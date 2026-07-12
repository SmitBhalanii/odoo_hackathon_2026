# AssetFlow Backend - Command Reference

Quick reference for all common commands.

## 🚀 Initial Setup

```bash
# Navigate to backend
cd d:\AssetFlow\backend

# Create virtual environment
python -m venv venv

# Activate (Windows CMD)
venv\Scripts\activate

# Activate (Windows PowerShell)
venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Create demo data
python seed.py

# Start server
uvicorn app.main:app --reload
```

## 🔄 Daily Development

```bash
# Activate virtual environment (do this first every time)
venv\Scripts\activate

# Start server (auto-reloads on file changes)
uvicorn app.main:app --reload

# Or use the run script
run.bat

# Start on different port
uvicorn app.main:app --reload --port 8080
```

## 🗄️ Database Commands

```bash
# Seed database with demo data
python seed.py

# Reset database (delete and recreate)
del assetflow.db
python seed.py

# Initialize database only (no seed data)
python -c "from app.db.session import init_db; init_db()"
```

## 📦 Package Management

```bash
# Install dependencies
pip install -r requirements.txt

# Add new package
pip install package-name
pip freeze > requirements.txt

# Update all packages
pip install --upgrade -r requirements.txt

# Show installed packages
pip list

# Show specific package info
pip show fastapi
```

## 🔍 Testing & Debugging

```bash
# Run Python REPL with app context
python -i -c "from app.db.session import SessionLocal; db = SessionLocal()"

# Check if server is running
curl http://localhost:8000/health

# Test login endpoint
curl -X POST http://localhost:8000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@techcorp.com\",\"password\":\"admin123\"}"

# Test with token (replace YOUR_TOKEN)
curl http://localhost:8000/api/assets ^
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🧹 Cleanup Commands

```bash
# Remove virtual environment
rmdir /s /q venv

# Remove database
del assetflow.db

# Remove Python cache
for /d /r . %d in (__pycache__) do @if exist "%d" rmdir /s /q "%d"

# Remove all generated files
del assetflow.db
for /d /r . %d in (__pycache__) do @if exist "%d" rmdir /s /q "%d"
```

## 📝 Useful Python Commands

```bash
# Check Python version
python --version

# Check pip version
pip --version

# Upgrade pip
python -m pip install --upgrade pip

# Show environment info
python -c "import sys; print(sys.version); print(sys.executable)"
```

## 🌐 Server URLs

- **API Docs (Swagger):** http://localhost:8000/docs
- **API Docs (ReDoc):** http://localhost:8000/redoc
- **Health Check:** http://localhost:8000/health
- **Root:** http://localhost:8000

## 🔑 Demo Credentials

```
Admin:     admin@techcorp.com / admin123
Manager:   manager@techcorp.com / manager123
Employee:  john.doe@techcorp.com / password123
```

## 🛠️ Development Workflow

```bash
# 1. Start your day
cd d:\AssetFlow\backend
venv\Scripts\activate
uvicorn app.main:app --reload

# 2. Make changes to code
# (Server auto-reloads)

# 3. Test in browser
# http://localhost:8000/docs

# 4. Reset database if needed
del assetflow.db
python seed.py
```

## 📊 Database Inspection

```bash
# Using Python REPL
python
>>> from app.db.session import SessionLocal
>>> from app.db import models
>>> db = SessionLocal()
>>> users = db.query(models.User).all()
>>> for u in users: print(u.email)
>>> exit()
```

## 🔄 Git Commands

```bash
# Check status
git status

# Add files
git add .

# Commit
git commit -m "Your message"

# Push
git push origin your-branch
```

## ⚡ One-Line Commands

```bash
# Fresh install
python -m venv venv && venv\Scripts\activate && pip install -r requirements.txt && python seed.py

# Quick reset
del assetflow.db && python seed.py

# Full cleanup and reinstall
rmdir /s /q venv && del assetflow.db && python -m venv venv && venv\Scripts\activate && pip install -r requirements.txt && python seed.py
```

## 🐛 Troubleshooting Commands

```bash
# Check if port is in use
netstat -ano | findstr :8000

# Kill process on port 8000 (if needed)
# 1. Find PID: netstat -ano | findstr :8000
# 2. Kill: taskkill /PID <PID> /F

# Fix PowerShell execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Verify virtual environment is active
where python
# Should show path inside venv folder
```

## 📱 API Testing with Curl

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@techcorp.com\",\"password\":\"admin123\"}"

# Register new user
curl -X POST http://localhost:8000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@test.com\",\"password\":\"test123\",\"name\":\"Test User\",\"role\":\"Employee\"}"

# Get users (with auth)
curl http://localhost:8000/api/users ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get assets (with pagination)
curl "http://localhost:8000/api/assets?skip=0&limit=10" ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Health check (no auth)
curl http://localhost:8000/health
```

## 📦 Production Deployment

```bash
# Install production server
pip install gunicorn

# Run with Gunicorn (Unix)
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker

# For Windows, use Uvicorn with workers
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

# With environment variables
set DEBUG=False
set SECRET_KEY=your-production-secret
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## 🔐 Security Commands

```bash
# Generate new secret key (Python)
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Test JWT token decoding
python
>>> from app.core.security import decode_access_token
>>> token = "YOUR_TOKEN"
>>> payload = decode_access_token(token)
>>> print(payload)
```

## 📈 Performance Testing

```bash
# Install testing tools
pip install pytest httpx

# Run all tests (when created)
pytest

# With coverage
pip install pytest-cov
pytest --cov=app tests/
```

## 💡 Quick Tips

```bash
# View real-time logs (server must be running)
# Just watch the terminal where uvicorn is running

# Check all routes
python -c "from app.main import app; print([r.path for r in app.routes])"

# List all models
python -c "from app.db import models; import inspect; print([m for m in dir(models) if inspect.isclass(getattr(models, m))])"

# Count lines of code
powershell "Get-ChildItem -Path app -Recurse -Include *.py | Get-Content | Measure-Object -Line"
```

## 🎓 Learning Resources

- **FastAPI Docs:** https://fastapi.tiangolo.com/
- **SQLAlchemy Docs:** https://docs.sqlalchemy.org/
- **Pydantic Docs:** https://docs.pydantic.dev/
- **Local API Docs:** http://localhost:8000/docs

---

**Pro Tip:** Keep the server running while developing. It auto-reloads on file changes!
