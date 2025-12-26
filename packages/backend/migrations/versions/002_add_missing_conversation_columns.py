"""add missing conversation columns

Revision ID: 002
Revises: 001
Create Date: 2025-01-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers, used by Alembic.
revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def column_exists(table_name: str, column_name: str) -> bool:
    """Check if a column exists in a table."""
    conn = op.get_bind()
    result = conn.execute(sa.text(
        "SELECT column_name FROM information_schema.columns "
        "WHERE table_name = :table AND column_name = :column"
    ), {"table": table_name, "column": column_name})
    return result.fetchone() is not None


def upgrade() -> None:
    # Add title column if it doesn't exist
    if not column_exists('conversations', 'title'):
        op.add_column('conversations', sa.Column('title', sa.String(255), nullable=True))
    
    # Add updated_at column if it doesn't exist
    if not column_exists('conversations', 'updated_at'):
        op.add_column('conversations', sa.Column('updated_at', sa.DateTime(), nullable=True))
        op.execute("UPDATE conversations SET updated_at = created_at WHERE updated_at IS NULL")
        op.alter_column('conversations', 'updated_at', nullable=False)
    
    # Add conversation_metadata column if it doesn't exist
    if not column_exists('conversations', 'conversation_metadata'):
        op.add_column('conversations', sa.Column('conversation_metadata', JSONB, nullable=True, server_default='{}'))


def downgrade() -> None:
    if column_exists('conversations', 'conversation_metadata'):
        op.drop_column('conversations', 'conversation_metadata')
    if column_exists('conversations', 'updated_at'):
        op.drop_column('conversations', 'updated_at')
    if column_exists('conversations', 'title'):
        op.drop_column('conversations', 'title')

