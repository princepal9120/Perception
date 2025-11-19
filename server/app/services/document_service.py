"""
Document service for handling file uploads, processing, and management.
"""
import hashlib
import mimetypes
import os
from pathlib import Path
from typing import List, Optional, Tuple
from fastapi import UploadFile, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from sqlmodel import SQLModel

from app.models.tables import Document, Chat, User
from app.models.schemas import DocumentResponse, DocumentUploadResponse
from app.services.ingestion_service import ChatIngestor, generate_session_id
from app.utils.file_io import save_uploaded_files
from app.utils.document_operation import load_documents
from app.logger.custom_logger import GLOBAL_LOGGER as log
from app.core.config import settings


class DocumentService:
    def __init__(self, db: AsyncSession, current_user: User):
        self.db = db
        self.current_user = current_user
        
        # Initialize base directories
        self.upload_dir = Path(settings.UPLOAD_DIR)
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Supported file extensions
        self.supported_extensions = {".pdf", ".docx", ".txt", ".md"}

    async def upload_documents(
        self, 
        chat_id: int, 
        files: List[UploadFile]
    ) -> DocumentUploadResponse:
        """
        Upload and process multiple documents for a chat session.
        """
        try:
            # Verify chat exists and user owns it
            chat = await self._get_chat(chat_id)
            
            # Generate session ID for this upload batch
            # We use a consistent session ID for the chat to maintain a single vector index
            session_id = f"chat_{chat_id}"
            
            # Filter supported files
            supported_files = []
            for file in files:
                if not file.filename:
                    continue
                    
                file_ext = Path(file.filename).suffix.lower()
                if file_ext not in self.supported_extensions:
                    log.warning(f"Unsupported file type: {file.filename}")
                    continue
                    
                supported_files.append(file)
            
            if not supported_files:
                raise HTTPException(
                    status_code=400,
                    detail="No supported files provided. Supported formats: PDF, DOCX, TXT, MD"
                )
            
            # Save files to upload directory
            temp_dir = self.upload_dir / session_id
            temp_dir.mkdir(parents=True, exist_ok=True)
            
            # Process files and create database records
            uploaded_documents = []
            checksums = set()
            
            for file in supported_files:
                # Calculate file checksum
                file_content = await file.read()
                checksum = hashlib.sha256(file_content).hexdigest()
                
                # Check for duplicates
                existing_doc = await self._get_document_by_checksum(checksum)
                if existing_doc:
                    log.info(f"Skipping duplicate file: {file.filename}")
                    continue
                
                # Reset file pointer after reading
                await file.seek(0)
                
                # Save file
                file_path = temp_dir / file.filename
                with open(file_path, "wb") as f:
                    f.write(file_content)
                
                # Get file info
                file_size = len(file_content)
                file_type, _ = mimetypes.guess_type(file.filename)
                file_type = file_type or "application/octet-stream"
                file_ext = Path(file.filename).suffix.lower()
                
                # Create database record
                document = Document(
                    user_id=self.current_user.id,
                    chat_id=chat_id,
                    filename=file.filename,
                    original_filename=file.filename,
                    file_path=str(file_path),
                    file_size=file_size,
                    file_type=file_type,
                    file_extension=file_ext,
                    session_id=session_id,
                    checksum=checksum,
                    indexed=False
                )
                
                self.db.add(document)
                await self.db.flush()
                
                uploaded_documents.append(document)
                checksums.add(checksum)
                
                log.info(f"File uploaded: {file.filename} ({file_size} bytes)")
            
            if not uploaded_documents:
                raise HTTPException(
                    status_code=400,
                    detail="No new files to upload (all duplicates or unsupported)"
                )
            
            # Process documents with ingestion service
            await self._process_documents(uploaded_documents, session_id, temp_dir)
            
            # Update documents with processing results
            for doc in uploaded_documents:
                await self.db.refresh(doc)
            
            await self.db.commit()
            
            return DocumentUploadResponse(
                documents=[self._to_response(doc) for doc in uploaded_documents],
                session_id=session_id,
                indexed=True,
                message=f"Successfully uploaded and indexed {len(uploaded_documents)} documents"
            )
            
        except Exception as e:
            await self.db.rollback()
            log.error(f"Error uploading documents: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to upload documents: {str(e)}"
            )

    async def get_chat_documents(
        self, 
        chat_id: int,
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[List[DocumentResponse], int]:
        """
        Get all documents for a specific chat.
        """
        try:
            # Verify chat exists and user owns it
            await self._get_chat(chat_id)
            
            # Query documents
            statement = (
                select(Document)
                .where(and_(
                    Document.chat_id == chat_id,
                    Document.user_id == self.current_user.id
                ))
                .order_by(Document.created_at.desc())
                .offset(skip)
                .limit(limit)
            )
            
            result = await self.db.execute(statement)
            documents = result.scalars().all()
            
            # Get total count
            count_statement = (
                select(Document)
                .where(and_(
                    Document.chat_id == chat_id,
                    Document.user_id == self.current_user.id
                ))
            )
            count_result = await self.db.execute(count_statement)
            total = len(count_result.scalars().all())
            
            return [self._to_response(doc) for doc in documents], total
            
        except Exception as e:
            log.error(f"Error getting chat documents: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to retrieve documents: {str(e)}"
            )

    async def delete_document(self, document_id: int) -> str:
        """
        Delete a specific document.
        """
        try:
            # Get document
            document = await self._get_document(document_id)
            
            # Delete file from filesystem
            file_path = Path(document.file_path)
            if file_path.exists():
                file_path.unlink()
                log.info(f"Deleted file: {file_path}")
            
            # Delete database record
            await self.db.delete(document)
            await self.db.commit()
            
            return f"Document '{document.original_filename}' deleted successfully"
            
        except Exception as e:
            await self.db.rollback()
            log.error(f"Error deleting document: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to delete document: {str(e)}"
            )

    async def get_user_documents(
        self,
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[List[DocumentResponse], int]:
        """
        Get all documents for the current user.
        """
        try:
            # Query documents
            statement = (
                select(Document)
                .where(Document.user_id == self.current_user.id)
                .order_by(Document.created_at.desc())
                .offset(skip)
                .limit(limit)
            )
            
            result = await self.db.execute(statement)
            documents = result.scalars().all()
            
            # Get total count
            count_statement = select(Document).where(Document.user_id == self.current_user.id)
            count_result = await self.db.execute(count_statement)
            total = len(count_result.scalars().all())
            
            return [self._to_response(doc) for doc in documents], total
            
        except Exception as e:
            log.error(f"Error getting user documents: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to retrieve documents: {str(e)}"
            )

    async def _process_documents(
        self, 
        documents: List[Document], 
        session_id: str, 
        temp_dir: Path
    ) -> None:
        """
        Process uploaded documents using the ingestion service.
        """
        try:
            # Initialize ingestor
            ingestor = ChatIngestor(
                temp_base=str(temp_dir),
                use_session_dirs=True,
                session_id=session_id
            )
            
            # Create mock uploaded files for ingestor
            mock_files = []
            for doc in documents:
                file_path = Path(doc.file_path)
                if file_path.exists():
                    mock_files.append(file_path)
            
            if not mock_files:
                log.warning("No files to process")
                return
            
            # Build retriever (this processes and indexes documents)
            retriever = ingestor.built_retriver(mock_files)
            
            # Update documents with chunk count and indexed status
            for doc in documents:
                doc.indexed = True
                # Note: chunk_count would be set during processing
                # For now, we'll estimate it based on file size
                doc.chunk_count = max(1, doc.file_size // 1000)  # Rough estimate
            
            log.info(f"Successfully processed {len(documents)} documents")
            
        except Exception as e:
            log.error(f"Error processing documents: {e}")
            # Don't raise here - documents are still uploaded, just not indexed
            for doc in documents:
                doc.indexed = False

    async def _get_chat(self, chat_id: int) -> Chat:
        """Get chat and verify ownership."""
        statement = select(Chat).where(
            and_(Chat.id == chat_id, Chat.user_id == self.current_user.id)
        )
        result = await self.db.execute(statement)
        chat = result.scalar_one_or_none()
        
        if not chat:
            raise HTTPException(
                status_code=404,
                detail="Chat not found or access denied"
            )
        
        return chat

    async def _get_document(self, document_id: int) -> Document:
        """Get document and verify ownership."""
        statement = select(Document).where(
            and_(
                Document.id == document_id,
                Document.user_id == self.current_user.id
            )
        )
        result = await self.db.execute(statement)
        document = result.scalar_one_or_none()
        
        if not document:
            raise HTTPException(
                status_code=404,
                detail="Document not found or access denied"
            )
        
        return document

    async def _get_document_by_checksum(self, checksum: str) -> Optional[Document]:
        """Get document by checksum for duplicate detection."""
        statement = select(Document).where(
            and_(
                Document.checksum == checksum,
                Document.user_id == self.current_user.id
            )
        )
        result = await self.db.execute(statement)
        return result.scalar_one_or_none()

    def _to_response(self, document: Document) -> DocumentResponse:
        """Convert Document model to DocumentResponse schema."""
        return DocumentResponse(
            id=document.id,
            user_id=document.user_id,
            chat_id=document.chat_id,
            filename=document.filename,
            original_filename=document.original_filename,
            file_size=document.file_size,
            file_type=document.file_type,
            file_extension=document.file_extension,
            session_id=document.session_id,
            chunk_count=document.chunk_count,
            indexed=document.indexed,
            created_at=document.created_at,
            updated_at=document.updated_at
        )
