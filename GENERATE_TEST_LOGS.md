# Generate Test Activity Logs

## Problem
The action logs page shows "No logs found" because there are no activity logs in the database yet.

## Solution
You need to perform some actions in the system to generate logs. Here's how:

## Quick Test - Generate Logs Manually

### 1. Generate Login Logs
```
1. Log out of the system
2. Log back in
3. This creates a "login" log entry
```

### 2. Generate Logout Logs
```
1. Click logout
2. This creates a "logout" log entry
```

### 3. Generate Registration Logs (Donor)
```
1. Log out
2. Go to registration page
3. Register a new donor account
4. This creates a "register" log entry
```

### 4. Generate Campaign Logs (Charity Admin)
```
1. Log in as charity admin
2. Go to campaigns page
3. Create a new campaign
4. This creates a "create_campaign" log entry
5. Edit the campaign
6. This creates an "update_campaign" log entry
```

### 5. Generate Donation Logs (Donor)
```
1. Log in as donor
2. Find a campaign
3. Make a donation
4. This creates a "make_donation" log entry
```

### 6. Generate Profile Update Logs
```
1. Log in as any user
2. Go to profile settings
3. Update your profile information
4. This creates an "update_profile" log entry
```

---

## Alternative: Create Test Logs via Database

If you want to quickly populate the database with test logs, run this SQL:

```sql
-- Insert test activity logs
INSERT INTO activity_logs (user_id, user_role, action, details, ip_address, created_at, updated_at) VALUES
(1, 'admin', 'login', '{"description": "Admin logged in", "user_email": "admin@example.com"}', '127.0.0.1', NOW(), NOW()),
(1, 'admin', 'logout', '{"description": "Admin logged out", "user_email": "admin@example.com"}', '127.0.0.1', NOW(), NOW()),
(2, 'donor', 'login', '{"description": "Donor logged in", "user_email": "donor@example.com"}', '127.0.0.1', NOW(), NOW()),
(2, 'donor', 'make_donation', '{"description": "Donor made a donation of ₱1000", "target_type": "Donation", "target_id": 1, "amount": 1000}', '127.0.0.1', NOW(), NOW()),
(3, 'charity_admin', 'login', '{"description": "Charity admin logged in", "user_email": "charity@example.com"}', '127.0.0.1', NOW(), NOW()),
(3, 'charity_admin', 'create_campaign', '{"description": "Charity admin created a campaign", "target_type": "Campaign", "target_id": 1, "campaign_title": "Help Feed the Hungry"}', '127.0.0.1', NOW(), NOW()),
(3, 'charity_admin', 'update_campaign', '{"description": "Charity admin updated a campaign", "target_type": "Campaign", "target_id": 1, "campaign_title": "Help Feed the Hungry"}', '127.0.0.1', NOW(), NOW()),
(2, 'donor', 'update_profile', '{"description": "Donor updated their profile", "target_type": "User", "target_id": 2}', '127.0.0.1', NOW(), NOW()),
(1, 'admin', 'approve_charity', '{"description": "Admin approved a charity", "target_type": "Charity", "target_id": 1, "charity_name": "Hope Foundation"}', '127.0.0.1', NOW(), NOW()),
(2, 'donor', 'submit_report', '{"description": "Donor submitted a report", "target_type": "Report", "target_id": 1, "report_type": "spam"}', '127.0.0.1', NOW(), NOW());
```

**Note**: Make sure the user_id values (1, 2, 3) match actual user IDs in your `users` table.

---

## Check if Logs Exist

Run this SQL query to check if there are any logs:

```sql
SELECT COUNT(*) as total_logs FROM activity_logs;
```

If the count is 0, you need to generate logs using one of the methods above.

---

## Verify Logs are Being Created

After performing actions, check the database:

```sql
SELECT 
    al.id,
    al.action,
    u.name as user_name,
    u.role as user_role,
    al.created_at
FROM activity_logs al
LEFT JOIN users u ON al.user_id = u.id
ORDER BY al.created_at DESC
LIMIT 10;
```

This will show the 10 most recent logs.

---

## Debug: Check API Response

Open browser console (F12) and look for:
```
API Response: {data: Array(0), current_page: 1, ...}
```

If `data` is an empty array, it means:
1. No logs exist in the database, OR
2. Your filters are too restrictive

Try clicking "Clear All Filters" to see all logs.

---

## Quick Fix: Ensure Logging is Working

Check that these files have the logging code:

### AuthController.php
```php
// In login method
ActivityLogger::logLogin($user, $r);

// In logout method
ActivityLogger::logLogout($user, $r);

// In registerDonor method
ActivityLogger::logRegister($user, $r);

// In registerCharityAdmin method
ActivityLogger::logRegister($user, $r);
```

### Other Controllers
Make sure CampaignController, DonationController, etc. have their respective logging calls.

---

## Test the Fix

1. **Clear all filters** on the action logs page
2. **Refresh the page**
3. **Perform a login/logout** to generate a log
4. **Refresh the action logs page**
5. You should now see the login/logout entries

If you still see "No logs found", check:
- Database connection is working
- Migrations have been run
- The `activity_logs` table exists
- Your user has admin role
