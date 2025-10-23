<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\{
  AuthController, CharityController, CampaignController, DonationController, FundUsageController, CharityPostController, TransparencyController, CharityFollowController, NotificationController, ReportController, CampaignCommentController, CategoryController, VolunteerController, LeaderboardController, DocumentExpiryController, LocationController, DonorRegistrationController
};
use App\Http\Controllers\Admin\{VerificationController, AdminActionLogController};

// Health
Route::get('/ping', fn () => ['ok' => true, 'time' => now()->toDateTimeString()]);

// Philippine Locations API (Public)
Route::get('/locations', [LocationController::class,'index']);
Route::get('/locations/regions', [LocationController::class,'getRegions']);
Route::get('/locations/regions/{regionCode}/provinces', [LocationController::class,'getProvinces']);
Route::get('/locations/regions/{regionCode}/provinces/{provinceCode}/cities', [LocationController::class,'getCities']);

// Auth
Route::post('/auth/register', [AuthController::class,'registerDonor']);
Route::post('/auth/register-charity', [AuthController::class,'registerCharityAdmin']);
Route::post('/auth/login', [AuthController::class,'login']);
Route::post('/auth/logout', [AuthController::class,'logout'])->middleware('auth:sanctum');
Route::get('/me', [AuthController::class,'me'])->middleware('auth:sanctum');
Route::put('/me', [AuthController::class,'updateProfile'])->middleware('auth:sanctum');
Route::post('/me/change-password', [AuthController::class,'changePassword'])->middleware('auth:sanctum');
Route::post('/me/deactivate', [AuthController::class,'deactivateAccount'])->middleware('auth:sanctum');
Route::delete('/me', [AuthController::class,'deleteAccount'])->middleware('auth:sanctum');

// Donor Registration (multi-step)
Route::post('/donors/register/draft', [DonorRegistrationController::class,'saveDraft']);
Route::post('/donors/register/verification', [DonorRegistrationController::class,'uploadVerification']);
Route::post('/donors/register/submit', [DonorRegistrationController::class,'submit']);

// Public directory
Route::get('/charities', [CharityController::class,'index']);
Route::get('/charities/{charity}', [CharityController::class,'show']);
Route::get('/charities/{charity}/channels', [CharityController::class,'channels']);
Route::get('/charities/{charity}/campaigns', [CampaignController::class,'index']);
Route::get('/campaigns/{campaign}', [CampaignController::class,'show']);
Route::get('/campaigns/{campaign}/fund-usage', [FundUsageController::class,'publicIndex']);
Route::get('/campaigns/{campaign}/updates', [CampaignController::class,'getUpdates']);
Route::get('/campaigns/{campaign}/supporters', [CampaignController::class,'getSupporters']);
Route::get('/campaigns/{campaign}/donations', [CampaignController::class,'getDonations']);
Route::get('/campaigns/{campaign}/stats', [CampaignController::class,'getStats']);

// Public charity posts (for donor news feed and charity profile)
Route::get('/posts', [CharityPostController::class,'index']);
Route::get('/charities/{charity}/posts', [CharityPostController::class,'getCharityPosts']);

// Public updates (for donor viewing)
Route::get('/charities/{charity}/updates', [\App\Http\Controllers\UpdateController::class,'getCharityUpdates']);

// Public categories and campaign comments
Route::get('/categories', [CategoryController::class,'index']);
Route::get('/campaigns/{campaign}/comments', [CampaignCommentController::class,'index']);

// Public leaderboards
Route::get('/leaderboard/donors', [LeaderboardController::class,'topDonors']);
Route::get('/leaderboard/charities', [LeaderboardController::class,'topCharities']);
Route::get('/leaderboard/stats', [LeaderboardController::class,'donationStats']);
Route::get('/leaderboard/period', [LeaderboardController::class,'leaderboardByPeriod']);
Route::get('/charities/{charity}/leaderboard', [LeaderboardController::class,'topDonorsForCharity']);

// Public charity documents (for viewing by donors and public)
Route::get('/charities/{charity}/documents', [CharityController::class,'getDocuments']);

// Document viewing and downloading (authenticated users)
Route::middleware(['auth:sanctum'])->group(function(){
  Route::get('/documents/{document}/view', [\App\Http\Controllers\DocumentController::class,'view']);
  Route::get('/documents/{document}/download', [\App\Http\Controllers\DocumentController::class,'download']);
});

// Charity follow system (for donors)
Route::middleware(['auth:sanctum','role:donor'])->group(function(){
  Route::post('/charities/{charity}/follow', [CharityFollowController::class,'toggleFollow']);
  Route::get('/charities/{charity}/follow-status', [CharityFollowController::class,'getFollowStatus']);
  Route::get('/me/followed-charities', [CharityFollowController::class,'myFollowedCharities']);
});

// Public charity follow stats
Route::get('/charities/{charity}/followers-count', [CharityFollowController::class,'getFollowersCount']);
Route::get('/charities/{charity}/followers', [CharityFollowController::class,'getFollowers']);

// Public transparency (for approved charities only)
Route::get('/charities/{charity}/transparency', [TransparencyController::class,'publicTransparency']);

// Donor transparency dashboard
Route::middleware(['auth:sanctum','role:donor'])->group(function(){
  Route::get('/me/transparency', [TransparencyController::class,'donorTransparency']);
});

// Charity admin transparency dashboard
Route::middleware(['auth:sanctum','role:charity_admin'])->group(function(){
  Route::get('/charities/{charity}/transparency', [TransparencyController::class,'charityTransparency']);
});

// Donor actions
Route::middleware(['auth:sanctum','role:donor'])->group(function(){
  Route::post('/donations', [DonationController::class,'store']);
  Route::post('/donations/{donation}/proof', [DonationController::class,'uploadProof']);
  Route::get('/me/donations', [DonationController::class,'myDonations']);
  Route::get('/donations/{donation}/receipt', [DonationController::class,'downloadReceipt']);
  
  // Reports (Donor can submit reports)
  Route::post('/reports', [ReportController::class,'store']);
  Route::get('/me/reports', [ReportController::class,'myReports']);
  
  // Campaign Comments (Donor can comment)
  Route::post('/campaigns/{campaign}/comments', [CampaignCommentController::class,'store']);
});

// Notifications (available to any authenticated user role)
Route::middleware(['auth:sanctum'])->group(function(){
  Route::get('/me/notifications', [NotificationController::class,'index']);
  Route::post('/notifications/{notification}/read', [NotificationController::class,'markAsRead']);
  Route::post('/notifications/mark-all-read', [NotificationController::class,'markAllAsRead']);
  Route::get('/notifications/unread-count', [NotificationController::class,'unreadCount']);
  Route::delete('/notifications/{notification}', [NotificationController::class,'destroy']);
  
  // Update interactions (available to any authenticated user)
  Route::post('/updates/{id}/like', [\App\Http\Controllers\UpdateController::class,'toggleLike']);
  Route::post('/updates/{id}/share', [\App\Http\Controllers\UpdateController::class,'shareUpdate']);
  Route::get('/updates/{id}/comments', [\App\Http\Controllers\UpdateController::class,'getComments']);
  Route::post('/updates/{id}/comments', [\App\Http\Controllers\UpdateController::class,'addComment']);
  Route::put('/comments/{id}', [\App\Http\Controllers\UpdateController::class,'updateComment']);
  Route::delete('/comments/{id}', [\App\Http\Controllers\UpdateController::class,'deleteComment']);
  Route::post('/comments/{id}/like', [\App\Http\Controllers\UpdateController::class,'toggleCommentLike']);
});

// System admin (for recurring donations processing and security)
Route::middleware(['auth:sanctum','role:admin'])->group(function(){
  Route::post('/admin/process-recurring-donations', [DonationController::class,'processRecurringDonations']);
  Route::get('/admin/security/activity-logs', [\App\Http\Controllers\Admin\SecurityController::class,'activityLogs']);
  Route::get('/admin/compliance/report', [\App\Http\Controllers\Admin\ComplianceController::class,'generateReport']);
});

// Charity admin
Route::middleware(['auth:sanctum','role:charity_admin'])->group(function(){
  Route::post('/charities', [CharityController::class,'store']);
  Route::put('/charities/{charity}', [CharityController::class,'update']);
  Route::post('/charity/profile/update', [CharityController::class,'updateProfile']);
  Route::post('/charities/{charity}/documents', [CharityController::class,'uploadDocument']);

  Route::post('/charities/{charity}/channels', [CharityController::class,'storeChannel']);

  Route::post('/charities/{charity}/campaigns', [CampaignController::class,'store']);
  Route::put('/campaigns/{campaign}', [CampaignController::class,'update']);
  Route::delete('/campaigns/{campaign}', [CampaignController::class,'destroy']);

  Route::get('/charities/{charity}/donations', [DonationController::class,'charityInbox']);
  Route::patch('/donations/{donation}/confirm', [DonationController::class,'confirm']);
  Route::patch('/donations/{donation}/status', [DonationController::class,'updateStatus']);

  Route::post('/campaigns/{campaign}/fund-usage', [FundUsageController::class,'store']);
  
  // Charity posts management
  Route::get('/my-posts', [CharityPostController::class,'getMyPosts']);
  Route::post('/posts', [CharityPostController::class,'store']);
  Route::put('/posts/{post}', [CharityPostController::class,'update']);
  Route::delete('/posts/{post}', [CharityPostController::class,'destroy']);
  
  // Reports (Charity can submit reports about donors)
  Route::post('/reports', [ReportController::class,'store']);
  Route::get('/me/reports', [ReportController::class,'myReports']);
  
  // Volunteer Management
  Route::get('/charities/{charity}/volunteers', [VolunteerController::class,'index']);
  Route::post('/charities/{charity}/volunteers', [VolunteerController::class,'store']);
  Route::get('/charities/{charity}/volunteers/statistics', [VolunteerController::class,'statistics']);
  Route::get('/charities/{charity}/volunteers/{volunteer}', [VolunteerController::class,'show']);
  Route::put('/charities/{charity}/volunteers/{volunteer}', [VolunteerController::class,'update']);
  Route::delete('/charities/{charity}/volunteers/{volunteer}', [VolunteerController::class,'destroy']);
  
  // Document Expiry Status
  Route::get('/charities/{charity}/documents/expiry-status', [DocumentExpiryController::class,'getCharityDocumentStatus']);
  
  // Updates Management (Charity Admin)
  Route::get('/updates', [\App\Http\Controllers\UpdateController::class,'index']);
  Route::post('/updates', [\App\Http\Controllers\UpdateController::class,'store']);
  Route::put('/updates/{id}', [\App\Http\Controllers\UpdateController::class,'update']);
  Route::delete('/updates/{id}', [\App\Http\Controllers\UpdateController::class,'destroy']);
  Route::post('/updates/{id}/pin', [\App\Http\Controllers\UpdateController::class,'togglePin']);
  Route::patch('/comments/{id}/hide', [\App\Http\Controllers\UpdateController::class,'hideComment']);
  
  // Bin/Trash Management
  Route::get('/updates/trash', [\App\Http\Controllers\UpdateController::class,'getTrashed']);
  Route::post('/updates/{id}/restore', [\App\Http\Controllers\UpdateController::class,'restore']);
  Route::delete('/updates/{id}/force', [\App\Http\Controllers\UpdateController::class,'forceDelete']);
});

// System admin
Route::middleware(['auth:sanctum','role:admin'])->group(function(){
  Route::get('/admin/verifications', [VerificationController::class,'index']);
  Route::get('/admin/charities', [VerificationController::class,'getAllCharities']);
  Route::get('/admin/users', [VerificationController::class,'getUsers']);
  Route::patch('/admin/charities/{charity}/approve', [VerificationController::class,'approve']);
  Route::patch('/admin/charities/{charity}/reject', [VerificationController::class,'reject']);
  Route::patch('/admin/users/{user}/suspend', [VerificationController::class,'suspendUser']);
  Route::patch('/admin/users/{user}/activate', [VerificationController::class,'activateUser']);
  
  // Reports Management
  Route::get('/admin/reports', [ReportController::class,'index']);
  Route::get('/admin/reports/statistics', [ReportController::class,'statistics']);
  Route::get('/admin/reports/{report}', [ReportController::class,'show']);
  Route::patch('/admin/reports/{report}/review', [ReportController::class,'review']);
  Route::delete('/admin/reports/{report}', [ReportController::class,'destroy']);
  
  // Admin Action Logs
  Route::get('/admin/action-logs', [AdminActionLogController::class,'index']);
  Route::get('/admin/action-logs/statistics', [AdminActionLogController::class,'statistics']);
  Route::get('/admin/action-logs/export', [AdminActionLogController::class,'export']);
  
  // Category Management
  Route::get('/admin/categories', [CategoryController::class,'adminIndex']);
  Route::post('/admin/categories', [CategoryController::class,'store']);
  Route::get('/admin/categories/statistics', [CategoryController::class,'statistics']);
  Route::put('/admin/categories/{category}', [CategoryController::class,'update']);
  Route::delete('/admin/categories/{category}', [CategoryController::class,'destroy']);
  
  // Comment Moderation
  Route::get('/admin/comments/pending', [CampaignCommentController::class,'pending']);
  Route::get('/admin/comments/statistics', [CampaignCommentController::class,'statistics']);
  Route::patch('/admin/comments/{comment}/moderate', [CampaignCommentController::class,'moderate']);
  Route::delete('/admin/comments/{comment}', [CampaignCommentController::class,'destroy']);
  
  // Document Expiry Management
  Route::get('/admin/documents/expiring', [DocumentExpiryController::class,'getExpiringDocuments']);
  Route::get('/admin/documents/expired', [DocumentExpiryController::class,'getExpiredDocuments']);
  Route::get('/admin/documents/expiry-statistics', [DocumentExpiryController::class,'getExpiryStatistics']);
  Route::patch('/admin/documents/{document}/expiry', [DocumentExpiryController::class,'updateDocumentExpiry']);
});

// routes/api.php
Route::get('/metrics', function () {
    return [
        'total_users' => \App\Models\User::count(),
        'total_donors' => \App\Models\User::where('role', 'donor')->count(),
        'total_charity_admins' => \App\Models\User::where('role', 'charity_admin')->count(),
        'charities' => \App\Models\Charity::where('verification_status','approved')->count(),
        'pending_verifications' => \App\Models\Charity::where('verification_status','pending')->count(),
        'campaigns' => \App\Models\Campaign::count(),
        'donations' => \App\Models\Donation::count(),
    ];
});
