<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Charity;
use Illuminate\Http\Request;
use App\Services\NotificationService;

class VerificationController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }
    public function index(){
        return Charity::with('owner')
            ->where('verification_status','pending')
            ->latest()
            ->paginate(20);
    }

    public function getAllCharities(){
        $request = request();
        $query = Charity::with('owner')->latest();

        // Optional status filter: approved | pending | rejected
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('verification_status', $request->status);
        }

        // Optional text search by name or contact email
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('contact_email', 'LIKE', "%{$search}%");
            });
        }

        $perPage = (int) ($request->input('per_page', 20));
        return $query->paginate($perPage);
    }

    public function getUsers(){
        $request = request();
        $query = \App\Models\User::query()->latest();

        // Optional role filter: donor | charity_admin | admin
        if ($request->has('role') && $request->role !== 'all') {
            $query->where('role', $request->role);
        }

        // Optional status filter: active | suspended
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Optional search by name or email
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('email', 'LIKE', "%{$search}%");
            });
        }

        $perPage = (int) ($request->input('per_page', 20));
        return $query->paginate($perPage);
    }

    public function activateUser(\Illuminate\Http\Request $r, \App\Models\User $user){
        $user->update(['status'=>'active']);
        return response()->json(['message'=>'User activated']);
    }

    public function approve(Request $r, Charity $charity){
        $charity->update([
            'verification_status'=>'approved',
            'verified_at'=>now(),
            'verification_notes'=>$r->input('notes')
        ]);

        // Send notification to charity owner
        $this->notificationService->sendVerificationStatus($charity, 'approved');

        return response()->json(['message'=>'Approved']);
    }

    public function reject(Request $r, Charity $charity){
        $rejectionReason = $r->input('reason');
        $charity->update([
            'verification_status'=>'rejected',
            'rejection_reason' => $rejectionReason,
            'verification_notes'=>$r->input('notes')
        ]);

        // Send notification to charity owner
        $this->notificationService->sendVerificationStatus($charity, 'rejected');

        return response()->json(['message'=>'Rejected']);
    }

    public function suspendUser(Request $r, \App\Models\User $user){
        $user->update(['status'=>'suspended']);
        return response()->json(['message'=>'User suspended']);
    }

    public function getCharityDocuments(Charity $charity){
        return $charity->documents()
            ->with('verifier:id,name,email')
            ->latest()
            ->get()
            ->map(function($doc) {
                return [
                    'id' => $doc->id,
                    'doc_type' => $doc->doc_type,
                    'file_path' => $doc->file_path,
                    'uploaded_at' => $doc->created_at,
                    'verification_status' => $doc->verification_status,
                    'verified_by' => $doc->verifier ? [
                        'id' => $doc->verifier->id,
                        'name' => $doc->verifier->name,
                    ] : null,
                    'verified_at' => $doc->verified_at,
                    'rejection_reason' => $doc->rejection_reason,
                    'admin_notes' => $doc->admin_notes,
                ];
            });
    }

    public function getCharityCampaigns(Charity $charity){
        return $charity->campaigns()
            ->withCount('donations')
            ->withSum('donations', 'amount')
            ->latest()
            ->get()
            ->map(function($campaign) {
                return [
                    'id' => $campaign->id,
                    'title' => $campaign->title,
                    'goal_amount' => $campaign->goal_amount,
                    'current_amount' => $campaign->donations_sum_amount ?? 0,
                    'status' => $campaign->status,
                    'created_at' => $campaign->created_at,
                ];
            });
    }

    public function getUserActivityLogs(Request $request){
        // For now, return empty array if UserActivityLog model doesn't exist
        if (!class_exists(\App\Models\UserActivityLog::class)) {
            return response()->json([]);
        }

        $query = \App\Models\UserActivityLog::with('user');

        // Apply filters
        if ($request->has('action_type') && $request->action_type !== 'all') {
            $query->where('action_type', $request->action_type);
        }
        
        if ($request->has('user_role') && $request->user_role !== 'all') {
            $query->whereHas('user', function($q) use ($request) {
                $q->where('role', $request->user_role);
            });
        }
        
        if ($request->has('target_type') && $request->target_type !== 'all') {
            $query->where('target_type', $request->target_type);
        }
        
        if ($request->has('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        
        if ($request->has('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }
        
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('description', 'LIKE', "%{$search}%")
                  ->orWhereHas('user', function($q) use ($search) {
                      $q->where('name', 'LIKE', "%{$search}%")
                        ->orWhere('email', 'LIKE', "%{$search}%");
                  });
            });
        }

        return $query->latest()->paginate(20);
    }

    public function getUserDonations(\App\Models\User $user){
        return $user->donations()
            ->with(['campaign.charity'])
            ->latest()
            ->get()
            ->map(function($donation) {
                return [
                    'id' => $donation->id,
                    'amount' => $donation->amount,
                    'status' => $donation->status,
                    'payment_method' => $donation->payment_method,
                    'created_at' => $donation->created_at,
                    'campaign' => [
                        'id' => $donation->campaign->id ?? null,
                        'title' => $donation->campaign->title ?? 'N/A',
                        'charity' => [
                            'name' => $donation->campaign->charity->name ?? 'N/A',
                        ]
                    ]
                ];
            });
    }

    public function getAllDonations(Request $request){
        $query = \App\Models\Donation::with(['donor','charity','campaign.charity']);

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->whereHas('donor', function($q) use ($search) {
                    $q->where('name', 'LIKE', "%{$search}%")
                      ->orWhere('email', 'LIKE', "%{$search}%");
                })
                ->orWhereHas('campaign', function($q) use ($search) {
                    $q->where('title', 'LIKE', "%{$search}%");
                })
                ->orWhereHas('charity', function($q) use ($search) {
                    $q->where('name', 'LIKE', "%{$search}%");
                });
            });
        }

        $paginated = $query->orderByDesc('created_at')->paginate(20);

        // Transform to match Transactions.tsx expected shape
        $transformed = $paginated->getCollection()->map(function($d){
            return [
                'id' => $d->id,
                'donor_name' => $d->donor->name ?? ($d->donor_name ?? 'Anonymous'),
                'charity_name' => $d->campaign->charity->name ?? $d->charity->name ?? 'N/A',
                'campaign_title' => $d->campaign->title ?? null,
                'amount' => $d->amount,
                'status' => $d->status,
                'created_at' => optional($d->created_at)->toISOString() ?? now()->toISOString(),
            ];
        });

        return response()->json([
            'data' => $transformed,
            'current_page' => $paginated->currentPage(),
            'last_page' => $paginated->lastPage(),
            'per_page' => $paginated->perPage(),
            'total' => $paginated->total(),
        ]);
    }

    public function getComplianceAudits(Request $request){
        // Placeholder - return empty for now
        return response()->json([]);
    }

    public function getFundsSummary(Request $request){
        $range = $request->input('range','30d');
        $startDate = match($range){
            '7d' => now()->subDays(7),
            '90d' => now()->subDays(90),
            default => now()->subDays(30),
        };

        $inflow = \App\Models\Donation::where('status','completed')
            ->where('created_at','>=',$startDate)
            ->sum('amount');

        $outflow = \App\Models\FundUsageLog::where('spent_at','>=',$startDate)->sum('amount');

        $campaignsTracked = \App\Models\Campaign::count();

        return response()->json([
            'total_inflow' => (float) $inflow,
            'total_outflow' => (float) $outflow,
            'campaigns_tracked' => $campaignsTracked,
        ]);
    }

    public function getFundsFlows(Request $request){
        $range = $request->input('range','30d');
        $startDate = match($range){
            '7d' => now()->subDays(7),
            '90d' => now()->subDays(90),
            default => now()->subDays(30),
        };

        // Build daily buckets
        $period = new \DatePeriod($startDate->copy()->startOfDay(), new \DateInterval('P1D'), now()->copy()->addDay()->startOfDay());

        $donations = \App\Models\Donation::where('status','completed')
            ->whereBetween('created_at', [$startDate, now()])
            ->get()
            ->groupBy(fn($d)=>$d->created_at->format('Y-m-d'));

        $usages = \App\Models\FundUsageLog::whereBetween('spent_at', [$startDate, now()])
            ->get()
            ->groupBy(fn($u)=>optional($u->spent_at)->format('Y-m-d'));

        $series = [];
        foreach ($period as $date) {
            $key = $date->format('Y-m-d');
            $series[] = [
                'label' => $date->format('M d'),
                'inflow' => (float) ($donations[$key]->sum('amount') ?? 0),
                'outflow' => (float) ($usages[$key]->sum('amount') ?? 0),
            ];
        }

        return response()->json($series);
    }

    public function getFundsAnomalies(Request $request){
        $range = $request->input('range','30d');
        $startDate = match($range){
            '7d' => now()->subDays(7),
            '90d' => now()->subDays(90),
            default => now()->subDays(30),
        };

        // Simple heuristic demo anomalies: large donations or large expenses
        $largeDonations = \App\Models\Donation::with('campaign')
            ->where('status','completed')
            ->where('amount','>=',10000)
            ->where('created_at','>=',$startDate)
            ->get()
            ->map(function($d){
                return [
                    'id' => $d->id,
                    'type' => 'large_donation',
                    'campaign' => $d->campaign->title ?? 'General',
                    'severity' => 'medium',
                    'message' => 'Large single donation detected: ₱'.number_format((float)$d->amount,2),
                    'timestamp' => $d->created_at->toISOString(),
                ];
            });

        $largeExpenses = \App\Models\FundUsageLog::with('campaign')
            ->where('amount','>=',10000)
            ->where('spent_at','>=',$startDate)
            ->get()
            ->map(function($u){
                return [
                    'id' => 100000 + $u->id,
                    'type' => 'large_outflow',
                    'campaign' => $u->campaign->title ?? 'General',
                    'severity' => 'high',
                    'message' => 'Large fund usage recorded: ₱'.number_format((float)$u->amount,2).' ('.$u->category.')',
                    'timestamp' => optional($u->spent_at)->toISOString() ?? now()->toISOString(),
                ];
            });

        return response()->json($largeDonations->merge($largeExpenses)->values());
    }

    public function exportDonations(Request $request)
    {
        $request->merge(['per_page' => 100000]);
        $data = $this->getAllDonations($request)->getData(true);

        $filename = 'donations_' . now()->format('Y-m-d_His') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"$filename\"",
        ];

        $callback = function() use ($data) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['ID','Donor','Charity','Campaign','Amount','Status','Date']);
            foreach (($data['data'] ?? []) as $row) {
                fputcsv($file, [
                    $row['id'],
                    $row['donor_name'],
                    $row['charity_name'],
                    $row['campaign_title'] ?? '-',
                    $row['amount'],
                    $row['status'],
                    $row['created_at'],
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
