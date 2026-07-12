# AssetFlow - Enterprise Asset & Resource Management System

An ERP module for tracking physical assets, managing bookings, maintenance workflows, and audit cycles.

## 🎯 Project Overview

AssetFlow helps organizations track:
- **Physical Assets** (equipment, furniture, vehicles, shared spaces)
- **Resource Bookings** with conflict prevention
- **Maintenance Requests** with approval workflows
- **Audit Cycles** for asset verification
- **Role-based Access Control** (Admin, Asset Manager, Department Head, Employee)

## 🏗️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database operations
- **SQLite** - Database
- **Python 3.9+**

### Frontend
- **React 18+** - UI framework
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **React Router** - Navigation

## 📁 Project Structure

```
assetflow-erp/
├── backend/
│   ├── app/
│   │   ├── models/          # SQLAlchemy ORM models
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   ├── routers/         # FastAPI route handlers
│   │   ├── services/        # Business logic layer
│   │   └── core/            # Auth, config, dependencies
│   └── main.py              # Application entry point
├── frontend/
│   ├── src/
│   │   ├── pages/           # Page components
│   │   ├── components/      # Reusable UI components
│   │   ├── api/             # API client functions
│   │   ├── context/         # React Context providers
│   │   └── hooks/           # Custom React hooks
│   └── package.json
└── .kiro/
    └── steering/            # Project guidelines & conventions
```

## 🚀 Getting Started

### Quick Start (Recommended)

#### Backend Setup (5 minutes)
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
python seed.py
uvicorn app.main:app --reload
```

Backend runs at: **http://localhost:8000**
- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

**Demo Login Credentials:**
- Admin: `admin@techcorp.com` / `admin123`
- Manager: `manager@techcorp.com` / `manager123`
- Employee: `john.doe@techcorp.com` / `password123`

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: **http://localhost:5173**

### Detailed Documentation

- **Backend**: See `backend/README.md` for complete technical docs
- **Quick Start**: See `backend/QUICKSTART.md` for 5-minute guide
- **Setup Complete**: See `BACKEND_SETUP_COMPLETE.md` for architecture overview

### Prerequisites
- Python 3.9+
- Node.js 18+
- Git

## 👥 Team

This project is built by a 3-person team for a hackathon:

- **SmitBhalanii** - [smitbhalani147@gmail.com](mailto:smitbhalani147@gmail.com)
- **shyamvachhani555** - [shyamvachhani555@gmail.com](mailto:shyamvachhani555@gmail.com)
- **AbhayBapodara** - [abhaynbapodara@gmail.com](mailto:abhaynbapodara@gmail.com)

## 🌿 Branch Strategy

```
main                              ← Production-ready code only
├── feature/auth-org              ← Person A: Authentication & Organizations
├── feature/assets-lifecycle      ← Person B: Asset management & state machine
└── feature/booking-maintenance-audit  ← Person C: Bookings, maintenance, audits
```

## 🔑 Core Features

### Asset Lifecycle State Machine
Assets have 7 states with enforced transitions:
- Available → Allocated, Reserved, Under Maintenance, Lost
- Allocated → Available, Under Maintenance, Lost, Retired
- Reserved → Allocated, Available
- Under Maintenance → Available, Lost, Retired
- Lost → Available, Disposed
- Retired → Disposed

### Business Rules
- ✅ **No Double-Allocation** - Assets can't be allocated to multiple users
- ✅ **No Overlapping Bookings** - Boundary-exclusive interval checking
- ✅ **Employee-Only Signup** - Admin assigns roles after signup
- ✅ **Approval Workflows** - Maintenance & Audit require multi-step approval

## 📝 API Response Format

All API responses follow this structure:

**Success:**
```json
{
  "data": { /* response data */ },
  "error": null
}
```

**Error:**
```json
{
  "data": null,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

## 🎨 Design System

- **Background**: `#0F0F12` (deep charcoal)
- **Card**: `#17171C` with `#2A2A32` border
- **Primary Blue**: `#3B82F6` (Tailwind blue-600)
- **Typography**: System fonts with Tailwind defaults

## 📋 Current Progress

### ✅ Completed
- [x] Project structure setup
- [x] Frontend UI (Dashboard, Assets, Bookings, etc.)
- [x] Login/Signup screen with dark mode design
- [x] Git repository initialized
- [x] **Backend fully structured and documented**
  - [x] FastAPI + SQLAlchemy 2.0 + SQLite setup
  - [x] JWT authentication system
  - [x] All 10+ database models
  - [x] Role-based access control
  - [x] Global exception handlers
  - [x] Pagination support
  - [x] CORS configuration
  - [x] Timestamp mixin on all tables
  - [x] Demo data seeding script
  - [x] Comprehensive documentation

### 🚧 In Progress
- [ ] Complete CRUD endpoints for all entities
- [ ] Asset lifecycle state machine implementation
- [ ] Booking conflict detection
- [ ] Maintenance approval workflows
- [ ] Notification system
- [ ] Activity logging
- [ ] Frontend-backend integration

### 📝 Planned
- [ ] Audit cycle management
- [ ] Report generation
- [ ] File upload (asset photos)
- [ ] QR code generation
- [ ] Email notifications
- [ ] Advanced search and filtering

## 🛠️ Development Guidelines

See `.kiro/steering/` directory for detailed:
- `product.md` - Business rules, roles, and requirements
- `structure.md` - Code conventions and architecture patterns

## 📄 License

This is a hackathon project for demonstration purposes.

---

Built with ❤️ for Odoo Hackathon 2026
