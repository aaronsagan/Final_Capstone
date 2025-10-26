import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  DollarSign,
  Users,
  Target,
  BarChart3,
  PieChart,
  FileText,
  Award,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { donationsService } from "@/services/donations";

interface DonorStats {
  name: string;
  email?: string;
  total: number;
  count: number;
}

interface CampaignStats {
  title: string;
  total: number;
  count: number;
}

export default function ReportsAnalytics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("month");
  const [donations, setDonations] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      if (!user?.charity?.id) return;
      const response = await donationsService.getCharityDonations(user.charity.id);
      setDonations(response.data);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const stats = {
    totalDonations: donations.filter(d => d.status === 'completed').reduce((sum, d) => sum + d.amount, 0),
    totalCount: donations.filter(d => d.status === 'completed').length,
    avgDonation: donations.filter(d => d.status === 'completed').length > 0 
      ? donations.filter(d => d.status === 'completed').reduce((sum, d) => sum + d.amount, 0) / donations.filter(d => d.status === 'completed').length
      : 0,
    thisMonth: donations.filter(d => {
      const date = new Date(d.donated_at);
      return date.getMonth() === currentMonth && 
             date.getFullYear() === currentYear &&
             d.status === 'completed';
    }).reduce((sum, d) => sum + d.amount, 0),
    lastMonth: donations.filter(d => {
      const date = new Date(d.donated_at);
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return date.getMonth() === lastMonth && 
             date.getFullYear() === lastMonthYear &&
             d.status === 'completed';
    }).reduce((sum, d) => sum + d.amount, 0),
  };

  const monthlyGrowth = stats.lastMonth > 0 
    ? ((stats.thisMonth - stats.lastMonth) / stats.lastMonth) * 100 
    : 0;

  // Top donors
  const donorMap = donations.reduce((acc, d) => {
    if (d.status !== 'completed' || d.is_anonymous) return acc;
    const donorId = d.donor?.id || 'unknown';
    if (!acc[donorId]) {
      acc[donorId] = {
        name: d.donor?.name || 'Unknown',
        email: d.donor?.email,
        total: 0,
        count: 0,
      };
    }
    acc[donorId].total += d.amount;
    acc[donorId].count += 1;
    return acc;
  }, {} as Record<string, DonorStats>);

  const topDonors: DonorStats[] = Object.values(donorMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Top campaigns
  const campaignMap = donations.reduce((acc, d) => {
    if (d.status !== 'completed') return acc;
    const campaignId = d.campaign?.id || 'general';
    if (!acc[campaignId]) {
      acc[campaignId] = {
        title: d.campaign?.title || 'General Donations',
        total: 0,
        count: 0,
      };
    }
    acc[campaignId].total += d.amount;
    acc[campaignId].count += 1;
    return acc;
  }, {} as Record<string, CampaignStats>);

  const topCampaigns: CampaignStats[] = Object.values(campaignMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Monthly donations for chart
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = i;
    const total = donations.filter(d => {
      const date = new Date(d.donated_at);
      return date.getMonth() === month && 
             date.getFullYear() === currentYear &&
             d.status === 'completed';
    }).reduce((sum, d) => sum + d.amount, 0);
    return { month: new Date(currentYear, month).toLocaleString('default', { month: 'short' }), total };
  });

  const maxMonthly = Math.max(...monthlyData.map(d => d.total), 1);

  // Donation sources
  const sources = {
    oneTime: donations.filter(d => !d.is_recurring && d.status === 'completed').length,
    recurring: donations.filter(d => d.is_recurring && d.status === 'completed').length,
  };

  const handleExport = (format: string) => {
    toast.info(`Exporting ${format.toUpperCase()} report...`);
    // TODO: Implement actual export
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Reports & Analytics</h1>
              <p className="text-muted-foreground">
                Track donation performance, campaign effectiveness, and generate transparency reports
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-[180px]">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => handleExport('pdf')}>
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Donations */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Donations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    ₱{stats.totalDonations.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    All time confirmed
                  </p>
                </CardContent>
              </Card>

              {/* This Month */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    This Month
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₱{stats.thisMonth.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {monthlyGrowth >= 0 ? (
                      <>
                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                        <span className="text-xs text-green-600 font-medium">
                          +{monthlyGrowth.toFixed(1)}%
                        </span>
                      </>
                    ) : (
                      <>
                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                        <span className="text-xs text-red-600 font-medium">
                          {monthlyGrowth.toFixed(1)}%
                        </span>
                      </>
                    )}
                    <span className="text-xs text-muted-foreground">vs last month</span>
                  </div>
                </CardContent>
              </Card>

              {/* Average Donation */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Average Donation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₱{isNaN(stats.avgDonation) || !isFinite(stats.avgDonation) ? '0.00' : stats.avgDonation.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Per donation
                  </p>
                </CardContent>
              </Card>

              {/* Total Count */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Donations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.totalCount}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Confirmed donations
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Monthly Donations Overview
                </CardTitle>
                <CardDescription>
                  Donation trends over the past 12 months
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Bar Chart */}
                <div className="space-y-4">
                  <div className="flex items-end justify-between h-64 gap-2">
                    {monthlyData.map((data, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full flex flex-col items-center">
                          <span className="text-xs font-medium mb-1">
                            {data.total > 0 ? `₱${(data.total / 1000).toFixed(0)}k` : ''}
                          </span>
                          <div
                            className="w-full bg-primary rounded-t transition-all hover:bg-primary/80 cursor-pointer"
                            style={{
                              height: `${(data.total / maxMonthly) * 200}px`,
                              minHeight: data.total > 0 ? '8px' : '0px',
                            }}
                            title={`${data.month}: ₱${data.total.toLocaleString()}`}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">
                          {data.month}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Donation Sources & Fund Allocation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Donation Sources */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-primary" />
                    Donation Sources
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>One-Time Donations</span>
                        <span className="font-medium">{sources.oneTime}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{
                            width: `${(sources.oneTime / (sources.oneTime + sources.recurring)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Recurring Donations</span>
                        <span className="font-medium">{sources.recurring}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all"
                          style={{
                            width: `${(sources.recurring / (sources.oneTime + sources.recurring)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Campaign Success Rates */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Campaign Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topCampaigns.slice(0, 3).map((campaign, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="truncate">{campaign.title}</span>
                          <span className="font-medium">₱{(campaign.total / 1000).toFixed(0)}k</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-600 rounded-full transition-all"
                            style={{
                              width: `${Math.min((campaign.total / topCampaigns[0].total) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI Insights */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Insights & Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {monthlyGrowth > 0 && (
                    <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
                      <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium">Positive Growth Trend</p>
                        <p className="text-sm text-muted-foreground">
                          This month's donations increased by {monthlyGrowth.toFixed(1)}% compared to last month.
                          Keep up the great work!
                        </p>
                      </div>
                    </div>
                  )}
                  {topCampaigns.length > 0 && (
                    <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
                      <Award className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">Top Performing Campaign</p>
                        <p className="text-sm text-muted-foreground">
                          "{topCampaigns[0].title}" is performing exceptionally well with ₱
                          {topCampaigns[0].total.toLocaleString()} raised. Consider promoting similar campaigns.
                        </p>
                      </div>
                    </div>
                  )}
                  {sources.recurring > 0 && (
                    <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
                      <Activity className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium">Recurring Donor Base</p>
                        <p className="text-sm text-muted-foreground">
                          You have {sources.recurring} recurring donors. Focus on retention strategies to maintain
                          this sustainable income stream.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar (1 col) */}
          <div className="space-y-6">
            {/* Top Donors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Top Donors
                </CardTitle>
                <CardDescription>Highest contributors this period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topDonors.length > 0 ? (
                    topDonors.map((donor, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{donor.name}</p>
                            <p className="text-xs text-muted-foreground">{donor.count} donations</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">₱{donor.total.toLocaleString()}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No donor data available yet
                    </p>
                  )}
                  {topDonors.length > 0 && (
                    <Button variant="outline" className="w-full mt-2">
                      View All Donors
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Campaigns */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Most Funded Campaigns
                </CardTitle>
                <CardDescription>Best performing campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topCampaigns.length > 0 ? (
                    topCampaigns.map((campaign, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm line-clamp-1">{campaign.title}</p>
                            <p className="text-xs text-muted-foreground">{campaign.count} donations</p>
                          </div>
                          <Badge variant="secondary" className="ml-2">
                            ₱{(campaign.total / 1000).toFixed(0)}k
                          </Badge>
                        </div>
                        {index < topCampaigns.length - 1 && <Separator />}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No campaign data available yet
                    </p>
                  )}
                  {topCampaigns.length > 0 && (
                    <Button variant="outline" className="w-full mt-2">
                      View All Campaigns
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Export & Reports */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Generate Reports
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={() => handleExport('pdf')}>
                  <Download className="h-4 w-4 mr-2" />
                  Monthly Report (PDF)
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => handleExport('csv')}>
                  <Download className="h-4 w-4 mr-2" />
                  Donation Data (CSV)
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => handleExport('xlsx')}>
                  <Download className="h-4 w-4 mr-2" />
                  Financial Report (XLSX)
                </Button>
                <Separator className="my-3" />
                <Button variant="default" className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  Transparency Report
                </Button>
              </CardContent>
            </Card>

            {/* Audit Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  Audit & Compliance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Verified Donations</span>
                  <Badge variant="secondary">{stats.totalCount}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Reports Generated</span>
                  <Badge variant="secondary">12</Badge>
                </div>
                <Separator />
                <Button variant="outline" size="sm" className="w-full">
                  Send to Admin
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
