"""
Document routes for file upload, management, and processing.
"""

import logging

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_active_user
from app.db.session import get_db
from app.models.schemas import (
    DocumentDeleteResponse,
    DocumentListResponse,
    DocumentResponse,
    DocumentUploadResponse,
    ErrorResponse,
)
from app.models.tables import User
from app.services.document_service import DocumentService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post(
    "/upload/{chat_id}",
    response_model=DocumentUploadResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"model": ErrorResponse},
        401: {"model": ErrorResponse},
        403: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        413: {"model": ErrorResponse},
    },
)
async def upload_documents(
    chat_id: int,
    files: list[UploadFile] = File(...),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload multiple documents to a chat session.

    - **chat_id**: ID of the chat to associate documents with
    - **files**: List of files to upload (max 10 files, 50MB each)

    Supported formats: PDF, DOCX, TXT, MD

    **Duplicate Detection**: Files are checked for duplicates ONLY within the same chat.
    The same file can be uploaded to different chats without issues.

    Requires authentication and ownership of the chat.
    """
    try:
        # Validate file count
        if len(files) > 10:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Too many files. Maximum 10 files allowed per upload.",
            )

        # Validate individual file sizes
        for file in files:
            if file.size and file.size > 50 * 1024 * 1024:  # 50MB
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"File '{file.filename}' is too large. Maximum size is 50MB.",
                )

        service = DocumentService(db, current_user)
        result = await service.upload_documents(chat_id, files)

        logger.info(f"User {current_user.id} uploaded {len(result.documents)} documents to chat {chat_id}")

        return result

    except HTTPException as e:
        # Re-raise HTTP exceptions with proper status codes (400, 404, etc.)
        logger.warning(f"Upload validation error for chat {chat_id}: {e.detail}")
        raise
    except Exception as e:
        # Catch unexpected errors and return 500
        logger.error(f"Unexpected error uploading documents to chat {chat_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while uploading documents",
        )


@router.get(
    "/chat/{chat_id}",
    response_model=DocumentListResponse,
    responses={401: {"model": ErrorResponse}, 403: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
async def get_chat_documents(
    chat_id: int,
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of records"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all documents for a specific chat.

    Returns documents sorted by most recently uploaded first.
    Requires authentication and ownership of the chat.
    """
    try:
        service = DocumentService(db, current_user)
        documents, total = await service.get_chat_documents(chat_id, skip, limit)

        return DocumentListResponse(documents=documents, total=total, chat_id=chat_id)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting chat documents: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve documents")


@router.get("", response_model=DocumentListResponse, responses={401: {"model": ErrorResponse}})
async def get_user_documents(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of records"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all documents for the current user across all chats.

    Returns documents sorted by most recently uploaded first.
    Requires authentication.
    """
    try:
        service = DocumentService(db, current_user)
        documents, total = await service.get_user_documents(skip, limit)

        return DocumentListResponse(documents=documents, total=total, chat_id=None)

    except Exception as e:
        logger.error(f"Error getting user documents: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve documents")


@router.delete(
    "/{document_id}",
    response_model=DocumentDeleteResponse,
    responses={401: {"model": ErrorResponse}, 403: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
async def delete_document(
    document_id: int, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)
):
    """
    Delete a specific document.

    This action is irreversible and will remove the document from both
    the database and the file system, including from the vector index.

    Requires authentication and ownership of the document.
    """
    try:
        service = DocumentService(db, current_user)
        message = await service.delete_document(document_id)

        logger.info(f"User {current_user.id} deleted document {document_id}")

        return DocumentDeleteResponse(message=message, document_id=document_id)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting document: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete document")


@router.get(
    "/{document_id}",
    response_model=DocumentResponse,
    responses={401: {"model": ErrorResponse}, 403: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
async def get_document(
    document_id: int, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)
):
    """
    Get details of a specific document.

    Requires authentication and ownership of the document.
    """
    try:
        service = DocumentService(db, current_user)
        document = await service._get_document(document_id)

        return service._to_response(document)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting document: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve document")


@router.post(
    "/batch-delete",
    response_model=list[DocumentDeleteResponse],
    responses={401: {"model": ErrorResponse}, 400: {"model": ErrorResponse}},
)
async def batch_delete_documents(
    document_ids: list[int], current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)
):
    """
    Delete multiple documents in batch.

    - **document_ids**: List of document IDs to delete (max 50)

    Returns a list of results for each document deletion attempt.
    Failed deletions are included in the response with error details.

    Requires authentication.
    """
    try:
        # Validate batch size
        if len(document_ids) > 50:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Too many documents. Maximum 50 documents allowed per batch delete.",
            )

        service = DocumentService(db, current_user)
        results = []

        for doc_id in document_ids:
            try:
                message = await service.delete_document(doc_id)
                results.append(DocumentDeleteResponse(message=message, document_id=doc_id))
            except Exception as e:
                results.append(
                    DocumentDeleteResponse(message=f"Failed to delete document {doc_id}: {str(e)}", document_id=doc_id)
                )

        logger.info(f"User {current_user.id} batch deleted {len(document_ids)} documents")

        return results

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in batch delete: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to batch delete documents"
        )


# Health check endpoint for document service
@router.get("/health", responses={200: {"description": "Document service is healthy"}})
async def health_check():
    """Health check endpoint for document service."""
    return {"status": "healthy", "service": "document_management"}
