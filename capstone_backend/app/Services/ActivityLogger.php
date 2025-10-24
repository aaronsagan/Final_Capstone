<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;

class ActivityLogger
{
    /**
     * Log a user activity
     * 
     * @param string $action The action being performed (e.g., 'login', 'create_campaign')
     * @param array $details Additional details about the action
     * @param Request|null $request The HTTP request (optional)
     * @return ActivityLog|null
     */
    public static function log(string $action, array $details = [], ?Request $request = null): ?ActivityLog
    {
        try {
            $user = Auth::user();
            $request = $request ?? request();

            $logData = [
                'user_id' => $user ? $user->id : null,
                'user_role' => $user ? $user->role : null,
                'action' => $action,
                'details' => $details,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'session_id' => $request->session()->getId(),
            ];

            return ActivityLog::create($logData);
        } catch (\Exception $e) {
            // Silently fail to not disrupt the main application flow
            \Log::error('Failed to log activity: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Log a login activity
     */
    public static function logLogin($user, ?Request $request = null)
    {
        return self::log('login', [
            'description' => "{$user->name} logged in",
            'user_email' => $user->email,
        ], $request);
    }

    /**
     * Log a logout activity
     */
    public static function logLogout($user, ?Request $request = null)
    {
        return self::log('logout', [
            'description' => "{$user->name} logged out",
            'user_email' => $user->email,
        ], $request);
    }

    /**
     * Log a registration activity
     */
    public static function logRegister($user, ?Request $request = null)
    {
        return self::log('register', [
            'description' => "{$user->name} registered as {$user->role}",
            'user_email' => $user->email,
            'user_role' => $user->role,
        ], $request);
    }

    /**
     * Log a donation activity
     */
    public static function logDonation($donation, ?Request $request = null)
    {
        $user = Auth::user();
        return self::log('make_donation', [
            'description' => "{$user->name} made a donation of ₱{$donation->amount}",
            'target_type' => 'Donation',
            'target_id' => $donation->id,
            'amount' => $donation->amount,
            'charity_id' => $donation->charity_id,
            'campaign_id' => $donation->campaign_id,
        ], $request);
    }

    /**
     * Log a campaign creation
     */
    public static function logCreateCampaign($campaign, ?Request $request = null)
    {
        $user = Auth::user();
        return self::log('create_campaign', [
            'description' => "{$user->name} created campaign: {$campaign->title}",
            'target_type' => 'Campaign',
            'target_id' => $campaign->id,
            'campaign_title' => $campaign->title,
        ], $request);
    }

    /**
     * Log a campaign update
     */
    public static function logUpdateCampaign($campaign, ?Request $request = null)
    {
        $user = Auth::user();
        return self::log('update_campaign', [
            'description' => "{$user->name} updated campaign: {$campaign->title}",
            'target_type' => 'Campaign',
            'target_id' => $campaign->id,
            'campaign_title' => $campaign->title,
        ], $request);
    }

    /**
     * Log a campaign deletion
     */
    public static function logDeleteCampaign($campaign, ?Request $request = null)
    {
        $user = Auth::user();
        return self::log('delete_campaign', [
            'description' => "{$user->name} deleted campaign: {$campaign->title}",
            'target_type' => 'Campaign',
            'target_id' => $campaign->id,
            'campaign_title' => $campaign->title,
        ], $request);
    }

    /**
     * Log a post creation
     */
    public static function logCreatePost($post, ?Request $request = null)
    {
        $user = Auth::user();
        return self::log('create_post', [
            'description' => "{$user->name} created a post",
            'target_type' => 'Post',
            'target_id' => $post->id,
        ], $request);
    }

    /**
     * Log a post update
     */
    public static function logUpdatePost($post, ?Request $request = null)
    {
        $user = Auth::user();
        return self::log('update_post', [
            'description' => "{$user->name} updated a post",
            'target_type' => 'Post',
            'target_id' => $post->id,
        ], $request);
    }

    /**
     * Log a post deletion
     */
    public static function logDeletePost($post, ?Request $request = null)
    {
        $user = Auth::user();
        return self::log('delete_post', [
            'description' => "{$user->name} deleted a post",
            'target_type' => 'Post',
            'target_id' => $post->id,
        ], $request);
    }

    /**
     * Log a profile update
     */
    public static function logUpdateProfile($user, ?Request $request = null)
    {
        return self::log('update_profile', [
            'description' => "{$user->name} updated their profile",
            'target_type' => 'User',
            'target_id' => $user->id,
        ], $request);
    }

    /**
     * Log a report submission
     */
    public static function logSubmitReport($report, ?Request $request = null)
    {
        $user = Auth::user();
        return self::log('submit_report', [
            'description' => "{$user->name} submitted a report",
            'target_type' => 'Report',
            'target_id' => $report->id,
            'report_type' => $report->report_type,
        ], $request);
    }

    /**
     * Log a charity approval
     */
    public static function logApproveCharity($charity, ?Request $request = null)
    {
        $user = Auth::user();
        return self::log('approve_charity', [
            'description' => "{$user->name} approved charity: {$charity->name}",
            'target_type' => 'Charity',
            'target_id' => $charity->id,
            'charity_name' => $charity->name,
        ], $request);
    }

    /**
     * Log a charity rejection
     */
    public static function logRejectCharity($charity, ?Request $request = null)
    {
        $user = Auth::user();
        return self::log('reject_charity', [
            'description' => "{$user->name} rejected charity: {$charity->name}",
            'target_type' => 'Charity',
            'target_id' => $charity->id,
            'charity_name' => $charity->name,
        ], $request);
    }

    /**
     * Log a user suspension
     */
    public static function logSuspendUser($targetUser, ?Request $request = null)
    {
        $user = Auth::user();
        return self::log('suspend_user', [
            'description' => "{$user->name} suspended user: {$targetUser->name}",
            'target_type' => 'User',
            'target_id' => $targetUser->id,
            'target_user_name' => $targetUser->name,
        ], $request);
    }

    /**
     * Log a user activation
     */
    public static function logActivateUser($targetUser, ?Request $request = null)
    {
        $user = Auth::user();
        return self::log('activate_user', [
            'description' => "{$user->name} activated user: {$targetUser->name}",
            'target_type' => 'User',
            'target_id' => $targetUser->id,
            'target_user_name' => $targetUser->name,
        ], $request);
    }
}
