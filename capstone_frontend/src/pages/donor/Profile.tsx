import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, TrendingUp, Award, Calendar, Settings, Share2, ExternalLink, DollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/auth";

interface DonationActivity {
  id: number;
  amount: number;
  donated_at: string;
  charity: { id: number; name: string; logo_path?: string };
  campaign?: { id: number; title: string } | null;
  status: string;
}

interface CharitySupported {
  id: number;
  name: string;
  logo_path?: string;
  total_donated: number;
}

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDonated: 0,
    campaignsSupported: 0,
    charitiesSupported: 0,
    donationsMade: 0,
  });
  const [recentDonations, setRecentDonations] = useState<DonationActivity[]>([]);
  const [supportedCharities, setSupportedCharities] = useState<CharitySupported[]>([]);
  const [achievements, setAchievements] = useState<string[]>([]);

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const token = authService.getToken();
      
      // Fetch donations
      const donationsRes = await fetch(`${API_URL}/me/donations`, {
        headers: {
          Accept: 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        }
      });
      
      if (donationsRes.ok) {
        const donationsData = await donationsRes.json();
        const donations: DonationActivity[] = donationsData.data || donationsData || [];
        
        // Calculate stats
        const completed = donations.filter(d => d.status === 'completed');
        const totalDonated = completed.reduce((sum, d) => sum + d.amount, 0);
        const campaignsSupported = new Set(donations.map(d => d.campaign?.id).filter(Boolean)).size;
        const charitiesSupported = new Set(donations.map(d => d.charity.id)).size;
        
        setStats({
          totalDonated,
          campaignsSupported,
          charitiesSupported,
          donationsMade: donations.length,
        });
        
        // Set recent donations (last 5)
        setRecentDonations(donations.slice(0, 5));
        
        // Calculate charities with total donated
        const charityMap = new Map<number, CharitySupported>();
        completed.forEach(d => {
          const existing = charityMap.get(d.charity.id);
          if (existing) {
            existing.total_donated += d.amount;
          } else {
            charityMap.set(d.charity.id, {
              id: d.charity.id,
              name: d.charity.name,
              logo_path: d.charity.logo_path,
              total_donated: d.amount,
            });
          }
        });
        
        setSupportedCharities(
          Array.from(charityMap.values())
            .sort((a, b) => b.total_donated - a.total_donated)
            .slice(0, 4)
        );
        
        // Calculate achievements
        const badges: string[] = [];
        if (donations.length > 0) badges.push("First Donation");
        if (campaignsSupported >= 5) badges.push("5 Campaigns Supported");
        if (totalDonated >= 10000) badges.push("₱10,000 Donated");
        if (totalDonated >= 50000) badges.push("Gold Donor");
        if (charitiesSupported >= 3) badges.push("Community Champion");
        setAchievements(badges);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const copyProfileLink = () => {
    const link = `${window.location.origin}/donor/profile`;
    navigator.clipboard.writeText(link);
    toast.success('Profile link copied to clipboard!');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-600">Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div>
      {/* Hero Section with Profile Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Profile Picture */}
            <Avatar className="h-32 w-32 ring-4 ring-primary/10">
              <AvatarImage 
                src={user?.profile_image ? `${API_URL}/storage/${user.profile_image}` : undefined} 
                alt={user?.name} 
              />
              <AvatarFallback className="text-3xl bg-primary/10 text-primary font-bold">
                {user?.name?.charAt(0) || 'D'}
              </AvatarFallback>
            </Avatar>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold">{user?.name || 'Donor'}</h1>
                {achievements.includes("Gold Donor") && (
                  <Badge className="bg-amber-500 hover:bg-amber-600">
                    <Award className="h-3 w-3 mr-1" />
                    Gold Donor
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-lg mb-3">
                @{user?.email?.split('@')[0] || 'donor'}
              </p>
              <p className="text-muted-foreground max-w-2xl">
                Helping communities one step at a time. Making a difference through charitable giving.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button onClick={() => navigate('/donor/settings')} variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
              <Button onClick={copyProfileLink} variant="outline" size="icon">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
        {/* Impact Overview Cards */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Impact Overview</h2>
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Donated</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  ₱{stats.totalDonated.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Campaigns Supported</CardTitle>
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{stats.campaignsSupported}</div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Charities Supported</CardTitle>
                  <Heart className="h-4 w-4 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">{stats.charitiesSupported}</div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Donations Made</CardTitle>
                  <Award className="h-4 w-4 text-amber-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-600">{stats.donationsMade}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Achievements */}
        {achievements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-500" />
                Achievements
              </CardTitle>
              <CardDescription>Your milestones and badges</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {achievements.map((achievement, index) => (
                  <Badge key={index} variant="outline" className="px-4 py-2 text-sm">
                    <Award className="h-3 w-3 mr-2 text-amber-500" />
                    {achievement}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Your latest donations</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/donor/history')}>
                  View All
                  <ExternalLink className="ml-2 h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentDonations.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No donations yet</p>
              ) : (
                <div className="space-y-4">
                  {recentDonations.map((donation) => (
                    <div key={donation.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <Avatar className="h-10 w-10">
                        <AvatarImage 
                          src={donation.charity.logo_path ? `${API_URL}/storage/${donation.charity.logo_path}` : undefined} 
                        />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {donation.charity.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{donation.campaign?.title || 'General Fund'}</p>
                        <p className="text-xs text-muted-foreground">{donation.charity.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {new Date(donation.donated_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">₱{donation.amount.toLocaleString()}</p>
                        {getStatusBadge(donation.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Supported Charities */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Supported Charities</CardTitle>
                  <CardDescription>Organizations you've helped</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/donor/charities')}>
                  View All
                  <ExternalLink className="ml-2 h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {supportedCharities.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No charities supported yet</p>
              ) : (
                <div className="space-y-4">
                  {supportedCharities.map((charity) => (
                    <div 
                      key={charity.id} 
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/donor/charity/${charity.id}`)}
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage 
                          src={charity.logo_path ? `${API_URL}/storage/${charity.logo_path}` : undefined} 
                        />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {charity.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{charity.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Total donated: <span className="font-semibold text-green-600">₱{charity.total_donated.toLocaleString()}</span>
                        </p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Member Info */}
        <Card>
          <CardHeader>
            <CardTitle>Member Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Member Since</p>
                <p className="font-semibold">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  }) : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Account Type</p>
                <Badge variant="outline">Donor</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <Badge className="bg-green-600">Active</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
