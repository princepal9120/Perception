from __future__ import annotations
from pathlib import Path
from typing import Iterable, List, Optional, Dict, Any
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_pinecone import PineconeVectorStore
from pinecone import Pinecone, ServerlessSpec
from app.utils.model_loader import ModelLoader
from app.logger import GLOBAL_LOGGER as log
from app.logger.custom_exception import DocumentPortalException
from app.core.config import settings
import json
import uuid
from datetime import datetime
from app.utils.file_io import save_uploaded_files
from app.utils.document_operation import load_documents
import hashlib
import sys
import time


def generate_session_id() -> str:
    """Generate a unique session ID with timestamp."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = uuid.uuid4().hex[:8]
    return f"session_{timestamp}_{unique_id}"


class ChatIngestor:
    def __init__( self,
        temp_base: str = "data",
        use_session_dirs: bool = True,
        session_id: Optional[str] = None,
        faiss_base: str = "faiss_index" # Kept for backward compatibility but not used
    ):
        try:
            log.info("Initializing ChatIngestor", session_id=session_id)
            
            # Initialize ModelLoader (loads config and API keys)
            try:
                self.model_loader = ModelLoader()
            except Exception as e:
                log.error(f"Failed to initialize ModelLoader: {e}")
                raise DocumentPortalException(
                    "Failed to load models and configuration. Check if app/config/conf.yaml exists and API keys are set.",
                    e
                ) from e

            self.use_session = use_session_dirs
            self.session_id = session_id or generate_session_id()

            self.temp_base = Path(temp_base); self.temp_base.mkdir(parents=True, exist_ok=True)
            self.temp_dir = self._resolve_dir(self.temp_base)
            
            # Get embedding dimension from ModelLoader
            embedding_dimension = self.model_loader.get_embedding_dimension()
            log.info(f"Using embedding dimension: {embedding_dimension}")
            
            # Initialize Pinecone
            try:
                self.pc = Pinecone(api_key=settings.PINECONE_API_KEY)
                self.index_name = settings.PINECONE_INDEX_NAME
                
                # Check if index exists, create if not
                existing_indexes = [i.name for i in self.pc.list_indexes()]
                if self.index_name not in existing_indexes:
                    log.info(f"Creating Pinecone index: {self.index_name} with dimension {embedding_dimension}")
                    self.pc.create_index(
                        name=self.index_name,
                        dimension=embedding_dimension,
                        metric="cosine",
                        spec=ServerlessSpec(
                            cloud="aws",
                            region="us-east-1"
                        )
                    )
                    # Wait for index to be ready
                    log.info(f"Waiting for Pinecone index {self.index_name} to be ready...")
                    while not self.pc.describe_index(self.index_name).status['ready']:
                        time.sleep(1)
                    log.info(f"Pinecone index {self.index_name} is ready")
                else:
                    # Verify dimension matches
                    index_info = self.pc.describe_index(self.index_name)
                    index_dimension = index_info.dimension
                    if index_dimension != embedding_dimension:
                        log.warning(
                            f"Dimension mismatch! Index has dimension {index_dimension} "
                            f"but embedding model produces {embedding_dimension}. "
                            f"You may need to delete and recreate the index."
                        )
                
                self.index = self.pc.Index(self.index_name)
            except Exception as e:
                log.error(f"Failed to initialize Pinecone: {e}")
                raise DocumentPortalException(
                    "Failed to connect to Pinecone. Check if PINECONE_API_KEY is set correctly.",
                    e
                ) from e

            log.info("ChatIngestor initialized with Pinecone",
                      session_id=self.session_id,
                      temp_dir=str(self.temp_dir),
                      index_name=self.index_name,
                      sessionized=self.use_session)
        except DocumentPortalException:
            raise
        except Exception as e:
            log.error("Failed to initialize ChatIngestor", error=str(e), exc_info=True)
            raise DocumentPortalException("Initialization error in ChatIngestor", e) from e


    def _resolve_dir(self, base: Path):
        if self.use_session:
            d = base / self.session_id 
            d.mkdir(parents=True, exist_ok=True)
            return d
        return base

    def _split(self, docs: List[Document], chunk_size=1000, chunk_overlap=200) -> List[Document]:
        splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
        chunks = splitter.split_documents(docs)
        log.info("Documents split", chunks=len(chunks), chunk_size=chunk_size, overlap=chunk_overlap)
        return chunks

    def built_retriver( self,
        uploaded_files: Iterable,
        *,
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        k: int = 5,
        search_type: str = "mmr",
        fetch_k: int = 20,
        lambda_mult: float = 0.5):
        try:
            # Check if uploaded_files are already Path objects
            first_file = next(iter(uploaded_files), None) if uploaded_files else None
            if isinstance(first_file, Path):
                paths = list(uploaded_files)
            else:
                paths = save_uploaded_files(uploaded_files, self.temp_dir)
            
            docs = load_documents(paths)
            
            # Load embeddings
            embeddings = self.model_loader.load_embeddings()
            
            # If no docs, return retriever for existing index
            if not docs:
                log.info("No new documents to index, returning retriever for existing index")
                vectorstore = PineconeVectorStore(
                    index=self.index,
                    embedding=embeddings,
                    namespace=self.session_id
                )
                return vectorstore.as_retriever(
                    search_type=search_type,
                    search_kwargs={"k": k, "fetch_k": fetch_k, "lambda_mult": lambda_mult}
                )

            # Split documents
            chunks = self._split(docs, chunk_size=chunk_size, chunk_overlap=chunk_overlap)
            
            # Add to Pinecone
            log.info(f"Adding {len(chunks)} chunks to Pinecone index {self.index_name} in namespace {self.session_id}")
            
            vectorstore = PineconeVectorStore.from_documents(
                documents=chunks,
                embedding=embeddings,
                index_name=self.index_name,
                namespace=self.session_id
            )
            
            log.info("Pinecone index updated")

            # Configure search parameters
            search_kwargs = {"k": k}
            
            if search_type == "mmr":
                search_kwargs["fetch_k"] = fetch_k
                search_kwargs["lambda_mult"] = lambda_mult
                log.info("Using MMR search", k=k, fetch_k=fetch_k, lambda_mult=lambda_mult)
            
            return vectorstore.as_retriever(search_type=search_type, search_kwargs=search_kwargs)

        except Exception as e:
            log.error("Failed to build retriever", error=str(e))
            raise DocumentPortalException("Failed to build retriever", e) from e

SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".txt"}
