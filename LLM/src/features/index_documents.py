import argparse

from src.core.config import get_settings
from src.data import get_document_catalog
from src.features.index_cache import load_or_build_document_index
from src.features.pdf_loader import PdfDocumentError
from src.models import ModelConfigurationError, get_embedding_model


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Embed source PDFs into a temporary in-memory vector index."
    )
    parser.add_argument("--query", help="Optional query to run after indexing")
    parser.add_argument("--policy-id", type=int, help="Optional policy metadata filter")
    parser.add_argument("--top-k", type=int, help="Number of search results")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Ignore a valid local cache and embed all documents again",
    )
    return parser


def main() -> None:
    args = build_parser().parse_args()
    settings = get_settings()

    try:
        catalog = get_document_catalog()
        cached_index = load_or_build_document_index(
            embedding=get_embedding_model(),
            settings=settings,
            catalog=catalog,
            force=args.force,
        )
    except (FileNotFoundError, ModelConfigurationError, PdfDocumentError, ValueError) as exc:
        raise SystemExit(f"Document indexing failed: {exc}") from exc

    source = "local cache" if cached_index.loaded_from_cache else "new embedding"
    print(
        f"Loaded {cached_index.document_count} documents and "
        f"{cached_index.chunk_count} chunks from {source}."
    )
    print("The in-memory copy will be discarded; the validated local cache remains.")

    if not args.query:
        return

    top_k = args.top_k if args.top_k is not None else settings.default_top_k
    results = cached_index.vector_search.search(
        args.query,
        policy_id=args.policy_id,
        top_k=top_k,
    )
    if not results:
        print("No matching chunks found.")
        return

    for rank, result in enumerate(results, start=1):
        preview = " ".join(result["content"].split())[:160]
        print(
            f"[{rank}] policy={result['policy_id']} page={result['page']} "
            f"score={result['score']:.4f} source={result['source']}"
        )
        print(f"    {preview}")


if __name__ == "__main__":
    main()
