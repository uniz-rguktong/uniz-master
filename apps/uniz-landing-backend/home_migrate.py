"""Add home copy columns on databases created before hero and contact existed."""

from sqlalchemy import inspect, text

HOME_COPY_COLUMNS = ("hero", "contact")


def add_missing_home_columns(sync_conn) -> list:
    inspector = inspect(sync_conn)
    tables = inspector.get_table_names()
    if "home_page_data" not in tables:
        return []
    present = {column["name"] for column in inspector.get_columns("home_page_data")}
    added = []
    for name in HOME_COPY_COLUMNS:
        if name in present:
            continue
        sync_conn.execute(text(f"ALTER TABLE home_page_data ADD COLUMN {name} JSON"))
        added.append(name)
    return added


async def ensure_home_copy_columns(engine) -> list:
    async with engine.begin() as conn:
        return await conn.run_sync(add_missing_home_columns)
