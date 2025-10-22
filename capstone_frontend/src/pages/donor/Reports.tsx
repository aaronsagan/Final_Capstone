import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Plus, Eye, Clock, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { reportsService } from "@/services/reports";

interface Report {
  id: number;
  reported_entity_type: string;
  reported_entity_id: number;
  reason: string;
  description: string;
  evidence_path?: string;
  status: string;
  admin_notes?: string;
  reviewed_at?: string;
  action_taken?: string;
  created_at: string;
}

export default function DonorReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form state (donor can only report a charity)
  const [formData, setFormData] = useState({
    charity_id: "", // selected charity id
    reason: "",
    description: "",
    evidence: null as File | null,
  });

  // Charity options for selection
  const [charities, setCharities] = useState<Array<{ id: number; name: string }>>([]);

  useEffect(() => {
    fetchMyReports();
  }, []);

  const fetchMyReports = async () => {
    try {
      const data = await reportsService.getMyReports();
      setReports(Array.isArray(data?.data) ? data.data : []);
    } catch (error) {
      toast.error("Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  const fetchCharities = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/charities`);
      if (!res.ok) return;
      const payload = await res.json();
      // Backend returns shape: { charities: { data: [...] }, filters: {...}, total: n }
      const list = Array.isArray(payload?.charities?.data)
        ? payload.charities.data
        : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
        ? payload
        : [];
      const mapped = list.map((c: any) => ({ id: c.id, name: c.name }));
      setCharities(mapped);
    } catch (e) {
      // silent fail; user can retry open dialog later
    }
  };

  const submitReport = async () => {
    if (!formData.charity_id || !formData.reason || !formData.description) {
      toast.error("Please select Charity, Reason, and provide Description");
      return;
    }

    try {
      const formDataToSend = new FormData();
      // Fixed type: charity
      formDataToSend.append("reported_entity_type", "charity");

      // Use selected charity id directly
      formDataToSend.append("reported_entity_id", String(formData.charity_id));

      formDataToSend.append("reason", formData.reason);
      formDataToSend.append("description", formData.description);
      if (formData.evidence) {
        formDataToSend.append("evidence", formData.evidence);
      }

      await reportsService.submitReport(formDataToSend);

      toast.success("Report submitted successfully");
      setIsCreateOpen(false);
      resetForm();
      fetchMyReports();
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || "Failed to submit report";
      toast.error(msg);
    }
  };

  const resetForm = () => {
    setFormData({
      charity_id: "",
      reason: "",
      description: "",
      evidence: null,
    });
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: "bg-red-100 text-red-800",
      under_review: "bg-yellow-100 text-yellow-800",
      resolved: "bg-green-100 text-green-800",
      dismissed: "bg-gray-100 text-gray-800",
    };

    const icons = {
      pending: Clock,
      under_review: Eye,
      resolved: CheckCircle,
      dismissed: XCircle,
    };

    const Icon = icons[status as keyof typeof icons] || Clock;
    const color = colors[status as keyof typeof colors] || colors.pending;

    return (
      <Badge className={color}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  const formatReason = (reason: string) => {
    return reason.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Reports</h1>
          <p className="text-muted-foreground">Track your submitted reports and their status</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Submit Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Submit a Report</DialogTitle>
              <DialogDescription>
                Report suspicious activities, fraud, or inappropriate content
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium">Charity</label>
                  <Select
                    value={formData.charity_id}
                    onOpenChange={(open) => { if (open && charities.length === 0) fetchCharities(); }}
                    onValueChange={(val) => setFormData({ ...formData, charity_id: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a charity to report" />
                    </SelectTrigger>
                    <SelectContent>
                      {charities.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name} (#{c.id})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Reason</label>
                <Select value={formData.reason} onValueChange={(value) => setFormData({ ...formData, reason: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
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
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide detailed information about the issue..."
                  rows={4}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Evidence (Optional)</label>
                <Input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => setFormData({ ...formData, evidence: e.target.files?.[0] || null })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Upload screenshots or documents as evidence (JPG, PNG, PDF - Max 5MB)
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={submitReport}>
                  Submit Report
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {(Array.isArray(reports) ? reports : []).map((report) => (
          <Card key={report.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <CardTitle className="text-lg">Report #{report.id}</CardTitle>
                    {getStatusBadge(report.status)}
                  </div>
                  <CardDescription>
                    {formatReason(report.reason)} • {report.reported_entity_type} #{report.reported_entity_id}
                  </CardDescription>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(report.created_at).toLocaleDateString()}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm bg-gray-50 p-3 rounded">
                {report.description}
              </p>
              {report.evidence_path && (
                <div>
                  <p className="text-sm font-medium">Evidence:</p>
                  <a 
                    href={`/storage/${report.evidence_path}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    View Evidence File
                  </a>
                </div>
              )}
              {report.admin_notes && (
                <div>
                  <p className="text-sm font-medium">Admin Response:</p>
                  <p className="text-sm bg-blue-50 p-3 rounded">
                    {report.admin_notes}
                  </p>
                  {report.action_taken && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Action taken: {report.action_taken.replace("_", " ")}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {(Array.isArray(reports) ? reports.length : 0) === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">You haven't submitted any reports yet.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Help keep our platform safe by reporting suspicious activities.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
