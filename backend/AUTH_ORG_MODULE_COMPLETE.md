# Auth & Organization Setup Modules - Complete ✅

## 🎉 Implementation Complete

Both the **Authentication** and **Organization Setup** modules have been fully implemented and pushed to GitHub!

**Repository:** https://github.com/SmitBhalanii/odoo_hackathon_2026
**Commit:** 244c18e - "Implement Auth and Organization Setup modules"

---

## 📦 What Was Built

### 1. AUTH MODULE

#### Models
✅ **User Model** (updated)
- id, name, email (unique), hashed_password
- role (enum: Admin, Asset Manager, Department Head, Employee)
- department_id (FK, nullable)
- status (Active/Inactive, default Active)
- created_at, updated_at (via TimestampMixin)

#### Endpoints (`/api/auth/*`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/signup` | None | Register new user (always Employee role) |
| POST | `/auth/login` | None | Login and get JWT token |
| POST | `/auth/forgot-password` | None | Request password reset token |
| POST | `/auth/reset-password` | None | Reset password with token |
| GET | `/auth/me` | JWT | Get current user profile |

#### 🔐 Security Features

**1. Signup Security Rule**
```python
# Role is ALWAYS set to Employee server-side
# Even if 'role' is in request body, it's stripped/ignored
# This prevents privilege escalation during signup
user.role = "Employee"  # Hard-coded - never from request
```

**2. Password Reset Flow**
- Token logged to console (hackathon demo)
- Generic message (doesn't leak email existence)
- Token expires in 1 hour
- Token is single-use

**3. JWT Authentication**
- Token payload: `{user_id, email, role}`
- Configurable expiry (default 24 hours)
- Bcrypt password hashing

---

### 2. ORGANIZATION SETUP MODULE

#### Models (updated)

✅ **Department Model**
- id, name, description
- head_user_id (FK User, nullable)
- parent_department_id (FK self, nullable) - hierarchical structure
- status (Active/Inactive)
- organization_id (FK)
- created_at, updated_at

✅ **AssetCategory Model**
- id, name (unique), description
- extra_fields (JSON: `[{field_name, field_type, required, options}]`)
- status (Active/Inactive)
- created_at, updated_at

#### Endpoints (`/api/org/*`)

##### Department Management

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/org/departments` | Any Auth User | List all departments |
| POST | `/org/departments` | Admin Only | Create department |
| PUT | `/org/departments/{id}` | Admin Only | Update department |
| PATCH | `/org/departments/{id}/status` | Admin Only | Toggle Active/Inactive |

**Key Features:**
- Returns departments with **nested head object** (id, name, email)
- Prevents self-parent references
- Prevents circular parent chains
- Validates head user and parent department exist

##### Category Management

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/org/categories` | Any Auth User | List all categories |
| POST | `/org/categories` | Admin Only | Create category |
| PUT | `/org/categories/{id}` | Admin Only | Update category |

**Extra Fields Format:**
```json
{
  "name": "Laptops",
  "extra_fields": [
    {
      "field_name": "warranty_period",
      "field_type": "text",
      "required": false
    },
    {
      "field_name": "processor_type",
      "field_type": "select",
      "options": ["Intel i5", "Intel i7", "AMD Ryzen"],
      "required": true
    }
  ]
}
```

Supported field types: `text`, `number`, `date`, `boolean`, `select`

##### Employee Management

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/org/employees` | Admin Only | Full employee directory |
| PATCH | `/org/employees/{id}/role` | Admin Only | **Change user role** |
| PATCH | `/org/employees/{id}/status` | Admin Only | Toggle Active/Inactive |

**⚠️ CRITICAL: Role Change Endpoint**

`PATCH /org/employees/{id}/role` is the **ONLY** endpoint in the entire backend that can change a user's role.

```python
# This is enforced by:
# 1. Admin-only access (require_admin dependency)
# 2. No other service/endpoint modifies role field
# 3. Signup always creates Employee role
# 4. Activity log created for every role change

# Example request:
PATCH /api/org/employees/5/role
{
  "role": "Asset Manager"
}
```

**Activity Logging:**
Every role change creates an activity log entry:
- Who made the change (admin user ID)
- User affected
- Old role → New role
- Timestamp

---

## 🧪 Testing Guide

### 1. Start the Backend

```bash
cd d:\AssetFlow\backend
venv\Scripts\activate
uvicorn app.main:app --reload
```

Visit: http://localhost:8000/docs

### 2. Test Auth Flow

#### A. Signup (Creates Employee)
```json
POST /api/auth/signup
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "test123",
  "department_id": 1
}

Response:
{
  "id": 6,
  "name": "Test User",
  "email": "test@example.com",
  "role": "Employee",  // Always Employee!
  "status": "Active",
  "department_id": 1,
  "created_at": "2024-...",
  "updated_at": "2024-..."
}
```

#### B. Login (Get Token)
```json
POST /api/auth/login
{
  "email": "admin@techcorp.com",
  "password": "admin123"
}

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "admin@techcorp.com",
    "name": "Admin User",
    "role": "Admin",
    ...
  }
}
```

#### C. Get Current User
```http
GET /api/auth/me
Authorization: Bearer <your-token>

Response: Current user object
```

#### D. Forgot Password
```json
POST /api/auth/forgot-password
{
  "email": "admin@techcorp.com"
}

Response:
{
  "message": "If that email exists, a reset link was sent."
}

// Check server console for token:
===============================================================
PASSWORD RESET TOKEN GENERATED
===============================================================
Email: admin@techcorp.com
Token: <long-token-string>
Expires: 2024-...
===============================================================
```

#### E. Reset Password
```json
POST /api/auth/reset-password
{
  "token": "<token-from-console>",
  "new_password": "newpass123"
}

Response:
{
  "message": "Password has been reset successfully."
}
```

### 3. Test Organization Flow

#### A. List Departments (Any User)
```http
GET /api/org/departments
Authorization: Bearer <employee-token>

Response: Array of departments with nested head objects
```

#### B. Create Department (Admin Only)
```json
POST /api/org/departments
Authorization: Bearer <admin-token>

{
  "name": "Marketing",
  "organization_id": 1,
  "description": "Marketing department",
  "head_user_id": 2,
  "parent_department_id": null
}
```

#### C. Update Department (Admin Only)
```json
PUT /api/org/departments/5
Authorization: Bearer <admin-token>

{
  "name": "Marketing & Sales",
  "head_user_id": 3
}
```

#### D. Toggle Department Status (Admin Only)
```json
PATCH /api/org/departments/5/status
Authorization: Bearer <admin-token>

{
  "status": "Inactive"
}
```

#### E. Create Category (Admin Only)
```json
POST /api/org/categories
Authorization: Bearer <admin-token>

{
  "name": "Vehicles",
  "description": "Company vehicles",
  "extra_fields": [
    {
      "field_name": "license_plate",
      "field_type": "text",
      "required": true
    },
    {
      "field_name": "fuel_type",
      "field_type": "select",
      "options": ["Petrol", "Diesel", "Electric"],
      "required": true
    }
  ]
}
```

#### F. List Employees (Admin Only)
```http
GET /api/org/employees
Authorization: Bearer <admin-token>

Response: Full employee directory with roles and departments
```

#### G. Change User Role (Admin Only - ONLY ROLE CHANGE ENDPOINT!)
```json
PATCH /api/org/employees/6/role
Authorization: Bearer <admin-token>

{
  "role": "Asset Manager"
}

// Check server console for activity log:
===============================================================
ROLE CHANGE LOGGED
===============================================================
User: Test User (test@example.com)
Role Change: Employee → Asset Manager
Changed By: Admin User ID 1
===============================================================
```

#### H. Change User Status (Admin Only)
```json
PATCH /api/org/employees/6/status
Authorization: Bearer <admin-token>

{
  "status": "Inactive"
}
```

---

## 🔒 Security Implementation

### 1. Role-Based Access Control

```python
# Public endpoints
POST /auth/signup, /auth/login, /auth/forgot-password, /auth/reset-password

# Any authenticated user
GET /auth/me, /org/departments, /org/categories

# Admin only
POST/PUT/PATCH /org/departments/*, /org/categories/*
GET/PATCH /org/employees/*
```

### 2. Password Security
- Bcrypt hashing with salt
- Minimum 6 characters
- Reset tokens expire after 1 hour
- Reset tokens are single-use

### 3. Role Change Security
- **Only one endpoint can change roles:** `PATCH /org/employees/{id}/role`
- Signup always creates Employee
- Activity logged for audit trail
- Admin authentication required

### 4. Department Validation
- Cannot be own parent
- Circular reference detection
- Parent department must exist
- Head user must exist

---

## 📊 Database Schema Updates

### Department Table
```sql
departments
  - id (PK)
  - name
  - description
  - organization_id (FK)
  - head_user_id (FK users) -- NEW
  - parent_department_id (FK departments) -- NEW
  - status (Active/Inactive) -- NEW
  - created_at
  - updated_at
```

### Asset Category Table
```sql
asset_categories
  - id (PK)
  - name (unique)
  - description
  - extra_fields (JSON) -- Format updated
  - status (Active/Inactive)
  - created_at
  - updated_at
```

---

## 📝 Demo Data

After running `python seed.py`:

**Users:**
| Name | Email | Password | Role |
|------|-------|----------|------|
| Admin User | admin@techcorp.com | admin123 | Admin |
| Asset Manager | manager@techcorp.com | manager123 | Asset Manager |
| John Doe | john.doe@techcorp.com | password123 | Employee |
| Jane Smith | jane.smith@techcorp.com | password123 | Department Head |
| Bob Wilson | bob.wilson@techcorp.com | password123 | Employee |

**Departments:**
- IT (head: Admin User)
- HR (head: Jane Smith)
- Finance
- Operations

**Categories:**
- Laptops (extra fields: warranty_period, processor_type, ram_size)
- Furniture (extra fields: material, dimensions, color)
- Electronics (extra fields: model_number, warranty_period)
- Spaces (extra fields: capacity, amenities)

---

## 🚀 API Documentation

Full interactive docs available at:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

---

## ✅ Verification Checklist

Test these scenarios to verify everything works:

### Auth Module
- [ ] Signup creates Employee role (even if role sent in request)
- [ ] Login returns JWT token
- [ ] Token works for protected endpoints
- [ ] Forgot password logs token to console
- [ ] Reset password works with token
- [ ] Invalid token is rejected
- [ ] Expired token is rejected
- [ ] /auth/me returns current user

### Organization Module
- [ ] Any user can GET departments/categories
- [ ] Only Admin can create/update departments
- [ ] Department cannot be its own parent
- [ ] Circular parent chains are prevented
- [ ] Department returns nested head object
- [ ] Only Admin can create/update categories
- [ ] Categories have unique names
- [ ] Extra fields are stored correctly
- [ ] Only Admin can see employee list
- [ ] Role change only works via PATCH /employees/{id}/role
- [ ] Role changes are logged to activity table
- [ ] Status changes work correctly

---

## 📂 Files Created/Modified

**New Files:**
- `backend/app/routers/org.py` - Organization router
- `backend/app/schemas/organization.py` - Org schemas
- `backend/app/services/organization_service.py` - Org business logic

**Modified Files:**
- `backend/app/db/models/organization.py` - Updated Department model
- `backend/app/db/models/asset_category.py` - Updated AssetCategory model
- `backend/app/routers/auth.py` - Complete auth endpoints
- `backend/app/schemas/user.py` - Updated user schemas
- `backend/app/services/auth_service.py` - Password reset logic
- `backend/app/main.py` - Registered org router

**Total Changes:**
- 9 files changed
- 1,126 insertions
- 40 deletions

---

## 🎯 Next Steps

The Auth and Organization modules are complete! You can now:

1. ✅ Test all endpoints via Swagger UI
2. ✅ Integrate with frontend
3. ✅ Build Asset Lifecycle module (next)
4. ✅ Add allocation workflows
5. ✅ Implement booking system

---

## 💻 Quick Test Commands

```bash
# Start server
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload

# In another terminal - test signup
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"test123"}'

# Test login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@techcorp.com","password":"admin123"}'

# Save token, then test protected endpoint
curl http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

**Status:** ✅ **COMPLETE AND PUSHED TO GITHUB**

**Repository:** https://github.com/SmitBhalanii/odoo_hackathon_2026

All requirements from the specification have been implemented! 🎉
