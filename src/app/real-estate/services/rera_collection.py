"""Bounded registry collection, independent of browser and database clients."""


def collect_pages(read_page, advance_page, max_pages=300):
    if not isinstance(max_pages, int) or max_pages < 1:
        raise ValueError("max_pages must be a positive integer")
    records = {}
    seen_pages = set()
    for page in range(1, max_pages + 1):
        batch = read_page()
        if not batch:
            raise RuntimeError("No registry records found; check the search and table mapping")
        identities = tuple(sorted(row["rera_id"] for row in batch))
        if identities in seen_pages:
            raise RuntimeError("Registry pagination repeated a page; import stopped")
        seen_pages.add(identities)
        for row in batch:
            records.setdefault(row["rera_id"], row)
        if page == max_pages or not advance_page(page):
            return list(records.values())
    return list(records.values())
