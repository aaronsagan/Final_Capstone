import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Building2, Mail, Calendar, MapPin, Phone, FileText, CheckCircle, User, Globe, Download, ExternalLink, TrendingUp, DollarSign, CreditCard, Eye, Users, XCircle, Clock, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Document {
  id: number;
  doc_type: string;
  file_path: string;
  uploaded_at: string;
  verification_status: 'pending' | 'approved' | 'rejected';
  verified_by?: {
    id: number;
    name: string;
  };
  verified_at?: string;
  rejection_reason?: string;
  admin_notes?: string;
}

interface Campaign {
  id: number;
  title: string;
  goal_amount: number | null;
  current_amount: number | null;
  status: string;
  created_at: string;
}

interface CharityDetail {
  id: number;
  name: string;
  contact_email: string;
  contact_phone?: string;
  address?: string;
  city?: string;
  province?: string;
  description?: string;
  mission?: string;
  vision?: string;
  website?: string;
  reg_no?: string;
  tax_id?: string;
  bank_name?: string;
  bank_account?: string;
  verification_status: string;
  created_at: string;
  verified_at?: string;
  owner?: {
    id: number;
    name: string;
    email: string;
  };
  total_campaigns?: number;
  total_raised?: number;
  active_campaigns?: number;
  total_donors?: number;
}

interface CharityDetailModalProps {
  charity: CharityDetail | null;
  open: boolean;
  onClose: () => void;
  onAction?: (action: string, charityId: number) => void;
}

export const CharityDetailModal = ({ charity, open, onClose, onAction }: CharityDetailModalProps) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const [rejectingDoc, setRejectingDoc] = useState<Document | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processingDoc, setProcessingDoc] = useState<number | null>(null);

  useEffect(() => {
    if (open && charity) {
      fetchDocuments();
      fetchCampaigns();
    }
  }, [open, charity]);

  const fetchDocuments = async () => {
    if (!charity) return;
    setLoadingDocuments(true);
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/charities/${charity.id}/documents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDocuments(Array.isArray(data) ? data : data?.data || []);
      } else if (response.status === 404) {
        // Endpoint not implemented yet, silently set empty array
        setDocuments([]);
      }
    } catch (error) {
      // Network error or endpoint not available, silently set empty array
      setDocuments([]);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const fetchCampaigns = async () => {
    if (!charity) return;
    setLoadingCampaigns(true);
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/charities/${charity.id}/campaigns`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCampaigns(Array.isArray(data) ? data : data?.data || []);
      } else if (response.status === 404) {
        // Endpoint not implemented yet, silently set empty array
        setCampaigns([]);
      }
    } catch (error) {
      // Network error or endpoint not available, silently set empty array
      setCampaigns([]);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const handleApproveDocument = async (doc: Document) => {
    setProcessingDoc(doc.id);
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/documents/${doc.id}/approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        toast.success('Document approved successfully');
        fetchDocuments(); // Refresh documents
      } else {
        toast.error('Failed to approve document');
      }
    } catch (error) {
      toast.error('Failed to approve document');
    } finally {
      setProcessingDoc(null);
    }
  };

  const handleRejectDocument = async () => {
    if (!rejectingDoc || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    setProcessingDoc(rejectingDoc.id);
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/documents/${rejectingDoc.id}/reject`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: rejectionReason })
      });
      if (response.ok) {
        toast.success('Document rejected successfully');
        setRejectingDoc(null);
        setRejectionReason('');
        fetchDocuments(); // Refresh documents
      } else {
        toast.error('Failed to reject document');
      }
    } catch (error) {
      toast.error('Failed to reject document');
    } finally {
      setProcessingDoc(null);
    }
  };

  const handleDownloadDocument = async (doc: Document) => {
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/documents/${doc.id}/download`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const fileName = doc.file_path.split('/').pop() || 'document';
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Document downloaded');
      } else {
        toast.error('Failed to download document');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download document');
    }
  };

  const handleViewDocument = (doc: Document) => {
    const url = `${import.meta.env.VITE_API_URL}/storage/${doc.file_path}`;
    window.open(url, '_blank');
  };

  const getDocTypeLabel = (docType: string) => {
    const labels: Record<string, string> = {
      registration: 'Registration Certificate',
      tax: 'Tax Exemption',
      bylaws: 'Bylaws',
      audit: 'Audit Report',
      other: 'Other Document'
    };
    return labels[docType] || docType;
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    };
    const icons = {
      pending: Clock,
      approved: CheckCircle,
      rejected: XCircle
    };
    const Icon = icons[status as keyof typeof icons] || Clock;
    return (
      <Badge className={styles[status as keyof typeof styles] || styles.pending}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (!charity) return null;

  const statusColors = {
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    verified: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto" aria-describedby="charity-detail-description">
        <DialogHeader>
          <DialogTitle className="text-2xl">Charity Details</DialogTitle>
          <DialogDescription id="charity-detail-description">View comprehensive information about this charity organization</DialogDescription>
        </DialogHeader>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Header Section */}
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold">{charity.name}</h3>
              <p className="text-muted-foreground">{charity.contact_email}</p>
              <div className="flex gap-2 mt-2">
                <Badge className={statusColors[charity.verification_status as keyof typeof statusColors] || ""}>{charity.verification_status}</Badge>
                {charity.total_campaigns !== undefined && <Badge variant="outline">{charity.total_campaigns} Campaigns</Badge>}
            {charity.total_donors !== undefined && <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{charity.total_donors} Donors</Badge>}
              </div>
            </div>
          </div>

          <Separator />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info">Information</TabsTrigger>
              <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
              <TabsTrigger value="campaigns">Campaigns ({campaigns.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4 mt-4">
          {/* Description */}
          {charity.description && (
            <div className="p-4 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900/20 dark:to-slate-800/10 border border-slate-200/50 dark:border-slate-700/20">
              <p className="text-xs text-muted-foreground mb-1">About</p>
              <p className="text-sm">{charity.description}</p>
            </div>
          )}

          {charity.mission && (
            <div className="p-4 rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-900/20 dark:to-indigo-800/10 border border-indigo-200/50 dark:border-indigo-700/20">
              <p className="text-xs text-muted-foreground mb-1">Mission</p>
              <p className="text-sm">{charity.mission}</p>
            </div>
          )}

          {/* Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/10 dark:to-blue-800/5 border border-blue-200/50 dark:border-blue-700/20">
              <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Contact Email</p>
                <p className="text-sm font-medium">{charity.contact_email}</p>
              </div>
            </div>

            {charity.contact_phone && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/10 dark:to-emerald-800/5 border border-emerald-200/50 dark:border-emerald-700/20">
                <Phone className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm font-medium">{charity.contact_phone}</p>
                </div>
              </div>
            )}

            {charity.address && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/10 dark:to-purple-800/5 border border-purple-200/50 dark:border-purple-700/20">
                <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="text-sm font-medium">{charity.address}</p>
                  {(charity.city || charity.province) && (
                    <p className="text-xs text-muted-foreground">{[charity.city, charity.province].filter(Boolean).join(', ')}</p>
                  )}
                </div>
              </div>
            )}

            {charity.website && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-br from-pink-50 to-pink-100/50 dark:from-pink-900/10 dark:to-pink-800/5 border border-pink-200/50 dark:border-pink-700/20">
                <Globe className="h-5 w-5 text-pink-600 dark:text-pink-400 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Website</p>
                  <a href={charity.website} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline">{charity.website}</a>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/10 dark:to-amber-800/5 border border-amber-200/50 dark:border-amber-700/20">
              <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Registered</p>
                <p className="text-sm font-medium">{new Date(charity.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            {charity.verified_at && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/10 dark:to-green-800/5 border border-green-200/50 dark:border-green-700/20">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Verified</p>
                  <p className="text-sm font-medium">{new Date(charity.verified_at).toLocaleDateString()}</p>
                </div>
              </div>
            )}

            {charity.total_raised !== undefined && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-br from-cyan-50 to-cyan-100/50 dark:from-cyan-900/10 dark:to-cyan-800/5 border border-cyan-200/50 dark:border-cyan-700/20">
                <FileText className="h-5 w-5 text-cyan-600 dark:text-cyan-400 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Raised</p>
                  <p className="text-sm font-medium">₱{(charity.total_raised ?? 0).toLocaleString()}</p>
                </div>
              </div>
            )}

            {charity.owner && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-900/10 dark:to-violet-800/5 border border-violet-200/50 dark:border-violet-700/20">
                <User className="h-5 w-5 text-violet-600 dark:text-violet-400 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Owner</p>
                  <p className="text-sm font-medium">{charity.owner.name}</p>
                  <p className="text-xs text-muted-foreground">{charity.owner.email}</p>
                </div>
              </div>
            )}

            {charity.reg_no && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-900/10 dark:to-yellow-800/5 border border-yellow-200/50 dark:border-yellow-700/20">
                <FileText className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Registration Number</p>
                  <p className="text-sm font-medium">{charity.reg_no}</p>
                </div>
              </div>
            )}

            {charity.tax_id && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-900/10 dark:to-rose-800/5 border border-rose-200/50 dark:border-rose-700/20">
                <FileText className="h-5 w-5 text-rose-600 dark:text-rose-400 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Tax ID</p>
                  <p className="text-sm font-medium">{charity.tax_id}</p>
                </div>
              </div>
            )}

            {charity.bank_name && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-br from-sky-50 to-sky-100/50 dark:from-sky-900/10 dark:to-sky-800/5 border border-sky-200/50 dark:border-sky-700/20">
                <CreditCard className="h-5 w-5 text-sky-600 dark:text-sky-400 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Bank Details</p>
                  <p className="text-sm font-medium">{charity.bank_name}</p>
                  {charity.bank_account && (
                    <p className="text-xs text-muted-foreground mt-0.5">Account: {charity.bank_account}</p>
                  )}
                </div>
              </div>
            )}

            {charity.active_campaigns !== undefined && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-br from-lime-50 to-lime-100/50 dark:from-lime-900/10 dark:to-lime-800/5 border border-lime-200/50 dark:border-lime-700/20">
                <TrendingUp className="h-5 w-5 text-lime-600 dark:text-lime-400 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Active Campaigns</p>
                  <p className="text-sm font-medium">{charity.active_campaigns}</p>
                </div>
              </div>
            )}

            {charity.total_donors !== undefined && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-br from-fuchsia-50 to-fuchsia-100/50 dark:from-fuchsia-900/10 dark:to-fuchsia-800/5 border border-fuchsia-200/50 dark:border-fuchsia-700/20">
                <Users className="h-5 w-5 text-fuchsia-600 dark:text-fuchsia-400 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Donors</p>
                  <p className="text-sm font-medium">{charity.total_donors}</p>
                </div>
              </div>
            )}
          </div>
            </TabsContent>

            <TabsContent value="documents" className="mt-4">
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Uploaded Documents ({documents.length})
                </h4>
                {loadingDocuments ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4 border rounded-lg">No documents uploaded yet</p>
                ) : (
                  <ScrollArea className="h-[300px] rounded-lg border dark:bg-gray-900/20">
                    <div className="p-3 space-y-3">
                      {documents.map((doc) => (
                        <div key={doc.id} className="p-4 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900/20 dark:to-slate-800/10 border border-slate-200/50 dark:border-slate-700/20">
                          <div className="space-y-3">
                            {/* Document Header */}
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-primary" />
                                  <p className="text-sm font-medium">{getDocTypeLabel(doc.doc_type)}</p>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                                </p>
                              </div>
                              {getStatusBadge(doc.verification_status)}
                            </div>

                            {/* Verification Info */}
                            {doc.verified_by && (
                              <div className="text-xs text-muted-foreground bg-slate-100 dark:bg-slate-800/50 p-2 rounded">
                                <p>Verified by: <span className="font-medium">{doc.verified_by.name}</span></p>
                                <p>On: {new Date(doc.verified_at!).toLocaleString()}</p>
                              </div>
                            )}

                            {/* Rejection Reason */}
                            {doc.rejection_reason && (
                              <div className="text-xs bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-2 rounded">
                                <p className="font-medium text-red-800 dark:text-red-400 flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  Rejection Reason:
                                </p>
                                <p className="text-red-700 dark:text-red-300 mt-1">{doc.rejection_reason}</p>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-2 flex-wrap">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewDocument(doc)}
                                className="transition-all hover:scale-105"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadDocument(doc)}
                                className="transition-all hover:scale-105"
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Download
                              </Button>
                              
                              {/* Verification Actions */}
                              {doc.verification_status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleApproveDocument(doc)}
                                    disabled={processingDoc === doc.id}
                                    className="bg-green-600 hover:bg-green-700 transition-all hover:scale-105"
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => setRejectingDoc(doc)}
                                    disabled={processingDoc === doc.id}
                                    className="transition-all hover:scale-105"
                                  >
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Reject
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </TabsContent>

            <TabsContent value="campaigns" className="mt-4">
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Campaigns ({campaigns.length})
                </h4>
                {loadingCampaigns ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : campaigns.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4 border rounded-lg">No campaigns yet</p>
                ) : (
                  <ScrollArea className="h-[300px] rounded-lg border dark:bg-gray-900/20">
                    <div className="p-3 space-y-2">
                      {campaigns.map((campaign) => (
                        <div key={campaign.id} className="p-3 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900/20 dark:to-slate-800/10 border border-slate-200/50 dark:border-slate-700/20">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{campaign.title}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                                  {campaign.status}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  Created {new Date(campaign.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="mt-2 flex items-center gap-2 text-xs">
                                <span className="text-muted-foreground">Progress:</span>
                                <span className="font-medium">₱{(campaign.current_amount ?? 0).toLocaleString()} / ₱{(campaign.goal_amount ?? 0).toLocaleString()}</span>
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                  {(campaign.goal_amount && campaign.goal_amount > 0) ? (((campaign.current_amount ?? 0) / campaign.goal_amount) * 100).toFixed(1) : '0.0'}%
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <Separator />

          {/* Actions */}
          {onAction && (
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={onClose} className="dark:bg-gray-900/50">Close</Button>
              {charity.verification_status === 'pending' && (
                <>
                  <Button onClick={() => onAction('approve', charity.id)}>Approve</Button>
                  <Button variant="destructive" onClick={() => onAction('reject', charity.id)}>Reject</Button>
                </>
              )}
            </div>
          )}
        </motion.div>
      </DialogContent>

      {/* Rejection Dialog */}
      <Dialog open={!!rejectingDoc} onOpenChange={(open) => !open && setRejectingDoc(null)}>
        <DialogContent className="sm:max-w-md" aria-describedby="reject-document-description">
          <DialogHeader>
            <DialogTitle>Reject Document</DialogTitle>
            <DialogDescription id="reject-document-description">
              Provide a reason for rejecting this document. The charity admin will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Please explain why this document is being rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Minimum 10 characters required
              </p>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setRejectingDoc(null);
                setRejectionReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectDocument}
              disabled={rejectionReason.trim().length < 10 || processingDoc !== null}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject Document
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};
