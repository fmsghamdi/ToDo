# 🔒 RBAC Security Fix Documentation

## 🚨 Problem Summary

**Critical Security Issue**: User roles were device-dependent instead of user-dependent.

### Symptoms
- User imported from AD and assigned a role (e.g., Manager) on Machine A
- Role worked correctly when user logged in from Machine A ✅
- Role **DID NOT** work when same user logged in from Machine B ❌
- Role returned when user logged back in from Machine A ✅

### Root Cause
1. **Client-side JWT token generation** - Frontend was generating mock JWT tokens
2. **No backend role verification** - Roles were not fetched from database on login
3. **LocalStorage caching** - Roles stored in browser localStorage per machine
4. **No centralized authentication** - AD users weren't properly registered in database

---

## ✅ Solution Implemented

### Backend Changes

#### 1. New AuthController with Database-First Approach
**File**: `src/TaqTask.Api/Controllers/AuthController.cs`

**Key Features**:
- ✅ `AsNoTracking()` - Prevents EF Core caching, always fetch fresh data
- ✅ All login endpoints fetch user role from database
- ✅ JWT tokens include role claim from database
- ✅ Token refresh re-fetches role from database

**New Endpoints**:

```csharp
// POST: /api/auth/login
// Regular email/password login
// Always fetches fresh user data including role from DB

// POST: /api/auth/ad-login  ← NEW
// Active Directory user login
// Creates user in DB if not exists (with default role)
// Preserves admin-assigned roles for existing users
// Returns JWT with DB-based role

// POST: /api/auth/refresh
// Token refresh endpoint
// Re-fetches user role from DB (not from old token)

// GET: /api/auth/me
// Get current user info
// Always queries DB for fresh data
```

**Critical Code Sections**:

```csharp
// ✅ Always fetch fresh data - NO CACHING
var user = await _context.Users
    .AsNoTracking()  // ← Prevents caching
    .FirstOrDefaultAsync(u => u.Email == request.Email && u.IsActive);

// ✅ Generate JWT with FRESH role from database
var token = GenerateJwtToken(user);
// Token includes: ClaimTypes.Role = user.Role (from DB)
```

#### 2. AD Login Flow

```
1. User authenticates with AD (LDAP/Office365)
2. Frontend calls: POST /api/auth/ad-login
   {
     "username": "user.name",
     "email": "user@domain.com",
     "displayName": "User Name",
     "department": "IT",
     "jobTitle": "Employee"
   }
3. Backend checks if user exists in DB:
   - If NEW: Create user with default role "user"
   - If EXISTS: Update info but PRESERVE assigned role
4. Backend returns JWT with role from database
5. Frontend stores JWT (contains correct role)
```

### Frontend Changes

#### 1. Updated AuthService
**File**: `web/src/services/AuthService.ts`

**Key Changes**:
```typescript
// ❌ OLD: Mock JWT generation (client-side)
private generateJWTToken(user: ADUser): string {
  // Creates fake token with no DB verification
}

// ✅ NEW: Backend API call
async authenticateWithAD(username: string, password: string) {
  // Call backend to get real JWT with DB-based role
  const response = await fetch("/api/auth/ad-login", {
    method: "POST",
    body: JSON.stringify({
      username, email, displayName, department, jobTitle
    })
  });
  
  const authData = await response.json();
  
  // ✅ Store backend-generated token (has correct role)
  localStorage.setItem("authToken", authData.token);
  localStorage.setItem("currentUser", JSON.stringify(authData.user));
  
  return authData;
}
```

---

## 🧪 Testing Guide

### Test Scenario 1: New AD User Login
```
1. Admin imports user from AD: john.doe
2. Admin assigns role: "manager"
3. User logs in from Machine A
   ✅ Expected: Role = "manager"
4. User logs in from Machine B
   ✅ Expected: Role = "manager" (same as DB)
5. User logs in from Machine C
   ✅ Expected: Role = "manager" (same as DB)
```

### Test Scenario 2: Role Change
```
1. User logged in with role "user"
2. Admin changes role to "admin" in database
3. User refreshes token or logs in again
   ✅ Expected: New token has role = "admin"
```

### Test Scenario 3: Multiple Machines
```
1. User logs in from Office PC → Gets JWT with role from DB
2. User logs in from Home PC → Gets NEW JWT with role from DB
3. Admin changes user role in database
4. User on Office PC refreshes → Gets updated role
5. User on Home PC refreshes → Gets updated role
   ✅ Expected: Both machines have same, up-to-date role
```

### Verification Steps

#### Backend Logs
Check logs for role verification:
```
info: Successful login for user: john.doe, Role: manager
info: AD login attempt for username: john.doe
info: Existing AD user login: john.doe, Current Role: manager
info: Generating token for AD user: john.doe with role: manager
```

#### Frontend Network Tab
1. Open DevTools (F12) → Network tab
2. Login as AD user
3. Check request to `/api/auth/ad-login`
4. Response should include:
```json
{
  "token": "eyJ...",  // JWT token
  "user": {
    "id": 123,
    "username": "john.doe",
    "role": "manager"  // ← From database
  }
}
```

#### JWT Token Inspection
Decode JWT token at [jwt.io](https://jwt.io):
```json
{
  "nameid": "123",
  "unique_name": "john.doe",
  "email": "john.doe@domain.com",
  "role": "manager",  // ← This MUST match DB role
  "exp": 1234567890
}
```

---

## 🔧 Migration Guide

### For Existing Users

**Problem**: Users with old localStorage tokens may have cached incorrect roles.

**Solution**: Force logout and re-login for all users:

```javascript
// Add to App.tsx or main component
useEffect(() => {
  const needsMigration = localStorage.getItem('rbac_migrated') !== 'v2';
  if (needsMigration) {
    // Clear old tokens
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.setItem('rbac_migrated', 'v2');
    // Redirect to login
    window.location.href = '/login';
  }
}, []);
```

### Database Setup

Ensure users table has proper role column:
```sql
ALTER TABLE users MODIFY COLUMN role VARCHAR(20) DEFAULT 'user';
UPDATE users SET role = 'user' WHERE role IS NULL;
```

---

## 📋 Key Security Improvements

### 1. Server-Side Role Resolution
- ✅ Roles fetched from database on EVERY login
- ✅ No client-side role caching
- ✅ No device-specific sessions

### 2. JWT Token Management
- ✅ Tokens generated by backend only
- ✅ Tokens include user ID (not device ID)
- ✅ Token refresh fetches updated role from DB

### 3. Database-First Authentication
- ✅ All authentication goes through backend
- ✅ User identity resolved by UPN/Email (not hostname/IP)
- ✅ EF Core caching disabled with `AsNoTracking()`

### 4. Role Assignment Flow
```
Admin assigns role in DB
        ↓
User logs in from ANY device
        ↓
Backend queries DB for current role
        ↓
JWT generated with DB role
        ↓
User receives correct permissions
```

---

## 🚀 Deployment Checklist

### Before Deployment
- [ ] Review all authentication endpoints
- [ ] Test with multiple users and devices
- [ ] Verify database connection string
- [ ] Check JWT secret key is secure
- [ ] Enable HTTPS in production

### After Deployment
- [ ] Force logout all existing users
- [ ] Clear browser cache on all machines
- [ ] Monitor backend logs for role verification
- [ ] Test role changes propagate correctly
- [ ] Verify AD integration works

---

## 🔍 Monitoring & Logging

### Important Logs to Monitor

```csharp
// Backend logs to watch
_logger.LogInformation("Successful login for user: {Username}, Role: {Role}");
_logger.LogInformation("AD login attempt for username: {Username}");
_logger.LogInformation("Existing AD user login: {Username}, Current Role: {Role}");
_logger.LogInformation("Generating token for AD user: {Username} with role: {Role}");
_logger.LogWarning("Failed login attempt for email: {Email}");
```

### Red Flags
- ⚠️ Role mismatch between token and database
- ⚠️ User accessing features without proper role
- ⚠️ Repeated failed authentication attempts
- ⚠️ Role changes not taking effect immediately

---

## 🛠️ Troubleshooting

### Issue: Role still wrong after login
**Solution**:
1. Check backend logs - is role being fetched from DB?
2. Clear localStorage in browser
3. Inspect JWT token at jwt.io - check role claim
4. Verify role in database matches expected

### Issue: Token not refreshing with new role
**Solution**:
1. User must logout and login again (token refresh updates role)
2. Or call `/api/auth/refresh` endpoint
3. Or implement auto-refresh on role change

### Issue: Multiple devices still have different roles
**Solution**:
1. Verify backend is running updated code
2. Check all devices are calling `/api/auth/ad-login`
3. Ensure no old frontend code is cached
4. Clear all browser caches and localStorage

---

## 📞 Support

For issues or questions:
1. Check backend logs: `src/TaqTask.Api/bin/Debug/net9.0/logs/`
2. Verify database: `SELECT username, email, role FROM users;`
3. Test endpoints: Use Postman or curl to test `/api/auth/ad-login`

---

## ✅ Verification Complete

Run these tests to confirm the fix:

```bash
# Test 1: Login from Machine A
curl -X POST http://localhost:5169/api/auth/ad-login \
  -H "Content-Type: application/json" \
  -d '{"username":"test.user","email":"test@domain.com","displayName":"Test User"}'

# Test 2: Decode JWT and verify role claim matches DB
# Copy token from response and check at jwt.io

# Test 3: Login from Machine B with same credentials
# Should get same role as Machine A
```

**If all tests pass**: ✅ RBAC fix is working correctly!

---

## 📝 Summary

**Before Fix**:
- ❌ Roles cached in localStorage per device
- ❌ Mock JWT tokens generated by frontend
- ❌ No database verification on login
- ❌ Device-dependent permissions

**After Fix**:
- ✅ Roles always fetched from database
- ✅ Real JWT tokens from backend only
- ✅ Database verification on every login
- ✅ User-dependent permissions (device-independent)

**Result**: User roles now work consistently across all devices! 🎉
