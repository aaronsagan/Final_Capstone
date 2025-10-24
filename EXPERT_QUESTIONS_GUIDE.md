# Expert Questions Guide - API, Indexing & Caching

## 📡 API Architecture & Usage

### **What API do you use?**

**Answer:**
"We built a **RESTful API** using **Laravel 11** framework with **Laravel Sanctum** for authentication. The API serves as the backend for our charity donation platform."

### **Where is the API located?**

**Answer:**
- **Backend Location:** `capstone_backend/routes/api.php`
- **Base URL:** `http://127.0.0.1:8000/api` (development)
- **API Controllers:** `capstone_backend/app/Http/Controllers/`

### **How many API endpoints do you have?**

**Answer:**
"We have **157+ API endpoints** organized into the following categories:

1. **Authentication** (7 endpoints)
   - Register donor/charity, login, logout, profile management
   
2. **Public Endpoints** (20+ endpoints)
   - Browse charities, campaigns, donation channels, leaderboards
   - Location data (Philippine regions, provinces, cities)
   
3. **Donor Endpoints** (15+ endpoints)
   - Make donations, view history, follow charities, submit reports
   
4. **Charity Admin Endpoints** (50+ endpoints)
   - Manage campaigns, updates, documents, donation channels
   - Fund usage tracking, volunteer management
   
5. **System Admin Endpoints** (40+ endpoints)
   - Verify charities, manage users, compliance reports
   - Document verification, action logs, category management"

### **Where do you use the API in your frontend?**

**Answer:**
"The frontend consumes the API in multiple locations:

1. **Service Layer** (`capstone_frontend/src/services/`)
   - `auth.ts` - Authentication services
   - `donor.ts` - Donor-specific operations
   - Other service files for organized API calls

2. **Component Level** (70+ components)
   - Direct fetch calls in pages and components
   - Examples:
     - `CharityDashboard.tsx` - Fetches charity data
     - `BrowseCharities.tsx` - Lists all charities
     - `MakeDonation.tsx` - Processes donations
     - `AdminDashboard.tsx` - Admin statistics

3. **Custom Hooks** 
   - `usePhilippineLocations.ts` - Location data fetching

4. **API Configuration**
   - Base URL stored in `.env` as `VITE_API_URL`
   - Default: `http://127.0.0.1:8000/api`"

### **What authentication method does your API use?**

**Answer:**
"We use **Laravel Sanctum** for API authentication:
- **Token-based authentication** for SPA (Single Page Application)
- **Session-based** for same-domain requests
- **Role-based access control** with three roles:
  - `donor` - Regular users who donate
  - `charity_admin` - Charity organization managers
  - `admin` - System administrators"

### **Example API Endpoints:**

```
Public:
GET  /api/charities - Browse all charities
GET  /api/campaigns/{id} - View campaign details
GET  /api/locations/regions - Get Philippine regions

Authenticated (Donor):
POST /api/donations - Submit donation
GET  /api/me/donations - View donation history
POST /api/charities/{id}/follow - Follow a charity

Authenticated (Charity Admin):
POST /api/charities/{id}/campaigns - Create campaign
POST /api/campaigns/{id}/updates - Post campaign update
GET  /api/charities/{id}/donations - View donations inbox

Authenticated (Admin):
PATCH /api/admin/charities/{id}/approve - Approve charity
GET   /api/admin/reports - View all reports
GET   /api/admin/compliance/report - Compliance data
```

---

## 🔍 Database Indexing

### **Did you use database indexing?**

**Answer:**
"**Yes, absolutely!** We implemented comprehensive database indexing for performance optimization."

### **What indexes do you have?**

**Answer:**
"We have **60+ database indexes** across 35 migration files. Here are the key ones:

#### **1. Foreign Key Indexes**
- `charity_id` - On donations, campaigns, documents, volunteers
- `campaign_id` - On donations, updates, comments, fund usage
- `user_id` - On donations, notifications, activity logs, comments

#### **2. Status & State Indexes**
- `status` - On donations, reports, volunteers, campaign comments
- `verification_status` - On charities
- `is_active` - On categories

#### **3. Composite Indexes** (Multiple columns)
```sql
// Donations table
index(['charity_id', 'campaign_id', 'status'])

// Updates table
index(['charity_id', 'is_pinned', 'created_at'])

// Notifications table
index(['user_id', 'read'])
index(['user_id', 'created_at'])

// Activity logs
index(['user_id', 'created_at'])
index(['action', 'created_at'])

// Charity follows
index(['charity_id', 'followed_at'])
```

#### **4. Unique Indexes** (Prevent duplicates)
```sql
// Update likes - one like per user per update
unique(['update_id', 'user_id'])

// Comment likes - one like per user per comment
unique(['comment_id', 'user_id'])

// Charity follows - one follow per donor per charity
unique(['donor_id', 'charity_id'])

// Campaign donation channels - prevent duplicate assignments
unique(['campaign_id', 'donation_channel_id'])
```

#### **5. Timestamp Indexes**
- `created_at` - On admin action logs, activity logs
- `last_activity` - On sessions table
- `expires_at` - On personal access tokens"

### **Why did you use these indexes?**

**Answer:**
"We strategically placed indexes to optimize:

1. **Query Performance**
   - Fast lookups for donations by charity/campaign
   - Quick filtering by status (pending, approved, rejected)
   
2. **Relationship Queries**
   - Efficient JOIN operations on foreign keys
   - Fast retrieval of related data (charity → campaigns → donations)

3. **Prevent Duplicates**
   - Unique constraints on likes, follows, and channel assignments
   
4. **Sorting & Filtering**
   - Timestamp indexes for chronological queries
   - Status indexes for filtering by state

5. **Analytics & Reporting**
   - Composite indexes for complex dashboard queries
   - Fast aggregation for leaderboards and statistics"

### **Example Index Usage:**

```php
// Migration example from donation_channels table
Schema::table('donation_channels', function (Blueprint $table) {
    $table->foreignId('charity_id')
          ->constrained('charities')
          ->onDelete('cascade');
    $table->index('charity_id'); // ← Index for fast lookups
});

// Composite index example from campaign_donation_channels
Schema::create('campaign_donation_channels', function (Blueprint $table) {
    $table->unique(['campaign_id', 'donation_channel_id']); // Prevent duplicates
    $table->index('campaign_id');        // Fast campaign lookups
    $table->index('donation_channel_id'); // Fast channel lookups
});
```

---

## 💾 Caching Strategy

### **Did you use caching?**

**Answer:**
"**Yes, we configured caching** using Laravel's caching system, though it's primarily configured for future optimization."

### **What caching driver do you use?**

**Answer:**
"We use **Database caching** as our default cache driver:

```php
// Configuration in .env
CACHE_STORE=database

// Cache table created via migration
0001_01_01_000001_create_cache_table.php
```

**Why database caching?**
- Simple setup, no additional services required
- Persistent across server restarts
- Good for development and small-to-medium scale
- Easy to upgrade to Redis/Memcached later"

### **Where is caching configured?**

**Answer:**
"Caching is configured in multiple locations:

1. **Environment Config** (`.env`)
   ```
   CACHE_STORE=database
   ```

2. **Cache Config** (`config/cache.php`)
   - Default driver: `database`
   - Available drivers: array, database, file, memcached, redis, dynamodb
   
3. **Database Migration**
   - `0001_01_01_000001_create_cache_table.php`
   - Creates `cache` and `cache_locks` tables

4. **Session Storage**
   ```
   SESSION_DRIVER=database
   ```
   - User sessions also stored in database"

### **What would you cache in production?**

**Answer:**
"For production optimization, we would cache:

1. **Static Data**
   - Philippine locations (regions, provinces, cities)
   - Category lists
   - Public charity listings

2. **Computed Data**
   - Leaderboard rankings
   - Donation statistics
   - Campaign progress calculations
   - Follower counts

3. **Expensive Queries**
   - Charity verification status
   - User role permissions
   - Dashboard analytics

**Example implementation:**
```php
// Cache leaderboard for 1 hour
$topDonors = Cache::remember('leaderboard.donors', 3600, function () {
    return User::where('role', 'donor')
               ->withSum('donations', 'amount')
               ->orderByDesc('donations_sum_amount')
               ->take(10)
               ->get();
});
```"

### **Other caching mechanisms you use:**

**Answer:**
"Beyond Laravel's cache system:

1. **Query Result Caching**
   - Eloquent query caching for repeated database calls
   
2. **Session Caching**
   - User authentication state cached in sessions
   
3. **Browser Caching**
   - Static assets (images, CSS, JS) cached by browser
   - API responses with appropriate cache headers

4. **Future Scalability**
   - Ready to switch to Redis for high-traffic scenarios
   - Configuration already supports multiple cache drivers"

---

## 🎯 Quick Reference for Experts

### **Technology Stack**
- **Backend:** Laravel 11 (PHP)
- **Frontend:** React + TypeScript + Vite
- **Database:** MySQL
- **Authentication:** Laravel Sanctum
- **API Style:** RESTful
- **Caching:** Database (upgradeable to Redis)

### **Performance Optimizations**
✅ 60+ database indexes  
✅ Foreign key constraints  
✅ Composite indexes for complex queries  
✅ Unique constraints to prevent duplicates  
✅ Database caching configured  
✅ Session management optimized  
✅ Eager loading for relationships  

### **API Security**
✅ Token-based authentication  
✅ Role-based access control (RBAC)  
✅ CORS configured  
✅ Input validation  
✅ SQL injection prevention (Eloquent ORM)  
✅ XSS protection  

### **Scalability Considerations**
- Modular API structure (easy to microservice later)
- Cache-ready architecture
- Index optimization for large datasets
- Soft deletes for data recovery
- Activity logging for audit trails

---

## 📝 Sample Expert Q&A

**Q: "How do you handle API rate limiting?"**  
A: "Laravel Sanctum provides built-in rate limiting. We can configure it in `RouteServiceProvider` to limit requests per minute per user."

**Q: "What about API versioning?"**  
A: "Currently v1 implicit. For future versions, we'd use route prefixing like `/api/v2/` or header-based versioning."

**Q: "How do you monitor API performance?"**  
A: "We have activity logs and admin action logs. For production, we'd integrate Laravel Telescope or external monitoring like New Relic."

**Q: "What's your database query optimization strategy?"**  
A: "We use indexes on frequently queried columns, composite indexes for multi-column queries, eager loading to prevent N+1 problems, and query result caching for expensive operations."

**Q: "How would you scale this system?"**  
A: "Vertical: Upgrade to Redis caching, add query optimization. Horizontal: Load balancer, database replication (master-slave), CDN for static assets, queue workers for async tasks."

---

## 🔗 File Locations Reference

| Component | Location |
|-----------|----------|
| API Routes | `capstone_backend/routes/api.php` |
| Controllers | `capstone_backend/app/Http/Controllers/` |
| Models | `capstone_backend/app/Models/` |
| Migrations | `capstone_backend/database/migrations/` |
| Cache Config | `capstone_backend/config/cache.php` |
| Frontend Services | `capstone_frontend/src/services/` |
| API Base URL | `capstone_frontend/.env` (VITE_API_URL) |
| Database Config | `capstone_backend/.env` |

---

**Last Updated:** October 24, 2025  
**Project:** Final Capstone - Charity Donation Platform
