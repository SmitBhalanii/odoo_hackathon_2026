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

### Prerequisites
- Python 3.9+
- Node.js 18+
- Git

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs at: http://localhost:8000

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:3000

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

- [x] Project structure setup
- [x] Login/Signup screen with dark mode design
- [x] Git repository initialized
- [ ] Backend authentication endpoints
- [ ] Asset management system
- [ ] Booking system
- [ ] Maintenance workflows
- [ ] Audit cycle management

## 🛠️ Development Guidelines

See `.kiro/steering/` directory for detailed:
- `product.md` - Business rules, roles, and requirements
- `structure.md` - Code conventions and architecture patterns

## 📄 License

This is a hackathon project for demonstration purposes.

---

Built with ❤️ for Odoo Hackathon 2026
