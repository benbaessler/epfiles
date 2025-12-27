#!/usr/bin/env python3
"""
Docker entrypoint script for database initialization.

This script handles the chicken-and-egg problem where:
1. Alembic migrations assume tables exist
2. init_db() creates tables but runs after migrations

For fresh Docker deployments, we need to:
1. Create tables first (init_db)
2. Stamp alembic to head (mark migrations as applied without running them)

For existing deployments with data:
1. Run migrations normally
"""
import sys
from sqlalchemy import inspect

# Add app to path
sys.path.insert(0, "/app")

from app.core.config import get_settings
from app.core.database import engine, init_db
from alembic.config import Config
from alembic import command


def main():
    settings = get_settings()
    inspector = inspect(engine)
    
    # Check if this is a fresh database (no tables exist)
    existing_tables = inspector.get_table_names()
    is_fresh_db = "conversations" not in existing_tables
    
    if is_fresh_db:
        print("Fresh database detected - creating tables from models...")
        init_db()
        
        # Stamp alembic to head (mark all migrations as applied)
        # This prevents migrations from trying to modify tables that already have the schema
        alembic_cfg = Config("/app/alembic.ini")
        command.stamp(alembic_cfg, "head")
        print("Database initialized and stamped to head revision")
    else:
        print("Existing database detected - running migrations...")
        alembic_cfg = Config("/app/alembic.ini")
        command.upgrade(alembic_cfg, "head")
        print("Migrations completed")


if __name__ == "__main__":
    main()

