# AssetFlow Backend

FastAPI-based backend for the AssetFlow Asset Management System.

## Technology Stack

- **FastAPI** - Modern, fast web framework for building APIs
- **SQLAlchemy 2.0** - SQL toolkit and ORM
- **SQLite** - Lightweight database (can be replaced with PostgreSQL/MySQL)
- **Pydantic v2** - Data validation using Python type annotations
- **Python-JOSE** - JWT token encoding/decoding
- **Passlib + Bcrypt** - Password hashing
- **Uvicorn** - ASGI server

## Project Structure

```
backend/
├── app/
│   ├── core/           # Core functionality
│   │   ├── config.py   # Settings management
│   │   ├── security.py # Password hashing & JWT
│   │   ├── deps.py     # Dependency injection
│   │   └── errors.py   # Custom exceptions
│   ├── db/             # Database layer
│   │   ├── base.py     # Declarative base & mixins
│   │   ├── session.py  # Session factory
│   │   └── models/     # SQLAlchemy models
│   ├── schemas/        # Pydantic schemas
│   ├── services/       # Business logic
│   ├── routers/        # API endpoints
│   └── main.py         # FastAPI app setup
├── requirements.txt
├── .env
└── seed.py            # Demo data population
```

## Setup Instructions

### 1. Create Virtual Environment

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Environment Configuration

Copy `.env.example` to `.env` and configure:

```env
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///./assetflow.db
FRONTEND_URL=http://localhost:5173
```

### 4. Initialize Database

The database is automatically initialized on first run. To manually initialize:

```bash
python -c "from app.db.session import init_db; init_db()"
```

### 5. Seed Demo Data (Optional)

```bash
python seed.py
```

### 6. Run Development Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, visit:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Key Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin, Asset Manager, Department Head, Employee)
- Secure password hashing with bcrypt

### Global Features
- **Pagination**: All list endpoints support `?skip=` and `?limit=` query parameters
- **Timestamps**: All models automatically track `created_at` and `updated_at`
- **Error Handling**: Standardized error responses (404, 409, 403)
- **CORS**: Configured for frontend integration
- **Health Check**: `/health` endpoint for monitoring

### API Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

#### Users
- `GET /api/users` - List users (paginated)
- `GET /api/users/{id}` - Get user details
- `PUT /api/users/{id}` - Update user (Admin only)

#### Assets
- `GET /api/assets` - List assets (paginated, filterable)
- `GET /api/assets/{id}` - Get asset details
- `POST /api/assets` - Create asset
- `PUT /api/assets/{id}` - Update asset
- `DELETE /api/assets/{id}` - Delete asset

#### Allocations
- `GET /api/allocations` - List allocations
- `POST /api/allocations` - Create allocation
- `PUT /api/allocations/{id}` - Update allocation
- `POST /api/allocations/{id}/return` - Mark as returned

#### Bookings
- `GET /api/bookings` - List bookings
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/{id}` - Update booking
- `DELETE /api/bookings/{id}` - Cancel booking

#### Maintenance
- `GET /api/maintenance-requests` - List requests
- `POST /api/maintenance-requests` - Create request
- `PUT /api/maintenance-requests/{id}` - Update request

## Database Models

### Core Models
- **User** - System users with authentication
- **Organization** - Company/organization details
- **Department** - Organizational departments
- **Location** - Physical locations
- **AssetCategory** - Asset types with custom fields
- **Asset** - Core asset entity

### Operational Models
- **Allocation** - Asset assignments to users
- **Booking** - Resource reservations
- **MaintenanceRequest** - Maintenance tracking
- **AuditLog** - Security and compliance tracking
- **Notification** - User notifications
- **Activity** - Recent activity feed

## Custom Exception Handling

The application uses custom exceptions that are automatically converted to proper HTTP responses:

- `NotFoundError` → 404 with `{"detail": "message"}`
- `ConflictError` → 409 with `{"detail": "message"}`
- `PermissionError` → 403 with `{"detail": "message"}`

## Security Features

1. **Password Security**: Bcrypt hashing with salt
2. **JWT Tokens**: Secure token-based authentication
3. **Role-Based Access**: Granular permission control
4. **Audit Logging**: All actions tracked for compliance
5. **Status Checks**: Inactive users cannot authenticate

## Development Tips

### Adding New Models
1. Create model in `app/db/models/`
2. Inherit from `Base` and `TimestampMixin`
3. Import in `app/db/models/__init__.py`
4. Create corresponding schemas in `app/schemas/`

### Adding New Endpoints
1. Create service in `app/services/` (business logic)
2. Create router in `app/routers/` (thin, validation only)
3. Register router in `app/main.py`

### Database Migrations (Future)
For production, use Alembic for database migrations:

```bash
alembic init alembic
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

## Production Deployment

1. Change `DEBUG=False` in `.env`
2. Use strong `SECRET_KEY`
3. Switch to PostgreSQL or MySQL
4. Use production ASGI server (Gunicorn + Uvicorn)
5. Enable HTTPS
6. Configure proper CORS origins
7. Set up database backups
8. Enable logging and monitoring

## Testing

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest
```

## License

Proprietary - AssetFlow Asset Management System
