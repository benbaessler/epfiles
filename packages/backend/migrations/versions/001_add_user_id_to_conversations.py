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


def upgrade() -> None:
    # Add user_id column to conversations table
    # Using nullable=True initially to handle existing rows
    op.add_column('conversations', sa.Column('user_id', sa.String(255), nullable=True))
    
    # Set a default value for existing rows (if any)
    # You may want to update this to a real user ID or delete orphan conversations
    op.execute("UPDATE conversations SET user_id = 'legacy_user' WHERE user_id IS NULL")
    
    # Now make the column non-nullable
    op.alter_column('conversations', 'user_id', nullable=False)
    
    # Add index for efficient user lookups
    op.create_index('ix_conversations_user_id', 'conversations', ['user_id'])


def downgrade() -> None:
    op.drop_index('ix_conversations_user_id', table_name='conversations')
    op.drop_column('conversations', 'user_id')


