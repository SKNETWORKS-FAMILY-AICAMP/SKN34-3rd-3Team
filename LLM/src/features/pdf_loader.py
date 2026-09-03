from pathlib import Path

from langchain_core.documents import Document
from pypdf import PdfReader
from pypdf.errors import PdfReadError

from src.data.contracts import DocumentCatalogEntry
from src.data.document_catalog import SOURCE_PDF_DIR


class PdfDocumentError(RuntimeError):
    """Base error for a PDF that cannot become a RAG document."""


class PdfDocumentNotFoundError(PdfDocumentError):
    """Raised when a catalog entry points to a missing PDF."""


class PdfTextNotFoundError(PdfDocumentError):
    """Raised when a PDF contains no extractable text."""


def load_pdf_pages(
    entry: DocumentCatalogEntry,
    *,
    source_dir: Path = SOURCE_PDF_DIR,
) -> list[Document]:
    """Read one PDF without writing to it and return non-empty page documents."""
    file_name = entry["file_name"]
    if Path(file_name).name != file_name:
        raise PdfDocumentError("Catalog file_name must not contain a directory path")

    pdf_path = source_dir / file_name
    if not pdf_path.is_file():
        raise PdfDocumentNotFoundError(f"PDF not found: {file_name}")

    pages: list[Document] = []
    try:
        with pdf_path.open("rb") as pdf_stream:
            reader = PdfReader(pdf_stream)
            for page_number, page in enumerate(reader.pages, start=1):
                content = (page.extract_text() or "").strip()
                if not content:
                    continue
                pages.append(
                    Document(
                        page_content=content,
                        metadata={
                            "policy_id": entry["policy_id"],
                            "title": entry["title"],
                            "source": file_name,
                            "page": page_number,
                        },
                    )
                )
    except (OSError, PdfReadError) as exc:
        raise PdfDocumentError(f"Unable to read PDF: {file_name}") from exc

    if not pages:
        raise PdfTextNotFoundError(f"No extractable text in PDF: {file_name}")
    return pages
