# Database Migrations

This directory is reserved for database migration files.

## Using Alembic (Optional)

To set up Alembic for database migrations:

```bash
# Install alembic
pip install alembic

# Initialize alembic
alembic init db/migrations

# Configure alembic.ini and env.py

# Create a migration
alembic revision --autogenerate -m "Initial migration"

# Apply migrations
alembic upgrade head
```

## Current Approach

Currently, we're using SQLModel's `create_all()` method for table creation.
For production deployments with zero-downtime requirements, consider using Alembic.
