import hashlib
import json
from dataclasses import asdict, dataclass
from pathlib import Path

from langchain_core.embeddings import Embeddings

from src.core.config import Settings
from src.data.contracts import DocumentCatalogEntry
from src.data.document_catalog import SOURCE_PDF_DIR
from src.features.indexing import prepare_document_chunks
from src.vectorstores.in_memory import InMemoryVectorSearch


INDEX_CACHE_VERSION = 1


@dataclass(frozen=True, slots=True)
class IndexManifest:
    version: int
    embedding_model: str
    chunk_size: int
    chunk_overlap: int
    chunk_count: int
    catalog: list[DocumentCatalogEntry]
    source_hashes: dict[str, str]


@dataclass(frozen=True, slots=True)
class CachedVectorIndex:
    vector_search: InMemoryVectorSearch
    document_count: int
    chunk_count: int
    loaded_from_cache: bool


def load_or_build_document_index(
    *,
    embedding: Embeddings,
    settings: Settings,
    catalog: list[DocumentCatalogEntry],
    source_dir: Path = SOURCE_PDF_DIR,
    force: bool = False,
) -> CachedVectorIndex:
    """Load a valid local index or embed documents once and cache the result."""
    cache_path = settings.resolved_vector_index_cache_path
    manifest_path = _manifest_path(cache_path)
    embedding_model = _embedding_identity(embedding, settings)
    expected_sources = _source_hashes(catalog, source_dir)

    if not force:
        manifest = _read_manifest(manifest_path)
        if _cache_is_valid(
            manifest,
            cache_path=cache_path,
            embedding_model=embedding_model,
            settings=settings,
            catalog=catalog,
            source_hashes=expected_sources,
        ):
            try:
                vector_search = InMemoryVectorSearch.load(
                    cache_path,
                    embedding=embedding,
                )
            except (OSError, TypeError, ValueError, json.JSONDecodeError):
                pass
            else:
                return CachedVectorIndex(
                    vector_search=vector_search,
                    document_count=len(catalog),
                    chunk_count=manifest.chunk_count,
                    loaded_from_cache=True,
                )

    chunks = prepare_document_chunks(
        catalog=catalog,
        source_dir=source_dir,
        settings=settings,
    )
    vector_search = InMemoryVectorSearch(embedding=embedding)
    vector_search.add_chunks(chunks)  # The only document Embedding call in this flow.

    manifest = IndexManifest(
        version=INDEX_CACHE_VERSION,
        embedding_model=embedding_model,
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
        chunk_count=len(chunks),
        catalog=catalog,
        source_hashes=expected_sources,
    )
    _write_cache(vector_search, manifest, cache_path, manifest_path)
    return CachedVectorIndex(
        vector_search=vector_search,
        document_count=len(catalog),
        chunk_count=len(chunks),
        loaded_from_cache=False,
    )


def _cache_is_valid(
    manifest: IndexManifest | None,
    *,
    cache_path: Path,
    embedding_model: str,
    settings: Settings,
    catalog: list[DocumentCatalogEntry],
    source_hashes: dict[str, str],
) -> bool:
    return (
        cache_path.is_file()
        and manifest is not None
        and manifest.version == INDEX_CACHE_VERSION
        and manifest.embedding_model == embedding_model
        and manifest.chunk_size == settings.chunk_size
        and manifest.chunk_overlap == settings.chunk_overlap
        and manifest.catalog == catalog
        and manifest.source_hashes == source_hashes
    )


def _embedding_identity(embedding: Embeddings, settings: Settings) -> str:
    configured_name = settings.embedding_model.strip()
    return configured_name or repr(embedding)


def _source_hashes(
    catalog: list[DocumentCatalogEntry],
    source_dir: Path,
) -> dict[str, str]:
    hashes: dict[str, str] = {}
    for entry in catalog:
        source_path = source_dir / entry["file_name"]
        if not source_path.is_file():
            raise FileNotFoundError(f"PDF not found: {entry['file_name']}")
        digest = hashlib.sha256()
        with source_path.open("rb") as source_file:
            for block in iter(lambda: source_file.read(1024 * 1024), b""):
                digest.update(block)
        hashes[entry["file_name"]] = digest.hexdigest()
    return hashes


def _manifest_path(cache_path: Path) -> Path:
    return cache_path.with_suffix(".manifest.json")


def _read_manifest(path: Path) -> IndexManifest | None:
    if not path.is_file():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return IndexManifest(**data)
    except (OSError, TypeError, ValueError, json.JSONDecodeError):
        return None


def _write_cache(
    vector_search: InMemoryVectorSearch,
    manifest: IndexManifest,
    cache_path: Path,
    manifest_path: Path,
) -> None:
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    temporary_cache = cache_path.with_suffix(f"{cache_path.suffix}.tmp")
    temporary_manifest = manifest_path.with_suffix(f"{manifest_path.suffix}.tmp")

    vector_search.save(temporary_cache)
    temporary_manifest.write_text(
        json.dumps(asdict(manifest), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    temporary_cache.replace(cache_path)
    temporary_manifest.replace(manifest_path)
