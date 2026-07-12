# AssetFlow API Testing Guide

Quick reference for testing the Auth and Organization APIs.

## 🚀 Start Server

```bash
cd d:\AssetFlow\backend
venv\Scripts\activate
uvicorn app.main:app --reload
```

**Server:** http://localhost:8000
**API Docs:** http://localhost:8000/docs

---

## 🔐 Authentication Endpoints

### 1. Signup (Public)

**Always creates Employee role - security rule!**

```bash
curl -X POST http://localhost:8000/api/auth/signup ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"New User\",\"email\":\"new@test.com\",\"password\":\"test123\",\"department_id\":1}"
```

**Swagger UI:**
1. Go to http://localhost:8000/docs
2. Find `POST /api/auth/signup`
3. Click "Try it out"
4. Fill in:
```json
{
  "name": "New User",
  "email": "new@test.com",
  "password": "test123",
  "department_id": 1
}
```
5. Click "Execute"

**Response:**
```json
{
  "id": 6,
  "email": "new@test.com",
  "name": "New User",
  "role": "Employee",  // Always Employee!
  "status": "Active",
  "department_id": 1,
  "created_at": "2024-...",
  "updated_at": "2024-..."
}
```

---

### 2. Login (Public)

```bash
curl -X POST http://localhost:8000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@techcorp.com\",\"password\":\"admin123\"}"
```

**Test Accounts:**
| Email | Password | Role |
|-------|----------|------|
| admin@techcorp.com | admin123 | Admin |
| manager@techcorp.com | manager123 | Asset Manager |
| john.doe@techcorp.com | password123 | Employee |

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "admin@techcorp.com",
    "name": "Admin User",
    "role": "Admin",
    "status": "Active",
    "department_id": 1,
    ...
  }
}
```

**Save this token for protected endpoints!**

---

### 3. Get Current User (Protected)

```bash
curl http://localhost:8000/api/auth/me ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### 4. Forgot Password (Public)

```bash
curl -X POST http://localhost:8000/api/auth/forgot-password ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@techcorp.com\"}"
```

**Check server console for token!**

---

### 5. Reset Password (Public)

```bash
curl -X POST http://localhost:8000/api/auth/reset-password ^
  -H "Content-Type: application/json" ^
  -d "{\"token\":\"TOKEN_FROM_CONSOLE\",\"new_password\":\"newpass123\"}"
```

---

## 🏢 Organization Endpoints

### Using Swagger UI (Easiest!)

1. Login first (get token)
2. Click "Authorize" button at top
3. Enter: `Bearer YOUR_TOKEN`
4. Click "Authorize"
5. Now test any endpoint!

---

### 1. List Departments (Any Auth User)

```bash
curl http://localhost:8000/api/org/departments ^
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:** Array of departments with nested head objects

---

### 2. Create Department (Admin Only)

```bash
curl -X POST http://localhost:8000/api/org/departments ^
  -H "Authorization: Bearer ADMIN_TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Marketing\",\"organization_id\":1,\"description\":\"Marketing dept\"}"
```

**Body:**
```json
{
  "name": "Marketing",
  "organization_id": 1,
  "description": "Marketing department",
  "head_user_id": 2,
  "parent_department_id": null
}
```

---

### 3. Update Department (Admin Only)

```bash
curl -X PUT http://localhost:8000/api/org/departments/1 ^
  -H "Authorization: Bearer ADMIN_TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"IT Department Updated\"}"
```

---

### 4. Toggle Department Status (Admin Only)

```bash
curl -X PATCH http://localhost:8000/api/org/departments/1/status ^
  -H "Authorization: Bearer ADMIN_TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"status\":\"Inactive\"}"
```

---

### 5. List Categories (Any Auth User)

```bash
curl http://localhost:8000/api/org/categories ^
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 6. Create Category (Admin Only)

```bash
curl -X POST http://localhost:8000/api/org/categories ^
  -H "Authorization: Bearer ADMIN_TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Vehicles\",\"description\":\"Company vehicles\",\"extra_fields\":[{\"field_name\":\"license_plate\",\"field_type\":\"text\",\"required\":true}]}"
```

**Body with extra fields:**
```json
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
    },
    {
      "field_name": "year",
      "field_type": "number",
      "required": false
    }
  ]
}
```

---

### 7. List Employees (Admin Only)

```bash
curl http://localhost:8000/api/org/employees ^
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Response:** Full employee directory

---

### 8. Change User Role (Admin Only) 

**⚠️ ONLY ENDPOINT THAT CAN CHANGE ROLES!**

```bash
curl -X PATCH http://localhost:8000/api/org/employees/3/role ^
  -H "Authorization: Bearer ADMIN_TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"role\":\"Asset Manager\"}"
```

**Body:**
```json
{
  "role": "Asset Manager"
}
```

**Valid roles:**
- "Admin"
- "Asset Manager"
- "Department Head"
- "Employee"

**Activity is logged to console!**

---

### 9. Change User Status (Admin Only)

```bash
curl -X PATCH http://localhost:8000/api/org/employees/3/status ^
  -H "Authorization: Bearer ADMIN_TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"status\":\"Inactive\"}"
```

---

## 🧪 Testing Workflow

### Step-by-Step Test

1. **Start server**
   ```bash
   uvicorn app.main:app --reload
   ```

2. **Open Swagger UI**
   - http://localhost:8000/docs

3. **Test Signup**
   - POST /api/auth/signup
   - Create new user
   - Verify role is "Employee"

4. **Test Login as Admin**
   - POST /api/auth/login
   - Email: admin@techcorp.com
   - Password: admin123
   - Copy the access_token

5. **Authorize Swagger**
   - Click "Authorize" button
   - Enter: `Bearer <your-token>`
   - Click "Authorize"

6. **Test Protected Endpoints**
   - GET /api/auth/me (works with any token)
   - GET /api/org/departments (works with any token)
   - GET /api/org/employees (requires admin token)

7. **Test Admin Operations**
   - Create department
   - Create category
   - Change user role
   - Change user status

8. **Test Password Reset**
   - POST /api/auth/forgot-password
   - Check console for token
   - POST /api/auth/reset-password with token
   - Try logging in with new password

---

## 📋 Test Scenarios

### Scenario 1: New Employee Onboarding

1. Signup new user → Gets Employee role
2. Admin logs in
3. Admin changes user role to "Asset Manager"
4. Activity logged
5. User can now login as Asset Manager

### Scenario 2: Department Setup

1. Admin creates parent department (e.g., "Operations")
2. Admin creates child department (e.g., "Operations - Logistics")
   - Set parent_department_id to Operations ID
3. Admin sets department head
4. Verify nested structure in GET /departments

### Scenario 3: Category with Custom Fields

1. Admin creates "Laptops" category
2. Add extra_fields:
   - warranty_period (text)
   - processor_type (select: Intel i5, i7, AMD)
   - ram_size (number)
3. These fields will be available when creating assets

### Scenario 4: Security Test

1. Create employee via signup
2. Try to create department → Should fail (403 Forbidden)
3. Try to access /org/employees → Should fail (403 Forbidden)
4. Admin changes role to "Asset Manager"
5. Try again → Still fails (only Admin can access)

---

## ❌ Common Errors

### 401 Unauthorized
- Token missing or invalid
- Token expired
- User account inactive

### 403 Forbidden
- User doesn't have required role
- Endpoint requires Admin, but user is Employee

### 404 Not Found
- Resource doesn't exist (user, department, etc.)

### 409 Conflict
- Email already exists (signup)
- Category name already exists

### 422 Validation Error
- Missing required fields
- Invalid field format
- Circular department reference

---

## 💡 Pro Tips

1. **Use Swagger UI** - Easiest way to test
2. **Save tokens** - Copy after login for reuse
3. **Check console** - Password reset tokens logged there
4. **Check activity logs** - Role changes logged to console
5. **Test with different roles** - Admin vs Employee
6. **Verify security** - Try accessing admin endpoints as employee

---

## 📞 Quick Reference

**Demo Accounts:**
```
Admin:    admin@techcorp.com / admin123
Manager:  manager@techcorp.com / manager123  
Employee: john.doe@techcorp.com / password123
```

**Key Endpoints:**
```
POST /api/auth/signup
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/forgot-password
POST /api/auth/reset-password

GET  /api/org/departments
POST /api/org/departments
GET  /api/org/categories
POST /api/org/categories
GET  /api/org/employees
PATCH /api/org/employees/{id}/role
PATCH /api/org/employees/{id}/status
```

---

Happy Testing! 🚀
