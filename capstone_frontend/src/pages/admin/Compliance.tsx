import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldAlert, RefreshCw, Eye, CheckCircle, XCircle, FileDown } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface AuditItem {
  id: number;
  charity_id: number;
  charity_name: string;
  period: string; // e.g. Q1 2025
  status: "pending" | "approved" | "rejected";
  notes?: string;
  created_at: string;
  files?: Array<{ label: string; url: string }>;
}

export default function Compliance() {
  const [items, setItems] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [notes, setNotes] = useState("");
  const [selected, setSelected] = useState<AuditItem | null>(null);

  const apiBase = import.meta.env.VITE_API_URL;
  const getToken = () => localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');

  const fetchItems = async () => {
    try {
      setLoading(true);
      const qs = new URLSearchParams();
      if (status !== 'all') qs.append('status', status);
      if (search) qs.append('search', search);
      const res = await fetch(`${apiBase}/admin/compliance/audits?${qs.toString()}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) {
        console.log('Compliance endpoints not yet implemented');
        setItems([]);
        return;
      }
      const data = await res.json();
      setItems(Array.isArray(data) ? data : data?.data || []);
    } catch (error) {
      console.log('Compliance endpoints not yet implemented');
      setItems([]);
    } finally {
      setLoading(false);
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
    } catch {
      toast.error('Failed to export');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between"><Skeleton className="h-8 w-64" /><Skeleton className="h-10 w-28" /></div>
        <Card><CardHeader><Skeleton className="h-5 w-28" /></CardHeader><CardContent>{[...Array(5)].map((_,i)=>(<div key={i} className="h-16 w-full bg-muted/40 animate-pulse rounded mb-3" />))}</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">Compliance & Audits</h1>
          <p className="text-muted-foreground mt-1">Review periodic audit reports and enforce compliance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchItems} className="transition-all duration-200 hover:scale-105 hover:bg-purple-50 dark:hover:bg-purple-950 hover:border-purple-300 dark:hover:border-purple-700 active:scale-95">
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button size="sm" onClick={exportSummary} className="transition-all duration-200 hover:scale-105 bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-500 dark:to-blue-500 hover:from-purple-700 hover:to-blue-700 dark:hover:from-purple-600 dark:hover:to-blue-600 active:scale-95"> <FileDown className="h-4 w-4 mr-2" /> Export</Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
      <Card className="transition-all duration-300 hover:shadow-xl border-purple-100 dark:border-purple-900 hover:border-purple-300 dark:hover:border-purple-700 dark:bg-gray-900/50">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/50 dark:to-blue-950/50">
          <CardTitle className="flex items-center gap-2 text-purple-700"><ShieldAlert className="h-5 w-5" /> Pending & Recent Audits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 flex-wrap mb-4">
            <Input placeholder="Search charity or period..." value={search} onChange={(e)=>setSearch(e.target.value)} className="w-64" />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {items.length === 0 && <div className="text-sm text-muted-foreground">No audit submissions.</div>}
            {items.map((it, index)=> (
              <motion.div 
                key={it.id} 
                className="border rounded-lg p-4 transition-all duration-300 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md cursor-pointer dark:border-gray-800"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{it.charity_name}</div>
                    <div className="text-sm text-muted-foreground">Period: {it.period}</div>
                    <div className="mt-1">
                      <Badge variant={it.status === 'pending' ? 'secondary' : it.status==='approved' ? 'default' : 'destructive'}>{it.status}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {(it.files || []).map((f, idx) => (
                      <a key={idx} href={f.url} target="_blank" className="text-xs underline">View {f.label}</a>
                    ))}
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={()=>setSelected(it)} className="transition-all duration-200 hover:scale-105 hover:bg-blue-50 dark:hover:bg-blue-950"><Eye className="h-4 w-4 mr-1"/>Review</Button>
                  {it.status === 'pending' && (
                    <>
                      <Button size="sm" onClick={()=>{ setSelected(it); setNotes(''); act('approve'); }} className="transition-all duration-200 hover:scale-105 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"><CheckCircle className="h-4 w-4 mr-1"/>Approve</Button>
                      <Button size="sm" variant="destructive" onClick={()=>{ setSelected(it); act('reject'); }} className="transition-all duration-200 hover:scale-105"><XCircle className="h-4 w-4 mr-1"/>Reject</Button>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {selected && (
            <div className="mt-6 border rounded-lg p-4">
              <div className="font-medium mb-2">Add Review Notes for {selected.charity_name} ({selected.period})</div>
              <Textarea value={notes} onChange={(e)=>setNotes(e.target.value)} rows={3} placeholder="Enter approval/rejection notes" />
              <div className="mt-2 flex gap-2 justify-end">
                <Button variant="outline" onClick={()=> setSelected(null)}>Cancel</Button>
                <Button onClick={()=> act('approve')}>Approve</Button>
                <Button variant="destructive" onClick={()=> act('reject')}>Reject</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </motion.div>
    </div>
  );
}
