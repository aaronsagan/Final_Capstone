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
        return Charity::with('owner')
            ->latest()
            ->paginate(20);
    }

    public function getUsers(){
        return \App\Models\User::latest()->paginate(20);
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
        $query = \App\Models\Donation::with(['donor', 'campaign.charity']);

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->whereHas('donor', function($q) use ($search) {
                    $q->where('name', 'LIKE', "%{$search}%");
                })
                ->orWhereHas('campaign', function($q) use ($search) {
                    $q->where('title', 'LIKE', "%{$search}%");
                });
            });
        }

        return $query->latest()->paginate(20);
    }

    public function getComplianceAudits(Request $request){
        // Placeholder - return empty for now
        return response()->json([]);
    }

    public function getFundsSummary(Request $request){
        // Placeholder - return empty for now
        return response()->json([
            'total_funds' => 0,
            'allocated' => 0,
            'pending' => 0,
            'completed' => 0
        ]);
    }

    public function getFundsFlows(Request $request){
        // Placeholder - return empty for now
        return response()->json([]);
    }

    public function getFundsAnomalies(Request $request){
        // Placeholder - return empty for now
        return response()->json([]);
    }
}
