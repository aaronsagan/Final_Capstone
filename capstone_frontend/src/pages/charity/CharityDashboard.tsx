import { useEffect, useState } from "react";
import { 
  Coins, 
  Megaphone, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle,
  XCircle,
  Plus,
  Heart,
  MessageCircle,
  Calendar,
  ArrowRight
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { authService } from "@/services/auth";
import { charityService } from "@/services/charity";
import { toast } from "sonner";
import { getCharityCoverUrl } from "@/lib/storage";

export default function CharityDashboard() {
  const navigate = useNavigate();
  const [charityData, setCharityData] = useState<any>(null);
  const [verificationStatus, setVerificationStatus] = useState<'pending'|'approved'|'rejected'>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDonationsMonth: 0,
    totalDonationsAllTime: 0,
    activeCampaigns: 0,
    donorsThisMonth: 0,
    pendingConfirmations: 0,
    newInteractions: 0
  });

  const [recentDonations, setRecentDonations] = useState<any[]>([]);
  const [recentUpdate, setRecentUpdate] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const token = authService.getToken();
      if (!token) {
        navigate('/auth/login');
        return;
      }

      // Get charity data
      const res = await fetch(`${import.meta.env.VITE_API_URL}/me`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
      });
      
      if (!res.ok) {
        toast.error('Failed to load charity data');
        return;
      }

      const me = await res.json();
      const charity = me?.charity;
      
      if (!charity) {
        toast.error('No charity found for this account');
        return;
      }

      setCharityData(charity);
      const status = charity.verification_status as 'pending'|'approved'|'rejected' | undefined;
      if (status) setVerificationStatus(status);

      // Load dashboard stats in parallel
      await Promise.all([
        loadStats(charity.id),
        loadRecentDonations(charity.id),
        loadRecentPosts(charity.id)
      ]);

    } catch (error: any) {
      console.error('Failed to load dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async (charityId: number) => {
    try {
      const token = authService.getToken();
      if (!token) return;

      // Get donations data
      const donationsRes = await fetch(
        `${import.meta.env.VITE_API_URL}/charities/${charityId}/donations`,
        { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }
      );

      if (donationsRes.ok) {
        const donations = await donationsRes.json();
        const allDonations = donations.data || donations;

        // Calculate stats
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const thisMonthDonations = allDonations.filter((d: any) => {
          const donationDate = new Date(d.donated_at || d.created_at);
          return donationDate.getMonth() === currentMonth && 
                 donationDate.getFullYear() === currentYear &&
                 (d.status === 'completed' || d.status === 'confirmed');
        });

        const confirmedDonations = allDonations.filter((d: any) => d.status === 'completed' || d.status === 'confirmed');
        const pendingDonations = allDonations.filter((d: any) => d.status === 'pending');

        // Ensure amounts are properly parsed as numbers and handle potential string values with commas
        const parseAmount = (amount: any) => {
          if (typeof amount === 'string') {
            // Remove any non-numeric characters except decimal point
            const numStr = amount.replace(/[^\d.]/g, '');
            return parseFloat(numStr) || 0;
          }
          return parseFloat(amount) || 0;
        };

        const totalMonth = thisMonthDonations.reduce((sum: number, d: any) => sum + parseAmount(d.amount), 0);
        const totalAllTime = confirmedDonations.reduce((sum: number, d: any) => sum + parseAmount(d.amount), 0);

        // Get unique donors this month (prefer stable IDs)
        const uniqueDonors = new Set(thisMonthDonations.map((d: any) => d.donor_id || d.donor?.id || d.donor_name));

        setStats(prev => ({
          ...prev,
          totalDonationsMonth: totalMonth,
          totalDonationsAllTime: totalAllTime,
          donorsThisMonth: uniqueDonors.size,
          pendingConfirmations: pendingDonations.length
        }));
      }

      // Get campaigns data
      const campaignsRes = await fetch(
        `${import.meta.env.VITE_API_URL}/charities/${charityId}/campaigns`,
        { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }
      );

      if (campaignsRes.ok) {
        const campaigns = await campaignsRes.json();
        const campaignList = campaigns.data || campaigns;
        const activeCampaigns = campaignList.filter((c: any) => c.status === 'active');
        
        setStats(prev => ({
          ...prev,
          activeCampaigns: activeCampaigns.length
        }));
      }

      // Get updates data for interactions count
      const updatesRes = await fetch(
        `${import.meta.env.VITE_API_URL}/charities/${charityId}/updates`,
        { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }
      );

      if (updatesRes.ok) {
        const updates = await updatesRes.json();
        const updateList = updates.data || updates;
        
        // Calculate new interactions (likes + comments from recent updates)
        const recentUpdates = updateList.slice(0, 5);
        const interactions = recentUpdates.reduce((sum: number, u: any) => {
          const likes = u.likes_count ?? u.like_count ?? 0;
          const comments = u.comments_count ?? (Array.isArray(u.comments) ? u.comments.length : 0) ?? 0;
          return sum + likes + comments;
        }, 0);

        setStats(prev => ({
          ...prev,
          newInteractions: interactions
        }));
      }

    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadRecentDonations = async (charityId: number) => {
    try {
      const token = authService.getToken();
      if (!token) return;

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/charities/${charityId}/donations`,
        { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }
      );

      if (res.ok) {
        const data = await res.json();
        const donations = data.data || data;
        
        // Get confirmed donations, sorted by date
        const parseAmount = (amount: any) => {
          if (typeof amount === 'string') {
            const numStr = amount.replace(/[^\d.]/g, '');
            return parseFloat(numStr) || 0;
          }
          return parseFloat(amount) || 0;
        };

        const confirmed = donations
          .filter((d: any) => d.status === 'completed' || d.status === 'confirmed')
          .sort((a: any, b: any) => new Date(b.donated_at || b.created_at).getTime() - new Date(a.donated_at || a.created_at).getTime())
          .slice(0, 4)
          .map((d: any) => ({
            donor: d.donor?.name || d.donor_name || 'Anonymous',
            amount: parseAmount(d.amount || 0),
            campaign: d.campaign?.title || 'General Fund',
            date: formatTimeAgo(d.donated_at || d.created_at)
          }));

        setRecentDonations(confirmed);
      }
    } catch (error) {
      console.error('Failed to load recent donations:', error);
    }
  };

  const loadRecentPosts = async (charityId: number) => {
    try {
      const token = authService.getToken();
      if (!token) return;

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/charities/${charityId}/updates`,
        { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }
      );

      if (res.ok) {
        const data = await res.json();
        const posts = data.data || data;
        
        if (posts.length > 0) {
          const sorted = [...posts].sort((a: any, b: any) => new Date(b.created_at || b.updated_at).getTime() - new Date(a.created_at || a.updated_at).getTime());
          const latest = sorted[0];
          setRecentUpdate({
            title: latest.title || 'Update',
            snippet: latest.content ? latest.content.substring(0, 100) + '...' : 'No content',
            likes: latest.likes_count ?? latest.like_count ?? 0,
            comments: latest.comments_count ?? (Array.isArray(latest.comments) ? latest.comments.length : 0) ?? 0,
            date: formatTimeAgo(latest.created_at || latest.updated_at)
          });
        }
      }
    } catch (error) {
      console.error('Failed to load recent posts:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-600 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            VERIFIED
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            PENDING REVIEW
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            ACTION REQUIRED
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const coverImageUrl = getCharityCoverUrl(charityData?.cover_image);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section with Cover Photo */}
      <div className="relative h-80 overflow-hidden">
        {/* Cover Image */}
        {coverImageUrl ? (
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${coverImageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {/* Gradient Overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-primary/50">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          </div>
        )}
        
        {/* Hero Content intentionally empty to avoid text overlay on image */}
        <div className="relative h-full" />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Header Card below the cover image */}
        <Card className="border-2 shadow-lg bg-gradient-to-r from-primary/5 via-background to-background">
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-3xl md:text-4xl">
                {charityData?.name || 'Your Charity Name'}
              </CardTitle>
              <CardDescription className="mt-2 max-w-3xl">
                {charityData?.mission || 'Empowering communities through sustainable programs and transparent fundraising.'}
              </CardDescription>
            </div>
            <div className="shrink-0 self-start md:self-center">
              {getVerificationBadge(verificationStatus)}
            </div>
          </CardHeader>
        </Card>
        
        {/* 1. Actionable Alerts & To-Do Card */}
        <Card className="border-2 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Action Required</CardTitle>
            <CardDescription>Important tasks that need your attention</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {/* Pending Donations */}
            <button
              onClick={() => navigate('/charity/donations')}
              className="flex flex-col items-start p-4 rounded-lg border-2 border-orange-200 bg-orange-50 dark:bg-orange-950/30 hover:border-orange-400 hover:bg-orange-100/60 transition-all text-left group"
            >
              <div className="flex items-center justify-between w-full mb-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="text-3xl font-bold text-orange-600 mb-1">
                {stats.pendingConfirmations}
              </div>
              <div className="text-sm font-medium">Donations Pending</div>
              <div className="text-xs text-muted-foreground">Click to review</div>
            </button>

            {/* Verification Status */}
            <div className="flex flex-col items-start p-4 rounded-lg border-2 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30">
              <div className="mb-3">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="mb-2">
                {getVerificationBadge(verificationStatus)}
              </div>
              <div className="text-sm font-medium">Verification Status</div>
              <div className="text-xs text-muted-foreground mt-1">
                {verificationStatus === 'approved' && 'Your charity is verified'}
                {verificationStatus === 'pending' && 'Under admin review'}
                {verificationStatus === 'rejected' && 'Please update documents'}
              </div>
            </div>

            {/* New Interactions */}
            <button
              onClick={() => navigate('/charity/updates')}
              className="flex flex-col items-start p-4 rounded-lg border-2 border-blue-200 bg-blue-50 dark:bg-blue-950/30 hover:border-blue-400 hover:bg-blue-100/60 transition-all text-left group"
            >
              <div className="flex items-center justify-between w-full mb-2">
                <MessageCircle className="h-5 w-5 text-blue-600" />
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {stats.newInteractions}
              </div>
              <div className="text-sm font-medium">New Interactions</div>
              <div className="text-xs text-muted-foreground">Comments & likes</div>
            </button>
          </CardContent>
        </Card>

        {/* 2. Key Statistics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 border-green-200 bg-green-50 dark:bg-green-950/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <span className="text-green-600 dark:text-green-500 font-bold">₱</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              ₱{stats.totalDonationsMonth.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total donations received
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary/30 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">All Time</CardTitle>
            <TrendingUp className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ₱{stats.totalDonationsAllTime.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Grand total raised
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-200 bg-orange-50 dark:bg-orange-950/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Megaphone className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.activeCampaigns}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently running
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200 bg-blue-50 dark:bg-blue-950/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Donors This Month</CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.donorsThisMonth}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Unique supporters
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Quick Actions Card */}
      <Card className="border-2 border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Manage your charity operations efficiently</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button size="lg" onClick={() => navigate('/charity/donations')} className="flex-1 min-w-[200px] bg-green-600 hover:bg-green-700 text-white">
            <Plus className="mr-2 h-5 w-5" />
            Log a New Donation
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/charity/updates')} className="flex-1 min-w-[200px] border-blue-300 text-blue-700 hover:bg-blue-50">
            <Plus className="mr-2 h-5 w-5" />
            Create a New Update
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/charity/campaigns')} className="flex-1 min-w-[200px] border-purple-300 text-purple-700 hover:bg-purple-50">
            <Plus className="mr-2 h-5 w-5" />
            Start a New Campaign
          </Button>
        </CardContent>
      </Card>

      {/* 4. Recent Activity Feed */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Donations */}
        <Card className="border-2 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Donations</CardTitle>
                <CardDescription>Latest contributions from your supporters</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/charity/donations')}>
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentDonations.length > 0 ? (
              <ScrollArea className="h-[280px] pr-4">
                <div className="space-y-4">
                  {recentDonations.map((donation, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Coins className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          <span className="font-semibold">{donation.donor}</span> donated{' '}
                          <span className="text-green-600 font-bold">₱{donation.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          to {donation.campaign}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          <Calendar className="inline h-3 w-3 mr-1" />
                          {donation.date}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="h-[280px] flex items-center justify-center">
                <div className="text-center">
                  <Coins className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <h4 className="font-semibold mb-2">No donations yet</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Confirmed donations will appear here
                  </p>
                  <Button variant="outline" onClick={() => navigate('/charity/donations')}>
                    View All Donations
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Updates */}
        <Card className="border-2 border-blue-200 bg-blue-50 dark:bg-blue-950/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Updates</CardTitle>
                <CardDescription>Your latest post activity</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/charity/updates')}>
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUpdate ? (
                <div className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => navigate('/charity/updates')}>
                  <h4 className="font-semibold mb-2">{recentUpdate.title}</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {recentUpdate.snippet}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4 text-red-500" />
                      <span>{recentUpdate.likes} likes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4 text-blue-500" />
                      <span>{recentUpdate.comments} comments</span>
                    </div>
                    <div className="flex items-center gap-1 ml-auto">
                      <Calendar className="h-4 w-4" />
                      <span>{recentUpdate.date}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-lg border text-center">
                  <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <h4 className="font-semibold mb-2">No updates yet</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    You haven't posted any updates
                  </p>
                </div>
              )}

              {/* Call to Action */}
              <div className="p-6 rounded-lg border-2 border-dashed border-muted-foreground/25 text-center">
                <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h4 className="font-semibold mb-2">Share Your Impact</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Keep your donors engaged by posting regular updates about your work
                </p>
                <Button onClick={() => navigate('/charity/updates')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Update
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
  );
}
