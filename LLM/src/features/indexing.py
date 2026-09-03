from pathlib import Path

from langchain_core.embeddings import Embeddings

from src.core.config import Settings, get_settings
from src.data import get_document_catalog, get_rag_chunks
from src.data.contracts import DocumentCatalogEntry, RagChunk
from src.data.document_catalog import SOURCE_PDF_DIR
from src.features.chunking import split_pdf_pages
from src.features.pdf_loader import load_pdf_pages
from src.models import get_embedding_model
from src.vectorstores.base import VectorSearch
from src.vectorstores.in_memory import InMemoryVectorSearch


def build_mock_vector_index(
    embedding: Embeddings | None = None,
) -> VectorSearch:
    """Embed Mock chunks and return a ready-to-search process-local index."""
    return build_vector_index(get_rag_chunks(), embedding=embedding)


def prepare_document_chunks(
    *,
    catalog: list[DocumentCatalogEntry] | None = None,
    source_dir: Path = SOURCE_PDF_DIR,
    settings: Settings | None = None,
) -> list[RagChunk]:
    """Load catalog PDFs and convert their non-empty pages into RAG chunks."""
    resolved_settings = settings or get_settings()
    entries = catalog if catalog is not None else get_document_catalog()

    chunks: list[RagChunk] = []
    for entry in entries:
        pages = load_pdf_pages(entry, source_dir=source_dir)
        chunks.extend(
            split_pdf_pages(
                pages,
                chunk_size=resolved_settings.chunk_size,
                chunk_overlap=resolved_settings.chunk_overlap,
            )
        )
    return chunks


def build_document_vector_index(
    embedding: Embeddings | None = None,
    *,
    catalog: list[DocumentCatalogEntry] | None = None,
    source_dir: Path = SOURCE_PDF_DIR,
    settings: Settings | None = None,
) -> VectorSearch:
    """Load, chunk, embed, and index the catalog PDFs in process memory."""
    chunks = prepare_document_chunks(
        catalog=catalog,
        source_dir=source_dir,
        settings=settings,
    )
    return build_vector_index(chunks, embedding=embedding)


def build_vector_index(
    chunks: list[RagChunk],
    *,
    embedding: Embeddings | None = None,
) -> VectorSearch:
    """Create an index; add_chunks() is where document embedding starts."""
    if not chunks:
        raise ValueError("At least one RAG chunk is required to build an index")
    embedding_model = embedding or get_embedding_model()
    vector_search = InMemoryVectorSearch(embedding=embedding_model)
    vector_search.add_chunks(chunks)  # Calls embedding.embed_documents().
    return vector_search
