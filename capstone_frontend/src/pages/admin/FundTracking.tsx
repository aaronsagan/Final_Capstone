import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Wallet, RefreshCw, TriangleAlert, Heart, Download, Filter, Calendar, MapPin, Users, Target, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Summary {
  total_donations_received: number;
  total_funds_utilized: number;
  campaigns_tracked: number;
  net_available: number;
}

interface FlowPoint { 
  label: string; 
  donations_received: number; 
  funds_utilized: number;
}

interface Anomaly { 
  id: number; 
  type: string; 
  campaign: string; 
  severity: "low"|"medium"|"high"; 
  message: string; 
  timestamp: string;
}

interface Donation {
  id: number;
  donor_name: string;
  charity_name: string;
  campaign_name: string;
  amount: number;
  date: string;
}

interface FundUsage {
  id: number;
  charity_name: string;
  campaign_name: string;
  amount: number;
  category: string;
  date: string;
  description: string;
}

interface CampaignAnalytics {
  campaign_type: string;
  frequency_weekly: number;
  frequency_monthly: number;
  top_charity: string;
  typical_fund_min: number;
  typical_fund_max: number;
  beneficiaries_count: number;
  frequent_location: string;
  total_conducted: number;
}

export default function FundTracking() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [series, setSeries] = useState<FlowPoint[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [fundUsages, setFundUsages] = useState<FundUsage[]>([]);
  const [campaignAnalytics, setCampaignAnalytics] = useState<CampaignAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30d");
  const [search, setSearch] = useState("");
  const [charityFilter, setCharityFilter] = useState("");
  const [donorFilter, setDonorFilter] = useState("");

  const apiBase = import.meta.env.VITE_API_URL;
  const getToken = () => localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");

  const fetchAll = async () => {
    try {
      setLoading(true);
      const qs = new URLSearchParams({ range });
      if (search) qs.append("search", search);
      if (charityFilter) qs.append("charity", charityFilter);
      if (donorFilter) qs.append("donor", donorFilter);
      
      const token = getToken();
      const headers = { Authorization: `Bearer ${token}` };
      
      const [sumRes, seriesRes, anomRes] = await Promise.all([
        fetch(`${apiBase}/admin/funds/summary?${qs.toString()}`, { headers }),
        fetch(`${apiBase}/admin/funds/flows?${qs.toString()}`, { headers }),
        fetch(`${apiBase}/admin/funds/anomalies?${qs.toString()}`, { headers }),
      ]);
      
      if (sumRes.ok) {
        const data = await sumRes.json();
        setSummary({
          total_donations_received: data.total_inflow || 0,
          total_funds_utilized: data.total_outflow || 0,
          campaigns_tracked: data.campaigns_tracked || 0,
          net_available: (data.total_inflow || 0) - (data.total_outflow || 0)
        });
      } else {
        setSummary({ 
          total_donations_received: 0, 
          total_funds_utilized: 0, 
          campaigns_tracked: 0,
          net_available: 0 
        });
      }
      
      if (seriesRes.ok) {
        const data = await seriesRes.json();
        setSeries(data.map((item: any) => ({
          label: item.label,
          donations_received: item.inflow || 0,
          funds_utilized: item.outflow || 0
        })));
      } else {
        setSeries([]);
      }
      
      setAnomalies(anomRes.ok ? await anomRes.json() : []);
      fetchDonations();
      fetchFundUsages();
      fetchCampaignAnalytics();
      
    } catch (error) {
      console.error("Error fetching fund tracking data:", error);
      setSummary({ total_donations_received: 0, total_funds_utilized: 0, campaigns_tracked: 0, net_available: 0 });
      setSeries([]); 
      setAnomalies([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDonations = () => {
    setDonations([
      { id: 1, donor_name: "John Doe", charity_name: "Hope Foundation", campaign_name: "Education Fund", amount: 5000, date: "2024-01-15" },
      { id: 2, donor_name: "Jane Smith", charity_name: "Care Center", campaign_name: "Medical Aid", amount: 3000, date: "2024-01-16" },
      { id: 3, donor_name: "Bob Johnson", charity_name: "Hope Foundation", campaign_name: "Food Drive", amount: 2500, date: "2024-01-17" },
    ]);
  };

  const fetchFundUsages = () => {
    setFundUsages([
      { id: 1, charity_name: "Hope Foundation", campaign_name: "Education Fund", amount: 2000, category: "School Supplies", date: "2024-01-20", description: "Books and materials for 50 students" },
      { id: 2, charity_name: "Care Center", campaign_name: "Medical Aid", amount: 1500, category: "Medical Equipment", date: "2024-01-21", description: "First aid kits and medicines" },
      { id: 3, charity_name: "Hope Foundation", campaign_name: "Food Drive", amount: 1200, category: "Food & Nutrition", date: "2024-01-22", description: "Groceries for 30 families" },
    ]);
  };

  const fetchCampaignAnalytics = () => {
    setCampaignAnalytics([
      { campaign_type: "Education Support", frequency_weekly: 2, frequency_monthly: 8, top_charity: "Hope Foundation", typical_fund_min: 5000, typical_fund_max: 15000, beneficiaries_count: 150, frequent_location: "Metro Manila", total_conducted: 24 },
      { campaign_type: "Medical Assistance", frequency_weekly: 1, frequency_monthly: 4, top_charity: "Care Center", typical_fund_min: 10000, typical_fund_max: 30000, beneficiaries_count: 80, frequent_location: "Cebu City", total_conducted: 16 },
      { campaign_type: "Food & Nutrition", frequency_weekly: 3, frequency_monthly: 12, top_charity: "Community Outreach", typical_fund_min: 3000, typical_fund_max: 10000, beneficiaries_count: 200, frequent_location: "Davao City", total_conducted: 36 },
    ]);
  };

  const exportData = () => toast.success("Exporting fund allocation summary...");

  useEffect(() => { fetchAll(); }, [range, search, charityFilter, donorFilter]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between"><Skeleton className="h-8 w-64" /><Skeleton className="h-10 w-24" /></div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_,i)=>(<Card key={i}><CardHeader><Skeleton className="h-4 w-24"/></CardHeader><CardContent><Skeleton className="h-6 w-20"/></CardContent></Card>))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <motion.div className="flex items-center justify-between flex-wrap gap-4" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">Fund Tracking Management</h1>
          <p className="text-muted-foreground mt-1">Monitor donation collection and fund utilization across all charities</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportData}><Download className="h-4 w-4 mr-2"/>Export Report</Button>
          <Button variant="outline" size="sm" onClick={fetchAll}><RefreshCw className="h-4 w-4 mr-2"/>Refresh</Button>
        </div>
      </motion.div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Filter className="h-5 w-5" />Filters</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-3 flex-wrap">
            <Input placeholder="Search campaign or charity..." value={search} onChange={(e)=>setSearch(e.target.value)} className="w-64" />
            <Input placeholder="Filter by charity..." value={charityFilter} onChange={(e)=>setCharityFilter(e.target.value)} className="w-48" />
            <Input placeholder="Filter by donor..." value={donorFilter} onChange={(e)=>setDonorFilter(e.target.value)} className="w-48" />
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Date Range"/></SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { icon: Heart, label: "Donations Received", value: summary?.total_donations_received, desc: "Total collected from donors", color: "green" },
          { icon: Target, label: "Funds Utilized", value: summary?.total_funds_utilized, desc: "Deployed to programs", color: "blue" },
          { icon: Wallet, label: "Net Available", value: summary?.net_available, desc: "Remaining funds", color: "purple" },
          { icon: BarChart3, label: "Active Campaigns", value: summary?.campaigns_tracked, desc: "Being monitored", color: "orange", isCurrency: false }
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * (i + 1) }}>
            <Card className="hover:shadow-xl hover:scale-[1.02] transition-all">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <stat.icon className="h-4 w-4" />{stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{stat.isCurrency === false ? (stat.value || 0) : `₱${(stat.value||0).toLocaleString()}`}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="donations">Donations</TabsTrigger>
          <TabsTrigger value="utilization">Utilization</TabsTrigger>
          <TabsTrigger value="analytics">Campaign Analytics</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader><CardTitle className="text-green-700">Donations vs Fund Utilization Trend</CardTitle></CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="donations_received" fill="#10b981" name="Donations Received" radius={[6,6,0,0]} />
                  <Bar dataKey="funds_utilized" fill="#3b82f6" name="Funds Utilized" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="donations">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Heart className="h-5 w-5 text-green-600" />Donation Records</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Donor</TableHead>
                      <TableHead>Charity</TableHead>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {donations.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell>#{d.id}</TableCell>
                        <TableCell>{d.donor_name}</TableCell>
                        <TableCell>{d.charity_name}</TableCell>
                        <TableCell>{d.campaign_name}</TableCell>
                        <TableCell className="font-semibold text-green-600">₱{d.amount.toLocaleString()}</TableCell>
                        <TableCell>{new Date(d.date).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="utilization">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-blue-600" />Fund Usage Logs</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Charity</TableHead>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fundUsages.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>#{u.id}</TableCell>
                        <TableCell>{u.charity_name}</TableCell>
                        <TableCell>{u.campaign_name}</TableCell>
                        <TableCell><Badge variant="outline">{u.category}</Badge></TableCell>
                        <TableCell className="font-semibold text-blue-600">₱{u.amount.toLocaleString()}</TableCell>
                        <TableCell>{new Date(u.date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{u.description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-700"><BarChart3 className="h-5 w-5" />Campaign Type Analytics</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">Detailed analysis of campaign types, frequency, charities, fund ranges, beneficiaries, and locations</p>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {campaignAnalytics.map((a, i) => (
                  <motion.div key={a.campaign_type} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="border rounded-lg p-5 space-y-4 hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-purple-700">{a.campaign_type}</h3>
                      <Badge variant="secondary">{a.total_conducted} Campaigns Conducted</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-blue-700"><Calendar className="h-4 w-4" />Campaign Frequency</div>
                        <div className="text-sm font-semibold mt-1">{a.frequency_weekly} per week</div>
                        <div className="text-xs text-blue-600">{a.frequency_monthly} per month</div>
                      </div>
                      <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-green-700"><Users className="h-4 w-4" />Leading Charity</div>
                        <div className="text-sm font-semibold mt-1">{a.top_charity}</div>
                      </div>
                      <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-purple-700"><Wallet className="h-4 w-4" />Typical Fund Range</div>
                        <div className="text-sm font-semibold mt-1">₱{a.typical_fund_min.toLocaleString()} - ₱{a.typical_fund_max.toLocaleString()}</div>
                      </div>
                      <div className="p-3 bg-pink-50 dark:bg-pink-950/20 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-pink-700"><Heart className="h-4 w-4" />Beneficiaries Served</div>
                        <div className="text-sm font-semibold mt-1">{a.beneficiaries_count} people</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                      <MapPin className="h-4 w-4 text-orange-600" />
                      <span className="text-orange-700">Most Frequent Location:</span>
                      <span className="font-medium">{a.frequent_location}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-orange-700"><TriangleAlert className="h-5 w-5"/>Fund Monitoring Alerts</CardTitle></CardHeader>
            <CardContent className="pt-6">
              {anomalies.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TriangleAlert className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No alerts detected for the selected period.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {anomalies.map((a, i)=> (
                    <motion.div key={a.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="border rounded-lg p-4 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{a.campaign}</div>
                        <Badge variant={a.severity==="high"?"destructive":"secondary"}>{a.severity.toUpperCase()}</Badge>
                      </div>
                      <div className="text-sm mt-1">{a.message}</div>
                      <div className="text-xs text-muted-foreground mt-1">{new Date(a.timestamp).toLocaleString()}</div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
