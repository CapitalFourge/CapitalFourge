#!/bin/bash
# PostgreSQL initialization script - runs on first container start

set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Enable TimescaleDB
    CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

    -- Enable pgvector for embeddings/ML
    CREATE EXTENSION IF NOT EXISTS vector;

    -- Enable uuid-ossp for UUID generation
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- Enable pg_trgm for text search
    CREATE EXTENSION IF NOT EXISTS pg_trgm;

    -- Create indexes for common queries (will be created by Spring Boot/JPA, but good to have)
    -- These are just examples - Spring Boot will manage schema via Flyway/Liquibase
EOSQL

echo "PostgreSQL extensions initialized: timescaledb, vector, uuid-ossp, pg_trgm"