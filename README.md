# AssetFlow - Enterprise Asset Management System

A comprehensive asset management system with FastAPI backend and React frontend, featuring role-based access control, asset lifecycle tracking, maintenance scheduling, and analytics.

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**
```powershell
cd d:\AssetFlow\backend
```

2. **Create and activate virtual environment:**
```powershell
python -m venv venv
.\venv\Scripts\activate
```

3. **Install dependencies:**
```powershell
pip install -r requirements.txt
```

4. **Create `.env` file** (copy from `.env.example` and update):
```env
SECRET_KEY=your-secret-key-here-min-32-chars
DATABASE_URL=sqlite:///./assetflow.db
FRONTEND_URL=http://localhost:5173
```

5. **Initialize database with seed data:**
```powershell
python seed.py
```

6. **Start the backend server:**
```powershell
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend will be running at: **http://127.0.0.1:8000**
- API Documentation: http://127.0.0.1:8000/docs
- Health Check: http://127.0.0.1:8000/health

### Frontend Setup

1. **Open a NEW terminal and navigate to frontend directory:**
```powershell
cd d:\AssetFlow\frontend
```

2. **Install dependencies:**
```powershell
npm install
```

3. **Create `.env` file** (copy from `.env.example`):
```env
VITE_API_URL=http://127.0.0.1:8000
```

4. **Start the development server:**
```powershell
npm run dev
```

Frontend will be running at: **http://localhost:5173**

### Test Login Credentials

After running `seed.py`, you can log in with:

**System Admin:**
- Email: `admin@assetflow.com`
- Password: `admin123`
- Role: Admin (full system access)

**Asset Manager:**
- Email: `manager@assetflow.com`  
- Password: `manager123`
- Role: AssetManager (manage assets, allocations, maintenance)

**Department Head:**
- Email: `head.it@assetflow.com`
- Password: `head123`
- Role: DepartmentHead (view department assets)

**Employee:**
- Email: `employee@assetflow.com`
- Password: `employee123`
- Role: Employee (view assigned assets)

## 🏗️ Architecture

### Backend (FastAPI)
- **Framework:** FastAPI with SQLAlchemy ORM
- **Database:** SQLite (easily swappable to PostgreSQL/MySQL)
- **Authentication:** JWT-based with bcrypt password hashing
- **API Structure:** RESTful with automatic OpenAPI docs

### Frontend (React + Vite)
- **Framework:** React 18 with Vite
- **Routing:** React Router v6
- **HTTP Client:** Axios with centralized API client
- **Styling:** Tailwind CSS
- **Charts:** Recharts for analytics

## 📁 Key Features

✅ **Asset Management** - Complete CRUD with lifecycle tracking  
✅ **Allocation & Transfers** - Assign assets to employees/departments  
✅ **Resource Booking** - Reserve bookable assets (rooms, equipment)  
✅ **Maintenance Tracking** - Request, approve, and track maintenance  
✅ **Audit Cycles** - Physical verification with discrepancy tracking  
✅ **Dashboard & Analytics** - Real-time KPIs and reports  
✅ **Notifications** - Activity tracking and alerts  
✅ **Role-Based Access** - 4 roles with appropriate permissions  

## 🔒 Security

- Password hashing with bcrypt
- JWT token authentication
- Role-based access control (RBAC)
- Department-scoped data access
- CORS configuration
- SQL injection protection via ORM

## 📚 Documentation

- **API Docs:** http://127.0.0.1:8000/docs (when backend is running)
- **Connection Audit:** `BACKEND_FRONTEND_CONNECTION_AUDIT.md`
- **API Client Setup:** `FRONTEND_API_CLIENT_COMPLETE.md`
- **Module Docs:** See individual `*_COMPLETE.md` files

## 🚨 Troubleshooting

### Backend won't start
- Ensure virtual environment is activated
- Check all dependencies: `pip install -r requirements.txt`
- Verify `.env` file exists with SECRET_KEY

### Frontend can't connect
- Verify backend is running at http://127.0.0.1:8000
- Check HealthCheck indicator (green dot = connected)
- Verify `.env` has correct VITE_API_URL

### 401 Errors
- Log out and log back in (token may have expired)
- Clear browser localStorage

---

**Status:** ✅ Core functionality complete  
**Last Updated:** 2026-07-12
