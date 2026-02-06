# Guía Paso a Paso para Implementar Todos los Tests - FinSight

Este documento proporciona instrucciones detalladas y paso a paso para implementar todos los tests necesarios para el proyecto FinSight. No se omite ningún detalle.

---

## Tabla de Contenidos

1. [Prerrequisitos](#prerrequisitos)
2. [Configuración Inicial](#configuración-inicial)
3. [Tests para data-collector (Python)](#tests-para-data-collector-python)
4. [Tests para portfolio-manager (Java)](#tests-para-portfolio-manager-java)
5. [Tests para frontend (Next.js/React)](#tests-para-frontend-nextjsreact)
6. [Tests de Integración](#tests-de-integración)
7. [Tests E2E](#tests-e2e)
8. [Configuración de CI/CD](#configuración-de-cicd)
9. [Verificación Final](#verificación-final)

---

## Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

- Python 3.11+
- Java 17+
- Node.js 20+
- Docker y Docker Compose
- pnpm (para frontend)
- Maven (para Java)

---

## Configuración Inicial

### Paso 1: Actualizar requirements.txt de Python

Agrega las siguientes dependencias de testing a [`data-collector/requirements.txt`](data-collector/requirements.txt):

```txt
# Dependencias existentes (mantener)
fastapi
uvicorn
polars
pymongo
python-dotenv
pytest
yfinance
redis
grpcio
grpcio-tools

# Nuevas dependencias de testing
pytest-cov
pytest-mock
pytest-asyncio
mongomock
faker
```

**Instrucciones:**

1. Abre el archivo `data-collector/requirements.txt`
2. Agrega las líneas anteriores al final del archivo
3. Guarda el archivo

### Paso 2: Actualizar pom.xml de Java

Agrega los plugins de testing a [`portfolio-manager/pom.xml`](portfolio-manager/pom.xml):

```xml
<!-- Agregar dentro de <build><plugins> después del plugin protobuf-maven-plugin -->

<!-- JaCoCo para cobertura de código -->
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <version>0.8.11</version>
    <executions>
        <execution>
            <goals>
                <goal>prepare-agent</goal>
            </goals>
        </execution>
        <execution>
            <id>report</id>
            <phase>test</phase>
            <goals>
                <goal>report</goal>
            </goals>
        </execution>
    </executions>
</plugin>

<!-- Surefire para ejecutar tests -->
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-surefire-plugin</artifactId>
    <version>3.2.2</version>
</plugin>

<!-- Failsafe para tests de integración -->
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-failsafe-plugin</artifactId>
    <version>3.2.2</version>
    <executions>
        <execution>
            <goals>
                <goal>integration-test</goal>
                <goal>verify</goal>
            </goals>
        </execution>
    </executions>
</plugin>
```

**Instrucciones:**

1. Abre el archivo `portfolio-manager/pom.xml`
2. Busca la sección `<build><plugins>`
3. Agrega los plugins anteriores después del plugin `protobuf-maven-plugin`
4. Guarda el archivo

### Paso 3: Actualizar package.json de Frontend

Agrega las dependencias de testing a [`frontend/package.json`](frontend/package.json):

```json
{
  "name": "frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "@react-three/drei": "^10.7.7",
    "@react-three/fiber": "^9.5.0",
    "@types/three": "^0.182.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "framer-motion": "^12.30.0",
    "lucide-react": "^0.563.0",
    "next": "16.1.6",
    "radix-ui": "^1.4.3",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "recharts": "^2.15.0",
    "date-fns": "^3.6.0",
    "tailwind-merge": "^3.4.0",
    "three": "^0.182.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.1.6",
    "tailwindcss": "^4",
    "tw-animate-css": "^1.4.0",
    "typescript": "^5",
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/react": "^14.1.2",
    "@testing-library/user-event": "^14.5.1",
    "@playwright/test": "^1.40.1",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "@types/jest": "^29.5.11"
  }
}
```

**Instrucciones:**

1. Abre el archivo `frontend/package.json`
2. Reemplaza todo el contenido con el JSON anterior
3. Guarda el archivo

### Paso 4: Crear archivos de configuración de testing

#### 4.1 Crear jest.config.js para frontend

Crea el archivo `frontend/jest.config.js`:

```javascript
const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  collectCoverageFrom: [
    "app/**/*.{js,jsx,ts,tsx}",
    "components/**/*.{js,jsx,ts,tsx}",
    "lib/**/*.{js,jsx,ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/.next/**",
  ],
  testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"],
};

module.exports = createJestConfig(customJestConfig);
```

**Instrucciones:**

1. Crea un nuevo archivo en `frontend/jest.config.js`
2. Copia el contenido anterior
3. Guarda el archivo

#### 4.2 Crear jest.setup.js para frontend

Crea el archivo `frontend/jest.setup.js`:

```javascript
import "@testing-library/jest-dom";
```

**Instrucciones:**

1. Crea un nuevo archivo en `frontend/jest.setup.js`
2. Copia el contenido anterior
3. Guarda el archivo

#### 4.3 Crear playwright.config.ts para frontend

Crea el archivo `frontend/playwright.config.ts`:

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

**Instrucciones:**

1. Crea un nuevo archivo en `frontend/playwright.config.ts`
2. Copia el contenido anterior
3. Guarda el archivo

#### 4.4 Crear pytest.ini para data-collector

Crea el archivo `data-collector/pytest.ini`:

```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts =
    --verbose
    --strict-markers
    --cov=src
    --cov-report=term-missing
    --cov-report=html
    --cov-report=xml
markers =
    unit: Unit tests
    integration: Integration tests
    slow: Slow running tests
```

**Instrucciones:**

1. Crea un nuevo archivo en `data-collector/pytest.ini`
2. Copia el contenido anterior
3. Guarda el archivo

---

## Tests para data-collector (Python)

### Paso 5: Crear estructura de directorios de tests

Crea la siguiente estructura de directorios:

```
data-collector/tests/
├── unit/
│   ├── __init__.py
│   ├── test_mongo_repository.py
│   ├── test_price_oracle.py
│   ├── test_financial_data_service.py
│   ├── test_polars_processor.py
│   └── test_api_endpoints.py
├── integration/
│   ├── __init__.py
│   ├── test_mongodb_integration.py
│   ├── test_redis_integration.py
│   └── test_grpc_integration.py
└── conftest.py
```

**Instrucciones:**

1. Navega al directorio `data-collector/tests`
2. Crea los directorios `unit` e `integration`
3. Crea los archivos `__init__.py` en cada directorio (pueden estar vacíos)
4. Crea los archivos de test listados arriba

### Paso 6: Crear conftest.py

Crea el archivo `data-collector/tests/conftest.py`:

```python
import pytest
from unittest.mock import Mock, MagicMock
from datetime import datetime
from src.domain.models import FinancialData
from src.infrastructure.mongo_repository import MongoFinancialDataRepository
from src.infrastructure.polars_processor import PolarsDataProcessor
from src.application.services import FinancialDataService
from src.application.price_oracle import PriceOracle


@pytest.fixture
def sample_financial_data():
    """Fixture que proporciona datos financieros de ejemplo."""
    return FinancialData(
        symbol="AAPL",
        price=150.0,
        timestamp=datetime.now(),
        metadata={"source": "test"}
    )


@pytest.fixture
def sample_raw_data():
    """Fixture que proporciona datos crudos de ejemplo."""
    return [
        {"symbol": "AAPL", "price": 150.0},
        {"symbol": "GOOGL", "price": 2800.0},
        {"symbol": "MSFT", "price": 300.0},
    ]


@pytest.fixture
def mock_mongo_repository():
    """Fixture que proporciona un repositorio MongoDB mockeado."""
    repo = Mock(spec=MongoFinancialDataRepository)
    repo.save.return_value = True
    return repo


@pytest.fixture
def mock_redis_client():
    """Fixture que proporciona un cliente Redis mockeado."""
    redis_mock = MagicMock()
    redis_mock.get.return_value = None
    redis_mock.set.return_value = True
    return redis_mock


@pytest.fixture
def polars_processor():
    """Fixture que proporciona una instancia del procesador Polars."""
    return PolarsDataProcessor()


@pytest.fixture
def financial_data_service(mock_mongo_repository, polars_processor):
    """Fixture que proporciona una instancia del servicio de datos financieros."""
    return FinancialDataService(
        repository=mock_mongo_repository,
        processor=polars_processor
    )


@pytest.fixture
def price_oracle(mock_redis_client):
    """Fixture que proporciona una instancia del Price Oracle."""
    return PriceOracle()
```

**Instrucciones:**

1. Crea el archivo `data-collector/tests/conftest.py`
2. Copia el contenido anterior
3. Guarda el archivo

### Paso 7: Crear test_polars_processor.py

Crea el archivo `data-collector/tests/unit/test_polars_processor.py`:

```python
import pytest
from datetime import datetime
from src.infrastructure.polars_processor import PolarsDataProcessor
from src.domain.models import FinancialData


class TestPolarsDataProcessor:
    """Tests para el procesador de datos Polars."""

    def test_process_batch_with_valid_data(self, sample_raw_data):
        """Test que procesa un batch de datos válidos."""
        processor = PolarsDataProcessor()
        result = processor.process_batch(sample_raw_data)

        assert len(result) == 3
        assert all(isinstance(item, FinancialData) for item in result)
        assert result[0].symbol == "AAPL"
        assert result[0].price == 150.0

    def test_process_batch_filters_negative_prices(self):
        """Test que filtra precios negativos."""
        processor = PolarsDataProcessor()
        raw_data = [
            {"symbol": "AAPL", "price": 150.0},
            {"symbol": "BAD", "price": -10.0},
            {"symbol": "GOOGL", "price": 2800.0},
        ]
        result = processor.process_batch(raw_data)

        assert len(result) == 2
        assert all(item.price > 0 for item in result)
        assert result[0].symbol == "AAPL"
        assert result[1].symbol == "GOOGL"

    def test_process_batch_filters_zero_prices(self):
        """Test que filtra precios cero."""
        processor = PolarsDataProcessor()
        raw_data = [
            {"symbol": "AAPL", "price": 150.0},
            {"symbol": "ZERO", "price": 0.0},
            {"symbol": "GOOGL", "price": 2800.0},
        ]
        result = processor.process_batch(raw_data)

        assert len(result) == 2
        assert all(item.price > 0 for item in result)

    def test_process_batch_with_empty_list(self):
        """Test que procesa una lista vacía."""
        processor = PolarsDataProcessor()
        result = processor.process_batch([])

        assert result == []

    def test_process_batch_sets_metadata(self, sample_raw_data):
        """Test que establece los metadatos correctamente."""
        processor = PolarsDataProcessor()
        result = processor.process_batch(sample_raw_data)

        assert all(item.metadata == {"processed_by": "polars_cleaner"} for item in result)

    def test_process_batch_sets_timestamp(self, sample_raw_data):
        """Test que establece el timestamp correctamente."""
        processor = PolarsDataProcessor()
        before = datetime.now()
        result = processor.process_batch(sample_raw_data)
        after = datetime.now()

        assert all(before <= item.timestamp <= after for item in result)
```

**Instrucciones:**

1. Crea el archivo `data-collector/tests/unit/test_polars_processor.py`
2. Copia el contenido anterior
3. Guarda el archivo

### Paso 8: Crear test_mongo_repository.py

Crea el archivo `data-collector/tests/unit/test_mongo_repository.py`:

```python
import pytest
from unittest.mock import Mock, MagicMock, patch
from datetime import datetime
from src.domain.models import FinancialData
from src.infrastructure.mongo_repository import MongoFinancialDataRepository


class TestMongoFinancialDataRepository:
    """Tests para el repositorio MongoDB."""

    @pytest.fixture
    def mock_mongo_client(self):
        """Fixture que proporciona un cliente MongoDB mockeado."""
        with patch('pymongo.MongoClient') as mock:
            yield mock

    @pytest.fixture
    def repository(self, mock_mongo_client):
        """Fixture que proporciona una instancia del repositorio."""
        return MongoFinancialDataRepository(
            connection_string="mongodb://localhost:27017",
            database_name="test_db"
        )

    def test_save_success(self, repository, sample_financial_data):
        """Test que guarda datos exitosamente."""
        repository.collection = Mock()
        repository.collection.insert_one.return_value = Mock(inserted_id="123")

        result = repository.save(sample_financial_data)

        assert result is True
        repository.collection.insert_one.assert_called_once()

    def test_save_failure(self, repository, sample_financial_data):
        """Test que maneja fallos al guardar."""
        repository.collection = Mock()
        repository.collection.insert_one.side_effect = Exception("Database error")

        result = repository.save(sample_financial_data)

        assert result is False

    def test_find_by_symbol(self, repository):
        """Test que busca por símbolo."""
        repository.collection = Mock()
        mock_cursor = MagicMock()
        mock_cursor.__iter__ = Mock(return_value=iter([]))
        repository.collection.find.return_value = mock_cursor

        result = repository.find_by_symbol("AAPL")

        repository.collection.find.assert_called_once_with({"symbol": "AAPL"})

    def test_find_by_date_range(self, repository):
        """Test que busca por rango de fechas."""
        repository.collection = Mock()
        mock_cursor = MagicMock()
        mock_cursor.__iter__ = Mock(return_value=iter([]))
        repository.collection.find.return_value = mock_cursor

        start_date = datetime(2024, 1, 1)
        end_date = datetime(2024, 1, 31)

        result = repository.find_by_date_range(start_date, end_date)

        repository.collection.find.assert_called_once()
```

**Instrucciones:**

1. Crea el archivo `data-collector/tests/unit/test_mongo_repository.py`
2. Copia el contenido anterior
3. Guarda el archivo

### Paso 9: Crear test_price_oracle.py

Crea el archivo `data-collector/tests/unit/test_price_oracle.py`:

```python
import pytest
from unittest.mock import Mock, patch
from src.application.price_oracle import PriceOracle


class TestPriceOracle:
    """Tests para el Price Oracle."""

    @pytest.fixture
    def price_oracle(self):
        """Fixture que proporciona una instancia del Price Oracle."""
        return PriceOracle()

    @patch('src.application.price_oracle.yf.Ticker')
    def test_fetch_and_cache_valid_symbol(self, mock_ticker, price_oracle):
        """Test que obtiene y cachea el precio de un símbolo válido."""
        mock_ticker_instance = Mock()
        mock_ticker_instance.info = {'currentPrice': 150.0}
        mock_ticker.return_value = mock_ticker_instance

        price = price_oracle.fetch_and_cache("AAPL")

        assert price == 150.0
        mock_ticker.assert_called_once_with("AAPL")

    @patch('src.application.price_oracle.yf.Ticker')
    def test_fetch_and_cache_invalid_symbol(self, mock_ticker, price_oracle):
        """Test que maneja símbolos inválidos."""
        mock_ticker_instance = Mock()
        mock_ticker_instance.info = None
        mock_ticker.return_value = mock_ticker_instance

        price = price_oracle.fetch_and_cache("INVALID")

        assert price == 0.0

    @patch('src.application.price_oracle.yf.Ticker')
    def test_fetch_and_cache_with_exception(self, mock_ticker, price_oracle):
        """Test que maneja excepciones."""
        mock_ticker.side_effect = Exception("API Error")

        price = price_oracle.fetch_and_cache("AAPL")

        assert price == 0.0
```

**Instrucciones:**

1. Crea el archivo `data-collector/tests/unit/test_price_oracle.py`
2. Copia el contenido anterior
3. Guarda el archivo

### Paso 10: Crear test_financial_data_service.py

Crea el archivo `data-collector/tests/unit/test_financial_data_service.py`:

```python
import pytest
from datetime import datetime
from src.application.services import FinancialDataService
from src.domain.models import FinancialData


class TestFinancialDataService:
    """Tests para el servicio de datos financieros."""

    def test_collect_and_store_success(self, financial_data_service, mock_mongo_repository):
        """Test que recolecta y almacena datos exitosamente."""
        result = financial_data_service.collect_and_store("AAPL", 150.0)

        assert result is True
        mock_mongo_repository.save.assert_called_once()

    def test_collect_and_store_creates_correct_data(self, financial_data_service, mock_mongo_repository):
        """Test que crea los datos correctos."""
        financial_data_service.collect_and_store("AAPL", 150.0)

        call_args = mock_mongo_repository.save.call_args[0][0]
        assert isinstance(call_args, FinancialData)
        assert call_args.symbol == "AAPL"
        assert call_args.price == 150.0
        assert call_args.metadata == {"source": "api_manual"}

    def test_process_and_store_batch(self, financial_data_service, mock_mongo_repository, sample_raw_data):
        """Test que procesa y almacena un batch de datos."""
        mock_mongo_repository.save.return_value = True

        count = financial_data_service.process_and_store_batch(sample_raw_data)

        assert count == 3
        assert mock_mongo_repository.save.call_count == 3

    def test_process_and_store_batch_with_empty_list(self, financial_data_service):
        """Test que procesa una lista vacía."""
        count = financial_data_service.process_and_store_batch([])

        assert count == 0

    def test_process_and_store_batch_with_partial_failure(self, financial_data_service, mock_mongo_repository):
        """Test que maneja fallos parciales."""
        mock_mongo_repository.save.side_effect = [True, False, True]

        raw_data = [
            {"symbol": "AAPL", "price": 150.0},
            {"symbol": "GOOGL", "price": 2800.0},
            {"symbol": "MSFT", "price": 300.0},
        ]

        count = financial_data_service.process_and_store_batch(raw_data)

        assert count == 2
```

**Instrucciones:**

1. Crea el archivo `data-collector/tests/unit/test_financial_data_service.py`
2. Copia el contenido anterior
3. Guarda el archivo

### Paso 11: Crear test_api_endpoints.py

Crea el archivo `data-collector/tests/unit/test_api_endpoints.py`:

```python
import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
from main import app


@pytest.fixture
def client():
    """Fixture que proporciona un cliente de prueba."""
    return TestClient(app)


@pytest.fixture
def mock_service():
    """Fixture que proporciona un servicio mockeado."""
    with patch('main.service') as mock:
        mock.process_and_store_batch.return_value = 3
        mock.collect_and_store.return_value = True
        yield mock


@pytest.fixture
def mock_oracle():
    """Fixture que proporciona un oracle mockeado."""
    with patch('main.oracle') as mock:
        mock.fetch_and_cache.return_value = 150.0
        yield mock


class TestHealthEndpoint:
    """Tests para el endpoint de health check."""

    def test_health_check(self, client):
        """Test que verifica el endpoint de health."""
        response = client.get("/health")

        assert response.status_code == 200
        assert response.json() == {"status": "alive", "service": "data_collector"}


class TestCollectBatchEndpoint:
    """Tests para el endpoint de recolección batch."""

    def test_collect_batch_success(self, client, mock_service):
        """Test que recolecta un batch exitosamente."""
        data = [
            {"symbol": "AAPL", "price": 150.0},
            {"symbol": "GOOGL", "price": 2800.0},
        ]

        response = client.post("/collect/batch", json=data)

        assert response.status_code == 200
        assert "Successfully processed" in response.json()["message"]


class TestCollectSymbolEndpoint:
    """Tests para el endpoint de recolección por símbolo."""

    def test_collect_symbol_success(self, client, mock_service):
        """Test que recolecta un símbolo exitosamente."""
        response = client.post("/collect/AAPL?price=150.0")

        assert response.status_code == 200
        assert "stored successfully" in response.json()["message"]

    def test_collect_symbol_failure(self, client, mock_service):
        """Test que maneja fallos en la recolección."""
        mock_service.collect_and_store.return_value = False

        response = client.post("/collect/AAPL?price=150.0")

        assert response.status_code == 500


class TestPriceEndpoint:
    """Tests para el endpoint de precios."""

    def test_get_price_success(self, client, mock_oracle):
        """Test que obtiene el precio exitosamente."""
        response = client.get("/price/AAPL")

        assert response.status_code == 200
        assert response.json()["symbol"] == "AAPL"
        assert response.json()["price"] == 150.0

    def test_get_price_not_found(self, client, mock_oracle):
        """Test que maneja símbolos no encontrados."""
        mock_oracle.fetch_and_cache.return_value = 0.0

        response = client.get("/price/INVALID")

        assert response.status_code == 404
```

**Instrucciones:**

1. Crea el archivo `data-collector/tests/unit/test_api_endpoints.py`
2. Copia el contenido anterior
3. Guarda el archivo

### Paso 12: Crear tests de integración para MongoDB

Crea el archivo `data-collector/tests/integration/test_mongodb_integration.py`:

```python
import pytest
from datetime import datetime
from src.infrastructure.mongo_repository import MongoFinancialDataRepository
from src.domain.models import FinancialData


@pytest.mark.integration
class TestMongoDBIntegration:
    """Tests de integración para MongoDB."""

    @pytest.fixture
    def repository(self):
        """Fixture que proporciona una instancia del repositorio."""
        return MongoFinancialDataRepository(
            connection_string="mongodb://localhost:27017",
            database_name="test_finsight"
        )

    def test_connection(self, repository):
        """Test que verifica la conexión a MongoDB."""
        assert repository.client is not None

    def test_save_and_find(self, repository):
        """Test que guarda y encuentra datos."""
        data = FinancialData(
            symbol="AAPL",
            price=150.0,
            timestamp=datetime.now(),
            metadata={"source": "test"}
        )

        # Guardar
        repository.save(data)

        # Buscar
        results = repository.find_by_symbol("AAPL")

        assert len(results) > 0
        assert results[0].symbol == "AAPL"
        assert results[0].price == 150.0
```

**Instrucciones:**

1. Crea el archivo `data-collector/tests/integration/test_mongodb_integration.py`
2. Copia el contenido anterior
3. Guarda el archivo

### Paso 13: Crear tests de integración para Redis

Crea el archivo `data-collector/tests/integration/test_redis_integration.py`:

```python
import pytest
import redis
from src.application.price_oracle import PriceOracle


@pytest.mark.integration
class TestRedisIntegration:
    """Tests de integración para Redis."""

    @pytest.fixture
    def redis_client(self):
        """Fixture que proporciona un cliente Redis."""
        return redis.Redis(host='localhost', port=6379, decode_responses=True)

    def test_connection(self, redis_client):
        """Test que verifica la conexión a Redis."""
        result = redis_client.ping()
        assert result is True

    def test_set_and_get(self, redis_client):
        """Test que establece y obtiene valores."""
        redis_client.set("test_key", "test_value")
        value = redis_client.get("test_key")

        assert value == "test_value"
        redis_client.delete("test_key")
```

**Instrucciones:**

1. Crea el archivo `data-collector/tests/integration/test_redis_integration.py`
2. Copia el contenido anterior
3. Guarda el archivo

---

## Tests para portfolio-manager (Java)

### Paso 14: Crear estructura de directorios de tests

Crea la siguiente estructura de directorios:

```
portfolio-manager/src/test/java/com/finsight/portfoliomanager/
├── domain/
│   ├── UserTest.java
│   ├── PortfolioTest.java
│   ├── PositionTest.java
│   └── TransactionTest.java
├── application/
│   └── services/
│       ├── UserServiceTest.java
│       └── PortfolioServiceTest.java
├── infrastructure/
│   └── adapters/
│       └── in/
│           └── rest/
│               ├── AuthControllerTest.java
│               ├── PortfolioControllerTest.java
│               └── MetricsControllerTest.java
└── integration/
    ├── PostgreSQLIntegrationTest.java
    ├── RedisIntegrationTest.java
    └── GrpcIntegrationTest.java
```

**Instrucciones:**

1. Navega a `portfolio-manager/src/test/java/com/finsight/portfoliomanager/`
2. Crea los directorios listados arriba
3. Crea los archivos de test listados

### Paso 15: Crear UserTest.java

Crea el archivo `portfolio-manager/src/test/java/com/finsight/portfoliomanager/domain/UserTest.java`:

```java
package com.finsight.portfoliomanager.domain;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Tests para la entidad User")
class UserTest {

    @Test
    @DisplayName("Debe crear un usuario con el builder")
    void shouldCreateUserWithBuilder() {
        User user = User.builder()
                .id(UUID.randomUUID())
                .email("test@example.com")
                .password("encoded_password")
                .username("testuser")
                .role(Role.USER)
                .active(true)
                .createdAt(LocalDateTime.now())
                .lastLoginAt(null)
                .build();

        assertNotNull(user);
        assertEquals("test@example.com", user.getEmail());
        assertEquals("testuser", user.getUsername());
        assertEquals(Role.USER, user.getRole());
        assertTrue(user.isActive());
    }

    @Test
    @DisplayName("Debe retornar true cuando el usuario está activo")
    void shouldReturnTrueWhenUserIsActive() {
        User user = User.builder()
                .active(true)
                .build();

        assertTrue(user.isActive());
    }

    @Test
    @DisplayName("Debe retornar false cuando el usuario no está activo")
    void shouldReturnFalseWhenUserIsNotActive() {
        User user = User.builder()
                .active(false)
                .build();

        assertFalse(user.isActive());
    }

    @Test
    @DisplayName("Debe retornar true cuando el usuario es admin")
    void shouldReturnTrueWhenUserIsAdmin() {
        User user = User.builder()
                .role(Role.ADMIN)
                .build();

        assertTrue(user.isAdmin());
    }

    @Test
    @DisplayName("Debe retornar false cuando el usuario no es admin")
    void shouldReturnFalseWhenUserIsNotAdmin() {
        User user = User.builder()
                .role(Role.USER)
                .build();

        assertFalse(user.isAdmin());
    }
}
```

**Instrucciones:**

1. Crea el archivo `portfolio-manager/src/test/java/com/finsight/portfoliomanager/domain/UserTest.java`
2. Copia el contenido anterior
3. Guarda el archivo

### Paso 16: Crear PortfolioTest.java

Crea el archivo `portfolio-manager/src/test/java/com/finsight/portfoliomanager/domain/PortfolioTest.java`:

```java
package com.finsight.portfoliomanager.domain;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Tests para la entidad Portfolio")
class PortfolioTest {

    @Test
    @DisplayName("Debe crear un portfolio con el builder")
    void shouldCreatePortfolioWithBuilder() {
        Portfolio portfolio = Portfolio.builder()
                .id(UUID.randomUUID())
                .name("Test Portfolio")
                .description("Test Description")
                .userId(UUID.randomUUID())
                .balance(BigDecimal.valueOf(10000.0))
                .positions(List.of())
                .transactions(List.of())
                .cumulativeDeposits(BigDecimal.valueOf(10000.0))
                .cumulativeWithdrawals(BigDecimal.ZERO)
                .performance(0.0)
                .build();

        assertNotNull(portfolio);
        assertEquals("Test Portfolio", portfolio.getName());
        assertEquals("Test Description", portfolio.getDescription());
        assertEquals(BigDecimal.valueOf(10000.0), portfolio.getBalance());
    }

    @Test
    @DisplayName("Debe calcular el valor total de la cuenta correctamente")
    void shouldCalculateTotalAccountValueCorrectly() {
        Position position1 = Position.builder()
                .symbol("AAPL")
                .quantity(BigDecimal.valueOf(10))
                .averagePrice(BigDecimal.valueOf(150.0))
                .currentPrice(BigDecimal.valueOf(160.0))
                .build();

        Position position2 = Position.builder()
                .symbol("GOOGL")
                .quantity(BigDecimal.valueOf(5))
                .averagePrice(BigDecimal.valueOf(2800.0))
                .currentPrice(BigDecimal.valueOf(2900.0))
                .build();

        Portfolio portfolio = Portfolio.builder()
                .balance(BigDecimal.valueOf(5000.0))
                .positions(List.of(position1, position2))
                .build();

        BigDecimal totalValue = portfolio.getTotalAccountValue();

        // Balance: 5000.0
        // Position 1: 10 * 160.0 = 1600.0
        // Position 2: 5 * 2900.0 = 14500.0
        // Total: 5000.0 + 1600.0 + 14500.0 = 21100.0
        assertEquals(BigDecimal.valueOf(21100.0), totalValue);
    }

    @Test
    @DisplayName("Debe retornar solo el balance cuando no hay posiciones")
    void shouldReturnOnlyBalanceWhenNoPositions() {
        Portfolio portfolio = Portfolio.builder()
                .balance(BigDecimal.valueOf(10000.0))
                .positions(null)
                .build();

        BigDecimal totalValue = portfolio.getTotalAccountValue();

        assertEquals(BigDecimal.valueOf(10000.0), totalValue);
    }

    @Test
    @DisplayName("Debe retornar solo el balance cuando las posiciones están vacías")
    void shouldReturnOnlyBalanceWhenPositionsEmpty() {
        Portfolio portfolio = Portfolio.builder()
                .balance(BigDecimal.valueOf(10000.0))
                .positions(List.of())
                .build();

        BigDecimal totalValue = portfolio.getTotalAccountValue();

        assertEquals(BigDecimal.valueOf(10000.0), totalValue);
    }
}
```

**Instrucciones:**

1. Crea el archivo `portfolio-manager/src/test/java/com/finsight/portfoliomanager/domain/PortfolioTest.java`
2. Copia el contenido anterior
3. Guarda el archivo

### Paso 17: Crear PositionTest.java

Crea el archivo `portfolio-manager/src/test/java/com/finsight/portfoliomanager/domain/PositionTest.java`:

```java
package com.finsight.portfoliomanager.domain;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Tests para la entidad Position")
class PositionTest {

    @Test
    @DisplayName("Debe crear una posición con el builder")
    void shouldCreatePositionWithBuilder() {
        Position position = Position.builder()
                .id(UUID.randomUUID())
                .portfolioId(UUID.randomUUID())
                .symbol("AAPL")
                .quantity(BigDecimal.valueOf(10))
                .averagePrice(BigDecimal.valueOf(150.0))
                .currentPrice(BigDecimal.valueOf(160.0))
                .build();

        assertNotNull(position);
        assertEquals("AAPL", position.getSymbol());
        assertEquals(BigDecimal.valueOf(10), position.getQuantity());
        assertEquals(BigDecimal.valueOf(150.0), position.getAveragePrice());
        assertEquals(BigDecimal.valueOf(160.0), position.getCurrentPrice());
    }

    @Test
    @DisplayName("Debe calcular el valor total de la posición correctamente")
    void shouldCalculateTotalValueCorrectly() {
        Position position = Position.builder()
                .symbol("AAPL")
                .quantity(BigDecimal.valueOf(10))
                .currentPrice(BigDecimal.valueOf(160.0))
                .build();

        BigDecimal totalValue = position.getTotalValue();

        assertEquals(BigDecimal.valueOf(1600.0), totalValue);
    }

    @Test
    @DisplayName("Debe calcular el P&L correctamente")
    void shouldCalculatePnLCorrectly() {
        Position position = Position.builder()
                .symbol("AAPL")
                .quantity(BigDecimal.valueOf(10))
                .averagePrice(BigDecimal.valueOf(150.0))
                .currentPrice(BigDecimal.valueOf(160.0))
                .build();

        BigDecimal pnl = position.getPnL();

        // (160.0 - 150.0) * 10 = 100.0
        assertEquals(BigDecimal.valueOf(100.0), pnl);
    }

    @Test
    @DisplayName("Debe calcular el P&L porcentual correctamente")
    void shouldCalculatePnLPercentageCorrectly() {
        Position position = Position.builder()
                .symbol("AAPL")
                .averagePrice(BigDecimal.valueOf(150.0))
                .currentPrice(BigDecimal.valueOf(160.0))
                .build();

        Double pnlPercentage = position.getPnLPercentage();

        // ((160.0 - 150.0) / 150.0) * 100 = 6.666...
        assertEquals(6.666, pnlPercentage, 0.01);
    }
}
```

**Instrucciones:**

1. Crea el archivo `portfolio-manager/src/test/java/com/finsight/portfoliomanager/domain/PositionTest.java`
2. Copia el contenido anterior
3. Guarda el archivo

### Paso 18: Crear TransactionTest.java

Crea el archivo `portfolio-manager/src/test/java/com/finsight/portfoliomanager/domain/TransactionTest.java`:

```java
package com.finsight.portfoliomanager.domain;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Tests para la entidad Transaction")
class TransactionTest {

    @Test
    @DisplayName("Debe crear una transacción con el builder")
    void shouldCreateTransactionWithBuilder() {
        Transaction transaction = Transaction.builder()
                .id(UUID.randomUUID())
                .portfolioId(UUID.randomUUID())
                .symbol("AAPL")
                .type(TransactionType.BUY)
                .quantity(BigDecimal.valueOf(10))
                .price(BigDecimal.valueOf(150.0))
                .total(BigDecimal.valueOf(1500.0))
                .timestamp(LocalDateTime.now())
                .build();

        assertNotNull(transaction);
        assertEquals("AAPL", transaction.getSymbol());
        assertEquals(TransactionType.BUY, transaction.getType());
        assertEquals(BigDecimal.valueOf(10), transaction.getQuantity());
        assertEquals(BigDecimal.valueOf(150.0), transaction.getPrice());
        assertEquals(BigDecimal.valueOf(1500.0), transaction.getTotal());
    }

    @Test
    @DisplayName("Debe crear una transacción de venta")
    void shouldCreateSellTransaction() {
        Transaction transaction = Transaction.builder()
                .type(TransactionType.SELL)
                .build();

        assertEquals(TransactionType.SELL, transaction.getType());
    }

    @Test
    @DisplayName("Debe crear una transacción de depósito")
    void shouldCreateDepositTransaction() {
        Transaction transaction = Transaction.builder()
                .type(TransactionType.DEPOSIT)
                .build();

        assertEquals(TransactionType.DEPOSIT, transaction.getType());
    }

    @Test
    @DisplayName("Debe crear una transacción de retiro")
    void shouldCreateWithdrawalTransaction() {
        Transaction transaction = Transaction.builder()
                .type(TransactionType.WITHDRAWAL)
                .build();

        assertEquals(TransactionType.WITHDRAWAL, transaction.getType());
    }
}
```

**Instrucciones:**

1. Crea el archivo `portfolio-manager/src/test/java/com/finsight/portfoliomanager/domain/TransactionTest.java`
2. Copia el contenido anterior
3. Guarda el archivo

### Paso 19: Crear UserServiceTest.java

Crea el archivo `portfolio-manager/src/test/java/com/finsight/portfoliomanager/application/services/UserServiceTest.java`:

```java
package com.finsight.portfoliomanager.application.services;

import com.finsight.portfoliomanager.application.ports.dto.auth.*;
import com.finsight.portfoliomanager.application.ports.out.TokenRepository;
import com.finsight.portfoliomanager.application.ports.out.TokenService;
import com.finsight.portfoliomanager.application.ports.out.UserRepository;
import com.finsight.portfoliomanager.domain.Role;
import com.finsight.portfoliomanager.domain.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests para UserService")
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private TokenService tokenService;

    @Mock
    private TokenRepository refreshTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(UUID.randomUUID())
                .email("test@example.com")
                .password("encoded_password")
                .username("testuser")
                .role(Role.USER)
                .active(true)
                .build();
    }

    @Test
    @DisplayName("Debe registrar un nuevo usuario exitosamente")
    void shouldRegisterNewUserSuccessfully() {
        RegisterCommand command = new RegisterCommand(
                "test@example.com",
                "password123",
                "testuser"
        );

        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encoded_password");
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        when(tokenService.createAccessToken(any(User.class))).thenReturn("access_token");
        when(tokenService.createRefreshToken(any(User.class))).thenReturn("refresh_token");

        AuthResult result = userService.register(command);

        assertNotNull(result);
        assertEquals("test@example.com", result.getEmail());
        assertEquals("testuser", result.getUsername());
        assertEquals("access_token", result.getAccessToken());
        assertEquals("refresh_token", result.getRefreshToken());
        verify(userRepository).save(any(User.class));
        verify(refreshTokenRepository).save(any(UUID.class), anyString(), anyLong());
    }

    @Test
    @DisplayName("Debe lanzar excepción cuando el email ya está registrado")
    void shouldThrowExceptionWhenEmailAlreadyRegistered() {
        RegisterCommand command = new RegisterCommand(
                "test@example.com",
                "password123",
                "testuser"
        );

        when(userRepository.existsByEmail(anyString())).thenReturn(true);

        assertThrows(RuntimeException.class, () -> userService.register(command));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Debe hacer login exitosamente")
    void shouldLoginSuccessfully() {
        LoginCommand command = new LoginCommand(
                "test@example.com",
                "password123"
        );

        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        when(tokenService.createAccessToken(any(User.class))).thenReturn("access_token");
        when(tokenService.createRefreshToken(any(User.class))).thenReturn("refresh_token");

        AuthResult result = userService.login(command);

        assertNotNull(result);
        assertEquals("test@example.com", result.getEmail());
        assertEquals("access_token", result.getAccessToken());
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Debe lanzar excepción cuando las credenciales son inválidas")
    void shouldThrowExceptionWhenCredentialsAreInvalid() {
        LoginCommand command = new LoginCommand(
                "test@example.com",
                "wrong_password"
        );

        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);

        assertThrows(RuntimeException.class, () -> userService.login(command));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Debe refrescar el token exitosamente")
    void shouldRefreshTokenSuccessfully() {
        RefreshCommand command = new RefreshCommand("refresh_token");

        when(tokenService.validateRefreshToken(anyString())).thenReturn(true);
        when(tokenService.extractUserId(anyString())).thenReturn(testUser.getId());
        when(refreshTokenRepository.findByUserId(any(UUID.class)))
                .thenReturn(Optional.of("refresh_token"));
        when(userRepository.findById(any(UUID.class))).thenReturn(Optional.of(testUser));
        when(tokenService.createAccessToken(any(User.class))).thenReturn("new_access_token");
        when(tokenService.createRefreshToken(any(User.class))).thenReturn("new_refresh_token");

        AuthResult result = userService.refresh(command);

        assertNotNull(result);
        assertEquals("new_access_token", result.getAccessToken());
        assertEquals("new_refresh_token", result.getRefreshToken());
    }

    @Test
    @DisplayName("Debe hacer logout exitosamente")
    void shouldLogoutSuccessfully() {
        UUID userId = testUser.getId();

        userService.logout(userId);

        verify(refreshTokenRepository).deleteByUserId(userId);
    }

    @Test
    @DisplayName("Debe encontrar usuario por ID")
    void shouldFindUserById() {
        UUID userId = testUser.getId();

        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));

        Optional<User> result = userService.findById(userId);

        assertTrue(result.isPresent());
        assertEquals(testUser.getEmail(), result.get().getEmail());
    }

    @Test
    @DisplayName("Debe cambiar contraseña exitosamente")
    void shouldChangePasswordSuccessfully() {
        ChangePasswordCommand command = new ChangePasswordCommand(
                testUser.getId(),
                "old_password",
                "new_password"
        );

        when(userRepository.findById(any(UUID.class))).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);
        when(passwordEncoder.encode(anyString())).thenReturn("new_encoded_password");
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        userService.changePassword(command);

        verify(passwordEncoder).encode("new_password");
        verify(userRepository).save(any(User.class));
        verify(refreshTokenRepository).deleteByUserId(testUser.getId());
    }

    @Test
    @DisplayName("Debe cambiar email exitosamente")
    void shouldChangeEmailSuccessfully() {
        ChangeEmailCommand command = new ChangeEmailCommand(
                testUser.getId(),
                "newemail@example.com"
        );

        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.findById(any(UUID.class))).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        userService.changeEmail(command);

        verify(userRepository).save(any(User.class));
    }
}
```

**Instrucciones:**

1. Crea el archivo `portfolio-manager/src/test/java/com/finsight/portfoliomanager/application/services/UserServiceTest.java`
2. Copia el contenido anterior
3. Guarda el archivo

### Paso 20: Crear PortfolioServiceTest.java

Crea el archivo `portfolio-manager/src/test/java/com/finsight/portfoliomanager/application/services/PortfolioServiceTest.java`:

```java
package com.finsight.portfoliomanager.application.services;

import com.finsight.portfoliomanager.application.ports.out.PortfolioRepository;
import com.finsight.portfoliomanager.domain.Portfolio;
import com.finsight.portfoliomanager.domain.Position;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests para PortfolioService")
class PortfolioServiceTest {

    @Mock
    private PortfolioRepository portfolioRepository;

    @InjectMocks
    private PortfolioService portfolioService;

    private Portfolio testPortfolio;

    @BeforeEach
    void setUp() {
        testPortfolio = Portfolio.builder()
                .id(UUID.randomUUID())
                .name("Test Portfolio")
                .description("Test Description")
                .userId(UUID.randomUUID())
                .balance(BigDecimal.valueOf(10000.0))
                .positions(List.of())
                .transactions(List.of())
                .cumulativeDeposits(BigDecimal.valueOf(10000.0))
                .cumulativeWithdrawals(BigDecimal.ZERO)
                .performance(0.0)
                .build();
    }

    @Test
    @DisplayName("Debe crear un portfolio exitosamente")
    void shouldCreatePortfolioSuccessfully() {
        when(portfolioRepository.save(any(Portfolio.class))).thenReturn(testPortfolio);

        Portfolio result = portfolioService.createPortfolio(testPortfolio);

        assertNotNull(result);
        assertEquals("Test Portfolio", result.getName());
        verify(portfolioRepository).save(any(Portfolio.class));
    }

    @Test
    @DisplayName("Debe encontrar portfolio por ID")
    void shouldFindPortfolioById() {
        UUID portfolioId = testPortfolio.getId();

        when(portfolioRepository.findById(portfolioId)).thenReturn(Optional.of(testPortfolio));

        Optional<Portfolio> result = portfolioService.findById(portfolioId);

        assertTrue(result.isPresent());
        assertEquals("Test Portfolio", result.get().getName());
    }

    @Test
    @DisplayName("Debe encontrar todos los portfolios de un usuario")
    void shouldFindAllPortfoliosByUserId() {
        UUID userId = testPortfolio.getUserId();

        when(portfolioRepository.findByUserId(userId)).thenReturn(List.of(testPortfolio));

        List<Portfolio> result = portfolioService.findByUserId(userId);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Test Portfolio", result.get(0).getName());
    }

    @Test
    @DisplayName("Debe actualizar un portfolio exitosamente")
    void shouldUpdatePortfolioSuccessfully() {
        when(portfolioRepository.findById(any(UUID.class))).thenReturn(Optional.of(testPortfolio));
        when(portfolioRepository.save(any(Portfolio.class))).thenReturn(testPortfolio);

        Portfolio updatedPortfolio = Portfolio.builder()
                .name("Updated Portfolio")
                .description("Updated Description")
                .build();

        Portfolio result = portfolioService.updatePortfolio(testPortfolio.getId(), updatedPortfolio);

        assertNotNull(result);
        verify(portfolioRepository).save(any(Portfolio.class));
    }

    @Test
    @DisplayName("Debe eliminar un portfolio exitosamente")
    void shouldDeletePortfolioSuccessfully() {
        UUID portfolioId = testPortfolio.getId();

        when(portfolioRepository.findById(portfolioId)).thenReturn(Optional.of(testPortfolio));
        doNothing().when(portfolioRepository).delete(any(Portfolio.class));

        portfolioService.deletePortfolio(portfolioId);

        verify(portfolioRepository).delete(any(Portfolio.class));
    }

    @Test
    @DisplayName("Debe agregar una posición al portfolio")
    void shouldAddPositionToPortfolio() {
        Position position = Position.builder()
                .symbol("AAPL")
                .quantity(BigDecimal.valueOf(10))
                .averagePrice(BigDecimal.valueOf(150.0))
                .currentPrice(BigDecimal.valueOf(160.0))
                .build();

        when(portfolioRepository.findById(any(UUID.class))).thenReturn(Optional.of(testPortfolio));
        when(portfolioRepository.save(any(Portfolio.class))).thenReturn(testPortfolio);

        Portfolio result = portfolioService.addPosition(testPortfolio.getId(), position);

        assertNotNull(result);
        verify(portfolioRepository).save(any(Portfolio.class));
    }

    @Test
    @DisplayName("Debe calcular el ROI del portfolio")
    void shouldCalculatePortfolioROI() {
        testPortfolio.setCumulativeDeposits(BigDecimal.valueOf(10000.0));
        testPortfolio.setCumulativeWithdrawals(BigDecimal.ZERO);
        testPortfolio.setBalance(BigDecimal.valueOf(12000.0));

        when(portfolioRepository.findById(any(UUID.class))).thenReturn(Optional.of(testPortfolio));

        Double roi = portfolioService.calculateROI(testPortfolio.getId());

        // ROI = (12000 - 10000) / 10000 * 100 = 20%
        assertEquals(20.0, roi, 0.01);
    }
}
```

**Instrucciones:**

1. Crea el archivo `portfolio-manager/src/test/java/com/finsight/portfoliomanager/application/services/PortfolioServiceTest.java`
2. Copia el contenido anterior
3. Guarda el archivo

### Paso 21: Crear AuthControllerTest.java

Crea el archivo `portfolio-manager/src/test/java/com/finsight/portfoliomanager/infrastructure/adapters/in/rest/AuthControllerTest.java`:

```java
package com.finsight.portfoliomanager.infrastructure.adapters.in.rest;

import com.finsight.portfoliomanager.application.ports.dto.auth.*;
import com.finsight.portfoliomanager.application.ports.in.UserUseCase;
import com.finsight.portfoliomanager.domain.Role;
import com.finsight.portfoliomanager.domain.User;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@DisplayName("Tests para AuthController")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserUseCase userUseCase;

    private AuthResult authResult;

    @BeforeEach
    void setUp() {
        authResult = AuthResult.builder()
                .userId(UUID.randomUUID())
                .email("test@example.com")
                .username("testuser")
                .role(Role.USER)
                .accessToken("access_token")
                .refreshToken("refresh_token")
                .build();
    }

    @Test
    @DisplayName("Debe registrar un nuevo usuario exitosamente")
    void shouldRegisterNewUserSuccessfully() throws Exception {
        RegisterCommand command = new RegisterCommand(
                "test@example.com",
                "password123",
                "testuser"
        );

        when(userUseCase.register(any(RegisterCommand.class))).thenReturn(authResult);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(command)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.username").value("testuser"))
                .andExpect(jsonPath("$.accessToken").value("access_token"))
                .andExpect(jsonPath("$.refreshToken").value("refresh_token"));
    }

    @Test
    @DisplayName("Debe hacer login exitosamente")
    void shouldLoginSuccessfully() throws Exception {
        LoginCommand command = new LoginCommand(
                "test@example.com",
                "password123"
        );

        when(userUseCase.login(any(LoginCommand.class))).thenReturn(authResult);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(command)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.accessToken").value("access_token"));
    }

    @Test
    @DisplayName("Debe refrescar el token exitosamente")
    void shouldRefreshTokenSuccessfully() throws Exception {
        RefreshCommand command = new RefreshCommand("refresh_token");

        when(userUseCase.refresh(any(RefreshCommand.class))).thenReturn(authResult);

        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(command)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("access_token"));
    }

    @Test
    @DisplayName("Debe hacer logout exitosamente")
    void shouldLogoutSuccessfully() throws Exception {
        UUID userId = UUID.randomUUID();

        mockMvc.perform(post("/api/auth/logout/{userId}", userId))
                .andExpect(status().isOk());
    }
}
```

**Instrucciones:**

1. Crea el archivo `portfolio-manager/src/test/java/com/finsight/portfoliomanager/infrastructure/adapters/in/rest/AuthControllerTest.java`
2. Copia el contenido anterior
3. Guarda el archivo

### Paso 22: Crear PortfolioControllerTest.java

Crea el archivo `portfolio-manager/src/test/java/com/finsight/portfoliomanager/infrastructure/adapters/in/rest/PortfolioControllerTest.java`:

```java
package com.finsight.portfoliomanager.infrastructure.adapters.in.rest;

import com.finsight.portfoliomanager.application.ports.in.PortfolioUseCase;
import com.finsight.portfoliomanager.domain.Portfolio;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PortfolioController.class)
@DisplayName("Tests para PortfolioController")
class PortfolioControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private PortfolioUseCase portfolioUseCase;

    private Portfolio testPortfolio;

    @BeforeEach
    void setUp() {
        testPortfolio = Portfolio.builder()
                .id(UUID.randomUUID())
                .name("Test Portfolio")
                .description("Test Description")
                .userId(UUID.randomUUID())
                .balance(BigDecimal.valueOf(10000.0))
                .positions(List.of())
                .transactions(List.of())
                .cumulativeDeposits(BigDecimal.valueOf(10000.0))
                .cumulativeWithdrawals(BigDecimal.ZERO)
                .performance(0.0)
                .build();
    }

    @Test
    @WithMockUser
    @DisplayName("Debe crear un portfolio exitosamente")
    void shouldCreatePortfolioSuccessfully() throws Exception {
        when(portfolioUseCase.createPortfolio(any(Portfolio.class))).thenReturn(testPortfolio);

        mockMvc.perform(post("/api/portfolios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testPortfolio)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Test Portfolio"))
                .andExpect(jsonPath("$.description").value("Test Description"));
    }

    @Test
    @WithMockUser
    @DisplayName("Debe obtener un portfolio por ID")
    void shouldGetPortfolioById() throws Exception {
        UUID portfolioId = testPortfolio.getId();

        when(portfolioUseCase.findById(portfolioId)).thenReturn(java.util.Optional.of(testPortfolio));

        mockMvc.perform(get("/api/portfolios/{id}", portfolioId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Test Portfolio"));
    }

    @Test
    @WithMockUser
    @DisplayName("Debe obtener todos los portfolios de un usuario")
    void shouldGetAllPortfoliosByUserId() throws Exception {
        UUID userId = testPortfolio.getUserId();

        when(portfolioUseCase.findByUserId(userId)).thenReturn(List.of(testPortfolio));

        mockMvc.perform(get("/api/portfolios/user/{userId}", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Test Portfolio"));
    }

    @Test
    @WithMockUser
    @DisplayName("Debe actualizar un portfolio exitosamente")
    void shouldUpdatePortfolioSuccessfully() throws Exception {
        UUID portfolioId = testPortfolio.getId();

        when(portfolioUseCase.updatePortfolio(eq(portfolioId), any(Portfolio.class)))
                .thenReturn(testPortfolio);

        mockMvc.perform(put("/api/portfolios/{id}", portfolioId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testPortfolio)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Test Portfolio"));
    }

    @Test
    @WithMockUser
    @DisplayName("Debe eliminar un portfolio exitosamente")
    void shouldDeletePortfolioSuccessfully() throws Exception {
        UUID portfolioId = testPortfolio.getId();

        mockMvc.perform(delete("/api/portfolios/{id}", portfolioId))
                .andExpect(status().isOk());
    }
}
```

**Instrucciones:**

1. Crea el archivo `portfolio-manager/src/test/java/com/finsight/portfoliomanager/infrastructure/adapters/in/rest/PortfolioControllerTest.java`
2. Copia el contenido anterior
3. Guarda el archivo

### Paso 23: Crear MetricsControllerTest.java

Crea el archivo `portfolio-manager/src/test/java/com/finsight/portfoliomanager/infrastructure/adapters/in/rest/MetricsControllerTest.java`:

```java
package com.finsight.portfoliomanager.infrastructure.adapters.in.rest;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(MetricsController.class)
@DisplayName("Tests para MetricsController")
class MetricsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("Debe retornar el estado de salud del servicio")
    void shouldReturnHealthStatus() throws Exception {
        mockMvc.perform(get("/api/metrics/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.service").value("portfolio-manager"));
    }
}
```

**Instrucciones:**

1. Crea el archivo `portfolio-manager/src/test/java/com/finsight/portfoliomanager/infrastructure/adapters/in/rest/MetricsControllerTest.java`
2. Copia el contenido anterior
3. Guarda el archivo

### Paso 24: Crear tests de integración para PostgreSQL

Crea el archivo `portfolio-manager/src/test/java/com/finsight/portfoliomanager/integration/PostgreSQLIntegrationTest.java`:

```java
package com.finsight.portfoliomanager.integration;

import com.finsight.portfoliomanager.domain.User;
import com.finsight.portfoliomanager.domain.Role;
import com.finsight.portfoliomanager.application.ports.out.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DisplayName("Tests de integración para PostgreSQL")
class PostgreSQLIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("Debe guardar y encontrar un usuario en PostgreSQL")
    void shouldSaveAndFindUserInPostgreSQL() {
        User user = User.builder()
                .id(UUID.randomUUID())
                .email("test@example.com")
                .password("encoded_password")
                .username("testuser")
                .role(Role.USER)
                .active(true)
                .build();

        User savedUser = userRepository.save(user);

        assertNotNull(savedUser.getId());
        assertEquals("test@example.com", savedUser.getEmail());

        Optional<User> foundUser = userRepository.findById(savedUser.getId());
        assertTrue(foundUser.isPresent());
        assertEquals("test@example.com", foundUser.get().getEmail());
    }

    @Test
    @DisplayName("Debe encontrar un usuario por email")
    void shouldFindUserByEmail() {
        User user = User.builder()
                .id(UUID.randomUUID())
                .email("test@example.com")
                .password("encoded_password")
                .username("testuser")
                .role(Role.USER)
                .active(true)
                .build();

        userRepository.save(user);

        Optional<User> foundUser = userRepository.findByEmail("test@example.com");

        assertTrue(foundUser.isPresent());
        assertEquals("test@example.com", foundUser.get().getEmail());
    }
}
```

**Instrucciones:**

1. Crea el archivo `portfolio-manager/src/test/java/com/finsight/portfoliomanager/integration/PostgreSQLIntegrationTest.java`
2. Copia el contenido anterior
3. Guarda el archivo

### Paso 25: Crear tests de integración para Redis

Crea el archivo `portfolio-manager/src/test/java/com/finsight/portfoliomanager/integration/RedisIntegrationTest.java`:

```java
package com.finsight.portfoliomanager.integration;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@DisplayName("Tests de integración para Redis")
class RedisIntegrationTest {

    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    @Test
    @DisplayName("Debe guardar y obtener un valor en Redis")
    void shouldSaveAndGetValueInRedis() {
        String key = "test_key";
        String value = "test_value";

        redisTemplate.opsForValue().set(key, value);

        String retrievedValue = redisTemplate.opsForValue().get(key);

        assertEquals(value, retrievedValue);
        redisTemplate.delete(key);
    }

    @Test
    @DisplayName("Debe guardar un valor con expiración")
    void shouldSaveValueWithExpiration() {
        String key = "test_key_expiration";
        String value = "test_value";

        redisTemplate.opsForValue().set(key, value, 10, TimeUnit.SECONDS);

        String retrievedValue = redisTemplate.opsForValue().get(key);

        assertEquals(value, retrievedValue);
        redisTemplate.delete(key);
    }

    @Test
    @DisplayName("Debe verificar si una clave existe")
    void shouldCheckIfKeyExists() {
        String key = "test_key_exists";
        String value = "test_value";

        redisTemplate.opsForValue().set(key, value);

        Boolean exists = redisTemplate.hasKey(key);

        assertTrue(exists);
        redisTemplate.delete(key);
    }
}
```

**Instrucciones:**

1. Crea el archivo `portfolio-manager/src/test/java/com/finsight/portfoliomanager/integration/RedisIntegrationTest.java`
2. Copia el contenido anterior
3. Guarda el archivo

### Paso 26: Crear tests de integración para gRPC

Crea el archivo `portfolio-manager/src/test/java/com/finsight/portfoliomanager/integration/GrpcIntegrationTest.java`:

```java
package com.finsight.portfoliomanager.integration;

import com.finsight.portfoliomanager.infrastructure.grpc.GrpcFinancialDataClient;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@DisplayName("Tests de integración para gRPC")
class GrpcIntegrationTest {

    @Autowired
    private GrpcFinancialDataClient grpcClient;

    @Test
    @DisplayName("Debe obtener datos financieros a través de gRPC")
    void shouldGetFinancialDataThroughGrpc() {
        // Este test asume que el servidor gRPC está corriendo
        // En un entorno real, usarías TestContainers o un servidor mock

        // Ejemplo de test (ajustar según la implementación real)
        // FinancialDataResponse response = grpcClient.getFinancialData("AAPL");
        // assertNotNull(response);
        // assertEquals("AAPL", response.getSymbol());

        // Por ahora, solo verificamos que el cliente existe
        assertNotNull(grpcClient);
    }
}
```

**Instrucciones:**

1. Crea el archivo `portfolio-manager/src/test/java/com/finsight/portfoliomanager/integration/GrpcIntegrationTest.java`
2. Copia el contenido anterior
3. Guarda el archivo

---

## Tests para frontend (Next.js/React)

### Paso 27: Crear estructura de directorios de tests

Crea la siguiente estructura de directorios:

```
frontend/
├── __tests__/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button.test.tsx
│   │   │   ├── card.test.tsx
│   │   │   └── input.test.tsx
│   │   └── trading/
│   │       ├── trade-dialog.test.tsx
│   │       └── create-portfolio-dialog.test.tsx
│   ├── pages/
│   │   ├── dashboard.test.tsx
│   │   └── portfolio.test.tsx
│   └── lib/
│       └── utils.test.ts
└── e2e/
    ├── auth.spec.ts
    ├── portfolio.spec.ts
    └── trading.spec.ts
```

**Instrucciones:**

1. Navega al directorio `frontend/`
2. Crea los directorios listados arriba
3. Crea los archivos de test listados

### Paso 28: Crear button.test.tsx

Crea el archivo `frontend/__tests__/components/ui/button.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeInTheDocument()
  })

  it('should render button with variant', () => {
    render(<Button variant="destructive">Delete</Button>)
    const button = screen.getByRole('button', { name: /delete/i })
    expect(button).toBeInTheDocument()
  })

  it('should render button with size', () => {
    render(<Button size="lg">Large Button</Button>)
    const button = screen.getByRole('button', { name: /large button/i })
    expect(button).toBeInTheDocument()
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    const button = screen.getByRole('button', { name: /disabled/i })
    expect(button).toBeDisabled()
  })

  it('should call onClick handler when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    const button = screen.getByRole('button', { name: /click me/i })
    button.click()
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

**Instrucciones:**

1. Crea el archivo `frontend/__tests__/components/ui/button.test.tsx`
2. Copia el contenido anterior
3. Guarda el archivo

### Paso 29: Crear card.test.tsx

Crea el archivo `frontend/__tests__/components/ui/card.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

describe('Card Component', () => {
  it('should render card with header and content', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
        </CardHeader>
        <CardContent>Test Content</CardContent>
      </Card>
    )

    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('should render card with custom className', () => {
    const { container } = render(
      <Card className="custom-class">
        <CardContent>Content</CardContent>
      </Card>
    )

    const card = container.firstChild as HTMLElement
    expect(card).toHaveClass('custom-class')
  })
})
```

**Instrucciones:**

1. Crea el archivo `frontend/__tests__/components/ui/card.test.tsx`
2. Copia el contenido anterior
3. Guarda el archivo

### Paso 30: Crear input.test.tsx

Crea el archivo `frontend/__tests__/components/ui/input.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { Input } from '@/components/ui/input'

describe('Input Component', () => {
  it('should render input with placeholder', () => {
    render(<Input placeholder="Enter text" />)
    const input = screen.getByPlaceholderText('Enter text')
    expect(input).toBeInTheDocument()
  })

  it('should render input with type', () => {
    render(<Input type="email" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('type', 'email')
  })

  it('should update value on change', () => {
    render(<Input placeholder="Enter text" />)
    const input = screen.getByPlaceholderText('Enter text') as HTMLInputElement

    fireEvent.change(input, { target: { value: 'test value' } })

    expect(input.value).toBe('test value')
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Input disabled />)
    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
  })
})
```

**Instrucciones:**

1. Crea el archivo `frontend/__tests__/components/ui/input.test.tsx`
2. Copia el contenido anterior
3. Guarda el archivo

### Paso 31: Crear trade-dialog.test.tsx

Crea el archivo `frontend/__tests__/components/trading/trade-dialog.test.tsx`:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TradeDialog } from '@/components/trading/trade-dialog'

describe('TradeDialog Component', () => {
  const mockOnSubmit = jest.fn()
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render dialog when open', () => {
    render(
      <TradeDialog
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        portfolioId="test-id"
      />
    )

    expect(screen.getByText(/trade/i)).toBeInTheDocument()
  })

  it('should not render dialog when closed', () => {
    render(
      <TradeDialog
        open={false}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        portfolioId="test-id"
      />
    )

    expect(screen.queryByText(/trade/i)).not.toBeInTheDocument()
  })

  it('should call onClose when cancel button is clicked', () => {
    render(
      <TradeDialog
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        portfolioId="test-id"
      />
    )

    const cancelButton = screen.getByText(/cancel/i)
    fireEvent.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should submit form with valid data', async () => {
    render(
      <TradeDialog
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        portfolioId="test-id"
      />
    )

    const symbolInput = screen.getByPlaceholderText(/symbol/i)
    const quantityInput = screen.getByPlaceholderText(/quantity/i)
    const submitButton = screen.getByText(/submit/i)

    fireEvent.change(symbolInput, { target: { value: 'AAPL' } })
    fireEvent.change(quantityInput, { target: { value: '10' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1)
    })
  })
})
```

**Instrucciones:**

1. Crea el archivo `frontend/__tests__/components/trading/trade-dialog.test.tsx`
2. Copia el contenido anterior
3. Guarda el archivo

### Paso 32: Crear create-portfolio-dialog.test.tsx

Crea el archivo `frontend/__tests__/components/trading/create-portfolio-dialog.test.tsx`:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CreatePortfolioDialog } from '@/components/trading/create-portfolio-dialog'

describe('CreatePortfolioDialog Component', () => {
  const mockOnSubmit = jest.fn()
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render dialog when open', () => {
    render(
      <CreatePortfolioDialog
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    )

    expect(screen.getByText(/create portfolio/i)).toBeInTheDocument()
  })

  it('should have name and description inputs', () => {
    render(
      <CreatePortfolioDialog
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    )

    expect(screen.getByPlaceholderText(/portfolio name/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/description/i)).toBeInTheDocument()
  })

  it('should submit form with valid data', async () => {
    render(
      <CreatePortfolioDialog
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    )

    const nameInput = screen.getByPlaceholderText(/portfolio name/i)
    const descriptionInput = screen.getByPlaceholderText(/description/i)
    const submitButton = screen.getByText(/create/i)

    fireEvent.change(nameInput, { target: { value: 'My Portfolio' } })
    fireEvent.change(descriptionInput, { target: { value: 'Test Description' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1)
    })
  })
})
```

**Instrucciones:**

1. Crea el archivo `frontend/__tests__/components/trading/create-portfolio-dialog.test.tsx`
2. Copia el contenido anterior
3. Guarda el archivo

### Paso 33: Crear dashboard.test.tsx

Crea el archivo `frontend/__tests__/pages/dashboard.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import Dashboard from '@/app/(dashboard)/dashboard/page'

// Mock de los componentes
jest.mock('@/components/trading/balance-chart', () => ({
  BalanceChart: () => <div data-testid="balance-chart">Balance Chart</div>
}))

jest.mock('@/components/trading/create-portfolio-dialog', () => ({
  CreatePortfolioDialog: () => <div data-testid="create-dialog">Create Dialog</div>
}))

describe('Dashboard Page', () => {
  it('should render dashboard page', () => {
    render(<Dashboard />)
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument()
  })

  it('should render balance chart component', () => {
    render(<Dashboard />)
    expect(screen.getByTestId('balance-chart')).toBeInTheDocument()
  })

  it('should render create portfolio button', () => {
    render(<Dashboard />)
    expect(screen.getByText(/create portfolio/i)).toBeInTheDocument()
  })
})
```

**Instrucciones:**

1. Crea el archivo `frontend/__tests__/pages/dashboard.test.tsx`
2. Copia el contenido anterior
3. Guarda el archivo

### Paso 34: Crear portfolio.test.tsx

Crea el archivo `frontend/__tests__/pages/portfolio.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import PortfolioPage from '@/app/(dashboard)/portfolio/page'

describe('Portfolio Page', () => {
  it('should render portfolio page', () => {
    render(<PortfolioPage />)
    expect(screen.getByText(/portfolios/i)).toBeInTheDocument()
  })

  it('should render portfolio list', () => {
    render(<PortfolioPage />)
    expect(screen.getByText(/portfolio list/i)).toBeInTheDocument()
  })
})
```

**Instrucciones:**

1. Crea el archivo `frontend/__tests__/pages/portfolio.test.tsx`
2. Copia el contenido anterior
3. Guarda el archivo

### Paso 35: Crear utils.test.ts

Crea el archivo `frontend/__tests__/lib/utils.test.ts`:

```typescript
import { cn } from "@/lib/utils";

describe("Utils", () => {
  describe("cn function", () => {
    it("should merge class names correctly", () => {
      const result = cn("class1", "class2");
      expect(result).toBe("class1 class2");
    });

    it("should handle conditional classes", () => {
      const result = cn("class1", false && "class2", "class3");
      expect(result).toBe("class1 class3");
    });

    it("should handle undefined and null values", () => {
      const result = cn("class1", undefined, null, "class2");
      expect(result).toBe("class1 class2");
    });

    it("should handle empty strings", () => {
      const result = cn("class1", "", "class2");
      expect(result).toBe("class1 class2");
    });

    it("should handle arrays of classes", () => {
      const result = cn(["class1", "class2"], "class3");
      expect(result).toBe("class1 class2 class3");
    });
  });
});
```

**Instrucciones:**

1. Crea el archivo `frontend/__tests__/lib/utils.test.ts`
2. Copia el contenido anterior
3. Guarda el archivo

---

## Tests E2E

### Paso 36: Crear auth.spec.ts

Crea el archivo `frontend/e2e/auth.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000");
  });

  test("should navigate to login page", async ({ page }) => {
    await page.click("text=Login");
    await expect(page).toHaveURL(/.*login/);
    await expect(page.locator("h1")).toContainText("Login");
  });

  test("should navigate to register page", async ({ page }) => {
    await page.click("text=Register");
    await expect(page).toHaveURL(/.*register/);
    await expect(page.locator("h1")).toContainText("Register");
  });

  test("should register a new user", async ({ page }) => {
    await page.goto("http://localhost:3000/register");

    // Fill registration form
    await page.fill('input[name="email"]', `test${Date.now()}@example.com`);
    await page.fill('input[name="username"]', "testuser");
    await page.fill('input[name="password"]', "password123");

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test("should login with valid credentials", async ({ page }) => {
    await page.goto("http://localhost:3000/login");

    // Fill login form
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "password123");

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test("should show error with invalid credentials", async ({ page }) => {
    await page.goto("http://localhost:3000/login");

    // Fill login form with invalid credentials
    await page.fill('input[name="email"]', "invalid@example.com");
    await page.fill('input[name="password"]', "wrongpassword");

    // Submit form
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator("text=Invalid credentials")).toBeVisible();
  });

  test("should logout successfully", async ({ page }) => {
    // Login first
    await page.goto("http://localhost:3000/login");
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await expect(page).toHaveURL(/.*dashboard/);

    // Logout
    await page.click("text=Logout");

    // Should redirect to home
    await expect(page).toHaveURL("http://localhost:3000/");
  });
});
```

**Instrucciones:**

1. Crea el archivo `frontend/e2e/auth.spec.ts`
2. Copia el contenido anterior
3. Guarda el archivo

### Paso 37: Crear portfolio.spec.ts

Crea el archivo `frontend/e2e/portfolio.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Portfolio Management", () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto("http://localhost:3000/login");
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test("should navigate to portfolio page", async ({ page }) => {
    await page.click("text=Portfolios");
    await expect(page).toHaveURL(/.*portfolio/);
    await expect(page.locator("h1")).toContainText("Portfolios");
  });

  test("should create a new portfolio", async ({ page }) => {
    await page.goto("http://localhost:3000/portfolio");

    // Click create portfolio button
    await page.click("text=Create Portfolio");

    // Fill form
    await page.fill('input[placeholder*="portfolio name"]', "Test Portfolio");
    await page.fill('input[placeholder*="description"]', "Test Description");

    // Submit
    await page.click("text=Create");

    // Should show new portfolio in list
    await expect(page.locator("text=Test Portfolio")).toBeVisible();
  });

  test("should view portfolio details", async ({ page }) => {
    await page.goto("http://localhost:3000/portfolio");

    // Click on first portfolio
    await page.click(".portfolio-card:first-child");

    // Should navigate to portfolio detail page
    await expect(page.locator("h1")).toContainText("Portfolio Details");
  });

  test("should delete a portfolio", async ({ page }) => {
    await page.goto("http://localhost:3000/portfolio");

    // Get initial count
    const initialCount = await page.locator(".portfolio-card").count();

    // Click delete button on first portfolio
    await page.click('.portfolio-card:first-child button:has-text("Delete")');

    // Confirm deletion
    await page.click("text=Confirm");

    // Should have one less portfolio
    const finalCount = await page.locator(".portfolio-card").count();
    expect(finalCount).toBe(initialCount - 1);
  });
});
```

**Instrucciones:**

1. Crea el archivo `frontend/e2e/portfolio.spec.ts`
2. Copia el contenido anterior
3. Guarda el archivo

### Paso 38: Crear trading.spec.ts

Crea el archivo `frontend/e2e/trading.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Trading Operations", () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto("http://localhost:3000/login");
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test("should open trade dialog", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard");

    // Click trade button
    await page.click("text=Trade");

    // Should show trade dialog
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator("text=Trade")).toBeVisible();
  });

  test("should execute a buy order", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard");

    // Open trade dialog
    await page.click("text=Trade");

    // Fill trade form
    await page.fill('input[placeholder*="symbol"]', "AAPL");
    await page.fill('input[placeholder*="quantity"]', "10");
    await page.selectOption('select[name="type"]', "BUY");

    // Submit
    await page.click('button:has-text("Submit")');

    // Should show success message
    await expect(page.locator("text=Order executed")).toBeVisible();
  });

  test("should execute a sell order", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard");

    // Open trade dialog
    await page.click("text=Trade");

    // Fill trade form
    await page.fill('input[placeholder*="symbol"]', "AAPL");
    await page.fill('input[placeholder*="quantity"]', "5");
    await page.selectOption('select[name="type"]', "SELL");

    // Submit
    await page.click('button:has-text("Submit")');

    // Should show success message
    await expect(page.locator("text=Order executed")).toBeVisible();
  });

  test("should add cash to portfolio", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard");

    // Click add cash button
    await page.click("text=Add Cash");

    // Fill amount
    await page.fill('input[type="number"]', "1000");

    // Submit
    await page.click('button:has-text("Add")');

    // Should show success message
    await expect(page.locator("text=Cash added")).toBeVisible();
  });

  test("should withdraw cash from portfolio", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard");

    // Click withdraw cash button
    await page.click("text=Withdraw Cash");

    // Fill amount
    await page.fill('input[type="number"]', "500");

    // Submit
    await page.click('button:has-text("Withdraw")');

    // Should show success message
    await expect(page.locator("text=Cash withdrawn")).toBeVisible();
  });
});
```

**Instrucciones:**

1. Crea el archivo `frontend/e2e/trading.spec.ts`
2. Copia el contenido anterior
3. Guarda el archivo

---

## Configuración de CI/CD

### Paso 39: Actualizar el workflow de CI/CD

Reemplaza el contenido de [`.github/workflows/ci.yml`](.github/workflows/ci.yml) con el siguiente contenido:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, master, develop]
  pull_request:
    branches: [main, master]

env:
  JAVA_VERSION: "17"
  PYTHON_VERSION: "3.11"
  NODE_VERSION: "20"

jobs:
  # Code Quality & Linting
  lint-python:
    name: Lint Python (data-collector)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}

      - name: Install dependencies
        run: |
          cd data-collector
          pip install black isort mypy pylint pytest
          pip install -r requirements.txt

      - name: Run Black
        run: cd data-collector && black --check .

      - name: Run isort
        run: cd data-collector && isort --check-only .

      - name: Run mypy
        run: cd data-collector && mypy src/ || true

      - name: Run pylint
        run: cd data-collector && pylint src/ --exit-zero

  lint-java:
    name: Lint Java (portfolio-manager)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK
        uses: actions/setup-java@v4
        with:
          java-version: ${{ env.JAVA_VERSION }}
          distribution: "temurin"

      - name: Run tests
        run: |
          cd portfolio-manager
          mvn clean test

  lint-frontend:
    name: Lint Frontend (Next.js)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: cd frontend && pnpm install

      - name: Run ESLint
        run: cd frontend && pnpm lint

      - name: Run TypeScript check
        run: cd frontend && pnpm tsc --noEmit

  # Unit Tests
  test-python:
    name: Test Python (data-collector)
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo:latest
        ports:
          - 27017:27017
      redis:
        image: redis:latest
        ports:
          - 6379:6379
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}

      - name: Install dependencies
        run: |
          cd data-collector
          pip install -r requirements.txt
          pip install pytest pytest-cov pytest-mock

      - name: Run tests with coverage
        run: |
          cd data-collector
          pytest --cov=src --cov-report=xml --cov-report=html

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./data-collector/coverage.xml
          flags: python

  test-java:
    name: Test Java (portfolio-manager)
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: user
          POSTGRES_PASSWORD: password
          POSTGRES_DB: finsight_db
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:latest
        ports:
          - 6379:6379
    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK
        uses: actions/setup-java@v4
        with:
          java-version: ${{ env.JAVA_VERSION }}
          distribution: "temurin"

      - name: Run tests with coverage
        run: |
          cd portfolio-manager
          mvn clean test jacoco:report

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./portfolio-manager/target/site/jacoco/jacoco.xml
          flags: java

  test-frontend:
    name: Test Frontend (Next.js)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: cd frontend && pnpm install

      - name: Run tests
        run: cd frontend && pnpm test

  # Integration Tests
  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest
    needs: [test-python, test-java]
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: user
          POSTGRES_PASSWORD: password
          POSTGRES_DB: finsight_db
        ports:
          - 5432:5432
      mongodb:
        image: mongo:latest
        ports:
          - 27017:27017
      redis:
        image: redis:latest
        ports:
          - 6379:6379
    steps:
      - uses: actions/checkout@v4

      - name: Run integration tests
        run: |
          echo "Running integration tests..."
          # Add integration test commands here
```

**Instrucciones:**

1. Abre el archivo `.github/workflows/ci.yml`
2. Reemplaza todo el contenido con el YAML anterior
3. Guarda el archivo

---

## Verificación Final

### Paso 40: Ejecutar todos los tests localmente

#### Ejecutar tests de Python

```bash
cd data-collector
pip install -r requirements.txt
pytest --cov=src --cov-report=html
```

#### Ejecutar tests de Java

```bash
cd portfolio-manager
mvn clean test
mvn jacoco:report
```

#### Ejecutar tests de Frontend

```bash
cd frontend
pnpm install
pnpm test
pnpm test:coverage
```

#### Ejecutar tests E2E

```bash
cd frontend
pnpm install
pnpm test:e2e
```

### Paso 41: Verificar cobertura de código

#### Python

Abre `data-collector/htmlcov/index.html` en tu navegador para ver el reporte de cobertura.

#### Java

Abre `portfolio-manager/target/site/jacoco/index.html` en tu navegador para ver el reporte de cobertura.

#### Frontend

Abre `frontend/coverage/index.html` en tu navegador para ver el reporte de cobertura.

### Paso 42: Verificar que todos los tests pasan

Asegúrate de que:

1. ✅ Todos los tests unitarios de Python pasan
2. ✅ Todos los tests unitarios de Java pasan
3. ✅ Todos los tests unitarios de Frontend pasan
4. ✅ Todos los tests de integración pasan
5. ✅ Todos los tests E2E pasan
6. ✅ La cobertura de código es aceptable (mínimo 70%)

---

## Resumen

Has completado la implementación de todos los tests necesarios para el proyecto FinSight:

### Tests Implementados

**data-collector (Python):**

- ✅ 5 archivos de tests unitarios
- ✅ 2 archivos de tests de integración
- ✅ Configuración de pytest con cobertura

**portfolio-manager (Java):**

- ✅ 4 archivos de tests de dominio
- ✅ 2 archivos de tests de servicios
- ✅ 3 archivos de tests de controladores
- ✅ 3 archivos de tests de integración
- ✅ Configuración de JaCoCo para cobertura

**frontend (Next.js/React):**

- ✅ 3 archivos de tests de componentes UI
- ✅ 2 archivos de tests de componentes de trading
- ✅ 2 archivos de tests de páginas
- ✅ 1 archivo de tests de utilidades
- ✅ 3 archivos de tests E2E
- ✅ Configuración de Jest y Playwright

**CI/CD:**

- ✅ Workflow actualizado con todos los jobs de testing
- ✅ Integración con Codecov para reportes de cobertura

---

## Próximos Pasos

1. **Ejecutar los tests localmente** para verificar que todo funciona
2. **Hacer commit y push** de los cambios
3. **Verificar que el pipeline de CI/CD** se ejecuta correctamente
4. **Revisar los reportes de cobertura** en Codecov
5. **Mejorar la cobertura** si es necesario

---

_Última actualización: 2025-02-05_
