<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\{Charity, CharityDocument, User};
use App\Services\SecurityService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ComplianceController extends Controller
{
    protected $securityService;

    public function __construct(SecurityService $securityService)
    {
        $this->securityService = $securityService;
    }

    public function generateReport()
    {
        return response()->json($this->securityService->generateComplianceReport());
    }

    public function complianceStatus()
    {
        $status = $this->securityService->checkComplianceStatus();

        return response()->json([
            'compliance_issues' => $status,
            'generated_at' => now()->toISOString(),
        ]);
    }

    public function charitiesByStatus()
    {
        $statusCounts = Charity::selectRaw('verification_status, COUNT(*) as count')
            ->groupBy('verification_status')
            ->get()
            ->pluck('count', 'verification_status');

        return response()->json([
            'status_breakdown' => $statusCounts,
            'total_charities' => Charity::count(),
        ]);
    }

    // --- Admin Audits (Demo implementation using existing charities) ---
    public function audits(Request $request)
    {
        $status = $request->input('status'); // pending|approved|rejected|all
        $search = $request->input('search');

        $charities = Charity::with('owner')->latest()->get();

        // Synthesize periodic audits per charity (current quarter)
        $period = 'Q' . ceil(now()->month / 3) . ' ' . now()->year;

        $items = $charities->map(function($c) use ($period) {
            // Map charity verification to an audit demo status
            $mapped = match($c->verification_status){
                'approved' => 'approved',
                'rejected' => 'rejected',
                default => 'pending',
            };
            return [
                'id' => (int) ($c->id * 1000 + now()->format('z')), // stable-ish demo id
                'charity_id' => $c->id,
                'charity_name' => $c->name,
                'period' => $period,
                'status' => $mapped,
                'notes' => null,
                'created_at' => $c->created_at?->toISOString() ?? now()->toISOString(),
                'files' => [
                    ['label' => 'Financial Report', 'url' => url('/storage/demo/financial_report.pdf')],
                    ['label' => 'Compliance Checklist', 'url' => url('/storage/demo/compliance_checklist.pdf')],
                ],
            ];
        })->values();

        if ($status && $status !== 'all') {
            $items = $items->filter(fn($i) => $i['status'] === $status)->values();
        }
        if ($search) {
            $s = Str::lower($search);
            $items = $items->filter(fn($i) => Str::contains(Str::lower($i['charity_name']), $s) || Str::contains(Str::lower($i['period']), $s))->values();
        }

        return response()->json($items);
    }

    public function updateAudit(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:approved,rejected',
            'notes' => 'nullable|string|max:1000',
        ]);

        // Demo implementation: no DB storage. Return echoed payload.
        return response()->json([
            'message' => 'Audit updated (demo)',
            'id' => (int) $id,
            'status' => $validated['status'],
            'notes' => $validated['notes'] ?? null,
            'updated_at' => now()->toISOString(),
        ]);
    }

    public function exportAudits(Request $request)
    {
        $items = $this->audits($request)->getData(true);

        $filename = 'audit_summary_' . now()->format('Y-m-d_His') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"$filename\"",
        ];

        $callback = function() use ($items) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['ID','Charity','Period','Status','Created At']);
            foreach ($items as $row) {
                fputcsv($file, [
                    $row['id'],
                    $row['charity_name'],
                    $row['period'],
                    $row['status'],
                    $row['created_at'],
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
