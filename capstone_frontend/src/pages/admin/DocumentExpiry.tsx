import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertTriangle, Calendar, Clock, FileText, Eye, Edit, Filter } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

interface ExpiringDocument {
  id: number;
  doc_type: string;
  expiry_date: string;
  days_until_expiry: number;
  charity: {
    id: number;
    name: string;
    contact_email: string;
  };
}

interface ExpiredDocument {
  id: number;
  doc_type: string;
  expiry_date: string;
  days_overdue: number;
  charity: {
    id: number;
    name: string;
    contact_email: string;
    verification_status: string;
  };
}

interface ExpiryStatistics {
  expiring_in_7_days: number;
  expiring_in_30_days: number;
  expired: number;
  charities_with_expired_docs: number;
}

export default function AdminDocumentExpiry() {
  const [expiringDocuments, setExpiringDocuments] = useState<ExpiringDocument[]>([]);
  const [expiredDocuments, setExpiredDocuments] = useState<ExpiredDocument[]>([]);
  const [statistics, setStatistics] = useState<ExpiryStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("expiring");
  const [daysFilter, setDaysFilter] = useState("30");
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchData();
  }, [daysFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');

      const authHeaders = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};

      // Fetch expiring documents
      const expiringResponse = await axios.get(
        `${API_URL}/admin/documents/expiring?days=${daysFilter}`,
        authHeaders
      );
      setExpiringDocuments(expiringResponse.data?.expiring_documents ?? []);

      // Fetch expired documents
      const expiredResponse = await axios.get(
        `${API_URL}/admin/documents/expired`,
        authHeaders
      );
      setExpiredDocuments(expiredResponse.data?.expired_documents ?? []);

      // Fetch statistics
      const statsResponse = await axios.get(
        `${API_URL}/admin/documents/expiry-statistics`,
        authHeaders
      );
      setStatistics(statsResponse.data ?? null);

    } catch (error) {
      toast.error("Failed to fetch document expiry data");
    } finally {
      setLoading(false);
    }
  };

  const updateDocumentExpiry = async (documentId: number, expires: boolean, expiryDate?: string) => {
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const authHeaders = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      await axios.patch(
        `${API_URL}/admin/documents/${documentId}/expiry`,
        {
          expires,
          expiry_date: expiryDate,
        },
        authHeaders
      );
      toast.success("Document expiry updated successfully");
      fetchData();
    } catch (error) {
      toast.error("Failed to update document expiry");
    }
  };

  const formatDocType = (docType: string) => {
    return docType.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  const getUrgencyBadge = (days: number, isExpired: boolean = false) => {
    if (isExpired) {
      return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
    }
    if (days <= 7) {
      return <Badge className="bg-red-100 text-red-800">Critical</Badge>;
    }
    if (days <= 14) {
      return <Badge className="bg-orange-100 text-orange-800">Urgent</Badge>;
    }
    if (days <= 30) {
      return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-800">Notice</Badge>;
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
          <h1 className="text-3xl font-bold">Document Expiry Management</h1>
          <p className="text-muted-foreground">Monitor and manage charity document expirations</p>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Expiring in 7 Days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{statistics.expiring_in_7_days}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Expiring in 30 Days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{statistics.expiring_in_30_days}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Already Expired</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{statistics.expired}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Affected Charities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{statistics.charities_with_expired_docs}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="flex gap-2">
              <Button
                variant={activeTab === "expiring" ? "default" : "outline"}
                onClick={() => setActiveTab("expiring")}
              >
                <Clock className="h-4 w-4 mr-2" />
                Expiring Documents
              </Button>
              <Button
                variant={activeTab === "expired" ? "default" : "outline"}
                onClick={() => setActiveTab("expired")}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Expired Documents
              </Button>
            </div>
            {activeTab === "expiring" && (
              <Select value={daysFilter} onValueChange={setDaysFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Next 7 days</SelectItem>
                  <SelectItem value="14">Next 14 days</SelectItem>
                  <SelectItem value="30">Next 30 days</SelectItem>
                  <SelectItem value="60">Next 60 days</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {activeTab === "expiring" ? "Expiring Documents" : "Expired Documents"} 
            ({activeTab === "expiring" ? (expiringDocuments?.length ?? 0) : (expiredDocuments?.length ?? 0)})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeTab === "expiring" ? (
              (expiringDocuments ?? []).map((document) => (
                <div key={document.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">{formatDocType(document.doc_type)}</span>
                        {getUrgencyBadge(document.days_until_expiry)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <strong>Charity:</strong> {document.charity.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong>Contact:</strong> {document.charity.contact_email}
                      </p>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Expires: {new Date(document.expiry_date).toLocaleDateString()}</span>
                        <span className="text-yellow-600 font-medium">
                          ({document.days_until_expiry} days remaining)
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/admin/charities/${document.charity.id}`, '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Charity
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              (expiredDocuments ?? []).map((document) => (
                <div key={document.id} className="border border-red-200 rounded-lg p-4 space-y-3 bg-red-50">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-red-500" />
                        <span className="font-medium">{formatDocType(document.doc_type)}</span>
                        {getUrgencyBadge(0, true)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <strong>Charity:</strong> {document.charity.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong>Contact:</strong> {document.charity.contact_email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong>Status:</strong> 
                        <Badge className={document.charity.verification_status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {document.charity.verification_status}
                        </Badge>
                      </p>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-red-500" />
                        <span>Expired: {new Date(document.expiry_date).toLocaleDateString()}</span>
                        <span className="text-red-600 font-medium">
                          ({document.days_overdue} days overdue)
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/admin/charities/${document.charity.id}`, '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Charity
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {((activeTab === "expiring" && (expiringDocuments?.length ?? 0) === 0) || 
              (activeTab === "expired" && (expiredDocuments?.length ?? 0) === 0)) && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No {activeTab} documents found.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Recommendations */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">Recommended Actions</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <ul className="space-y-2 text-sm">
            <li>• Contact charities with documents expiring in 7 days immediately</li>
            <li>• Send renewal reminders to charities with documents expiring in 30 days</li>
            <li>• Review verification status of charities with expired documents</li>
            <li>• Consider suspending charities with critical expired documents</li>
            <li>• Set up automated email reminders for document renewals</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
