import { useState, useEffect } from "react";
import { Search, Building2, CheckCircle, XCircle, RefreshCw, TrendingUp, ChevronRight, FileText, Clock, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { adminService, Charity } from "@/services/admin";
import { Skeleton } from "@/components/ui/skeleton";
import { CharityDetailModal } from "@/components/admin/CharityDetailModal";
import { motion, AnimatePresence } from "framer-motion";

export default function Charities() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [charities, setCharities] = useState<Charity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCharity, setSelectedCharity] = useState<Charity | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [stats, setStats] = useState({ total: 0, verified: 0, pending: 0, rejected: 0 });

  useEffect(() => {
    fetchCharities();
  }, [currentPage, filterStatus]);

  const fetchCharities = async () => {
    setIsLoading(true);
    try {
      const response = await adminService.getAllCharities(currentPage, {
        status: filterStatus !== 'all' ? filterStatus : undefined
      });
      setCharities(response.data);
      
      // Calculate stats
      const total = response.data.length;
      const verified = response.data.filter((c: Charity) => c.verification_status === 'approved').length;
      const pending = response.data.filter((c: Charity) => c.verification_status === 'pending').length;
      const rejected = response.data.filter((c: Charity) => c.verification_status === 'rejected').length;
      setStats({ total, verified, pending, rejected });
    } catch (error: any) {
      console.error('Failed to fetch charities:', error);
      toast.error('Failed to load charities');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetail = async (charity: Charity) => {
    try {
      const details = await adminService.getCharityDetails(charity.id);
      setSelectedCharity(details);
      setIsDetailModalOpen(true);
    } catch (error) {
      toast.error('Failed to load charity details');
    }
  };

  const handleCharityAction = async (action: string, charityId: number) => {
    try {
      if (action === 'approve') {
        await adminService.approveCharity(charityId);
        toast.success("Charity approved");
      } else if (action === 'reject') {
        await adminService.rejectCharity(charityId, "Insufficient documentation");
        toast.success("Charity rejected");
      }
      fetchCharities();
      setIsDetailModalOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${action} charity`);
    }
  };

  const filteredCharities = charities.filter(charity => {
    const matchesSearch = charity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         charity.contact_email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80 mt-2" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-[180px]" />
        </div>
        <div className="grid gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const pendingCharities = charities.filter(c => c.verification_status === 'pending');
  const approvedCharities = charities.filter(c => c.verification_status === 'approved');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Charity Organizations</h1>
        <p className="text-muted-foreground">Manage and verify charitable organizations</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card className="border bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/50 dark:to-purple-900/30 border-purple-200/60 dark:border-purple-700/40">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Charities</p>
                  <h3 className="text-2xl font-bold mt-1">{stats.total}</h3>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-green-900/30 border-green-200/60 dark:border-green-700/40">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Verified</p>
                  <h3 className="text-2xl font-bold mt-1">{stats.verified}</h3>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/50 dark:to-amber-900/30 border-amber-200/60 dark:border-amber-700/40">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <h3 className="text-2xl font-bold mt-1">{stats.pending}</h3>
                </div>
                <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/50 dark:to-red-900/30 border-red-200/60 dark:border-red-700/40">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                  <h3 className="text-2xl font-bold mt-1">{stats.rejected}</h3>
                </div>
                <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabs for All Charities and Pending Applications */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="all" className="transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Building2 className="h-4 w-4 mr-2" />
            All Charities ({charities.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="transition-all data-[state=active]:bg-amber-500 data-[state=active]:text-white">
            <ShieldCheck className="h-4 w-4 mr-2" />
            Pending Applications ({pendingCharities.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4 flex-wrap">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search charities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 transition-all focus:ring-2 focus:ring-primary/50 dark:bg-gray-900/50 dark:border-gray-700"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px] transition-all hover:border-primary/50">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchCharities} className="transition-all duration-200 hover:scale-[1.02] hover:bg-primary/5 dark:hover:bg-primary/10 active:scale-[0.98]">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          {/* Charity Cards */}
          <div className="grid gap-4">
            {filteredCharities.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center text-muted-foreground">
                  No charities found
                </CardContent>
              </Card>
            ) : (
              filteredCharities.map((charity, index) => (
                <motion.div
                  key={charity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border border-border hover:border-primary/50 hover:bg-primary/5 dark:bg-gray-900/50 dark:hover:bg-primary/10"
                    onClick={() => handleViewDetail(charity)}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                            <Building2 className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors duration-200">{charity.name}</h3>
                            <p className="text-sm text-muted-foreground">{charity.contact_email}</p>
                            {charity.owner && (
                              <p className="text-xs text-muted-foreground mt-1">Owner: {charity.owner.name}</p>
                            )}
                            <div className="flex gap-2 mt-2 flex-wrap">
                              <Badge 
                                variant={charity.verification_status === 'approved' ? 'default' : charity.verification_status === 'pending' ? 'secondary' : 'destructive'} 
                                className="text-xs transition-all hover:scale-105"
                              >
                                {charity.verification_status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Registered {new Date(charity.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-200 flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {/* Search for Pending */}
          <div className="flex gap-4 flex-wrap">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search pending applications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 transition-all focus:ring-2 focus:ring-amber-500/50 dark:bg-gray-900/50 dark:border-gray-700"
              />
            </div>
            <Button variant="outline" onClick={fetchCharities} className="transition-all duration-200 hover:scale-[1.02] hover:bg-amber-500/5 dark:hover:bg-amber-500/10 active:scale-[0.98]">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          {/* Pending Application Cards */}
          <div className="grid gap-4">
            {pendingCharities.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.contact_email.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
              <Card className="border-dashed border-amber-200">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-amber-500 opacity-50" />
                  No pending applications
                </CardContent>
              </Card>
            ) : (
              pendingCharities.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.contact_email.toLowerCase().includes(searchTerm.toLowerCase())).map((charity, index) => (
                <motion.div
                  key={charity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="group hover:shadow-lg transition-all duration-300 border border-amber-200/60 hover:border-amber-500/50 hover:bg-amber-50/50 dark:bg-gray-900/50 dark:border-amber-900/40 dark:hover:bg-amber-950/30">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-200 to-amber-100 dark:from-amber-900/50 dark:to-amber-800/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                            <ShieldCheck className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg group-hover:text-amber-700 transition-colors duration-200">{charity.name}</h3>
                            <p className="text-sm text-muted-foreground">{charity.contact_email}</p>
                            {charity.owner && (
                              <p className="text-xs text-muted-foreground mt-1">Owner: {charity.owner.name}</p>
                            )}
                            <div className="flex gap-2 mt-2 flex-wrap">
                              <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 transition-all hover:scale-105">
                                {charity.verification_status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Submitted {new Date(charity.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button size="sm" variant="outline" onClick={() => handleViewDetail(charity)} className="transition-all duration-200 hover:scale-105 hover:bg-blue-50 dark:hover:bg-blue-950">
                            <FileText className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button size="sm" onClick={() => handleCharityAction('approve', charity.id)} className="transition-all duration-200 hover:scale-105 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleCharityAction('reject', charity.id)} className="transition-all duration-200 hover:scale-105">
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Charity Detail Modal */}
      <CharityDetailModal
        charity={selectedCharity}
        open={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onAction={handleCharityAction}
      />
    </div>
  );
}
