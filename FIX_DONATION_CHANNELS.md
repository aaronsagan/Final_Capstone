# Fix: No Donation Channels Available

## Problem
The donation page shows "No channels available" because:
1. No donation channels have been created yet
2. Channels exist but aren't attached to campaigns

## Quick Fix - Create Test Channels via Database

Run this SQL in your database:

```sql
-- Insert sample donation channels for charity ID 1
INSERT INTO donation_channels (charity_id, type, label, account_name, account_number, is_active, created_at, updated_at)
VALUES 
(1, 'gcash', 'GCash - Main Account', 'Juan Dela Cruz', '09123456789', 1, NOW(), NOW()),
(1, 'maya', 'Maya - Main Account', 'Juan Dela Cruz', '09987654321', 1, NOW(), NOW()),
(1, 'bank_transfer', 'BDO - Main Account', 'Charity Foundation Inc.', '1234567890', 1, NOW(), NOW());

-- Attach channels to campaign 1
INSERT INTO campaign_donation_channel (campaign_id, donation_channel_id)
SELECT 1, id FROM donation_channels WHERE charity_id = 1;
```

## Test the Fix

1. Open browser console (F12)
2. Go to http://localhost:8080/donor/donate
3. Select charity and campaign
4. Check console for logs showing channels loaded
5. Verify channels appear in Step 3 dropdown

## Create Channels via UI (Proper Way)

1. Log in as charity admin
2. Go to Charity Dashboard
3. Find "Donation Channels" section
4. Click "Add Channel"
5. Fill in details and upload QR code
6. Save channel
7. Attach to campaigns in campaign settings
