import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, ReceiptText, FileDown } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface DonationTx {
  id: number;
  donor_name: string;
  charity_name: string;
  campaign_title?: string;
  amount: number | null;
  status: string; // pending|completed|failed|refunded
  created_at: string;
}

export default function Transactions() {
  const [items, setItems] = useState<DonationTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const apiBase = import.meta.env.VITE_API_URL;
  const getToken = () => localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');

  const fetchItems = async () => {
    try {
      setLoading(true);
      const qs = new URLSearchParams({ page: String(page) });
      if (status !== 'all') qs.append('status', status);
      if (search) qs.append('search', search);
      const res = await fetch(`${apiBase}/admin/donations?${qs.toString()}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) {
        // Gracefully handle 404 - endpoint not implemented yet
        console.log('Transactions endpoint not yet implemented');
        setItems([]);
        return;
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : data?.data || [];
      setItems(list);
      setLastPage(data?.last_page || 1);
    } catch (error) {
      console.log('Transactions endpoint not yet implemented');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, [status, search, page]);

  const exportCsv = async () => {
    try {
      const qs = new URLSearchParams();
      if (status !== 'all') qs.append('status', status);
      const res = await fetch(`${apiBase}/admin/donations/export?${qs.toString()}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `donations_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a); a.click(); a.remove();
    } catch {
      toast.error('Failed to export');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between"><Skeleton className="h-8 w-64" /><Skeleton className="h-10 w-24"/></div>
        <Card><CardHeader><Skeleton className="h-5 w-40" /></CardHeader><CardContent>{[...Array(6)].map((_,i)=>(<div key={i} className="h-9 w-full bg-muted/40 animate-pulse rounded mb-2"/>))}</CardContent></Card>
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
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">Transactions</h1>
          <p className="text-muted-foreground mt-1">Platform-wide donation records</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchItems} className="transition-all duration-200 hover:scale-105 hover:bg-blue-50 dark:hover:bg-blue-950 hover:border-blue-300 dark:hover:border-blue-700 active:scale-95"><RefreshCw className="h-4 w-4 mr-2"/>Refresh</Button>
          <Button size="sm" onClick={exportCsv} className="transition-all duration-200 hover:scale-105 bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-500 dark:to-cyan-500 hover:from-blue-700 hover:to-cyan-700 dark:hover:from-blue-600 dark:hover:to-cyan-600 active:scale-95"><FileDown className="h-4 w-4 mr-2"/>Export</Button>
        </div>
      </motion.div>

      <div className="flex gap-3 flex-wrap">
        <Input placeholder="Search donor/charity/campaign" value={search} onChange={(e)=>setSearch(e.target.value)} className="w-64" />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status"/></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
      <Card className="transition-all duration-300 hover:shadow-xl border-blue-100 dark:border-blue-900 hover:border-blue-300 dark:hover:border-blue-700 dark:bg-gray-900/50">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50">
          <CardTitle className="flex items-center gap-2 text-blue-700"><ReceiptText className="h-5 w-5"/> Donation Ledger</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Donor</TableHead>
                  <TableHead>Charity</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No transactions found</TableCell></TableRow>
                )}
                {items.map((t, index)=> (
                  <TableRow key={t.id} className="transition-all duration-200 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 cursor-pointer">
                    <TableCell>{t.id}</TableCell>
                    <TableCell>{t.donor_name}</TableCell>
                    <TableCell>{t.charity_name}</TableCell>
                    <TableCell>{t.campaign_title || '-'}</TableCell>
                    <TableCell>₱{(t.amount ?? 0).toLocaleString()}</TableCell>
                    <TableCell>{t.status}</TableCell>
                    <TableCell>{new Date(t.created_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {lastPage > 1 && (
            <div className="mt-4 flex gap-2 justify-end">
              <Button size="sm" variant="outline" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Prev</Button>
              <div className="text-sm self-center">Page {page} of {lastPage}</div>
              <Button size="sm" variant="outline" disabled={page>=lastPage} onClick={()=>setPage(p=>p+1)}>Next</Button>
            </div>
          )}
        </CardContent>
      </Card>
      </motion.div>
    </div>
  );
}
