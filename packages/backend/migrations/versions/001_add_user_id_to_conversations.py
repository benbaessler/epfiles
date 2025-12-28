"""add user_id to conversations

Revision ID: 001
Revises: 
Create Date: 2025-01-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
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


def index_exists(index_name: str) -> bool:
    """Check if an index exists."""
    conn = op.get_bind()
    result = conn.execute(sa.text(
        "SELECT indexname FROM pg_indexes WHERE indexname = :index"
    ), {"index": index_name})
    return result.fetchone() is not None


def upgrade() -> None:
    # Add user_id column to conversations table (idempotent)
    if not column_exists('conversations', 'user_id'):
        op.add_column('conversations', sa.Column('user_id', sa.String(255), nullable=True))
    
    # Set a default value for existing rows (if any)
    op.execute("UPDATE conversations SET user_id = 'legacy_user' WHERE user_id IS NULL")
    
    # Now make the column non-nullable
    op.alter_column('conversations', 'user_id', nullable=False)
    
    # Add index for efficient user lookups (idempotent)
    if not index_exists('ix_conversations_user_id'):
        op.create_index('ix_conversations_user_id', 'conversations', ['user_id'])


def downgrade() -> None:
    if index_exists('ix_conversations_user_id'):
        op.drop_index('ix_conversations_user_id', table_name='conversations')
    if column_exists('conversations', 'user_id'):
        op.drop_column('conversations', 'user_id')


