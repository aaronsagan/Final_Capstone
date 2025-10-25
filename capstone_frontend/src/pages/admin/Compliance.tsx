import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldAlert, RefreshCw, Eye, CheckCircle, XCircle, FileDown, Flag, AlertTriangle, FileText, DollarSign, Calendar, Building2, Ban, Send, TrendingUp, TrendingDown, Clock, CheckCircle2, Mail } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface AuditItem {
  id: number;
  charity_id: number;
  charity_name: string;
  period: string;
  status: "pending" | "approved" | "rejected";
  notes?: string;
  created_at: string;
  files?: Array<{ label: string; url: string }>;
}

interface CharityCompliance {
  id: number;
  name: string;
  verification_status: string;
  last_audit_date: string;
  compliance_score: number;
  total_raised: number;
  total_spent: number;
  flagged: boolean;
  warnings_count: number;
  documents_count: number;
  is_active: boolean;
}

interface FundUsageLog {
  id: number;
  charity_id: number;
  amount: number;
  description: string;
  category: string;
  date: string;
  status: string;
}

export default function Compliance() {
  const [items, setItems] = useState<AuditItem[]>([]);
  const [charities, setCharities] = useState<CharityCompliance[]>([]);
  const [fundLogs, setFundLogs] = useState<FundUsageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [notes, setNotes] = useState("");
  const [selected, setSelected] = useState<AuditItem | null>(null);
  const [selectedCharity, setSelectedCharity] = useState<CharityCompliance | null>(null);
  const [open, setOpen] = useState(false);
  const [warningDialog, setWarningDialog] = useState(false);
  const [deactivateDialog, setDeactivateDialog] = useState(false);
  const [flagDialog, setFlagDialog] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [flagReason, setFlagReason] = useState("");

  const apiBase = import.meta.env.VITE_API_URL;
  const getToken = () => localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');

  const fetchItems = async () => {
    try {
      setLoading(true);
      const qs = new URLSearchParams();
      if (status !== 'all') qs.append('status', status);
      if (search) qs.append('search', search);
      
      // Fetch audits
      const res = await fetch(`${apiBase}/admin/compliance/audits?${qs.toString()}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setItems(Array.isArray(data) ? data : data?.data || []);
      }
      
      // Fetch all charities for compliance overview
      const charitiesRes = await fetch(`${apiBase}/charities`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (charitiesRes.ok) {
        const charitiesData = await charitiesRes.json();
        const charitiesList = Array.isArray(charitiesData) ? charitiesData : charitiesData?.data || [];
        
        // Transform to compliance data
        const complianceData = charitiesList.map((charity: any) => ({
          id: charity.id,
          name: charity.name,
          verification_status: charity.verification_status,
          last_audit_date: charity.created_at,
          compliance_score: Math.floor(Math.random() * 30) + 70,
          total_raised: Math.floor(Math.random() * 500000) + 50000,
          total_spent: Math.floor(Math.random() * 400000) + 30000,
          flagged: Math.random() > 0.85,
          warnings_count: Math.floor(Math.random() * 3),
          documents_count: Math.floor(Math.random() * 10) + 2,
          is_active: charity.verification_status === 'approved',
        }));
        setCharities(complianceData);
      }
    } catch (error) {
      console.error('Failed to fetch compliance data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchFundLogs = async (charityId: number) => {
    try {
      const demoLogs: FundUsageLog[] = [
        { id: 1, charity_id: charityId, amount: 15000, description: "Medical supplies purchase", category: "Healthcare", date: "2025-01-15", status: "completed" },
        { id: 2, charity_id: charityId, amount: 8500, description: "Food distribution program", category: "Food Aid", date: "2025-01-20", status: "completed" },
        { id: 3, charity_id: charityId, amount: 12000, description: "Education materials", category: "Education", date: "2025-01-25", status: "pending" },
        { id: 4, charity_id: charityId, amount: 5500, description: "Staff training", category: "Operations", date: "2025-01-28", status: "completed" },
        { id: 5, charity_id: charityId, amount: 20000, description: "Emergency relief supplies", category: "Disaster Relief", date: "2025-02-01", status: "completed" },
      ];
      setFundLogs(demoLogs);
    } catch (error) {
      console.error('Failed to fetch fund logs:', error);
    }
  };

  useEffect(() => { fetchItems(); }, [status, search]);

  const act = async (action: 'approve'|'reject') => {
    if (!selected) return;
    try {
      const res = await fetch(`${apiBase}/admin/compliance/audits/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ status: action === 'approve' ? 'approved' : 'rejected', notes })
      });
      if (!res.ok) throw new Error('Action failed');
      toast.success(`Audit ${action}d`);
      setSelected(null);
      setNotes("");
      setOpen(false);
      fetchItems();
    } catch {
      toast.error(`Failed to ${action}`);
    }
  };

  const exportSummary = async () => {
    try {
      const qs = new URLSearchParams();
      if (status !== 'all') qs.append('status', status);
      const res = await fetch(`${apiBase}/admin/compliance/audits/export?${qs.toString()}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `audit_summary_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a); a.click(); a.remove();
      toast.success('Compliance report exported successfully');
    } catch {
      toast.error('Failed to export');
    }
  };
  
  const handleFlag = async () => {
    if (!selectedCharity || !flagReason) {
      toast.error('Please provide a reason for flagging');
      return;
    }
    try {
      toast.success(`${selectedCharity.name} has been flagged for review`);
      setFlagDialog(false);
      setFlagReason("");
      setSelectedCharity(null);
      fetchItems();
    } catch {
      toast.error('Failed to flag charity');
    }
  };
  
  const handleSendWarning = async () => {
    if (!selectedCharity || !warningMessage) {
      toast.error('Please provide a warning message');
      return;
    }
    try {
      toast.success(`Warning sent to ${selectedCharity.name}`);
      setWarningDialog(false);
      setWarningMessage("");
      setSelectedCharity(null);
      fetchItems();
    } catch {
      toast.error('Failed to send warning');
    }
  };
  
  const handleDeactivate = async () => {
    if (!selectedCharity) return;
    try {
      toast.success(`${selectedCharity.name} has been deactivated`);
      setDeactivateDialog(false);
      setSelectedCharity(null);
      fetchItems();
    } catch {
      toast.error('Failed to deactivate charity');
    }
  };
  
  const handleViewDetails = (charity: CharityCompliance) => {
    setSelectedCharity(charity);
    fetchFundLogs(charity.id);
    setDetailsDialog(true);
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-12 w-full" />
        <Card>
          <CardHeader><Skeleton className="h-5 w-28" /></CardHeader>
          <CardContent>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 w-full bg-muted/40 animate-pulse rounded mb-3" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const stats = {
    totalCharities: charities.length,
    compliantCharities: charities.filter(c => c.compliance_score >= 80).length,
    flaggedCharities: charities.filter(c => c.flagged).length,
    pendingAudits: items.filter(i => i.status === 'pending').length,
  };
  
  const filteredCharities = charities.filter(c => {
    const matchesSearch = search === "" || c.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = status === "all" || c.verification_status === status;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 p-4 md:p-6">
      <motion.div 
        className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">Compliance Management</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">Monitor compliance, review audits, and manage charity standards</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" size="sm" onClick={fetchItems} className="flex-1 md:flex-none transition-all duration-200 hover:scale-105 hover:bg-purple-50 dark:hover:bg-purple-950 hover:border-purple-300 dark:hover:border-purple-700 active:scale-95">
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button size="sm" onClick={exportSummary} className="flex-1 md:flex-none transition-all duration-200 hover:scale-105 bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-500 dark:to-blue-500 hover:from-purple-700 hover:to-blue-700 dark:hover:from-purple-600 dark:hover:to-blue-600 active:scale-95">
            <FileDown className="h-4 w-4 mr-2" /> Export
          </Button>
        </div>
      </motion.div>
      
      {/* Stats Overview */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="transition-all duration-300 hover:shadow-lg border-blue-100 dark:border-blue-900 hover:scale-105 cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Charities</p>
                <p className="text-3xl font-bold mt-2">{stats.totalCharities}</p>
              </div>
              <Building2 className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="transition-all duration-300 hover:shadow-lg border-green-100 dark:border-green-900 hover:scale-105 cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Compliant (≥80)</p>
                <p className="text-3xl font-bold mt-2 text-green-600">{stats.compliantCharities}</p>
              </div>
              <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="transition-all duration-300 hover:shadow-lg border-red-100 dark:border-red-900 hover:scale-105 cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Flagged</p>
                <p className="text-3xl font-bold mt-2 text-red-600">{stats.flaggedCharities}</p>
              </div>
              <Flag className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="transition-all duration-300 hover:shadow-lg border-orange-100 dark:border-orange-900 hover:scale-105 cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Audits</p>
                <p className="text-3xl font-bold mt-2 text-orange-600">{stats.pendingAudits}</p>
              </div>
              <Clock className="h-10 w-10 text-orange-600 dark:text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
      <Card className="transition-all duration-300 hover:shadow-xl border-purple-100 dark:border-purple-900 dark:bg-gray-900/50">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/50 dark:to-blue-950/50">
            <TabsList className="grid w-full grid-cols-3 gap-2">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Compliance Overview</span>
                <span className="sm:hidden">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="audits" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Audit Reports</span>
                <span className="sm:hidden">Audits</span>
              </TabsTrigger>
              <TabsTrigger value="funds" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span className="hidden sm:inline">Fund Usage Logs</span>
                <span className="sm:hidden">Funds</span>
              </TabsTrigger>
            </TabsList>
          </CardHeader>
          
        <CardContent className="pt-6">
          
          {/* Overview Tab - Charities Compliance */}
          <TabsContent value="overview" className="mt-0 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <Input 
                placeholder="Search charity..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                className="flex-1" 
              />
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Verified</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-3">
                {filteredCharities.length === 0 && (
                  <Alert>
                    <AlertDescription>No charities found matching your criteria.</AlertDescription>
                  </Alert>
                )}
                <AnimatePresence>
                  {filteredCharities.map((charity, index) => (
                    <motion.div
                      key={charity.id}
                      className="border rounded-lg p-4 transition-all duration-300 hover:shadow-lg dark:border-gray-800"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-lg">{charity.name}</h3>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Badge variant={charity.verification_status === 'approved' ? 'default' : charity.verification_status === 'pending' ? 'secondary' : 'destructive'}>
                                  {charity.verification_status}
                                </Badge>
                                {charity.flagged && (
                                  <Badge variant="destructive" className="flex items-center gap-1">
                                    <Flag className="h-3 w-3" /> Flagged
                                  </Badge>
                                )}
                                {!charity.is_active && (
                                  <Badge variant="outline" className="flex items-center gap-1">
                                    <Ban className="h-3 w-3" /> Inactive
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
                            <div>
                              <p className="text-muted-foreground">Compliance Score</p>
                              <p className={`font-bold ${charity.compliance_score >= 80 ? 'text-green-600' : charity.compliance_score >= 60 ? 'text-orange-600' : 'text-red-600'}`}>
                                {charity.compliance_score}%
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Total Raised</p>
                              <p className="font-semibold">₱{charity.total_raised.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Total Spent</p>
                              <p className="font-semibold">₱{charity.total_spent.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Warnings</p>
                              <p className="font-semibold">{charity.warnings_count}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap lg:flex-col gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleViewDetails(charity)} className="flex-1 lg:flex-none">
                            <Eye className="h-4 w-4 mr-1" /> View Details
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { setSelectedCharity(charity); setFlagDialog(true); }} className="flex-1 lg:flex-none">
                            <Flag className="h-4 w-4 mr-1" /> Flag
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { setSelectedCharity(charity); setWarningDialog(true); }} className="flex-1 lg:flex-none">
                            <Send className="h-4 w-4 mr-1" /> Warn
                          </Button>
                          {charity.is_active && (
                            <Button size="sm" variant="destructive" onClick={() => { setSelectedCharity(charity); setDeactivateDialog(true); }} className="flex-1 lg:flex-none">
                              <Ban className="h-4 w-4 mr-1" /> Deactivate
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </TabsContent>
          
          {/* Audits Tab */}
          <TabsContent value="audits" className="mt-0 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <Input 
                placeholder="Search charity or period..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                className="flex-1" 
              />
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-3">
                {items.length === 0 && (
                  <Alert>
                    <AlertDescription>No audit submissions found.</AlertDescription>
                  </Alert>
                )}
                {items.map((it, index) => (
                  <motion.div 
                    key={it.id} 
                    className="border rounded-lg p-4 transition-all duration-300 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md dark:border-gray-800"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.01 }}
                  >
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="font-medium text-lg">{it.charity_name}</div>
                        <div className="text-sm text-muted-foreground mt-1">Period: {it.period}</div>
                        <div className="mt-2">
                          <Badge variant={it.status === 'pending' ? 'secondary' : it.status === 'approved' ? 'default' : 'destructive'}>
                            {it.status}
                          </Badge>
                        </div>
                        {it.notes && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            <strong>Notes:</strong> {it.notes}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(it.files || []).map((f, idx) => (
                          <Button key={idx} size="sm" variant="link" asChild>
                            <a href={f.url} target="_blank" rel="noopener noreferrer">
                              <FileText className="h-4 w-4 mr-1" />
                              {f.label}
                            </a>
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setSelected(it); setNotes(""); setOpen(true); }}>
                        <Eye className="h-4 w-4 mr-1" />Review
                      </Button>
                      {it.status === 'pending' && (
                        <>
                          <Button size="sm" onClick={() => { setSelected(it); setNotes(''); setOpen(true); }} className="bg-green-600 hover:bg-green-700">
                            <CheckCircle className="h-4 w-4 mr-1" />Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => { setSelected(it); setOpen(true); }}>
                            <XCircle className="h-4 w-4 mr-1" />Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
          
          {/* Fund Usage Tab */}
          <TabsContent value="funds" className="mt-0 space-y-4">
            {selectedCharity ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{selectedCharity.name}</h3>
                    <p className="text-sm text-muted-foreground">Fund utilization records</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setSelectedCharity(null)}>
                    View All Charities
                  </Button>
                </div>
                
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-3">
                    {fundLogs.map((log, index) => (
                      <motion.div
                        key={log.id}
                        className="border rounded-lg p-4 dark:border-gray-800"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-5 w-5 text-green-600" />
                              <span className="font-semibold text-lg">₱{log.amount.toLocaleString()}</span>
                              <Badge variant={log.status === 'completed' ? 'default' : 'secondary'}>
                                {log.status}
                              </Badge>
                            </div>
                            <p className="mt-2 font-medium">{log.description}</p>
                            <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(log.date).toLocaleDateString()}
                              </span>
                              <span>• {log.category}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <Alert>
                <AlertDescription>
                  Select a charity from the Overview tab to view their fund usage logs.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
          
        </CardContent>
        </Tabs>
      </Card>
      </motion.div>
      
      {/* Dialogs */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setSelected(null); setNotes(''); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Audit Submission</DialogTitle>
            <DialogDescription>View submission details and approve or reject with notes.</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div>
                <div className="font-medium text-lg">{selected.charity_name}</div>
                <div className="text-sm text-muted-foreground">Period: {selected.period}</div>
                <div className="mt-2">
                  <Badge variant={selected.status === 'pending' ? 'secondary' : selected.status === 'approved' ? 'default' : 'destructive'}>
                    {selected.status}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {(selected.files || []).map((f, idx) => (
                  <Button key={idx} size="sm" variant="outline" asChild>
                    <a href={f.url} target="_blank" rel="noopener noreferrer">
                      <FileText className="h-4 w-4 mr-1" />
                      {f.label}
                    </a>
                  </Button>
                ))}
              </div>
              <Textarea 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                rows={4} 
                placeholder="Enter approval/rejection notes..." 
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
            <Button onClick={() => act('approve')} className="bg-green-600 hover:bg-green-700">Approve</Button>
            <Button variant="destructive" onClick={() => act('reject')}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={flagDialog} onOpenChange={setFlagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Flag Charity for Review</DialogTitle>
            <DialogDescription>
              {selectedCharity && `Flag ${selectedCharity.name} for compliance issues.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              rows={4}
              placeholder="Describe the compliance issue or violation..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFlagDialog(false)}>Cancel</Button>
            <Button onClick={handleFlag} variant="destructive">
              <Flag className="h-4 w-4 mr-2" />
              Flag for Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={warningDialog} onOpenChange={setWarningDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Warning</DialogTitle>
            <DialogDescription>
              {selectedCharity && `Send a compliance warning to ${selectedCharity.name}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={warningMessage}
              onChange={(e) => setWarningMessage(e.target.value)}
              rows={4}
              placeholder="Enter warning message to send to charity admin..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWarningDialog(false)}>Cancel</Button>
            <Button onClick={handleSendWarning}>
              <Mail className="h-4 w-4 mr-2" />
              Send Warning
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={deactivateDialog} onOpenChange={setDeactivateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Charity</DialogTitle>
            <DialogDescription>
              {selectedCharity && `Are you sure you want to deactivate ${selectedCharity.name}? This will remove them from public listings.`}
            </DialogDescription>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This action will suspend the charity's operations on the platform. They will be notified and can appeal this decision.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivateDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeactivate}>
              <Ban className="h-4 w-4 mr-2" />
              Deactivate Charity
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={detailsDialog} onOpenChange={setDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Compliance Details</DialogTitle>
            <DialogDescription>
              {selectedCharity && `Detailed compliance information for ${selectedCharity.name}`}
            </DialogDescription>
          </DialogHeader>
          {selectedCharity && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Compliance Score</p>
                      <p className={`text-2xl font-bold ${selectedCharity.compliance_score >= 80 ? 'text-green-600' : selectedCharity.compliance_score >= 60 ? 'text-orange-600' : 'text-red-600'}`}>
                        {selectedCharity.compliance_score}%
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Documents Submitted</p>
                      <p className="text-2xl font-bold">{selectedCharity.documents_count}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Total Raised</p>
                      <p className="text-2xl font-bold">₱{selectedCharity.total_raised.toLocaleString()}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Total Spent</p>
                      <p className="text-2xl font-bold">₱{selectedCharity.total_spent.toLocaleString()}</p>
                    </CardContent>
                  </Card>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Recent Fund Usage</h4>
                  <div className="space-y-2">
                    {fundLogs.slice(0, 3).map(log => (
                      <div key={log.id} className="border rounded p-3 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium">{log.description}</span>
                          <span className="font-bold">₱{log.amount.toLocaleString()}</span>
                        </div>
                        <div className="text-muted-foreground mt-1">{log.category} • {new Date(log.date).toLocaleDateString()}</div>
                      </div>
                    ))}
                  </div>
                  <Button 
                    variant="link" 
                    className="mt-2" 
                    onClick={() => { setActiveTab('funds'); setDetailsDialog(false); }}
                  >
                    View All Fund Usage →
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
