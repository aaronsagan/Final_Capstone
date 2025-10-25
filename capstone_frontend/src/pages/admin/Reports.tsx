import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Eye, CheckCircle, XCircle, Clock, Search, Filter, RefreshCw, Ban, ShieldAlert, UserX, FileText, History } from "lucide-react";
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
  reported_user?: {
    id: number;
    name: string;
    email: string;
    role: string;
    account_status: string;
    created_at: string;
    previous_reports_count?: number;
    previous_suspensions_count?: number;
  };
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
  violation_level?: string;
  suspension_duration?: number;
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
  const [violationLevel, setViolationLevel] = useState("");
  const [suspensionDuration, setSuspensionDuration] = useState("");
  const [isSuspensionOpen, setIsSuspensionOpen] = useState(false);

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
    setViolationLevel("");
    setSuspensionDuration("");
    setIsReviewOpen(true);
  };

  const handleSuspendUser = (report: Report) => {
    setSelectedReport(report);
    setViolationLevel("");
    setSuspensionDuration("");
    setAdminNotes("");
    setIsSuspensionOpen(true);
  };

  const submitSuspension = async () => {
    if (!selectedReport || !violationLevel || !suspensionDuration) {
      toast.error("Please select violation level and suspension duration");
      return;
    }

    try {
      const res = await fetch(`${apiBase}/admin/reports/${selectedReport.id}/suspend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          reported_user_id: selectedReport.reported_user?.id,
          violation_level: violationLevel,
          suspension_duration: suspensionDuration,
          reason: selectedReport.reason,
          admin_notes: adminNotes,
        }),
      });
      if (!res.ok) throw new Error('Suspension failed');

      toast.success("User suspended successfully");
      setIsSuspensionOpen(false);
      fetchReports();
      fetchStatistics();
    } catch (error) {
      toast.error("Failed to suspend user");
    }
  };

  const dismissReport = async (reportId: number) => {
    if (!confirm("Are you sure you want to dismiss this report?")) return;

    try {
      const res = await fetch(`${apiBase}/admin/reports/${reportId}/dismiss`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          admin_notes: "Report dismissed - insufficient evidence or no violation found"
        }),
      });
      if (!res.ok) throw new Error('Dismiss failed');
      toast.success("Report dismissed successfully");
      fetchReports();
      fetchStatistics();
    } catch (error) {
      toast.error("Failed to dismiss report");
    }
  };

  const getViolationLevelBadge = (level: string) => {
    const colors = {
      minor: "bg-yellow-100 text-yellow-800 border-yellow-300",
      moderate: "bg-orange-100 text-orange-800 border-orange-300",
      severe: "bg-red-100 text-red-800 border-red-300",
    };
    const icons = {
      minor: "🟡",
      moderate: "🟠",
      severe: "🔴",
    };
    return (
      <Badge className={colors[level as keyof typeof colors]}>
        {icons[level as keyof typeof icons]} {level.toUpperCase()}
      </Badge>
    );
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
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleSuspendUser(report)}
                          className="transition-all duration-200 hover:scale-105 bg-red-600 hover:bg-red-700"
                        >
                          <Ban className="h-4 w-4 mr-1" />
                          Suspend
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => dismissReport(report.id)}
                          className="transition-all duration-200 hover:scale-105"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Dismiss
                        </Button>
                      </>
                    )}
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Report Details #{selectedReport?.id}
            </DialogTitle>
            <DialogDescription>
              Complete information about this report
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-6">
              {/* Report Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <label className="text-sm font-medium">Current Status</label>
                  <div className="mt-1">{getStatusBadge(selectedReport.status)}</div>
                </div>
                {selectedReport.violation_level && (
                  <div>
                    <label className="text-sm font-medium">Violation Level</label>
                    <div className="mt-1">{getViolationLevelBadge(selectedReport.violation_level)}</div>
                  </div>
                )}
              </div>

              {/* Reported User Info */}
              {selectedReport.reported_user && (
                <Card className="border-red-200 dark:border-red-900">
                  <CardHeader className="pb-3 bg-red-50 dark:bg-red-950/20">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <UserX className="h-4 w-4" />
                      Reported User Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Name</label>
                        <p className="text-sm font-medium">{selectedReport.reported_user.name}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Email</label>
                        <p className="text-sm">{selectedReport.reported_user.email}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Role</label>
                        <Badge variant="outline">{selectedReport.reported_user.role}</Badge>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Account Status</label>
                        <Badge variant={selectedReport.reported_user.account_status === 'active' ? 'default' : 'destructive'}>
                          {selectedReport.reported_user.account_status}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Previous Reports</label>
                        <p className="text-sm font-semibold text-orange-600">{selectedReport.reported_user.previous_reports_count || 0}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Previous Suspensions</label>
                        <p className="text-sm font-semibold text-red-600">{selectedReport.reported_user.previous_suspensions_count || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Reporter Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Reported By</label>
                  <p className="text-sm">{selectedReport.reporter.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedReport.reporter.email}</p>
                  <Badge variant="secondary" className="mt-1">{selectedReport.reporter_role}</Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">Report Date</label>
                  <p className="text-sm">{new Date(selectedReport.created_at).toLocaleString()}</p>
                </div>
              </div>

              {/* Report Details */}
              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Reason: {formatReason(selectedReport.reason)}
                </label>
                <p className="text-sm mt-2 p-3 bg-red-50 dark:bg-red-950/20 rounded border border-red-200 dark:border-red-900">
                  {selectedReport.description}
                </p>
              </div>

              {selectedReport.evidence_path && (
                <div>
                  <label className="text-sm font-medium">Evidence</label>
                  <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-900">
                    <a 
                      href={`/storage/${selectedReport.evidence_path}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      View Evidence File
                    </a>
                  </div>
                </div>
              )}

              {selectedReport.admin_notes && (
                <div>
                  <label className="text-sm font-medium">Admin Notes</label>
                  <p className="text-sm mt-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-900">
                    {selectedReport.admin_notes}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              {selectedReport.status === "pending" && (
                <div className="flex gap-2 justify-end pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDetailsOpen(false);
                      dismissReport(selectedReport.id);
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Dismiss Report
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setIsDetailsOpen(false);
                      handleSuspendUser(selectedReport);
                    }}
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Suspend User
                  </Button>
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

      {/* Suspension Dialog */}
      <Dialog open={isSuspensionOpen} onOpenChange={setIsSuspensionOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Ban className="h-5 w-5" />
              Suspend User Account
            </DialogTitle>
            <DialogDescription>
              Review violation and assign suspension duration for report #{selectedReport?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-6">
              {/* Reported User Summary */}
              {selectedReport.reported_user && (
                <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{selectedReport.reported_user.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedReport.reported_user.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Previous Issues</p>
                      <p className="text-sm">
                        <span className="font-semibold text-orange-600">{selectedReport.reported_user.previous_reports_count || 0}</span> reports, 
                        <span className="font-semibold text-red-600 ml-1">{selectedReport.reported_user.previous_suspensions_count || 0}</span> suspensions
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Violation Reason */}
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
                <p className="text-sm font-medium mb-1">Report Reason:</p>
                <p className="text-sm text-red-600 font-semibold">{formatReason(selectedReport.reason)}</p>
              </div>

              {/* Violation Level Selection */}
              <div>
                <label className="text-sm font-medium flex items-center gap-2 mb-2">
                  <ShieldAlert className="h-4 w-4" />
                  Violation Level
                </label>
                <Select value={violationLevel} onValueChange={setViolationLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select violation severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minor">
                      <div className="flex items-center gap-2">
                        <span>🟡</span>
                        <div>
                          <p className="font-medium">Minor Violation</p>
                          <p className="text-xs text-muted-foreground">Spam, inappropriate language, repeated unsolicited messages</p>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="moderate">
                      <div className="flex items-center gap-2">
                        <span>🟠</span>
                        <div>
                          <p className="font-medium">Moderate Violation</p>
                          <p className="text-xs text-muted-foreground">Fake proof, misleading content, minor fund misuse</p>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="severe">
                      <div className="flex items-center gap-2">
                        <span>🔴</span>
                        <div>
                          <p className="font-medium">Severe Violation</p>
                          <p className="text-xs text-muted-foreground">Fraud, scam, fake charity, repeated offenses, harassment</p>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Suspension Duration */}
              <div>
                <label className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4" />
                  Suspension Duration
                </label>
                <Select value={suspensionDuration} onValueChange={setSuspensionDuration}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select suspension period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 Days (Minor - Warning)</SelectItem>
                    <SelectItem value="5">5 Days (Moderate)</SelectItem>
                    <SelectItem value="7">7 Days (Moderate)</SelectItem>
                    <SelectItem value="10">10 Days (Severe)</SelectItem>
                    <SelectItem value="15">15 Days (Severe)</SelectItem>
                    <SelectItem value="30">30 Days (Very Severe)</SelectItem>
                    <SelectItem value="permanent">Permanent Ban</SelectItem>
                  </SelectContent>
                </Select>
                {suspensionDuration && suspensionDuration !== "permanent" && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Account will be automatically reactivated on: {new Date(Date.now() + parseInt(suspensionDuration) * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </p>
                )}
                {suspensionDuration === "permanent" && (
                  <p className="text-xs text-red-600 font-semibold mt-2">
                    ⚠️ This user will be permanently banned and cannot access the platform
                  </p>
                )}
              </div>

              {/* Violation Guidelines */}
              <Card className="border-blue-200 dark:border-blue-900">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Suspension Guidelines</CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-2">
                  <div className="flex gap-2">
                    <span>🟡</span>
                    <div>
                      <p className="font-medium">Minor (3 days):</p>
                      <p className="text-muted-foreground">First offense, spam, inappropriate language</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span>🟠</span>
                    <div>
                      <p className="font-medium">Moderate (5-7 days):</p>
                      <p className="text-muted-foreground">Fake proof, misleading content, minor fund misuse</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span>🔴</span>
                    <div>
                      <p className="font-medium">Severe (10-15 days or Permanent):</p>
                      <p className="text-muted-foreground">Fraud, scam, fake charity, repeated offenses, harassment</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Admin Notes */}
              <div>
                <label className="text-sm font-medium mb-2 block">Suspension Reason (will be sent to user)</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Explain the reason for suspension and any additional notes..."
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => setIsSuspensionOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={submitSuspension}
                  disabled={!violationLevel || !suspensionDuration}
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Confirm Suspension
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
