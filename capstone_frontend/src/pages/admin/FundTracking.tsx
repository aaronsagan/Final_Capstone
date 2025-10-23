import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Wallet, RefreshCw, TriangleAlert, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Summary {
  total_inflow: number;
  total_outflow: number;
  campaigns_tracked: number;
}

interface FlowPoint { label: string; inflow: number; outflow: number }
interface Anomaly { id: number; type: string; campaign: string; severity: "low"|"medium"|"high"; message: string; timestamp: string }

export default function FundTracking() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [series, setSeries] = useState<FlowPoint[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30d");
  const [search, setSearch] = useState("");

  const apiBase = import.meta.env.VITE_API_URL;
  const getToken = () => localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');

  const fetchAll = async () => {
    try {
      setLoading(true);
      const qs = new URLSearchParams({ range });
      if (search) qs.append('search', search);
      const [sumRes, seriesRes, anomRes] = await Promise.all([
        fetch(`${apiBase}/admin/funds/summary?${qs.toString()}`, { headers: { Authorization: `Bearer ${getToken()}` } }),
        fetch(`${apiBase}/admin/funds/flows?${qs.toString()}`, { headers: { Authorization: `Bearer ${getToken()}` } }),
        fetch(`${apiBase}/admin/funds/anomalies?${qs.toString()}`, { headers: { Authorization: `Bearer ${getToken()}` } }),
      ]);
      setSummary(sumRes.ok ? await sumRes.json() : { total_inflow: 0, total_outflow: 0, campaigns_tracked: 0 });
      setSeries(seriesRes.ok ? await seriesRes.json() : []);
      setAnomalies(anomRes.ok ? await anomRes.json() : []);
      
      // Log if endpoints not implemented
      if (!sumRes.ok || !seriesRes.ok || !anomRes.ok) {
        console.log('Fund tracking endpoints not yet implemented');
      }
    } catch (error) {
      console.log('Fund tracking endpoints not yet implemented');
      setSummary({ total_inflow: 0, total_outflow: 0, campaigns_tracked: 0 });
      setSeries([]); 
      setAnomalies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [range, search]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between"><Skeleton className="h-8 w-64" /><Skeleton className="h-10 w-24" /></div>
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_,i)=>(<Card key={i}><CardHeader><Skeleton className="h-4 w-24"/></CardHeader><CardContent><Skeleton className="h-6 w-20"/></CardContent></Card>))}
        </div>
        <Card><CardHeader><Skeleton className="h-5 w-40"/></CardHeader><CardContent><Skeleton className="h-[320px] w-full"/></CardContent></Card>
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
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">Fund Tracking</h1>
          <p className="text-muted-foreground mt-1">Monitor inflows/outflows and detect anomalies</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAll} className="transition-all duration-200 hover:scale-105 hover:bg-green-50 dark:hover:bg-green-950 hover:border-green-300 dark:hover:border-green-700 active:scale-95"><RefreshCw className="h-4 w-4 mr-2"/>Refresh</Button>
      </motion.div>

      <div className="flex gap-3 flex-wrap">
        <Input placeholder="Search campaign/charity" value={search} onChange={(e)=>setSearch(e.target.value)} className="w-64" />
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Range"/></SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="transition-all duration-300 hover:shadow-xl border-green-100 dark:border-green-900 hover:border-green-300 dark:hover:border-green-700 hover:scale-[1.02] cursor-pointer">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50">
              <CardTitle className="flex items-center gap-2 text-green-700"><TrendingUp className="h-5 w-5" />Total Inflow</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">₱{(summary?.total_inflow||0).toLocaleString()}</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="transition-all duration-300 hover:shadow-xl border-red-100 dark:border-red-900 hover:border-red-300 dark:hover:border-red-700 hover:scale-[1.02] cursor-pointer">
            <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/50 dark:to-orange-950/50">
              <CardTitle className="flex items-center gap-2 text-red-700"><TrendingDown className="h-5 w-5" />Total Outflow</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-400 dark:to-orange-400 bg-clip-text text-transparent">₱{(summary?.total_outflow||0).toLocaleString()}</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="transition-all duration-300 hover:shadow-xl border-blue-100 dark:border-blue-900 hover:border-blue-300 dark:hover:border-blue-700 hover:scale-[1.02] cursor-pointer">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50">
              <CardTitle className="flex items-center gap-2 text-blue-700"><Wallet className="h-5 w-5" />Campaigns Tracked</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">{summary?.campaigns_tracked||0}</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
      <Card className="transition-all duration-300 hover:shadow-xl border-green-100 dark:border-green-900 hover:border-green-300 dark:hover:border-green-700 dark:bg-gray-900/50">
        <CardHeader className="bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-950/30 dark:to-emerald-950/30">
          <CardTitle className="text-green-700">Inflows vs Outflows</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={series}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" className="text-xs" stroke="hsl(var(--muted-foreground))" />
              <YAxis className="text-xs" stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)" }} />
              <Bar dataKey="inflow" fill="hsl(var(--primary))" radius={[6,6,0,0]} />
              <Bar dataKey="outflow" fill="hsl(var(--secondary))" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
      <Card className="transition-all duration-300 hover:shadow-xl border-orange-100 dark:border-orange-900 hover:border-orange-300 dark:hover:border-orange-700 dark:bg-gray-900/50">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/50 dark:to-red-950/50">
          <CardTitle className="flex items-center gap-2 text-orange-700"><TriangleAlert className="h-5 w-5"/> Anomalies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {anomalies.length === 0 && <div className="text-sm text-muted-foreground">No anomalies detected for the selected range.</div>}
            {anomalies.map((a, index)=> (
              <motion.div 
                key={a.id} 
                className="border rounded-lg p-3 transition-all duration-300 hover:bg-orange-50/50 dark:hover:bg-orange-950/30 hover:border-orange-300 dark:hover:border-orange-700 hover:shadow-md cursor-pointer dark:border-gray-800"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">{a.campaign}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${a.severity==='high'?'bg-red-100 text-red-800':a.severity==='medium'?'bg-yellow-100 text-yellow-800':'bg-blue-100 text-blue-800'}`}>{a.severity.toUpperCase()}</span>
                </div>
                <div className="text-sm mt-1">{a.message}</div>
                <div className="text-xs text-muted-foreground">{new Date(a.timestamp).toLocaleString()}</div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
      </motion.div>
    </div>
  );
}
