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


---

## 🔧 Module 6: Maintenance Requests

### Create Maintenance Request
```bash
POST http://localhost:8000/api/v1/maintenance
Authorization: Bearer YOUR_TOKEN

{
  "asset_id": 1,
  "issue_description": "Laptop screen has dead pixels and flickering issues",
  "priority": "High",
  "photo_url": "https://example.com/issue-photo.jpg"
}
```

**Expected**: 201 Created, maintenance request in "Pending" status

### List Maintenance Requests (Kanban Board)
```bash
# All requests
GET http://localhost:8000/api/v1/maintenance
Authorization: Bearer YOUR_TOKEN

# Filter by status
GET http://localhost:8000/api/v1/maintenance?status=Pending
GET http://localhost:8000/api/v1/maintenance?status=InProgress

# Filter by asset
GET http://localhost:8000/api/v1/maintenance?asset_id=1
```

**Response Format**: Flat list with fields needed for Kanban board (group by status client-side)

### Approve Maintenance Request (Asset Manager)
```bash
POST http://localhost:8000/api/v1/maintenance/1/approve
Authorization: Bearer ASSET_MANAGER_TOKEN
```

**Expected**: Request status → "Approved", Asset status → "Under Maintenance"

### Reject Maintenance Request (Asset Manager)
```bash
POST http://localhost:8000/api/v1/maintenance/1/reject
Authorization: Bearer ASSET_MANAGER_TOKEN

{
  "rejection_reason": "Duplicate request - already being handled"
}
```

**Expected**: Request status → "Rejected", Asset status unchanged

### Assign Technician (Asset Manager)
```bash
POST http://localhost:8000/api/v1/maintenance/1/assign-technician
Authorization: Bearer ASSET_MANAGER_TOKEN

{
  "technician_name": "John Smith - IT Support"
}
```

**Expected**: Request status → "TechnicianAssigned"

### Start Maintenance Work
```bash
POST http://localhost:8000/api/v1/maintenance/1/start
Authorization: Bearer YOUR_TOKEN
```

**Expected**: Request status → "InProgress"

### Resolve Maintenance
```bash
POST http://localhost:8000/api/v1/maintenance/1/resolve
Authorization: Bearer YOUR_TOKEN

{
  "resolution_notes": "Replaced LCD screen and tested thoroughly",
  "cost": 250.00
}
```

**Expected**: Request status → "Resolved", Asset status → "Available", resolved_at timestamp set

### Get Maintenance Request Details
```bash
GET http://localhost:8000/api/v1/maintenance/1
Authorization: Bearer YOUR_TOKEN
```

**Expected**: Full request details with nested asset, requester, and approver objects

---

## 📋 Module 7: Audit Cycles

### Create Audit Cycle (Admin Only)
```bash
POST http://localhost:8000/api/v1/audit-cycles
Authorization: Bearer ADMIN_TOKEN

{
  "title": "Q1 2026 Physical Asset Audit",
  "start_date": "2026-01-15",
  "end_date": "2026-01-31",
  "auditor_ids": [2, 3, 5],
  "scope_department_id": 1,
  "scope_location": "Building A"
}
```

**Expected**: 
- 201 Created
- Cycle status = "Open"
- AuditResult rows auto-created for all assets matching scope
- Each result.result = null (pending verification)

**Note**: Omit `scope_department_id` or `scope_location` to audit ALL assets

### List Audit Cycles
```bash
# All cycles
GET http://localhost:8000/api/v1/audit-cycles
Authorization: Bearer YOUR_TOKEN

# Filter by status
GET http://localhost:8000/api/v1/audit-cycles?status=Open
GET http://localhost:8000/api/v1/audit-cycles?status=Closed
```

**Response**: List with summary statistics:
- total_assets, verified_count, missing_count, damaged_count
- auditor_count, creator_name
- Useful for dashboard overview

### Get Audit Cycle Details
```bash
GET http://localhost:8000/api/v1/audit-cycles/1
Authorization: Bearer YOUR_TOKEN
```

**Response**: Full cycle details with:
- Nested auditor list (id, name, email)
- All audit results with asset details
- Statistics object with completion percentage
- Creator and scope department info

**Use For**: Audit checklist UI showing all assets to verify

### Mark Audit Result (Assigned Auditor Only)
```bash
# Verify asset found
PATCH http://localhost:8000/api/v1/audit-cycles/results/1
Authorization: Bearer AUDITOR_TOKEN

{
  "result": "Verified",
  "notes": "Asset found at expected location, condition is Good"
}

# Mark asset missing
PATCH http://localhost:8000/api/v1/audit-cycles/results/2
Authorization: Bearer AUDITOR_TOKEN

{
  "result": "Missing",
  "notes": "Not found at Building A Floor 2, last seen 2 months ago"
}

# Mark asset damaged
PATCH http://localhost:8000/api/v1/audit-cycles/results/3
Authorization: Bearer AUDITOR_TOKEN

{
  "result": "Damaged",
  "notes": "Screen cracked, case dented, needs repair"
}
```

**Expected**: Result marked with timestamp and marker user_id

**Permission Check**: Only auditors assigned to this cycle can mark results

**Error Cases**:
- 403 if user not assigned as auditor
- 409 if cycle already closed

### Get Audit Discrepancies
```bash
GET http://localhost:8000/api/v1/audit-cycles/1/discrepancies
Authorization: Bearer YOUR_TOKEN
```

**Response**: All assets marked as "Missing" or "Damaged" (non-Verified)

**Use For**: Review issues before closing cycle

### Close Audit Cycle (Admin/Asset Manager)
```bash
POST http://localhost:8000/api/v1/audit-cycles/1/close
Authorization: Bearer ADMIN_TOKEN
```

**Expected**:
- Cycle status → "Closed"
- All "Missing" assets → "Lost" status (via state machine)
- Notifications created for department heads with missing assets
- Cannot mark more results after closure

**Damaged Assets**: Remain in current status (can create maintenance requests)

---

## 🧪 Complete Testing Workflow

### Maintenance Workflow Test
```bash
# 1. Employee creates request
POST /maintenance (Employee token)
→ Status: Pending, Asset unchanged

# 2. Asset Manager reviews
GET /maintenance?status=Pending
→ See pending requests

# 3a. Approve path
POST /maintenance/1/approve (Asset Manager token)
→ Status: Approved, Asset: Under Maintenance

POST /maintenance/1/assign-technician
→ Status: TechnicianAssigned

POST /maintenance/1/start
→ Status: InProgress

POST /maintenance/1/resolve
→ Status: Resolved, Asset: Available

# 3b. Reject path (alternative)
POST /maintenance/2/reject (Asset Manager token)
→ Status: Rejected, Asset unchanged

# 4. Verify Kanban data
GET /maintenance
→ Returns flat list grouped by status on frontend
```

### Audit Workflow Test
```bash
# 1. Admin creates audit
POST /audit-cycles (Admin token)
{
  "title": "Q1 Audit",
  "start_date": "2026-01-01",
  "end_date": "2026-01-31",
  "auditor_ids": [2, 3]
}
→ Creates cycle + AuditResult rows for all assets

# 2. Auditors mark results
PATCH /audit-cycles/results/1 (Auditor token)
{ "result": "Verified" }

PATCH /audit-cycles/results/2 (Auditor token)
{ "result": "Missing", "notes": "Cannot locate" }

PATCH /audit-cycles/results/3 (Auditor token)
{ "result": "Damaged", "notes": "Screen broken" }

# 3. Check progress
GET /audit-cycles/1
→ See stats.completion_percentage

# 4. Review issues
GET /audit-cycles/1/discrepancies
→ See Missing + Damaged assets

# 5. Close cycle
POST /audit-cycles/1/close (Admin/Asset Manager token)
→ Missing assets become Lost status
→ Cycle status: Closed
```

---

## 🔐 Permission Matrix for New Modules

### Maintenance Endpoints
| Endpoint | Admin | Asset Manager | Dept Head | Employee |
|----------|-------|---------------|-----------|----------|
| POST /maintenance | ✅ | ✅ | ✅ | ✅ |
| GET /maintenance | ✅ | ✅ | ✅ | ✅ |
| GET /maintenance/{id} | ✅ | ✅ | ✅ | ✅ |
| POST /{id}/approve | ✅ | ✅ | ❌ | ❌ |
| POST /{id}/reject | ✅ | ✅ | ❌ | ❌ |
| POST /{id}/assign-technician | ✅ | ✅ | ❌ | ❌ |
| POST /{id}/start | ✅ | ✅ | ✅ | ✅ |
| POST /{id}/resolve | ✅ | ✅ | ✅ | ✅ |

### Audit Endpoints
| Endpoint | Admin | Asset Manager | Dept Head | Employee |
|----------|-------|---------------|-----------|----------|
| POST /audit-cycles | ✅ | ❌ | ❌ | ❌ |
| GET /audit-cycles | ✅ | ✅ | ✅ | ✅ |
| GET /audit-cycles/{id} | ✅ | ✅ | ✅ | ✅ |
| PATCH /results/{id} | ✅* | ✅* | ✅* | ✅* |
| GET /{id}/discrepancies | ✅ | ✅ | ✅ | ✅ |
| POST /{id}/close | ✅ | ✅ | ❌ | ❌ |

\* Only if user is assigned as auditor for that cycle

---

## 📊 Response Examples

### Maintenance Request List (for Kanban)
```json
[
  {
    "id": 1,
    "asset_id": 5,
    "asset_tag": "AF-0005",
    "asset_name": "Dell Laptop XPS 15",
    "raised_by": 10,
    "requester_name": "John Doe",
    "issue_description": "Laptop screen flickering",
    "priority": "High",
    "status": "InProgress",
    "technician_name": "Mike Johnson",
    "created_at": "2026-01-15T10:30:00"
  },
  {
    "id": 2,
    "asset_id": 12,
    "asset_tag": "AF-0012",
    "asset_name": "iPhone 14 Pro",
    "raised_by": 8,
    "requester_name": "Jane Smith",
    "issue_description": "Battery draining quickly",
    "priority": "Medium",
    "status": "Pending",
    "technician_name": null,
    "created_at": "2026-01-15T14:20:00"
  }
]
```

### Audit Cycle Details
```json
{
  "id": 1,
  "title": "Q1 2026 Physical Audit",
  "start_date": "2026-01-01",
  "end_date": "2026-01-31",
  "status": "Open",
  "scope_department_id": 1,
  "scope_location": "Building A",
  "created_by": 1,
  "creator": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@techcorp.com"
  },
  "scope_department": {
    "id": 1,
    "name": "IT Department"
  },
  "auditors": [
    {
      "id": 2,
      "name": "Auditor One",
      "email": "auditor1@techcorp.com"
    },
    {
      "id": 3,
      "name": "Auditor Two",
      "email": "auditor2@techcorp.com"
    }
  ],
  "results": [
    {
      "id": 1,
      "asset_id": 5,
      "asset_tag": "AF-0005",
      "asset_name": "Dell Laptop",
      "expected_location": "Building A Floor 2",
      "result": "Verified",
      "notes": "Found at desk 205",
      "marked_by": 2,
      "marker_name": "Auditor One",
      "marked_at": "2026-01-16T09:15:00"
    },
    {
      "id": 2,
      "asset_id": 8,
      "asset_tag": "AF-0008",
      "asset_name": "iPad Pro",
      "expected_location": "Building A Floor 1",
      "result": "Missing",
      "notes": "Not found, checking with employee",
      "marked_by": 3,
      "marker_name": "Auditor Two",
      "marked_at": "2026-01-16T10:30:00"
    },
    {
      "id": 3,
      "asset_id": 12,
      "asset_tag": "AF-0012",
      "asset_name": "Monitor",
      "expected_location": "Building A Floor 3",
      "result": null,
      "notes": null,
      "marked_by": null,
      "marker_name": null,
      "marked_at": null
    }
  ],
  "stats": {
    "total_assets": 25,
    "verified": 20,
    "missing": 2,
    "damaged": 1,
    "pending": 2,
    "completion_percentage": 92.0
  },
  "created_at": "2026-01-01T08:00:00",
  "updated_at": "2026-01-16T10:30:00"
}
```

---

## 🎯 State Machine Impact

### Maintenance Request Transitions
- **Approve** → Asset: `Available` → `Under Maintenance`
- **Resolve** → Asset: `Under Maintenance` → `Available`
- **Reject** → Asset status unchanged

### Audit Cycle Transitions
- **Close Cycle** → Missing Assets: `[current]` → `Lost`

All transitions logged in activity table and printed to console.

---

## ⚠️ Common Issues & Solutions

### Maintenance Module

**Issue**: Cannot approve already approved request
```json
{
  "detail": "Cannot approve request in status 'Approved'. Must be 'Pending'."
}
```
**Solution**: Check request status first with `GET /maintenance/{id}`

**Issue**: Asset stuck in "Under Maintenance"
**Solution**: Complete the maintenance workflow by calling `/resolve` endpoint

### Audit Module

**Issue**: 403 when marking result
```json
{
  "detail": "Only auditors assigned to this cycle can mark results"
}
```
**Solution**: Ensure user is in the `auditor_ids` list for that cycle

**Issue**: Cannot mark result after closing
```json
{
  "detail": "Cannot mark result for closed audit cycle"
}
```
**Solution**: Cycles cannot be reopened - create new cycle if needed

**Issue**: Asset still "Available" after marking Missing
**Solution**: Normal - assets only transition to "Lost" when cycle is closed with `/close` endpoint

---

## 📝 Updated Module Checklist

- [x] Module 1: Authentication & Authorization ✅
- [x] Module 2: Organization Setup ✅
- [x] Module 3: Asset Registry ✅
- [x] Module 4: Allocations (covered in initial setup)
- [x] Module 5: Bookings (covered in initial setup)
- [x] Module 6: Maintenance Requests ✅ **NEW**
- [x] Module 7: Audit Cycles ✅ **NEW**

**All modules complete and tested!** 🎉

---

**Last Updated**: Current Session
**API Version**: 1.0.0
**Status**: Production Ready ✅
