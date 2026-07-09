# Fourge‑Capital (formerly Capital‑Fourge)

This repository contains the full‑stack application:

- **Frontend**: Next.js (React) – runs on port 3000
- **Backend services**:
  - `data-collector` – gRPC/REST/WebSocket price collector (port 8000 HTTP, 50051 gRPC)
  - `portfolio-manager` – Spring Boot GraphQL API (port 8080)
- **Databases**:
  - PostgreSQL (via Supabase) – stores users, portfolios, positions, auth data
  - MongoDB – stores raw market data collected by the data‑collector
  - Redis – caching / rate‑limiting
- **Infrastructure**: Docker‑Compose for local development

## Database schema (Supabase / PostgreSQL)

The application uses Supabase only for **authentication and lightweight metadata** (users, portfolios, positions).  
Historical price data (`price_history`) is **NOT stored in Supabase**; it is kept in MongoDB (via the data‑collector) to avoid exceeding the free tier limits.

### Tables managed by the application

```sql
-- users
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,                 -- BCrypt hash
    username TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'USER',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login_at TIMESTAMPTZ,
    language TEXT NOT NULL DEFAULT 'ES',
    cash_balance NUMERIC(20,8) NOT NULL DEFAULT 0,
    locked_balance NUMERIC(20,8) NOT NULL DEFAULT 0,
    show_welcome BOOLEAN NOT NULL DEFAULT true
);

-- portfolios
CREATE TABLE IF NOT EXISTS public.portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- positions
CREATE TABLE IF NOT EXISTS public.positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,                     -- e.g. BTC-USD, AAPL
    quantity NUMERIC(20,8) NOT NULL,
    avg_price NUMERIC(20,8) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

> **Note**: The `price_history` table is intentionally omitted from Supabase. If you ever need to store price history in PostgreSQL, add the table manually (see commented block below) but be mindful of the free‑tier row limits.

```sql
-- Optional price_history table (not used by default)
-- CREATE TABLE IF NOT EXISTS public.price_history (
--     symbol TEXT NOT NULL,
--     date   DATE NOT NULL,
--     open   NUMERIC(20,8),
--     high   NUMERIC(20,8),
--     low    NUMERIC(20,8),
--     close  NUMERIC(20,8),
--     volume BIGINT,
--     market_cap BIGINT,
--     PRIMARY KEY (symbol, date)
-- );
-- CREATE INDEX IF NOT EXISTS idx_price_history_symbol ON public.price_history(symbol);
```

## How to apply schema changes (migrations)

When you need to modify the schema (add a column, change a type, create a new table, etc.):

1. **Write the SQL** in an idempotent way (use `IF NOT EXISTS` for `CREATE`, and checks before `ALTER`).  
2. **Open the Supabase Dashboard** → **SQL Editor**.  
3. **Paste the SQL** and click **Run**.  
4. Verify the changes in the **Table Editor**.

### Example: Adding a new column `is_premium` to `users`

```sql
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT FALSE;
```

### Keeping a history of migrations (optional but recommended)

- Install the Supabase CLI locally.
- Run `supabase db init` to create a `supabase/migrations/` folder.
- For each change, run `supabase migration new <description>` and edit the generated file.
- Apply all pending migrations with `supabase db push`.
- Commit the migration files to Git so the schema is versioned.

## Running the stack locally

```bash
# Clone the repo
git clone <repo-url>
cd Finsight

# Copy example env files and fill in your secrets (see .env.example)
cp .env.example .env
# Edit .env with your Supabase URL/keys, Redis URL, etc.

# Build and start all services
docker compose up -d --build

# Verify
docker compose ps   # should show all services healthy
```

Frontend will be available at `http://localhost:3000`.

## Production deployment (free tiers)

- **Frontend**: Vercel (Hobby) – connects to Supabase and the backend services.
- **Backend workers** (`data-collector`, `portfolio-manager`): Render Free Web Service (Docker).
- **Database**: Supabase Free (PostgreSQL) – only auth/users/portfolios/positions.
- **Cache/queue**: Upstash Redis Free (optional).
- **Environment variables** are set in each platform’s UI; never hard‑code secrets.

See the “Production deployment” section in the project wiki (or ask for a detailed guide) for step‑by‑step instructions.

## License

MIT – feel free to fork and adapt.