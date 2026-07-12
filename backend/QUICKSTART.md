# AssetFlow Backend - Quick Start Guide

Get the AssetFlow backend running in 5 minutes!

## Prerequisites

- Python 3.9 or higher
- pip (Python package installer)

## Quick Setup

### 1. Navigate to Backend Directory

```bash
cd d:\AssetFlow\backend
```

### 2. Create Virtual Environment

```bash
python -m venv venv
```

### 3. Activate Virtual Environment

**Windows (Command Prompt):**
```bash
venv\Scripts\activate
```

**Windows (PowerShell):**
```bash
venv\Scripts\Activate.ps1
```

### 4. Install Dependencies

```bash
pip install -r requirements.txt
```

This installs:
- FastAPI - Web framework
- SQLAlchemy - Database ORM
- Pydantic - Data validation
- Uvicorn - ASGI server
- Python-JOSE - JWT tokens
- Passlib - Password hashing

### 5. Seed Database (Creates Demo Data)

```bash
python seed.py
```

This creates:
- Sample users (Admin, Manager, Employees)
- Asset categories (Laptops, Furniture, etc.)
- Sample assets
- Allocations and bookings
- Activity logs

### 6. Start the Server

**Option A: Using the run script (Windows)**
```bash
run.bat
```

**Option B: Manual start**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 7. Verify It's Running

Open your browser and visit:
- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

## Demo Login Credentials

After seeding, use these credentials to test:

### Admin Account
- **Email:** admin@techcorp.com
- **Password:** admin123
- **Access:** Full system access

### Manager Account
- **Email:** manager@techcorp.com
- **Password:** manager123
- **Access:** Asset management

### Employee Account
- **Email:** john.doe@techcorp.com
- **Password:** password123
- **Access:** Basic user access

## Testing the API

### 1. Login to Get Token

Using the Swagger UI at http://localhost:8000/docs:

1. Click on `/api/auth/login` endpoint
2. Click "Try it out"
3. Enter credentials:
```json
{
  "email": "admin@techcorp.com",
  "password": "admin123"
}
```
4. Click "Execute"
5. Copy the `access_token` from the response

### 2. Authorize Requests

1. Click the "Authorize" button at the top of the Swagger UI
2. Enter: `Bearer <your-access-token>`
3. Click "Authorize"

Now you can test all protected endpoints!

### 3. Try Some Endpoints

- `GET /api/assets` - List all assets
- `GET /api/users` - List all users
- `GET /api/allocations` - List allocations
- `GET /health` - Check API health

## Common Commands

```bash
# Start server
uvicorn app.main:app --reload

# Start server on different port
uvicorn app.main:app --reload --port 8080

# Reset database (delete and reseed)
# On Windows:
del assetflow.db
python seed.py

# View logs in debug mode
# Already enabled by default in development
```

## Project Structure Overview

```
backend/
├── app/
│   ├── main.py              # FastAPI app entry point
│   ├── core/
│   │   ├── config.py        # Settings (.env configuration)
│   │   ├── security.py      # Password & JWT handling
│   │   ├── deps.py          # Dependency injection
│   │   └── errors.py        # Custom exceptions
│   ├── db/
│   │   ├── base.py          # SQLAlchemy base & mixins
│   │   ├── session.py       # Database session
│   │   └── models/          # Database models
│   ├── schemas/             # Pydantic validation schemas
│   ├── services/            # Business logic
│   └── routers/             # API endpoints
├── seed.py                  # Database seeding script
├── requirements.txt         # Python dependencies
└── .env                     # Environment configuration
```

## API Features

### ✅ Implemented

- User authentication (JWT)
- User management
- Asset listing with pagination
- Role-based access control
- Automatic timestamps on all records
- Global error handling
- CORS configuration
- Health check endpoint

### 🚧 To Be Expanded

- Complete CRUD for all entities
- Asset allocation workflows
- Booking system with conflict detection
- Maintenance request workflows
- Notification system
- Activity logging
- Audit trails
- Report generation
- File upload for asset photos
- QR code generation

## Troubleshooting

### Port Already in Use

If port 8000 is taken:
```bash
uvicorn app.main:app --reload --port 8080
```

### Module Not Found Errors

Make sure virtual environment is activated:
```bash
venv\Scripts\activate
pip install -r requirements.txt
```

### Database Locked Error

Close any DB browser tools and restart the server.

### Import Errors

Delete `__pycache__` folders and restart:
```bash
# Windows
for /d /r . %d in (__pycache__) do @if exist "%d" rmdir /s /q "%d"
```

## Next Steps

1. ✅ Backend running
2. Start the frontend (see `frontend/README.md`)
3. Test the integration
4. Explore the API documentation at http://localhost:8000/docs
5. Customize for your needs!

## Need Help?

- Check the main README.md for detailed documentation
- Visit http://localhost:8000/docs for interactive API documentation
- Review the code comments in `app/` directory

Happy coding! 🚀
