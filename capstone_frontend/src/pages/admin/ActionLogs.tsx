import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Download, Search, Filter, Calendar, RefreshCw, Activity } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

interface UserActivityLog {
  id: number;
  user: {
    id: number;
    name: string;
    email: string;
    role: string; // 'donor', 'charity', 'admin'
  };
  action_type: string;
  target_type?: string;
  target_id?: number;
  details?: any;
  description?: string;
  ip_address?: string;
  created_at: string;
}

export default function AdminActionLogs() {
  const [logs, setLogs] = useState<UserActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [actionTypeFilter, setActionTypeFilter] = useState("all");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [targetTypeFilter, setTargetTypeFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const apiBase = import.meta.env.VITE_API_URL;
  const getToken = () => localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchLogs();
  }, [actionTypeFilter, userRoleFilter, targetTypeFilter, startDate, endDate, debouncedSearchTerm]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (actionTypeFilter !== "all") params.append("action_type", actionTypeFilter);
      if (userRoleFilter !== "all") params.append("user_role", userRoleFilter);
      if (targetTypeFilter !== "all") params.append("target_type", targetTypeFilter);
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);
      if (debouncedSearchTerm) params.append("search", debouncedSearchTerm);

      const res = await fetch(`${apiBase}/admin/activity-logs?${params.toString()}`, {
        headers: { 
          Authorization: `Bearer ${getToken()}`,
          'Accept': 'application/json'
        },
      });
      
      if (res.status === 401) {
        setLogs([]);
        toast.error('Unauthorized. Please log in as an admin.');
        // Optionally redirect to login
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }
      
      if (res.status === 404) {
        setLogs([]);
        toast.error('Activity logs endpoint not found');
        return;
      }
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch logs');
      }
      
      const data = await res.json();
      const logsData = Array.isArray(data) ? data : data?.data || [];
      setLogs(logsData);
      
      if (logsData.length === 0 && (actionTypeFilter !== 'all' || userRoleFilter !== 'all' || debouncedSearchTerm)) {
        toast.info('No logs found matching your filters');
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load activity logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const exportLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (actionTypeFilter !== "all") params.append("action_type", actionTypeFilter);
      if (userRoleFilter !== "all") params.append("user_role", userRoleFilter);
      if (targetTypeFilter !== "all") params.append("target_type", targetTypeFilter);
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);

      const res = await fetch(`${apiBase}/admin/activity-logs/export?${params.toString()}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `user_activity_logs_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success("Logs exported successfully");
    } catch (error) {
      toast.error("Failed to export logs");
    }
  };

  const formatActionType = (actionType: string) => {
    return actionType.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  const getActionBadge = (actionType: string) => {
    const colors = {
      login: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      logout: "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300",
      create_campaign: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      update_campaign: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
      delete_campaign: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      make_donation: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
      update_profile: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
      register: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
      submit_report: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
      approve_charity: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      reject_charity: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      other: "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300",
    };

    const color = colors[actionType as keyof typeof colors] || colors.other;
    
    return (
      <Badge className={color}>
        {formatActionType(actionType)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-72 mt-2" />
          </div>
          <Skeleton className="h-10 w-28" />
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
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">User Activity Logs</h1>
          <p className="text-muted-foreground mt-1">Monitor all user activities including donors and charity admins</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setLoading(true); fetchLogs(); }} className="transition-all duration-200 hover:scale-105 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:border-indigo-300 dark:hover:border-indigo-700 active:scale-95">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportLogs} className="flex items-center gap-2 transition-all duration-200 hover:scale-105 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 hover:from-indigo-700 hover:to-purple-700 dark:hover:from-indigo-600 dark:hover:to-purple-600 active:scale-95">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
      <Card className="transition-all duration-300 hover:shadow-lg border-indigo-100 dark:border-indigo-900 dark:bg-gray-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              {searchTerm !== debouncedSearchTerm && (
                <div className="absolute right-3 top-3">
                  <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
            <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="User Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="donor">Donors</SelectItem>
                <SelectItem value="charity_admin">Charity Admins</SelectItem>
                <SelectItem value="admin">System Admins</SelectItem>
              </SelectContent>
            </Select>
            <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Action Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
                <SelectItem value="register">Register</SelectItem>
                <SelectItem value="create_campaign">Create Campaign</SelectItem>
                <SelectItem value="update_campaign">Update Campaign</SelectItem>
                <SelectItem value="delete_campaign">Delete Campaign</SelectItem>
                <SelectItem value="make_donation">Make Donation</SelectItem>
                <SelectItem value="update_profile">Update Profile</SelectItem>
                <SelectItem value="submit_report">Submit Report</SelectItem>
              </SelectContent>
            </Select>
            <Select value={targetTypeFilter} onValueChange={setTargetTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Target Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Campaign">Campaign</SelectItem>
                <SelectItem value="Donation">Donation</SelectItem>
                <SelectItem value="Profile">Profile</SelectItem>
                <SelectItem value="Report">Report</SelectItem>
                <SelectItem value="User">User</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              placeholder="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              type="date"
              placeholder="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          {(searchTerm || actionTypeFilter !== 'all' || userRoleFilter !== 'all' || targetTypeFilter !== 'all' || startDate || endDate) && (
            <div className="flex justify-end mt-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setActionTypeFilter('all');
                  setUserRoleFilter('all');
                  setTargetTypeFilter('all');
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-sm"
              >
                Clear All Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      </motion.div>

      {/* Logs List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
      <Card className="transition-all duration-300 hover:shadow-xl border-purple-100 dark:border-purple-900 dark:bg-gray-900/50">
        <CardHeader>
          <CardTitle>Action Logs ({(logs || []).length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(logs || []).map((log, index) => (
              <motion.div 
                key={log.id} 
                className="border rounded-lg p-4 space-y-3 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/30 dark:to-slate-800/20 dark:border-gray-800"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {getActionBadge(log.action_type)}
                      <Badge variant="outline" className="text-xs">
                        {log.user.role}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {log.user.name}
                      </span>
                    </div>
                    {log.target_type && (
                      <p className="text-sm">
                        <span className="font-medium">Target:</span> {log.target_type} #{log.target_id}
                      </p>
                    )}
                    {log.description && (
                      <p className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded">
                        {log.description}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>{new Date(log.created_at).toLocaleString()}</p>
                    {log.ip_address && <p>IP: {log.ip_address}</p>}
                  </div>
                </div>
                {log.details && (
                  <details className="text-sm">
                    <summary className="cursor-pointer text-blue-600 dark:text-blue-400 hover:underline">
                      View Details
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs overflow-auto">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </details>
                )}
              </motion.div>
            ))}
            {(logs || []).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No action logs found matching your filters.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      </motion.div>
    </div>
  );
}
