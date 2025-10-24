# Admin Dashboard 403 Error - Root Cause & Solution

## Error Description
```
Failed to load resource: the server responded with a status of 403 (Forbidden)
Error fetching dashboard stats: AxiosError
```

## Root Cause Analysis

The **403 Forbidden** error occurs when the Admin Dashboard tries to fetch data from protected endpoints. Here's what's happening:

### 1. **Authentication Flow Issue**
The dashboard makes three API calls:
- `/api/metrics` - **PUBLIC** (no auth required) ✅
- `/api/admin/users` - **PROTECTED** (requires `auth:sanctum` + `role:admin`) ❌
- `/api/admin/charities` - **PROTECTED** (requires `auth:sanctum` + `role:admin`) ❌

### 2. **Middleware Protection**
From `api.php` lines 254-313, admin routes are protected by:
```php
Route::middleware(['auth:sanctum','role:admin'])->group(function(){
  Route::get('/admin/users', [VerificationController::class,'getUsers']);
  Route::get('/admin/charities', [VerificationController::class,'getAllCharities']);
  // ... other admin routes
});
```

### 3. **Role Enforcement**
The `EnsureRole` middleware (line 10) returns **403 Forbidden** when:
```php
abort_unless($user && in_array($user->role, $roles), 403, 'Forbidden');
```

This happens if:
- ❌ No authentication token is provided
- ❌ Token is invalid or expired
- ❌ User is authenticated but doesn't have `role: 'admin'`

## Possible Causes

### Cause 1: User Doesn't Have Admin Role
**Most Likely Issue**: The logged-in user has `role: 'donor'` or `role: 'charity_admin'` instead of `role: 'admin'`.

**How to Check:**
1. Open browser DevTools → Console
2. Run: `localStorage.getItem('auth_token')`
3. Decode the token at https://jwt.io
4. Check the user's role in the database

**Solution:**
```sql
-- Update user to admin role
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

### Cause 2: Missing or Invalid Token
The token might not be stored correctly or has expired.

**How to Check:**
```javascript
// In browser console
console.log('Token:', localStorage.getItem('auth_token'));
console.log('Session Token:', sessionStorage.getItem('auth_token'));
```

**Solution:**
1. Log out completely
2. Clear browser storage: `localStorage.clear()` and `sessionStorage.clear()`
3. Log in again with admin credentials

### Cause 3: CORS or Sanctum Configuration
The token might not be sent with the request due to CORS issues.

**How to Check:**
Open DevTools → Network tab → Check the failed request headers:
- Should have: `Authorization: Bearer <token>`
- If missing, it's a frontend issue

## Step-by-Step Debugging

### Step 1: Verify User Role in Database
```bash
# Connect to your database
php artisan tinker

# Check user role
$user = User::where('email', 'admin@example.com')->first();
echo $user->role; // Should output: 'admin'

# If not admin, update it:
$user->role = 'admin';
$user->save();
```

### Step 2: Check Token in Browser
```javascript
// Open browser console (F12)
const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
console.log('Token exists:', !!token);
console.log('Token:', token);

// Test API call manually
fetch('http://127.0.0.1:8000/api/me', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(data => console.log('User data:', data));
```

### Step 3: Verify Backend Response
```bash
# Test the endpoint directly
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" http://127.0.0.1:8000/api/admin/users
```

Expected responses:
- **200 OK** → Token is valid, user is admin ✅
- **401 Unauthorized** → Token is invalid or expired ❌
- **403 Forbidden** → User is not admin ❌

## Quick Fix Solutions

### Solution 1: Create Admin User (If None Exists)
```bash
php artisan tinker
```

```php
use App\Models\User;
use Illuminate\Support\Facades\Hash;

User::create([
    'name' => 'System Admin',
    'email' => 'admin@charity.com',
    'password' => Hash::make('admin123'),
    'role' => 'admin',
    'status' => 'active'
]);
```

### Solution 2: Update Existing User to Admin
```bash
php artisan tinker
```

```php
$user = User::where('email', 'your-email@example.com')->first();
$user->role = 'admin';
$user->save();
```

### Solution 3: Re-login with Admin Account
1. Log out from the current session
2. Clear browser storage
3. Log in with admin credentials
4. The dashboard should now work

## Frontend Code Reference

### Dashboard.tsx (Lines 64-116)
```typescript
const fetchDashboardData = async () => {
  try {
    setIsLoading(true);
    
    // PUBLIC endpoint - works fine
    const metricsResponse = await fetch(`${import.meta.env.VITE_API_URL}/metrics`);
    
    // PROTECTED endpoints - require admin role
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const usersResponse = await fetch(`${import.meta.env.VITE_API_URL}/admin/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const charitiesResponse = await fetch(`${import.meta.env.VITE_API_URL}/admin/charities`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
  }
};
```

## Prevention

### Add Better Error Handling
Update `Dashboard.tsx` to show specific error messages:

```typescript
const fetchDashboardData = async () => {
  try {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    
    if (!token) {
      toast.error('Not authenticated. Please log in.');
      return;
    }
    
    const usersResponse = await fetch(`${import.meta.env.VITE_API_URL}/admin/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (usersResponse.status === 403) {
      toast.error('Access denied. Admin privileges required.');
      // Optionally redirect to login
      return;
    }
    
    if (usersResponse.status === 401) {
      toast.error('Session expired. Please log in again.');
      // Clear token and redirect
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
      return;
    }
    
    if (!usersResponse.ok) {
      throw new Error(`HTTP ${usersResponse.status}`);
    }
    
    // Process response...
  } catch (error) {
    console.error('Dashboard error:', error);
    toast.error('Failed to load dashboard data');
  }
};
```

## Summary

**Most Common Issue**: User is logged in but doesn't have `role: 'admin'`.

**Quick Fix**:
1. Update user role to 'admin' in database
2. Log out and log back in
3. Dashboard should load successfully

**Verification**:
- Check Network tab: Authorization header should be present
- Check Console: No 403 errors
- Dashboard displays metrics, users, and charities
