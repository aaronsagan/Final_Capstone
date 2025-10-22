import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Heart,
  Users,
  Calendar,
  Share2,
  TrendingUp,
  Target,
  Facebook,
  Twitter,
  Link2,
  ChevronLeft,
  Image as ImageIcon,
  Clock,
  Trophy,
  Medal,
  Award,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { campaignService } from "@/services/campaigns";
import { charityService } from "@/services/charity";
import { buildStorageUrl } from "@/lib/api";

interface Campaign {
  id: number;
  title: string;
  description: string;
  goal: number;
  amountRaised: number;
  donorsCount: number;
  status: "active" | "completed" | "draft" | "expired";
  bannerImage?: string;
  endDate: string;
  createdAt: string;
  charity: {
    id: number;
    name: string;
    logo?: string;
  };
  story?: {
    problem: string;
    solution: string;
    outcome: string;
  };
  fundUsage?: Array<{
    category: string;
    amount: number;
  }>;
  gallery?: string[];
}

interface Update {
  id: number;
  content: string;
  createdAt: string;
  images?: string[];
}

interface Supporter {
  id: number;
  name: string;
  isAnonymous: boolean;
  donatedAt: string;
  amount: number;
  rank?: number;
}

export default function CampaignPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("story");

  useEffect(() => {
    loadCampaignData();
  }, [id]);

  const loadCampaignData = async () => {
    try {
      setLoading(true);
      
      if (!id) {
        throw new Error("Campaign ID is required");
      }

      // Fetch campaign details
      const campaignResponse = await campaignService.getCampaign(parseInt(id));
      
      // Map backend campaign to frontend format
      const mappedCampaign: Campaign = {
        id: campaignResponse.id,
        title: campaignResponse.title,
        description: campaignResponse.description || "",
        goal: campaignResponse.target_amount || 0,
        amountRaised: campaignResponse.current_amount || 0,
        donorsCount: 0, // Will be calculated from supporters
        status: mapBackendStatus(campaignResponse.status),
        bannerImage: campaignResponse.cover_image_path,
        endDate: campaignResponse.end_date || campaignResponse.deadline_at || "",
        createdAt: campaignResponse.start_date || campaignResponse.created_at,
        charity: {
          id: campaignResponse.charity?.id || campaignResponse.charity_id,
          name: campaignResponse.charity?.name || "",
          logo: campaignResponse.charity?.logo_path,
        },
        story: {
          problem: campaignResponse.problem || "",
          solution: campaignResponse.solution || "",
          outcome: campaignResponse.outcome || "",
        },
        fundUsage: [],
        gallery: [],
      };

      // If charity name/logo missing, fetch public charity profile
      if (!mappedCampaign.charity.name && mappedCampaign.charity.id) {
        try {
          const ch = await charityService.getPublicCharityProfile(mappedCampaign.charity.id);
          if (ch) {
            mappedCampaign.charity.name = ch.name || mappedCampaign.charity.name || "";
            mappedCampaign.charity.logo = ch.logo_path || mappedCampaign.charity.logo;
          }
        } catch (e) {
          // ignore; will fallback to unknown label later
        }
      }

      // Fetch updates (optional - graceful fallback)
      let campaignUpdates: Update[] = [];
      try {
        const updatesData = await campaignService.getCampaignUpdates(parseInt(id));
        if (Array.isArray(updatesData)) {
          campaignUpdates = updatesData.map((update: any) => ({
            id: update.id,
            content: update.content || update.text || "",
            createdAt: update.created_at || update.date,
            images: update.images || [],
          }));
        }
      } catch (err: any) {
        // Silently ignore - endpoint may not exist yet
      }

      // Fetch supporters (optional - graceful fallback)
      let campaignSupporters: Supporter[] = [];
      try {
        const supportersData = await campaignService.getCampaignSupporters(parseInt(id));
        if (Array.isArray(supportersData)) {
          campaignSupporters = supportersData
            .map((supporter: any, index: number) => ({
              id: supporter.id || supporter.donor_id,
              name: supporter.name || supporter.donor?.name || "Anonymous",
              isAnonymous: supporter.is_anonymous || false,
              donatedAt: supporter.donated_at || supporter.created_at,
              amount: supporter.amount || supporter.total_amount || 0,
              rank: index < 5 ? index + 1 : undefined,
            }))
            .sort((a: Supporter, b: Supporter) => b.amount - a.amount);
          
          // Update donor count
          mappedCampaign.donorsCount = campaignSupporters.length;
        }
      } catch (err: any) {
        // Silently ignore - endpoint may not exist yet
      }

      // Fetch fund usage (optional - graceful fallback)
      try {
        const fundUsageData = await campaignService.getCampaignFundUsage(parseInt(id));
        if (Array.isArray(fundUsageData)) {
          mappedCampaign.fundUsage = fundUsageData.map((item: any) => ({
            category: item.category || item.name,
            amount: item.amount || item.value || 0,
          }));
        }
      } catch (err: any) {
        // Silently ignore - endpoint may not exist yet
      }

      // Final fallback for display label
      if (!mappedCampaign.charity.name) {
        mappedCampaign.charity.name = "Unknown Charity";
      }
      setCampaign(mappedCampaign);
      setUpdates(campaignUpdates);
      setSupporters(campaignSupporters);
    } catch (error) {
      console.error("Failed to load campaign:", error);
      toast({
        title: "Error",
        description: "Failed to load campaign details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShare = (platform: "facebook" | "twitter" | "link") => {
    const url = window.location.href;
    const text = campaign?.title || "";

    switch (platform) {
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
        break;
      case "twitter":
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, "_blank");
        break;
      case "link":
        navigator.clipboard.writeText(url);
        toast({
          title: "Link Copied",
          description: "Campaign link copied to clipboard",
        });
        break;
    }
  };

  const mapBackendStatus = (status: string): "active" | "completed" | "draft" | "expired" => {
    switch (status) {
      case "published":
        return "active";
      case "closed":
        return "completed";
      case "archived":
        return "expired";
      case "draft":
      default:
        return "draft";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const progressPercentage = campaign
    ? Math.min(Math.round((campaign.amountRaised / campaign.goal) * 100), 100)
    : 0;

  const daysLeft = campaign
    ? Math.max(
        0,
        Math.ceil(
          (new Date(campaign.endDate).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  const statusConfig = {
    active: { label: "Active", color: "bg-green-500" },
    completed: { label: "Completed", color: "bg-blue-500" },
    draft: { label: "Draft", color: "bg-yellow-500" },
    expired: { label: "Expired", color: "bg-red-500" },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <p className="text-xl text-muted-foreground mb-4">Campaign not found</p>
          <Button onClick={() => navigate("/campaigns")}>Browse Campaigns</Button>
        </div>
      </div>
    );
  }

  const currentStatus = statusConfig[campaign.status];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner */}
      <div className="relative h-[400px] bg-muted overflow-hidden">
        {campaign.bannerImage ? (
          <img
            src={buildStorageUrl(campaign.bannerImage) || undefined}
            alt={campaign.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <ImageIcon className="h-24 w-24 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        {/* Back Button */}
        <Button
          variant="secondary"
          size="sm"
          className="absolute top-4 left-4 bg-white dark:bg-gray-900 hover:bg-white dark:hover:bg-gray-800 text-gray-900 dark:text-white shadow-lg border border-gray-200 dark:border-gray-700 backdrop-blur-sm"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>

        {/* Status Badge */}
        <Badge
          className={`absolute top-4 right-4 ${currentStatus.color} text-white border-0 shadow-lg px-3 py-1`}
        >
          {currentStatus.label}
        </Badge>

        {/* Title & Charity Info */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
              {campaign.title}
            </h1>
            <div
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate(`/charities/${campaign.charity.id}`)}
            >
              <Avatar className="h-12 w-12 ring-2 ring-white">
                <AvatarImage src={buildStorageUrl(campaign.charity.logo) || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {campaign.charity.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm text-white/80">Organized by</p>
                <p className="text-white font-semibold">{campaign.charity.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Content - Tabs */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="story">The Story</TabsTrigger>
                <TabsTrigger value="updates">Updates</TabsTrigger>
                <TabsTrigger value="usage">Fund Usage</TabsTrigger>
                <TabsTrigger value="supporters">Supporters</TabsTrigger>
              </TabsList>

              {/* Tab 1: The Story */}
              <TabsContent value="story" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>About This Campaign</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <p className="text-muted-foreground leading-relaxed">
                      {campaign.description}
                    </p>

                    {campaign.story && (
                      <>
                        <div>
                          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                            <span className="text-red-500">⚠️</span> The Problem
                          </h3>
                          <p className="text-muted-foreground leading-relaxed">
                            {campaign.story.problem}
                          </p>
                        </div>

                        <Separator />

                        <div>
                          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                            <span className="text-blue-500">💡</span> The Solution
                          </h3>
                          <p className="text-muted-foreground leading-relaxed">
                            {campaign.story.solution}
                          </p>
                        </div>

                        <Separator />

                        <div>
                          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                            <span className="text-green-500">🎯</span> Expected Outcome
                          </h3>
                          <p className="text-muted-foreground leading-relaxed">
                            {campaign.story.outcome}
                          </p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 2: Updates */}
              <TabsContent value="updates" className="space-y-4 mt-6">
                {updates.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground">No updates yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  updates.map((update) => (
                    <Card key={update.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3 mb-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={buildStorageUrl(campaign.charity.logo) || undefined} />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {campaign.charity.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-semibold">{campaign.charity.name}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(update.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <p className="text-foreground leading-relaxed">{update.content}</p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              {/* Tab 3: Fund Usage */}
              <TabsContent value="usage" className="space-y-4 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>How Your Donations Are Used</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {campaign.fundUsage && campaign.fundUsage.length > 0 ? (
                      <div className="space-y-4">
                        {campaign.fundUsage.map((item, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium">{item.category}</p>
                              <div className="mt-2">
                                <Progress
                                  value={(item.amount / campaign.goal) * 100}
                                  className="h-2"
                                />
                              </div>
                            </div>
                            <p className="ml-4 font-bold text-primary">
                              {formatCurrency(item.amount)}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        Fund usage breakdown will be available soon
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 4: Supporters - Leaderboard */}
              <TabsContent value="supporters" className="space-y-4 mt-6">
                {supporters.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Trophy className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground text-lg">No supporters yet</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Be the first to support this campaign!
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* Top 3 Donors - Podium Style */}
                    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Trophy className="h-5 w-5 text-primary" />
                          Top Donors
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                          {supporters.slice(0, 3).map((supporter, index) => {
                            const medals = [
                              { icon: Trophy, color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
                              { icon: Medal, color: "text-gray-400", bg: "bg-gray-400/10", border: "border-gray-400/20" },
                              { icon: Award, color: "text-orange-600", bg: "bg-orange-600/10", border: "border-orange-600/20" },
                            ];
                            const medal = medals[index];
                            const MedalIcon = medal.icon;

                            return (
                              <div
                                key={supporter.id}
                                className={`flex flex-col items-center p-4 rounded-lg border ${medal.bg} ${medal.border} ${
                                  index === 0 ? "ring-2 ring-primary/20" : ""
                                }`}
                              >
                                <div className="relative mb-3">
                                  <Avatar className={`h-16 w-16 ${index === 0 ? "ring-2 ring-primary" : ""}`}>
                                    <AvatarFallback className={`${medal.bg} ${medal.color} text-lg font-bold`}>
                                      {supporter.isAnonymous ? "?" : supporter.name.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className={`absolute -top-1 -right-1 ${medal.bg} rounded-full p-1.5 border-2 border-background`}>
                                    <MedalIcon className={`h-4 w-4 ${medal.color}`} />
                                  </div>
                                </div>
                                <p className="font-bold text-center text-sm mb-1">
                                  {supporter.isAnonymous ? "Anonymous Donor" : supporter.name}
                                </p>
                                <p className={`text-lg font-bold ${medal.color}`}>
                                  {formatCurrency(supporter.amount)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Rank #{supporter.rank}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    {/* All Supporters List */}
                    <Card>
                      <CardHeader>
                        <CardTitle>All Supporters ({supporters.length})</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {supporters.map((supporter, index) => {
                            const isTopThree = index < 3;
                            const rankColors = [
                              "text-yellow-600 bg-yellow-500/10",
                              "text-gray-600 bg-gray-400/10",
                              "text-orange-600 bg-orange-600/10",
                            ];

                            return (
                              <div
                                key={supporter.id}
                                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                                  isTopThree
                                    ? "bg-muted/50 border border-border/40"
                                    : "hover:bg-muted/30"
                                }`}
                              >
                                {/* Rank Badge */}
                                <div
                                  className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                                    isTopThree
                                      ? rankColors[index]
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {supporter.rank || index + 1}
                                </div>

                                {/* Avatar */}
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback className="bg-primary/10 text-primary">
                                    {supporter.isAnonymous ? "?" : supporter.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>

                                {/* Donor Info */}
                                <div className="flex-1">
                                  <p className="font-medium">
                                    {supporter.isAnonymous ? "Anonymous Donor" : supporter.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(supporter.donatedAt).toLocaleDateString()}
                                  </p>
                                </div>

                                {/* Amount */}
                                <div className="text-right">
                                  <p className="font-bold text-primary">
                                    {formatCurrency(supporter.amount)}
                                  </p>
                                  {isTopThree && (
                                    <p className="text-xs text-muted-foreground">Top Donor</p>
                                  )}
                                </div>

                                {/* Heart Icon */}
                                <Heart className="h-5 w-5 text-red-500 fill-red-500 flex-shrink-0" />
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar - Sticky Progress & CTA */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-4">
              <Card>
                <CardContent className="pt-6 space-y-6">
                  {/* Progress */}
                  <div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-3xl font-bold text-foreground">
                        {formatCurrency(campaign.amountRaised)}
                      </span>
                      <span className="text-muted-foreground">raised</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      of {formatCurrency(campaign.goal)} goal
                    </p>
                    <Progress value={progressPercentage} className="h-3" />
                    <p className="text-sm text-primary font-semibold mt-2">
                      {progressPercentage}% funded
                    </p>
                  </div>

                  <Separator />

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Users className="h-4 w-4" />
                        <span className="text-sm">Donors</span>
                      </div>
                      <p className="text-2xl font-bold">{campaign.donorsCount}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">Days Left</span>
                      </div>
                      <p className="text-2xl font-bold">
                        {daysLeft > 0 ? daysLeft : "Ended"}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* CTA Buttons */}
                  <div className="space-y-3">
                    <Button
                      size="lg"
                      className="w-full bg-primary hover:bg-primary/90 text-lg h-12"
                      onClick={() => navigate(`/campaigns/${campaign.id}/donate`)}
                    >
                      <Heart className="mr-2 h-5 w-5" />
                      Donate Now
                    </Button>

                    {/* Share Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleShare("facebook")}
                      >
                        <Facebook className="h-4 w-4 mr-1" />
                        Share
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleShare("twitter")}
                      >
                        <Twitter className="h-4 w-4 mr-1" />
                        Tweet
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleShare("link")}
                      >
                        <Link2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
