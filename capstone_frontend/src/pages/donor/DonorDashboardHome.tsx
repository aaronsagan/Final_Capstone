import { useEffect, useState } from "react";
import { 
  Heart, 
  TrendingUp, 
  Users, 
  Award,
  ArrowRight,
  Calendar,
  Sparkles,
  Target,
  MessageCircle,
  Eye,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/context/AuthContext";
import { donorService, type DonorStats, type CharityUpdate, type SuggestedCampaign } from "@/services/donor";
import { toast } from "sonner";

export default function DonorDashboardHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DonorStats>({
    total_donated: 0,
    charities_supported: 0,
    donations_made: 0,
  });
  const [updates, setUpdates] = useState<CharityUpdate[]>([]);
  const [suggestedCampaigns, setSuggestedCampaigns] = useState<SuggestedCampaign[]>([]);
  const [loadingUpdates, setLoadingUpdates] = useState(false);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const statsData = await donorService.getDashboardStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }

    // Load updates in parallel
    fetchUpdates();
    fetchSuggestedCampaigns();
  };

  const fetchUpdates = async () => {
    try {
      setLoadingUpdates(true);
      const updatesData = await donorService.getSupportedCharitiesUpdates(4);
      setUpdates(updatesData);
    } catch (error) {
      console.error('Error fetching updates:', error);
    } finally {
      setLoadingUpdates(false);
    }
  };

  const fetchSuggestedCampaigns = async () => {
    try {
      setLoadingCampaigns(true);
      const campaignsData = await donorService.getSuggestedCampaigns(3);
      setSuggestedCampaigns(campaignsData);
    } catch (error) {
      console.error('Error fetching suggested campaigns:', error);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const calculateProgress = (current?: number, target?: number) => {
    if (!target || target === 0) return 0;
    return Math.min(Math.round(((current || 0) / target) * 100), 100);
  };

  const getMilestoneIcon = (count: number) => {
    if (count >= 50) return "🏆";
    if (count >= 25) return "🌟";
    if (count >= 10) return "💎";
    if (count >= 5) return "⭐";
    return "🎯";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero / Welcome Section */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-5xl font-bold">
              Welcome back, {user?.name?.split(' ')[0] || 'Friend'}!
            </h1>
          </div>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl">
            See the incredible impact you're making in the community.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button size="lg" onClick={() => navigate('/donor/donate')} className="shadow-lg">
              <Heart className="mr-2 h-5 w-5" />
              Make a Donation
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/donor/charities')}>
              Browse Charities
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-12">
        {/* Your Impact At-a-Glance */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Your Impact At-a-Glance
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Total Donated Card */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-border/40 hover:border-primary/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Donated</CardTitle>
                <div className="p-2 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 dark:text-green-500">
                  ₱{stats.total_donated.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Making a difference, one donation at a time
                </p>
              </CardContent>
            </Card>

            {/* Charities Supported Card */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-border/40 hover:border-primary/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Charities Supported</CardTitle>
                <div className="p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-500">
                  {stats.charities_supported}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Organizations you've helped
                </p>
              </CardContent>
            </Card>

            {/* Donations Made Card */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-border/40 hover:border-primary/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Donations Made</CardTitle>
                <div className="p-2 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                  <Heart className="h-5 w-5 text-purple-600 dark:text-purple-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-500">
                  {stats.donations_made}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Total contributions
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Your Giving Journey */}
        {stats.first_donation_date && (
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Award className="h-6 w-6 text-primary" />
              Your Giving Journey
            </h2>
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <div className="relative">
                  {/* Progress Bar */}
                  <div className="absolute top-8 left-0 right-0 h-2 bg-gradient-to-r from-primary/20 via-primary/40 to-primary rounded-full" />
                  
                  {/* Milestones */}
                  <div className="relative flex justify-between items-start">
                    {/* First Donation */}
                    <div className="flex flex-col items-center gap-2 z-10">
                      <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-2xl shadow-lg">
                        🎯
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold">First Donation</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(stats.first_donation_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    {/* Milestone Markers */}
                    {stats.donations_made >= 5 && (
                      <div className="flex flex-col items-center gap-2 z-10">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-2xl shadow-lg">
                          {getMilestoneIcon(stats.donations_made)}
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold">{stats.donations_made} Donations!</p>
                          <p className="text-xs text-muted-foreground">Amazing progress</p>
                        </div>
                      </div>
                    )}

                    {/* Latest Donation */}
                    {stats.latest_donation_date && (
                      <div className="flex flex-col items-center gap-2 z-10">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-2xl shadow-lg">
                          ✨
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold">Latest</p>
                          <p className="text-xs text-muted-foreground">
                            {formatTimeAgo(stats.latest_donation_date)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Achievement Badges */}
                {stats.charities_supported >= 3 && (
                  <div className="mt-8 pt-6 border-t">
                    <p className="text-sm font-medium mb-3">Your Achievements</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="px-3 py-1">
                        <Users className="h-3 w-3 mr-1" />
                        Supported {stats.charities_supported} Charities
                      </Badge>
                      {stats.donations_made >= 10 && (
                        <Badge variant="secondary" className="px-3 py-1">
                          <Award className="h-3 w-3 mr-1" />
                          Generous Donor
                        </Badge>
                      )}
                      {stats.total_donated >= 10000 && (
                        <Badge variant="secondary" className="px-3 py-1">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Impact Maker
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        {/* Latest Updates from Charities You Support */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <MessageCircle className="h-6 w-6 text-primary" />
              Latest Updates from Charities You Support
            </h2>
            <Button variant="ghost" onClick={() => navigate('/donor/news-feed')}>
              View All Updates
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {loadingUpdates ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : updates.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {updates.map((update) => (
                <Card key={update.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 ring-2 ring-background">
                        <AvatarImage
                          src={
                            update.charity?.logo_path
                              ? `${import.meta.env.VITE_API_URL}/storage/${update.charity.logo_path}`
                              : ""
                          }
                        />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {update.charity?.name?.substring(0, 2).toUpperCase() || "CH"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{update.charity?.name || "Charity"}</p>
                        <p className="text-xs text-muted-foreground">{formatTimeAgo(update.created_at)}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm line-clamp-3 leading-relaxed">{update.content}</p>
                    
                    {update.media_urls && update.media_urls.length > 0 && (
                      <div className="rounded-lg overflow-hidden">
                        <img
                          src={`${import.meta.env.VITE_API_URL}/storage/${update.media_urls[0]}`}
                          alt="Update"
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Heart className="h-3.5 w-3.5" />
                          {update.likes_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3.5 w-3.5" />
                          {update.comments_count}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/donor/news-feed')}
                      >
                        View Full Update
                        <ArrowRight className="ml-2 h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                No updates yet from charities you support.
              </p>
              <Button onClick={() => navigate('/donor/charities')}>
                Discover Charities
              </Button>
            </Card>
          )}
        </section>

        {/* Suggested Campaigns for You */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              Causes You Might Care About
            </h2>
            <Button variant="ghost" onClick={() => navigate('/donor/charities')}>
              Discover More Campaigns
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {loadingCampaigns ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : suggestedCampaigns.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {suggestedCampaigns.map((campaign) => {
                const progress = calculateProgress(campaign.current_amount, campaign.target_amount);
                const daysLeft = campaign.deadline_at
                  ? Math.max(
                      0,
                      Math.ceil(
                        (new Date(campaign.deadline_at).getTime() - new Date().getTime()) /
                          (1000 * 60 * 60 * 24)
                      )
                    )
                  : null;

                return (
                  <Card key={campaign.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300">
                    {/* Campaign Image */}
                    <div className="relative h-48 overflow-hidden bg-muted">
                      <img
                        src={
                          campaign.cover_image_path
                            ? `${import.meta.env.VITE_API_URL}/storage/${campaign.cover_image_path}`
                            : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23f0f0f0' width='400' height='300'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='24' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3ECampaign%3C/text%3E%3C/svg%3E"
                        }
                        alt={campaign.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      
                      {/* Charity Logo */}
                      <div className="absolute bottom-3 left-3">
                        <Avatar className="h-10 w-10 ring-2 ring-white">
                          <AvatarImage
                            src={
                              campaign.charity?.logo_path
                                ? `${import.meta.env.VITE_API_URL}/storage/${campaign.charity.logo_path}`
                                : ""
                            }
                          />
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                            {campaign.charity?.name?.substring(0, 2).toUpperCase() || "CH"}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>

                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                        {campaign.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {campaign.description || "Support this campaign"}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Progress */}
                      {campaign.target_amount && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Raised</span>
                            <span className="font-bold text-primary">{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>₱{(campaign.current_amount || 0).toLocaleString()}</span>
                            <span>of ₱{campaign.target_amount.toLocaleString()}</span>
                          </div>
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm">
                        {daysLeft !== null && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{daysLeft > 0 ? `${daysLeft} days left` : 'Ended'}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          className="flex-1"
                          onClick={() => navigate(`/campaigns/${campaign.id}`)}
                        >
                          <Heart className="mr-2 h-4 w-4" />
                          Donate Now
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => navigate(`/campaigns/${campaign.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                No campaign suggestions available at the moment.
              </p>
              <Button onClick={() => navigate('/donor/charities')}>
                Browse All Campaigns
              </Button>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
