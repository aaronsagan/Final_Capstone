import { useEffect, useState } from "react";
import { adminService, Charity } from "@/services/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ShieldCheck, FileText, RefreshCw, Search, CheckCircle, XCircle, Clock, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { CharityDetailModal } from "@/components/admin/CharityDetailModal";
import { motion } from "framer-motion";

export default function Applications() {
  const [items, setItems] = useState<Charity[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedCharity, setSelectedCharity] = useState<Charity | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [stats, setStats] = useState({ total: 0, today: 0, thisWeek: 0 });

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/charities`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      const list = Array.isArray(data) ? data : data?.data || [];
      const pending = list.filter((c: Charity) => c.verification_status === 'pending');
      setItems(pending);
      
      // Calculate stats
      const today = new Date().toDateString();
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const todayCount = pending.filter((c: Charity) => new Date(c.created_at).toDateString() === today).length;
      const weekCount = pending.filter((c: Charity) => new Date(c.created_at) >= weekAgo).length;
      setStats({ total: pending.length, today: todayCount, thisWeek: weekCount });
    } catch (e) {
      console.error(e);
      toast.error("Failed to load applications");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (action: string, charityId: number) => {
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      if (action === 'approve') {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/charities/${charityId}/approve`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Approval failed');
        toast.success("Application approved");
      } else {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/charities/${charityId}/reject`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ reason: "Insufficient documents" }),
        });
        if (!res.ok) throw new Error('Rejection failed');
        toast.success("Application rejected");
      }
      fetchData();
      setIsDetailModalOpen(false);
    } catch {
      toast.error(`Failed to ${action}`);
    }
  };

  const handleView = async (charity: Charity) => {
    try {
      const details = await adminService.getCharityDetails(charity.id);
      setSelectedCharity(details);
      setIsDetailModalOpen(true);
    } catch (error) {
      toast.error('Failed to load charity details');
    }
  };

  const filtered = query
    ? items.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()) || c.contact_email.toLowerCase().includes(query.toLowerCase()))
    : items;

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80 mt-2" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Charity Applications</h1>
        <p className="text-muted-foreground">Review and verify charity registrations</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card className="border bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10 border-amber-200/60 dark:border-amber-700/40 hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Applications</p>
                  <h3 className="text-2xl font-bold mt-1">{stats.total}</h3>
                </div>
                <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 border-blue-200/60 dark:border-blue-700/40 hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Today</p>
                  <h3 className="text-2xl font-bold mt-1">{stats.today}</h3>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10 border-purple-200/60 dark:border-purple-700/40 hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">This Week</p>
                  <h3 className="text-2xl font-bold mt-1">{stats.thisWeek}</h3>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email"
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} className="transition-smooth hover:scale-[1.02] active:scale-[0.98]">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Application Cards */}
      <div className="grid gap-4">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No pending applications
            </CardContent>
          </Card>
        ) : (
          filtered.map((charity, index) => (
            <motion.div
              key={charity.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="group hover:shadow-lg transition-all border border-border hover:border-primary/50">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-200 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <ShieldCheck className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{charity.name}</h3>
                        <p className="text-sm text-muted-foreground">{charity.contact_email}</p>
                        {charity.owner && (
                          <p className="text-xs text-muted-foreground mt-1">Owner: {charity.owner.name}</p>
                        )}
                        <div className="flex gap-2 mt-2 flex-wrap">
                          <Badge variant="secondary" className="text-xs">
                            {charity.verification_status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Submitted {new Date(charity.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button size="sm" variant="outline" onClick={() => handleView(charity)} className="transition-smooth">
                        <FileText className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button size="sm" onClick={() => handleAction('approve', charity.id)} className="transition-smooth bg-green-600 hover:bg-green-700">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleAction('reject', charity.id)} className="transition-smooth">
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

      {/* Charity Detail Modal */}
      <CharityDetailModal
        charity={selectedCharity}
        open={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onAction={handleAction}
      />
    </div>
  );
}
