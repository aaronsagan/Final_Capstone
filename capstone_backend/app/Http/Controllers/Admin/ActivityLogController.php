<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    /**
     * Get all user activity logs with filters
     * Tracks ALL users: donors, charity admins, and system admins
     */
    public function index(Request $request)
    {
        $query = ActivityLog::with('user:id,name,email,role');

        // Filter by user role (check both user table and user_role column)
        if ($request->has('user_role') && $request->user_role !== 'all') {
            $query->where(function($q) use ($request) {
                $q->whereHas('user', function($userQuery) use ($request) {
                    $userQuery->where('role', $request->user_role);
                })->orWhere('user_role', $request->user_role);
            });
        }

        // Filter by action type
        if ($request->has('action_type') && $request->action_type !== 'all') {
            $query->where('action', $request->action_type);
        }

        // Filter by date range
        if ($request->has('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        // Search in details
        if ($request->has('search') && $request->search) {
            $query->where(function($q) use ($request) {
                $q->where('action', 'like', '%' . $request->search . '%')
                  ->orWhere('details', 'like', '%' . $request->search . '%')
                  ->orWhereHas('user', function($userQuery) use ($request) {
                      $userQuery->where('name', 'like', '%' . $request->search . '%')
                                ->orWhere('email', 'like', '%' . $request->search . '%');
                  });
            });
        }

        // Order by most recent first
        $query->orderBy('created_at', 'desc');

        $logs = $query->paginate(50);

        // Transform the data to match frontend expectations
        $transformedLogs = $logs->getCollection()->map(function($log) {
            return [
                'id' => $log->id,
                'user' => [
                    'id' => $log->user->id ?? null,
                    'name' => $log->user->name ?? 'Unknown User',
                    'email' => $log->user->email ?? '',
                    'role' => $log->user->role ?? $log->user_role ?? 'unknown',
                ],
                'action_type' => $log->action,
                'target_type' => $log->details['target_type'] ?? null,
                'target_id' => $log->details['target_id'] ?? null,
                'details' => $log->details,
                'description' => $log->details['description'] ?? $this->generateDescription($log),
                'ip_address' => $log->ip_address,
                'created_at' => $log->created_at->toISOString(),
            ];
        });

        return response()->json([
            'data' => $transformedLogs,
            'current_page' => $logs->currentPage(),
            'last_page' => $logs->lastPage(),
            'per_page' => $logs->perPage(),
            'total' => $logs->total(),
        ]);
    }

    /**
     * Get statistics for user activities
     */
    public function statistics()
    {
        return response()->json([
            'total_actions' => ActivityLog::count(),
            'actions_today' => ActivityLog::whereDate('created_at', today())->count(),
            'actions_this_week' => ActivityLog::whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])->count(),
            'actions_this_month' => ActivityLog::whereMonth('created_at', now()->month)->count(),
            'by_action_type' => ActivityLog::selectRaw('action, COUNT(*) as count')
                ->groupBy('action')
                ->get(),
            'by_user_role' => ActivityLog::selectRaw('user_role, COUNT(*) as count')
                ->groupBy('user_role')
                ->get(),
            'recent_actions' => ActivityLog::with('user:id,name,role')
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get(),
        ]);
    }

    /**
     * Export logs to CSV
     */
    public function export(Request $request)
    {
        $query = ActivityLog::with('user:id,name,email,role');

        // Apply same filters as index
        if ($request->has('user_role') && $request->user_role !== 'all') {
            $query->whereHas('user', function($q) use ($request) {
                $q->where('role', $request->user_role);
            });
        }
        if ($request->has('action_type') && $request->action_type !== 'all') {
            $query->where('action', $request->action_type);
        }
        if ($request->has('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        $logs = $query->orderBy('created_at', 'desc')->get();

        // Generate CSV
        $filename = 'activity_logs_' . now()->format('Y-m-d_His') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"$filename\"",
        ];

        $callback = function() use ($logs) {
            $file = fopen('php://output', 'w');
            
            // CSV Headers
            fputcsv($file, ['ID', 'User', 'Email', 'Role', 'Action', 'Description', 'IP Address', 'Date/Time']);
            
            // CSV Data
            foreach ($logs as $log) {
                fputcsv($file, [
                    $log->id,
                    $log->user->name ?? 'Unknown',
                    $log->user->email ?? 'N/A',
                    $log->user->role ?? $log->user_role ?? 'N/A',
                    $log->action,
                    $log->details['description'] ?? $this->generateDescription($log),
                    $log->ip_address ?? 'N/A',
                    $log->created_at->format('Y-m-d H:i:s'),
                ]);
            }
            
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Generate a human-readable description for the log
     */
    private function generateDescription($log)
    {
        $action = $log->action;
        $userName = $log->user->name ?? 'User';
        
        $descriptions = [
            'login' => "$userName logged in",
            'logout' => "$userName logged out",
            'register' => "$userName registered an account",
            'create_campaign' => "$userName created a campaign",
            'update_campaign' => "$userName updated a campaign",
            'delete_campaign' => "$userName deleted a campaign",
            'make_donation' => "$userName made a donation",
            'update_profile' => "$userName updated their profile",
            'submit_report' => "$userName submitted a report",
            'create_post' => "$userName created a post",
            'update_post' => "$userName updated a post",
            'delete_post' => "$userName deleted a post",
            'approve_charity' => "$userName approved a charity",
            'reject_charity' => "$userName rejected a charity",
            'suspend_user' => "$userName suspended a user",
            'activate_user' => "$userName activated a user",
        ];

        return $descriptions[$action] ?? "$userName performed action: $action";
    }
}
