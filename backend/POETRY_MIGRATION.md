# Poetry Migration Guide for Synca Backend

## Overview

This guide helps you migrate from pip/requirements.txt to Poetry for the Synca FastAPI backend project.

## What Changed

- **Before**: Dependencies managed with `requirements.txt`
- **After**: Dependencies managed with `pyproject.toml` and `poetry.lock`
- **Benefits**:
  - Deterministic dependency resolution
  - Separate dev and production dependencies
  - Built-in virtual environment management
  - Easy script management
  - Better dependency conflict resolution

## Installation

### 1. Install Poetry

**Windows (PowerShell):**
```powershell
(Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | py -
```

**macOS/Linux:**
```bash
curl -sSL https://install.python-poetry.org | python3 -
```

**Alternative (using pip):**
```bash
pip install poetry
```

### 2. Verify Installation
```bash
poetry --version
```

## Migration Steps

### 1. Navigate to Backend Directory
```bash
cd backend/
```

### 2. Install Dependencies
```bash
# Install all dependencies (main + dev + test)
poetry install

# Install only production dependencies
poetry install --only=main

# Install without dev dependencies
poetry install --no-dev
```

### 3. Activate Virtual Environment
```bash
# Method 1: Use poetry shell
poetry shell

# Method 2: Run commands with poetry run
poetry run python main.py
```

## Common Commands

### Development Commands

| Task | Old Command | New Command |
|------|-------------|-------------|
| Run development server | `uvicorn main:app --reload` | `poetry run dev` |
| Run production server | `uvicorn main:app` | `poetry run start` |
| Run migrations | `alembic upgrade head` | `poetry run migrate` |
| Create migrations | `alembic revision --autogenerate` | `poetry run makemigrations` |
| Run tests | `pytest` | `poetry run test` |
| Run tests with coverage | `pytest --cov=app` | `poetry run test-cov` |
| Format code | `black app/ && isort app/` | `poetry run format` |
| Lint code | `flake8 app/` | `poetry run lint` |
| Type checking | `mypy app/` | `poetry run type-check` |

### Dependency Management

| Task | Old Command | New Command |
|------|-------------|-------------|
| Add package | `pip install package` | `poetry add package` |
| Add dev package | `pip install package` | `poetry add --group dev package` |
| Remove package | `pip uninstall package` | `poetry remove package` |
| Update packages | `pip install -U package` | `poetry update package` |
| Show dependencies | `pip list` | `poetry show` |

## Project Structure

```
backend/
├── pyproject.toml          # Poetry configuration (replaces requirements.txt)
├── poetry.lock             # Locked versions (auto-generated)
├── .venv/                  # Virtual environment (auto-created)
├── app/                    # Application code
├── migrations/             # Database migrations
├── tests/                  # Test files
├── alembic.ini            # Alembic configuration
├── main.py                # FastAPI application entry point
└── Dockerfile             # Updated for Poetry
```

## Dependencies

### Production Dependencies
- fastapi==0.116.1
- uvicorn[standard]==0.35.0
- sqlalchemy==2.0.37
- psycopg2==2.9.10
- python-dotenv==1.1.1
- pydantic==2.11.7
- pydantic-settings==2.5.2
- requests==2.32.3
- starlette==0.47.1
- alembic==1.13.2

### Development Dependencies
- pytest: Testing framework
- pytest-asyncio: Async test support
- pytest-cov: Coverage reports
- black: Code formatting
- isort: Import sorting
- flake8: Linting
- mypy: Type checking
- pre-commit: Pre-commit hooks
- httpx: HTTP client for testing

### Test Dependencies
- pytest: Testing framework
- pytest-asyncio: Async test support
- pytest-cov: Coverage reports
- httpx: HTTP client for testing
- factory-boy: Test data factories

## Docker Usage

The Dockerfile has been updated to use Poetry:

```dockerfile
# Build image
docker build -t synca-backend .

# Run container
docker run -p 8000:8000 synca-backend
```

### Docker Compose (if using)
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=
```

## Development Workflow

### 1. Daily Development
```bash
# Activate environment
poetry shell

# Run development server with hot reload
poetry run dev

# In another terminal, run tests
poetry run test
```

### 2. Adding New Dependencies
```bash
# Add production dependency
poetry add requests

# Add development dependency
poetry add --group dev pytest-mock

# Add test dependency
poetry add --group test factory-boy
```

### 3. Code Quality
```bash
# Format code
poetry run format

# Check formatting without changing
poetry run format-check

# Lint code
poetry run lint

# Type check
poetry run type-check
```

### 4. Database Operations
```bash
# Create new migration
poetry run makemigrations -m "add user table"

# Apply migrations
poetry run migrate

# Downgrade migration
poetry run alembic downgrade -1
```

## Configuration Details

### pyproject.toml Sections

1. **[tool.poetry]**: Basic project information
2. **[tool.poetry.dependencies]**: Production dependencies
3. **[tool.poetry.group.dev.dependencies]**: Development dependencies
4. **[tool.poetry.group.test.dependencies]**: Test-specific dependencies
5. **[tool.poetry.scripts]**: Custom commands
6. **[tool.black]**: Black formatter configuration
7. **[tool.isort]**: Import sorter configuration
8. **[tool.mypy]**: Type checker configuration
9. **[tool.pytest.ini_options]**: Pytest configuration

### Environment Variables

Poetry respects these environment variables:
- `POETRY_VENV_IN_PROJECT=1`: Create .venv in project directory
- `POETRY_NO_INTERACTION=1`: Run in non-interactive mode
- `POETRY_CACHE_DIR`: Custom cache directory

## Troubleshooting

### Common Issues

1. **Poetry not found after installation**
   ```bash
   # Add to PATH or restart terminal
   export PATH="$HOME/.local/bin:$PATH"
   ```

2. **Virtual environment issues**
   ```bash
   # Delete and recreate environment
   poetry env remove python
   poetry install
   ```

3. **Dependency conflicts**
   ```bash
   # Update lock file
   poetry lock --no-update
   poetry install
   ```

4. **Cache issues**
   ```bash
   # Clear poetry cache
   poetry cache clear . --all
   ```

### Performance Tips

1. **Use dependency groups**:
   ```bash
   # Install only production dependencies
   poetry install --only=main
   ```

2. **Enable parallel installation**:
   ```bash
   poetry config installer.parallel true
   ```

3. **Use local virtual environment**:
   ```bash
   poetry config virtualenvs.in-project true
   ```

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Install Poetry
  uses: snok/install-poetry@v1
  with:
    version: 1.7.1

- name: Install dependencies
  run: poetry install --only=main

- name: Run tests
  run: poetry run test
```

### Docker Production Build
```dockerfile
# Multi-stage build for production
FROM python:3.11-slim as builder
RUN pip install poetry
COPY pyproject.toml poetry.lock ./
RUN poetry export -f requirements.txt --output requirements.txt --without-hashes

FROM python:3.11-slim as production
COPY --from=builder requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Next Steps

1. **Set up pre-commit hooks**:
   ```bash
   poetry run pre-commit install
   ```

2. **Configure IDE**: Update your IDE to use Poetry's virtual environment

3. **Update CI/CD**: Modify deployment scripts to use Poetry

4. **Team onboarding**: Share this guide with team members

## Support

- [Poetry Documentation](https://python-poetry.org/docs/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)

## Migration Checklist

- [ ] Install Poetry
- [ ] Run `poetry install`
- [ ] Test application with `poetry run dev`
- [ ] Run tests with `poetry run test`
- [ ] Update deployment scripts
- [ ] Update documentation
- [ ] Share guide with team
- [ ] Remove old `requirements.txt` (optional)

