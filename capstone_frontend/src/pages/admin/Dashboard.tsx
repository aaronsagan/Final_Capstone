import { useEffect, useState } from "react";
import { Users, Building2, CheckCircle, DollarSign, Activity, Eye, UserCheck, UserX, Clock, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { KPICard } from "@/components/admin/KPICard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

// Mock data - will be replaced with API calls
const mockChartData = [
  { month: "Jan", registrations: 12 },
  { month: "Feb", registrations: 19 },
  { month: "Mar", registrations: 15 },
  { month: "Apr", registrations: 25 },
  { month: "May", registrations: 22 },
  { month: "Jun", registrations: 30 },
];

interface DashboardMetrics {
  total_users: number;
  total_donors: number;
  total_charity_admins: number;
  charities: number;
  pending_verifications: number;
  campaigns: number;
  donations: number;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

interface Charity {
  id: number;
  name: string;
  contact_email: string;
  verification_status: string;
  created_at: string;
  owner?: {
    name: string;
  };
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [pendingCharities, setPendingCharities] = useState<Charity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch metrics
      const metricsResponse = await fetch(`${import.meta.env.VITE_API_URL}/metrics`);
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData);
      }

      // Fetch recent users
      // Check both localStorage and sessionStorage for token
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const usersResponse = await fetch(`${import.meta.env.VITE_API_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        // Handle both array responses and Laravel paginator objects
        const usersArray = Array.isArray(usersData)
          ? usersData
          : Array.isArray(usersData?.data)
            ? usersData.data
            : [];
        setRecentUsers(usersArray.slice(0, 5)); // Show latest 5 users
      }

      // Fetch pending charities
      const charitiesResponse = await fetch(`${import.meta.env.VITE_API_URL}/admin/charities`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (charitiesResponse.ok) {
        const charitiesData = await charitiesResponse.json();
        // Handle both array responses and Laravel paginator objects
        const charitiesArray = Array.isArray(charitiesData)
          ? charitiesData
          : Array.isArray(charitiesData?.data)
            ? charitiesData.data
            : [];
        const pending = charitiesArray.filter((c: Charity) => c.verification_status === 'pending');
        setPendingCharities(pending.slice(0, 5)); // Show latest 5 pending
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
      // Set fallback empty arrays to prevent undefined errors
      setMetrics(null);
      setRecentUsers([]);
      setPendingCharities([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCharityAction = async (charityId: number, action: 'approve' | 'reject') => {
    setActionLoading(`${action}-${charityId}`);
    try {
      // Check both localStorage and sessionStorage for token
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/charities/${charityId}/${action}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error(`Failed to ${action} charity`);
      
      toast.success(`Charity ${action}d successfully`);
      fetchDashboardData(); // Refresh data
    } catch (error) {
      toast.error(`Failed to ${action} charity`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUserAction = async (userId: number, action: 'suspend' | 'activate') => {
    setActionLoading(`${action}-${userId}`);
    try {
      // Check both localStorage and sessionStorage for token
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/users/${userId}/${action}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error(`Failed to ${action} user`);
      
      toast.success(`User ${action}d successfully`);
      fetchDashboardData(); // Refresh data
    } catch (error) {
      toast.error(`Failed to ${action} user`);
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-56" />
            <Skeleton className="h-4 w-64 mt-3" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>

        {/* KPI skeletons */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-4">
              <Skeleton className="h-4 w-24" />
              <div className="mt-3 flex items-end justify-between">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          <div className="rounded-xl border bg-card p-4">
            <Skeleton className="h-6 w-64" />
            <div className="mt-4 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between border rounded-lg p-3">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-40" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <Skeleton className="h-6 w-64" />
            <div className="mt-4 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between border rounded-lg p-3">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-40" />
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-[300px] w-full mt-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Overview of your charity platform
          </p>
        </div>
        <Button onClick={fetchDashboardData} variant="outline" size="sm" className="transition-smooth hover:scale-[1.02] active:scale-[0.98]">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <KPICard
          title="Total Users"
          value={metrics?.total_users?.toString() || '0'}
          icon={Users}
          description="All registered users"
          to="/admin/users"
          variant="emerald"
        />
        <KPICard
          title="Total Donors"
          value={metrics?.total_donors?.toString() || '0'}
          icon={DollarSign}
          description="Registered donors"
          to="/admin/users"
          variant="blue"
        />
        <KPICard
          title="Charity Admins"
          value={metrics?.total_charity_admins?.toString() || '0'}
          icon={Building2}
          description="Charity representatives"
          to="/admin/users"
          variant="purple"
        />
        <KPICard
          title="Approved Charities"
          value={metrics?.charities?.toString() || '0'}
          icon={CheckCircle}
          description="Verified organizations"
          to="/admin/charities"
          variant="pink"
        />
        <KPICard
          title="Pending Verifications"
          value={metrics?.pending_verifications?.toString() || '0'}
          icon={Activity}
          description="Awaiting review"
          to="/admin/charities"
          variant="amber"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {/* Pending Charities */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Charity Verifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingCharities.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No pending verifications</p>
            ) : (
              <div className="space-y-4">
                {(pendingCharities || []).map((charity) => (
                  <div key={charity.id} className="flex items-center justify-between p-3 border rounded-lg bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/30 dark:to-slate-800/20">
                    <div className="flex-1">
                      <h4 className="font-medium">{charity.name}</h4>
                      <p className="text-sm text-muted-foreground">{charity.contact_email}</p>
                      <p className="text-xs text-muted-foreground">
                        Submitted {new Date(charity.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleCharityAction(charity.id, 'approve')}
                        disabled={actionLoading === `approve-${charity.id}`}
                        className="transition-smooth"
                      >
                        {actionLoading === `approve-${charity.id}` ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <CheckCircle className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCharityAction(charity.id, 'reject')}
                        disabled={actionLoading === `reject-${charity.id}`}
                        className="transition-smooth"
                      >
                        {actionLoading === `reject-${charity.id}` ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <UserX className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </motion.div>

        {/* Recent Users */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.05 }}>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recent User Registrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentUsers.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No recent users</p>
            ) : (
              <div className="space-y-4">
                {(recentUsers || []).map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-slate-800/20">
                    <div className="flex-1">
                      <h4 className="font-medium">{user.name}</h4>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={user.role === 'donor' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                        <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                          {user.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {user.status === 'active' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUserAction(user.id, 'suspend')}
                          disabled={actionLoading === `suspend-${user.id}`}
                          className="transition-smooth"
                        >
                          {actionLoading === `suspend-${user.id}` ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <UserX className="h-3 w-3" />
                          )}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleUserAction(user.id, 'activate')}
                          disabled={actionLoading === `activate-${user.id}`}
                          className="transition-smooth"
                        >
                          {actionLoading === `activate-${user.id}` ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <UserCheck className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.1 }}>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Charity Registrations Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockChartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                className="text-xs"
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis 
                className="text-xs"
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Line 
                type="monotone" 
                dataKey="registrations" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      </motion.div>
    </div>
  );
}
