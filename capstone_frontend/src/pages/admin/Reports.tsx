import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Eye, CheckCircle, XCircle, Clock, Search, Filter, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

interface Report {
  id: number;
  reporter: {
    id: number;
    name: string;
    email: string;
  };
  reporter_role: string;
  reported_entity_type: string;
  reported_entity_id: number;
  reason: string;
  description: string;
  evidence_path?: string;
  status: string;
  admin_notes?: string;
  reviewed_by?: number;
  reviewed_at?: string;
  action_taken?: string;
  created_at: string;
}

interface ReportStatistics {
  total: number;
  pending: number;
  under_review: number;
  resolved: number;
  dismissed: number;
  by_reason: Array<{ reason: string; count: number }>;
  recent: Report[];
}

export default function AdminReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [statistics, setStatistics] = useState<ReportStatistics | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [entityTypeFilter, setEntityTypeFilter] = useState("all");
  const [reasonFilter, setReasonFilter] = useState("all");

  // Review form state
  const [reviewStatus, setReviewStatus] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    fetchReports();
    fetchStatistics();
  }, [statusFilter, entityTypeFilter, reasonFilter, searchTerm]);

  const apiBase = import.meta.env.VITE_API_URL;
  const getToken = () => localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');

  const fetchReports = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (entityTypeFilter !== "all") params.append("entity_type", entityTypeFilter);
      if (reasonFilter !== "all") params.append("reason", reasonFilter);
      if (searchTerm) params.append("search", searchTerm);

      const res = await fetch(`${apiBase}/admin/reports?${params.toString()}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Failed to fetch reports');
      const data = await res.json();
      setReports(Array.isArray(data) ? data : data?.data || []);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
      toast.error("Failed to fetch reports");
      setReports([]); // Ensure reports is always an array
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const res = await fetch(`${apiBase}/admin/reports/statistics`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) return;
      setStatistics(await res.json());
    } catch (error) {
      console.error("Failed to fetch statistics:", error);
    }
  };

  const handleViewDetails = async (report: Report) => {
    try {
      const res = await fetch(`${apiBase}/admin/reports/${report.id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Failed to fetch report');
      const data = await res.json();
      setSelectedReport(data.report || data);
      setIsDetailsOpen(true);
    } catch (error) {
      toast.error("Failed to fetch report details");
    }
  };

  const handleReviewReport = (report: Report) => {
    setSelectedReport(report);
    setReviewStatus("");
    setActionTaken("");
    setAdminNotes("");
    setIsReviewOpen(true);
  };

  const submitReview = async () => {
    if (!selectedReport || !reviewStatus) {
      toast.error("Please select a status");
      return;
    }

    try {
      const res = await fetch(`${apiBase}/admin/reports/${selectedReport.id}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          status: reviewStatus,
          action_taken: actionTaken,
          admin_notes: adminNotes,
        }),
      });
      if (!res.ok) throw new Error('Review failed');

      toast.success("Report reviewed successfully");
      setIsReviewOpen(false);
      fetchReports();
      fetchStatistics();
    } catch (error) {
      toast.error("Failed to review report");
    }
  };

  const deleteReport = async (reportId: number) => {
    if (!confirm("Are you sure you want to delete this report?")) return;

    try {
      const res = await fetch(`${apiBase}/admin/reports/${reportId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Delete failed');
      toast.success("Report deleted successfully");
      fetchReports();
      fetchStatistics();
    } catch (error) {
      toast.error("Failed to delete report");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "destructive",
      under_review: "default",
      resolved: "default",
      dismissed: "secondary",
    } as const;

    const colors = {
      pending: "bg-red-100 text-red-800",
      under_review: "bg-yellow-100 text-yellow-800",
      resolved: "bg-green-100 text-green-800",
      dismissed: "bg-gray-100 text-gray-800",
    };

    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  const formatReason = (reason: string) => {
    return reason.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-72 mt-2" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-28" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-6 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 w-full bg-muted/40 animate-pulse rounded mb-3" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div 
        className="flex justify-between items-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-400 dark:to-orange-400 bg-clip-text text-transparent">Reports Management</h1>
          <p className="text-muted-foreground mt-1">Review and manage user reports</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { setLoading(true); fetchReports(); fetchStatistics(); }} className="transition-all duration-200 hover:scale-105 hover:bg-red-50 dark:hover:bg-red-950 hover:border-red-300 dark:hover:border-red-700 active:scale-95">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </motion.div>

      {/* Statistics Cards */}
      {statistics && (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-5 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="transition-all duration-300 hover:shadow-xl border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:scale-[1.02] cursor-pointer">
            <CardHeader className="pb-2 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-950/50 dark:to-slate-950/50">
              <CardTitle className="text-sm font-medium text-gray-700">Total Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-gray-600 to-slate-600 dark:from-gray-400 dark:to-slate-400 bg-clip-text text-transparent">{statistics.total}</div>
            </CardContent>
          </Card>
          <Card className="transition-all duration-300 hover:shadow-xl border-red-100 dark:border-red-900 hover:border-red-300 dark:hover:border-red-700 hover:scale-[1.02] cursor-pointer">
            <CardHeader className="pb-2 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/50 dark:to-rose-950/50">
              <CardTitle className="text-sm font-medium text-red-700">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-red-600 to-rose-600 dark:from-red-400 dark:to-rose-400 bg-clip-text text-transparent">{statistics.pending}</div>
            </CardContent>
          </Card>
          <Card className="transition-all duration-300 hover:shadow-xl border-yellow-100 dark:border-yellow-900 hover:border-yellow-300 dark:hover:border-yellow-700 hover:scale-[1.02] cursor-pointer">
            <CardHeader className="pb-2 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/50 dark:to-amber-950/50">
              <CardTitle className="text-sm font-medium text-yellow-700">Under Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 dark:from-yellow-400 dark:to-amber-400 bg-clip-text text-transparent">{statistics.under_review}</div>
            </CardContent>
          </Card>
          <Card className="transition-all duration-300 hover:shadow-xl border-green-100 dark:border-green-900 hover:border-green-300 dark:hover:border-green-700 hover:scale-[1.02] cursor-pointer">
            <CardHeader className="pb-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50">
              <CardTitle className="text-sm font-medium text-green-700">Resolved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">{statistics.resolved}</div>
            </CardContent>
          </Card>
          <Card className="transition-all duration-300 hover:shadow-xl border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:scale-[1.02] cursor-pointer">
            <CardHeader className="pb-2 bg-gradient-to-r from-gray-50 to-zinc-50 dark:from-gray-950/50 dark:to-zinc-950/50">
              <CardTitle className="text-sm font-medium text-gray-700">Dismissed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-gray-600 to-zinc-600 dark:from-gray-400 dark:to-zinc-400 bg-clip-text text-transparent">{statistics.dismissed}</div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
      <Card className="transition-all duration-300 hover:shadow-lg border-orange-100 dark:border-orange-900 dark:bg-gray-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by entity type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="charity">Charity</SelectItem>
                <SelectItem value="campaign">Campaign</SelectItem>
                <SelectItem value="donation">Donation</SelectItem>
              </SelectContent>
            </Select>
            <Select value={reasonFilter} onValueChange={setReasonFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reasons</SelectItem>
                <SelectItem value="fraud">Fraud</SelectItem>
                <SelectItem value="fake_proof">Fake Proof</SelectItem>
                <SelectItem value="inappropriate_content">Inappropriate Content</SelectItem>
                <SelectItem value="scam">Scam</SelectItem>
                <SelectItem value="fake_charity">Fake Charity</SelectItem>
                <SelectItem value="misuse_of_funds">Misuse of Funds</SelectItem>
                <SelectItem value="spam">Spam</SelectItem>
                <SelectItem value="harassment">Harassment</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      </motion.div>

      {/* Reports List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
      <Card className="transition-all duration-300 hover:shadow-xl border-red-100 dark:border-red-900 dark:bg-gray-900/50">
        <CardHeader>
          <CardTitle>Reports ({(reports || []).length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(reports || []).map((report, index) => (
              <motion.div 
                key={report.id} 
                className="border rounded-lg p-4 space-y-3 transition-all duration-300 hover:bg-red-50/30 dark:hover:bg-red-950/20 hover:border-red-300 dark:hover:border-red-700 hover:shadow-md cursor-pointer dark:border-gray-800"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="font-medium">Report #{report.id}</span>
                      {getStatusBadge(report.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Reported by: {report.reporter.name} ({report.reporter_role})
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Reason:</span> {formatReason(report.reason)}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Entity:</span> {report.reported_entity_type} #{report.reported_entity_id}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(report)}
                      className="transition-all duration-200 hover:scale-105 hover:bg-blue-50 dark:hover:bg-blue-950"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    {report.status === "pending" && (
                      <Button
                        size="sm"
                        onClick={() => handleReviewReport(report)}
                        className="transition-all duration-200 hover:scale-105 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Review
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteReport(report.id)}
                      className="transition-all duration-200 hover:scale-105"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
                <p className="text-sm bg-gray-50 p-2 rounded">
                  {report.description}
                </p>
                <div className="text-xs text-muted-foreground">
                  Submitted: {new Date(report.created_at).toLocaleString()}
                </div>
              </motion.div>
            ))}
            {(reports || []).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No reports found matching your filters.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      </motion.div>

      {/* Report Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
            <DialogDescription>
              Full details of report #{selectedReport?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Reporter</label>
                  <p className="text-sm">{selectedReport.reporter.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedReport.reporter.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedReport.status)}</div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <p className="text-sm mt-1 p-2 bg-gray-50 rounded">{selectedReport.description}</p>
              </div>
              {selectedReport.evidence_path && (
                <div>
                  <label className="text-sm font-medium">Evidence</label>
                  <p className="text-sm mt-1">
                    <a 
                      href={`/storage/${selectedReport.evidence_path}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View Evidence File
                    </a>
                  </p>
                </div>
              )}
              {selectedReport.admin_notes && (
                <div>
                  <label className="text-sm font-medium">Admin Notes</label>
                  <p className="text-sm mt-1 p-2 bg-blue-50 rounded">{selectedReport.admin_notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Review Report Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Report</DialogTitle>
            <DialogDescription>
              Take action on report #{selectedReport?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={reviewStatus} onValueChange={setReviewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Action Taken</label>
              <Select value={actionTaken} onValueChange={setActionTaken}>
                <SelectTrigger>
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Action</SelectItem>
                  <SelectItem value="warned">Warned User</SelectItem>
                  <SelectItem value="suspended">Suspended Account</SelectItem>
                  <SelectItem value="deleted">Deleted Content</SelectItem>
                  <SelectItem value="contacted">Contacted User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Admin Notes</label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add notes about your review and action taken..."
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsReviewOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submitReview}>
                Submit Review
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
