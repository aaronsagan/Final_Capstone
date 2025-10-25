# Action Logs - Quick Visual Guide

## 🎯 What You'll See

### 1. Page Header
```
┌─────────────────────────────────────────────────────────────┐
│ Action Logs Management              [Refresh] [Export CSV]  │
│ Monitor and audit all significant user actions...           │
└─────────────────────────────────────────────────────────────┘
```

### 2. Statistics Cards (4 Cards in a Row)
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Total Actions│ │    Today     │ │  This Week   │ │  This Month  │
│              │ │              │ │              │ │              │
│   1,234  📊 │ │    45    ⚡  │ │   156   📈   │ │   678   📊   │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
  Blue border     Green border     Purple border    Orange border
```

### 3. Filters Section
```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 Filters                                                   │
├─────────────────────────────────────────────────────────────┤
│ [Search...]  [User Role ▼]  [Action Type ▼]  [Target ▼]   │
│ [Start Date] [End Date]                  [Clear All Filters]│
└─────────────────────────────────────────────────────────────┘
```

### 4. Action Logs List
```
┌─────────────────────────────────────────────────────────────┐
│ Action Logs (25)                                             │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [Login] [donor] John Doe (john@email.com)               │ │
│ │ John Doe logged in                        [View Details]│ │
│ │                                   2024-10-26 4:00 AM     │ │
│ │                                   IP: 192.168.1.1        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [Create Campaign] [charity_admin] Hope Foundation       │ │
│ │ Target: Campaign #123                     [View Details]│ │
│ │ Created campaign: Feed the Hungry                       │ │
│ │                                   2024-10-26 3:45 AM     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [Make Donation] [donor] Jane Smith                      │ │
│ │ Target: Donation #456                     [View Details]│ │
│ │ Made a donation of ₱5,000                               │ │
│ │                                   2024-10-26 3:30 AM     │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 5. Detailed View Modal (When Clicking "View Details")
```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Action Log Details                                    [X] │
│ Complete information about this user action                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 👥 User Information                                         │
│ ┌────────────────────┬────────────────────┐                │
│ │ Name: John Doe     │ Email: john@...    │                │
│ │ User ID: #123      │ Role: [donor]      │                │
│ └────────────────────┴────────────────────┘                │
│                                                              │
│ ⚡ Action Information                                       │
│ ┌────────────────────┬────────────────────┐                │
│ │ Action: [Login]    │ Log ID: #789       │                │
│ │ Time: 2024-10-26   │ IP: 192.168.1.1    │                │
│ │ Target: N/A        │ Target ID: N/A     │                │
│ └────────────────────┴────────────────────┘                │
│                                                              │
│ Description                                                  │
│ ┌──────────────────────────────────────────┐               │
│ │ John Doe logged in                       │               │
│ └──────────────────────────────────────────┘               │
│                                                              │
│ 📊 Additional Details                                       │
│ ┌──────────────────────────────────────────┐               │
│ │ {                                        │               │
│ │   "user_email": "john@email.com",       │               │
│ │   "login_method": "password",           │               │
│ │   "device": "Chrome on Windows"         │               │
│ │ }                                        │               │
│ └──────────────────────────────────────────┘               │
│                                                              │
│                                          [Close]             │
└─────────────────────────────────────────────────────────────┘
```

## 🎨 Color Coding Reference

### Action Badges
- **Login** → Blue background
- **Logout** → Gray background
- **Register** → Cyan background
- **Create Campaign** → Green background
- **Update Campaign** → Yellow background
- **Delete Campaign** → Red background
- **Make Donation** → Emerald background
- **Update Profile** → Purple background
- **Submit Report** → Orange background
- **Approve Charity** → Green background
- **Reject Charity** → Red background

### Statistics Cards
- **Total Actions** → Blue left border
- **Today** → Green left border
- **This Week** → Purple left border
- **This Month** → Orange left border

## 🔍 How to Use

### Filtering Logs
1. **By Search** - Type user name, email, or action description
2. **By User Role** - Select: All Roles, Donors, Charity Admins, or System Admins
3. **By Action Type** - Select specific action (Login, Create Campaign, etc.)
4. **By Target Type** - Filter by what was affected (Campaign, Donation, etc.)
5. **By Date Range** - Set start and end dates
6. **Clear Filters** - Click "Clear All Filters" to reset

### Viewing Details
1. **Click on any log entry** - Opens detailed modal
2. **Click "View Details" button** - Same as above
3. **Review all information** - User info, action info, description, JSON details
4. **Close modal** - Click "Close" or click outside modal

### Exporting Data
1. **Apply desired filters** (optional)
2. **Click "Export CSV"** button
3. **File downloads automatically** with timestamp in filename
4. **Open in Excel or Google Sheets** for analysis

## 📊 What Actions Are Logged?

✅ **Authentication**
- Login
- Logout
- Register (Donor & Charity Admin)

✅ **Campaign Management**
- Create Campaign
- Update Campaign
- Delete Campaign

✅ **Donations**
- Make Donation

✅ **Profile Management**
- Update Profile

✅ **Content Management**
- Create Post
- Update Post
- Delete Post

✅ **Reports**
- Submit Report

✅ **Admin Actions**
- Approve Charity
- Reject Charity
- Suspend User
- Activate User

## 🚀 Quick Test

1. **Open the page**: `http://localhost:8080/admin/action-logs`
2. **Check statistics**: Should see 4 cards with numbers
3. **View logs**: Should see list of recent actions
4. **Click a log**: Modal should open with details
5. **Try filtering**: Select a filter and see results update
6. **Export**: Click Export CSV and check downloaded file

## ✨ Key Features

- ✅ Real-time statistics dashboard
- ✅ Advanced filtering (6 different filters)
- ✅ Search functionality with debouncing
- ✅ Detailed view modal for each log
- ✅ CSV export capability
- ✅ Color-coded action badges
- ✅ Responsive design
- ✅ Dark mode support
- ✅ Smooth animations
- ✅ IP address tracking
- ✅ Timestamp for every action
- ✅ User information display
- ✅ Target entity tracking
