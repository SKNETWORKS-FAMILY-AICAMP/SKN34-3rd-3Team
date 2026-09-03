from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

from src.data.contracts import RagChunk


KOREAN_DOCUMENT_SEPARATORS = ["\n\n", "\n", "다. ", "요. ", ". ", " ", ""]


def split_pdf_pages(
    pages: list[Document],
    *,
    chunk_size: int,
    chunk_overlap: int,
) -> list[RagChunk]:
    """Split page documents while preserving source metadata."""
    _validate_chunk_settings(chunk_size, chunk_overlap)
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=KOREAN_DOCUMENT_SEPARATORS,
        length_function=len,
    )

    chunks: list[RagChunk] = []
    for page in pages:
        policy_id, title, source, page_number = _required_metadata(page)
        split_contents = [
            content.strip()
            for content in splitter.split_text(page.page_content)
            if content.strip()
        ]
        for chunk_number, content in enumerate(split_contents, start=1):
            chunks.append(
                {
                    "chunk_id": (
                        f"policy-{policy_id}-page-{page_number}-chunk-{chunk_number}"
                    ),
                    "policy_id": policy_id,
                    "title": title,
                    "source": source,
                    "page": page_number,
                    "content": content,
                }
            )
    return chunks


def _validate_chunk_settings(chunk_size: int, chunk_overlap: int) -> None:
    if chunk_size < 1:
        raise ValueError("chunk_size must be at least 1")
    if chunk_overlap < 0:
        raise ValueError("chunk_overlap must not be negative")
    if chunk_overlap >= chunk_size:
        raise ValueError("chunk_overlap must be smaller than chunk_size")


def _required_metadata(document: Document) -> tuple[int, str, str, int]:
    required = ("policy_id", "title", "source", "page")
    missing = [name for name in required if name not in document.metadata]
    if missing:
        raise ValueError(f"Missing page metadata: {', '.join(missing)}")

    metadata = document.metadata
    return (
        int(metadata["policy_id"]),
        str(metadata["title"]),
        str(metadata["source"]),
        int(metadata["page"]),
    )
