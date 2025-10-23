<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CharityDocument;
use App\Models\Charity;
use Illuminate\Http\Request;
use App\Services\NotificationService;

class DocumentVerificationController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Approve a specific document
     */
    public function approveDocument(Request $request, CharityDocument $document)
    {
        $document->update([
            'verification_status' => 'approved',
            'verified_by' => $request->user()->id,
            'verified_at' => now(),
            'admin_notes' => $request->input('notes'),
            'rejection_reason' => null, // Clear any previous rejection
        ]);

        // Check if all documents are approved, then auto-approve charity
        $this->checkAndApproveCharity($document->charity);

        // Send notification to charity owner
        $this->notificationService->sendDocumentVerificationStatus($document, 'approved');

        return response()->json([
            'message' => 'Document approved successfully',
            'document' => $document->load('verifier'),
        ]);
    }

    /**
     * Reject a specific document
     */
    public function rejectDocument(Request $request, CharityDocument $document)
    {
        $request->validate([
            'reason' => 'required|string|min:10|max:500',
        ]);

        $document->update([
            'verification_status' => 'rejected',
            'verified_by' => $request->user()->id,
            'verified_at' => now(),
            'rejection_reason' => $request->input('reason'),
            'admin_notes' => $request->input('notes'),
        ]);

        // Set charity back to pending if it was approved
        if ($document->charity->verification_status === 'approved') {
            $document->charity->update([
                'verification_status' => 'pending',
            ]);
        }

        // Send notification to charity owner
        $this->notificationService->sendDocumentVerificationStatus($document, 'rejected');

        return response()->json([
            'message' => 'Document rejected successfully',
            'document' => $document->load('verifier'),
        ]);
    }

    /**
     * Reset document status to pending (for resubmission)
     */
    public function resetDocument(Request $request, CharityDocument $document)
    {
        $document->update([
            'verification_status' => 'pending',
            'verified_by' => null,
            'verified_at' => null,
            'rejection_reason' => null,
            'admin_notes' => null,
        ]);

        return response()->json([
            'message' => 'Document status reset to pending',
            'document' => $document,
        ]);
    }

    /**
     * Get document verification statistics for a charity
     */
    public function getDocumentStats(Charity $charity)
    {
        $documents = $charity->documents;
        
        return response()->json([
            'total' => $documents->count(),
            'pending' => $documents->where('verification_status', 'pending')->count(),
            'approved' => $documents->where('verification_status', 'approved')->count(),
            'rejected' => $documents->where('verification_status', 'rejected')->count(),
            'all_approved' => $documents->count() > 0 && $documents->where('verification_status', 'approved')->count() === $documents->count(),
        ]);
    }

    /**
     * Check if all documents are approved and auto-approve charity
     */
    protected function checkAndApproveCharity(Charity $charity)
    {
        $documents = $charity->documents;
        
        // Need at least one document
        if ($documents->count() === 0) {
            return false;
        }

        // Check if all documents are approved
        $allApproved = $documents->every(function ($doc) {
            return $doc->verification_status === 'approved';
        });

        if ($allApproved && $charity->verification_status !== 'approved') {
            $charity->update([
                'verification_status' => 'approved',
                'verified_at' => now(),
                'verification_notes' => 'All documents verified and approved',
            ]);

            // Send charity approval notification
            $this->notificationService->sendVerificationStatus($charity, 'approved');

            return true;
        }

        return false;
    }
}
