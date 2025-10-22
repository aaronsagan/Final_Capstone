import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  Share2,
  MapPin,
  Mail,
  Phone,
  Globe,
  Facebook,
  Twitter,
  Instagram,
  Loader2,
  CheckCircle,
  Users,
  TrendingUp,
  Target,
  Send,
  Calendar,
  Building2,
  FileText,
  ExternalLink,
  UserPlus,
  UserCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { charityService } from "@/services/charity";
import { updatesService } from "@/services/updates";
import { authService } from "@/services/auth";
import { CampaignCard } from "@/components/charity/CampaignCard";
import { getCharityLogoUrl, getStorageUrl } from "@/lib/storage";

interface Update {
  id: number;
  charity_id: number;
  parent_id: number | null;
  content: string;
  media_urls: string[];
  created_at: string;
  is_pinned: boolean;
  likes_count: number;
  comments_count: number;
  children?: Update[];
  is_liked?: boolean;
}

interface Comment {
  id: number;
  update_id: number;
  user_id: number;
  content: string;
  created_at: string;
  user?: {
    id: number;
    name: string;
    role: string;
    profile_image?: string;
    charity?: {
      id: number;
      owner_id: number;
      name: string;
      logo_path?: string;
    };
  };
}

interface Campaign {
  id: number;
  title: string;
  description: string;
  goal: number;
  amountRaised: number;
  donorsCount: number;
  views: number;
  status: "active" | "completed" | "draft" | "expired";
  bannerImage?: string;
  endDate: string;
  createdAt: string;
}

interface Charity {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  municipality?: string;
  province?: string;
  logo_path?: string;
  banner_path?: string;
  mission?: string;
  vision?: string;
  description?: string;
  tagline?: string;
  services?: string;
  registration_number?: string;
  website_url?: string;
  facebook_url?: string;
  twitter_url?: string;
  instagram_url?: string;
  is_verified?: boolean;
  created_at?: string;
}

export default function CharityPublicProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [charity, setCharity] = useState<Charity | null>(null);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("updates");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [comments, setComments] = useState<Record<number, Comment[]>>({});
  const [newComment, setNewComment] = useState<Record<number, string>>({});
  const [loadingComments, setLoadingComments] = useState<Set<number>>(new Set());
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (id) {
      loadCharityData();
      loadCurrentUser();
    }
  }, [id]);

  const loadCurrentUser = async () => {
    try {
      const token = authService.getToken();
      if (!token) return;
      const res = await fetch(`${import.meta.env.VITE_API_URL}/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      if (res.ok) {
        const user = await res.json();
        setCurrentUser(user);
      }
    } catch (error) {
      console.error("Failed to load current user:", error);
    }
  };

  const loadCharityData = async () => {
    try {
      setLoading(true);
      const charityId = parseInt(id!);
      const charityData = await charityService.getPublicCharityProfile(charityId);
      setCharity(charityData.data || charityData);

      const updatesData = await updatesService.getCharityUpdates(charityId);
      const updatesList = updatesData.data || updatesData;
      const organized = organizeThreads(updatesList);
      setUpdates(organized);

      const campaignsData = await charityService.getCharityCampaigns(charityId);
      const campaignsList = campaignsData.data || campaignsData;
      const mapped = campaignsList.map((c: any) => ({
        id: c.id,
        title: c.title,
        description: c.description || "",
        goal: c.target_amount || 0,
        amountRaised: c.current_amount || 0,
        donorsCount: c.donors_count || 0,
        views: c.views || 0,
        status: c.status || "active",
        bannerImage: c.cover_image_path,
        endDate: c.deadline_at || c.end_date,
        createdAt: c.created_at,
      }));
      setCampaigns(mapped);

      const statsData = await charityService.getCharityStats(charityId);
      setStats(statsData.data || statsData);

      if (authService.getToken()) {
        try {
          const followData = await charityService.checkFollowStatus(charityId);
          setIsFollowing(followData.is_following || false);
        } catch (error) {
          // Not logged in
        }
      }
    } catch (error) {
      console.error("Error loading charity data:", error);
      toast.error("Failed to load charity profile");
    } finally {
      setLoading(false);
    }
  };

  const organizeThreads = (updatesList: Update[]): Update[] => {
    const updateMap = new Map<number, Update>();
    const rootUpdates: Update[] = [];
    updatesList.forEach((update) => {
      updateMap.set(update.id, { ...update, children: [] });
    });
    updatesList.forEach((update) => {
      const updateWithChildren = updateMap.get(update.id)!;
      if (update.parent_id) {
        const parent = updateMap.get(update.parent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(updateWithChildren);
        } else {
          rootUpdates.push(updateWithChildren);
        }
      } else {
        rootUpdates.push(updateWithChildren);
      }
    });
    return rootUpdates.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  };

  const handleFollow = async () => {
    if (!authService.getToken()) {
      toast.error("Please login to follow this charity");
      navigate("/auth/login");
      return;
    }
    try {
      setFollowLoading(true);
      const result = await charityService.toggleFollow(parseInt(id!));
      setIsFollowing(result.is_following);
      toast.success(result.is_following ? "Following charity" : "Unfollowed charity");
    } catch (error) {
      toast.error("Failed to update follow status");
    } finally {
      setFollowLoading(false);
    }
  };

  const handleToggleLike = async (updateId: number) => {
    if (!authService.getToken()) {
      toast.error("Please login to like posts");
      return;
    }
    try {
      const result = await updatesService.toggleLike(updateId);
      const updateInState = (items: Update[]): Update[] => {
        return items.map((update) => {
          if (update.id === updateId) {
            return {
              ...update,
              is_liked: result.liked,
              likes_count: result.likes_count,
            };
          }
          if (update.children) {
            return { ...update, children: updateInState(update.children) };
          }
          return update;
        });
      };
      setUpdates((prev) => updateInState(prev));
    } catch (error) {
      toast.error("Failed to like post");
    }
  };

  const handleToggleComments = async (updateId: number) => {
    const isExpanded = expandedComments.has(updateId);
    if (isExpanded) {
      setExpandedComments((prev) => {
        const next = new Set(prev);
        next.delete(updateId);
        return next;
      });
    } else {
      setExpandedComments((prev) => new Set(prev).add(updateId));
      if (!comments[updateId]) {
        fetchComments(updateId);
      }
    }
  };

  const fetchComments = async (updateId: number) => {
    if (loadingComments.has(updateId)) return;
    setLoadingComments((prev) => new Set(prev).add(updateId));
    try {
      const data = await updatesService.getComments(updateId);
      setComments((prev) => ({ ...prev, [updateId]: data.data || data }));
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoadingComments((prev) => {
        const next = new Set(prev);
        next.delete(updateId);
        return next;
      });
    }
  };

  const handleAddComment = async (updateId: number) => {
    if (!authService.getToken()) {
      toast.error("Please login to comment");
      return;
    }
    const content = newComment[updateId];
    if (!content?.trim()) return;
    try {
      const newCommentData = await updatesService.addComment(updateId, content);
      setComments((prev) => ({
        ...prev,
        [updateId]: [...(prev[updateId] || []), newCommentData],
      }));
      setNewComment((prev) => ({ ...prev, [updateId]: "" }));
      const updateCounts = (items: Update[]): Update[] => {
        return items.map((update) => {
          if (update.id === updateId) {
            return { ...update, comments_count: update.comments_count + 1 };
          }
          if (update.children) {
            return { ...update, children: updateCounts(update.children) };
          }
          return update;
        });
      };
      setUpdates((prev) => updateCounts(prev));
      toast.success("Comment added");
    } catch (error) {
      toast.error("Failed to add comment");
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: charity?.name,
        text: charity?.tagline || charity?.mission,
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Profile link copied to clipboard!");
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const renderUpdate = (update: Update, depth: number = 0): JSX.Element => {
    const isThreaded = depth > 0;
    const isExpanded = expandedComments.has(update.id);
    const updateComments = comments[update.id] || [];

    return (
      <div key={update.id} className={isThreaded ? "ml-12 relative" : ""}>
        {isThreaded && (
          <div className="absolute left-[-24px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/40 to-transparent" />
        )}
        <Card className={`${isThreaded ? "mt-4" : "mb-4"} bg-card border-border/40 hover:shadow-lg transition-all duration-200`}>
          <CardHeader className="pb-4">
            <div className="flex items-start gap-3 flex-1">
              <Avatar className="h-11 w-11 ring-2 ring-background shadow-sm">
                <AvatarImage
                  src={charity?.logo_path ? `${import.meta.env.VITE_API_URL}/storage/${charity.logo_path}` : ""}
                />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {charity?.name?.substring(0, 2).toUpperCase() || "CH"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-sm text-foreground">{charity?.name || "Charity"}</p>
                  {charity?.is_verified && (
                    <Badge variant="secondary" className="flex items-center gap-1 text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0">
                      <CheckCircle className="h-3 w-3" />
                      Verified
                    </Badge>
                  )}
                  {update.is_pinned && (
                    <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-0">Pinned</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{formatTimeAgo(update.created_at)}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">{update.content}</p>
            {update.media_urls && update.media_urls.length > 0 && (
              <div className={`grid gap-2 rounded-xl overflow-hidden ${update.media_urls.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                {update.media_urls.map((url, index) => (
                  <img key={index} src={`${import.meta.env.VITE_API_URL}/storage/${url}`} alt={`Update media ${index + 1}`} className="rounded-lg w-full object-cover max-h-96 cursor-pointer hover:opacity-95 transition-opacity" />
                ))}
              </div>
            )}
            {(update.likes_count > 0 || update.comments_count > 0) && (
              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                {update.likes_count > 0 && (
                  <button className="hover:underline cursor-pointer" onClick={() => handleToggleLike(update.id)}>
                    <Heart className="h-3.5 w-3.5 inline mr-1 fill-red-500 text-red-500" />
                    {update.likes_count} {update.likes_count === 1 ? "like" : "likes"}
                  </button>
                )}
                {update.comments_count > 0 && (
                  <button className="hover:underline cursor-pointer" onClick={() => handleToggleComments(update.id)}>
                    {update.comments_count} {update.comments_count === 1 ? "comment" : "comments"}
                  </button>
                )}
              </div>
            )}
            <Separator className="!mt-3" />
            <div className="flex items-center gap-2 !mt-2">
              <Button variant="ghost" size="sm" className="flex-1 h-10 hover:bg-accent transition-colors" onClick={() => handleToggleLike(update.id)}>
                <Heart className={`mr-2 h-4 w-4 transition-all ${update.is_liked ? "fill-red-500 text-red-500 scale-110" : "hover:scale-110"}`} />
                <span className="font-medium">Like</span>
              </Button>
              <Button variant="ghost" size="sm" className="flex-1 h-10 hover:bg-accent transition-colors" onClick={() => handleToggleComments(update.id)}>
                <MessageCircle className="mr-2 h-4 w-4" />
                <span className="font-medium">Comment</span>
              </Button>
            </div>
            {isExpanded && (
              <>
                <Separator />
                <div className="space-y-3 pt-2">
                  {loadingComments.has(update.id) ? (
                    <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                  ) : (
                    <>
                      {updateComments.length > 0 && (
                        <ScrollArea className="max-h-72 pr-2">
                          <div className="space-y-4">
                            {updateComments.map((comment) => (
                              <div key={comment.id} className="flex gap-3">
                                <Avatar className="h-8 w-8 mt-0.5 ring-2 ring-background">
                                  <AvatarImage
                                    src={
                                      comment.user?.role === "charity_admin" && comment.user?.charity?.logo_path
                                        ? getCharityLogoUrl(comment.user.charity.logo_path) || undefined
                                        : getStorageUrl(comment.user?.profile_image) || undefined
                                    }
                                    alt={comment.user?.name}
                                  />
                                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                    {(comment.user?.role === "charity_admin" && comment.user?.charity?.name
                                      ? comment.user.charity.name.substring(0, 2).toUpperCase()
                                      : comment.user?.name?.substring(0, 2).toUpperCase()) || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="bg-muted/60 dark:bg-muted/40 rounded-2xl px-4 py-2.5">
                                    <p className="font-semibold text-xs text-foreground mb-0.5">
                                      {comment.user?.role === "charity_admin" && comment.user?.charity?.name
                                        ? comment.user.charity.name
                                        : comment.user?.name || "User"}
                                    </p>
                                    <p className="text-sm text-foreground/90 leading-relaxed">{comment.content}</p>
                                  </div>
                                  <div className="flex items-center gap-4 mt-1.5 px-4">
                                    <span className="text-xs text-muted-foreground">{formatTimeAgo(comment.created_at)}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                      <div className="flex gap-3 pt-3">
                        <Avatar className="h-8 w-8 mt-1 ring-2 ring-background">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {currentUser?.name?.substring(0, 2).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 flex gap-2">
                          <input type="text" placeholder="Write a comment..." value={newComment[update.id] || ""} onChange={(e) => setNewComment((prev) => ({ ...prev, [update.id]: e.target.value }))} onKeyPress={(e) => e.key === "Enter" && handleAddComment(update.id)} className="flex-1 px-4 py-2.5 bg-muted/40 border border-border/60 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" />
                          <Button size="sm" onClick={() => handleAddComment(update.id)} disabled={!newComment[update.id]?.trim()} className="rounded-full h-10 w-10 p-0 bg-primary hover:bg-primary/90">
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
        {update.children && update.children.length > 0 && (
          <div className="space-y-0">{update.children.map((child) => renderUpdate(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading charity profile...</p>
        </div>
      </div>
    );
  }

  if (!charity) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Charity not found</p>
          <Button onClick={() => navigate("/")} className="mt-4">Go Home</Button>
        </Card>
      </div>
    );
  }

  const totalRaised = campaigns.reduce((sum, c) => sum + (c.amountRaised || 0), 0);
  const activeCampaigns = campaigns.filter((c) => c.status === "active").length;
  const followersCount = stats?.followers_count || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header / Hero Section */}
      <div className="relative">
        <div className="h-[300px] lg:h-[400px] w-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
          {charity.banner_path ? (
            <img src={`${import.meta.env.VITE_API_URL}/storage/${charity.banner_path}`} alt={`${charity.name} banner`} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Building2 className="h-24 w-24 text-muted-foreground/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>

        <div className="container mx-auto px-4 lg:px-8">
          <div className="relative -mt-20 lg:-mt-24">
            <div className="flex flex-col lg:flex-row items-start lg:items-end gap-6">
              <Avatar className="h-32 w-32 lg:h-40 lg:w-40 ring-4 ring-background shadow-2xl">
                <AvatarImage src={charity.logo_path ? `${import.meta.env.VITE_API_URL}/storage/${charity.logo_path}` : ""} />
                <AvatarFallback className="text-4xl font-bold bg-primary text-primary-foreground">
                  {charity.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 pb-4">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <h1 className="text-3xl lg:text-4xl font-bold text-foreground">{charity.name}</h1>
                      {charity.is_verified && (
                        <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-0 flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-lg text-muted-foreground mb-3 max-w-2xl">{charity.tagline || charity.mission}</p>
                    {charity.municipality && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{charity.municipality}{charity.province && `, ${charity.province}`}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <Button size="lg" variant={isFollowing ? "outline" : "default"} onClick={handleFollow} disabled={followLoading} className={isFollowing ? "" : "bg-primary hover:bg-primary/90"}>
                      {followLoading ? (
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      ) : isFollowing ? (
                        <UserCheck className="h-5 w-5 mr-2" />
                      ) : (
                        <UserPlus className="h-5 w-5 mr-2" />
                      )}
                      {isFollowing ? "Following" : "Follow"}
                    </Button>
                    <Button size="lg" variant="outline" onClick={handleShare}>
                      <Share2 className="h-5 w-5 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                  <Card className="bg-card/50 border-border/40">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-500/10">
                          <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-500" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total Raised</p>
                          <p className="text-lg font-bold text-foreground">{formatCurrency(totalRaised)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/50 border-border/40">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Target className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Active Campaigns</p>
                          <p className="text-lg font-bold text-foreground">{activeCampaigns}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/50 border-border/40">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                          <Users className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Followers</p>
                          <p className="text-lg font-bold text-foreground">{followersCount}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/50 border-border/40">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/10">
                          <FileText className="h-5 w-5 text-purple-600 dark:text-purple-500" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Updates</p>
                          <p className="text-lg font-bold text-foreground">{updates.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content Area */}
          <div className="flex-1">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8 sticky top-0 z-10 bg-background">
                <TabsTrigger value="updates">Updates</TabsTrigger>
                <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
                <TabsTrigger value="about">About</TabsTrigger>
              </TabsList>

              <TabsContent value="updates" className="space-y-4">
                {updates.length === 0 ? (
                  <Card className="p-12 text-center border-dashed">
                    <MessageCircle className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">No updates yet</h3>
                    <p className="text-muted-foreground text-sm">This charity hasn't shared any updates yet. Follow them to stay informed about future work.</p>
                  </Card>
                ) : (
                  updates.map((update) => renderUpdate(update, 0))
                )}
              </TabsContent>

              <TabsContent value="campaigns" className="space-y-4">
                {campaigns.length === 0 ? (
                  <Card className="p-12 text-center border-dashed">
                    <Target className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">No campaigns yet</h3>
                    <p className="text-muted-foreground text-sm">This charity hasn't created any campaigns yet.</p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {campaigns.map((campaign) => (
                      <CampaignCard key={campaign.id} campaign={campaign} viewMode="donor" />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="about">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <h2 className="text-2xl font-bold">Mission</h2>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">{charity.mission || "No mission statement provided."}</p>
                    </CardContent>
                  </Card>

                  {charity.vision && (
                    <Card>
                      <CardHeader>
                        <h2 className="text-2xl font-bold">Vision</h2>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground leading-relaxed">{charity.vision}</p>
                      </CardContent>
                    </Card>
                  )}

                  {charity.services && (
                    <Card>
                      <CardHeader>
                        <h2 className="text-2xl font-bold">Services</h2>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{charity.services}</p>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader>
                      <h2 className="text-2xl font-bold">Transparency Info</h2>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {charity.registration_number && (
                        <div className="flex items-start gap-3">
                          <FileText className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <p className="font-medium text-sm">Registration Number</p>
                            <p className="text-muted-foreground">{charity.registration_number}</p>
                          </div>
                        </div>
                      )}
                      {charity.created_at && (
                        <div className="flex items-start gap-3">
                          <Calendar className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <p className="font-medium text-sm">Joined Platform</p>
                            <p className="text-muted-foreground">{new Date(charity.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <aside className="lg:w-80 space-y-6">
            <Card className="sticky top-24">
              <CardHeader>
                <h3 className="font-bold text-lg">Contact Information</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {charity.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">Email</p>
                      <a href={`mailto:${charity.email}`} className="text-primary text-sm hover:underline break-words">{charity.email}</a>
                    </div>
                  </div>
                )}
                {charity.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Phone</p>
                      <a href={`tel:${charity.phone}`} className="text-primary text-sm hover:underline">{charity.phone}</a>
                    </div>
                  </div>
                )}
                {charity.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">Address</p>
                      <p className="text-muted-foreground text-sm">{charity.address}</p>
                    </div>
                  </div>
                )}

                <Separator />

                <div>
                  <p className="font-medium text-sm mb-3">Social Media</p>
                  <div className="flex gap-2">
                    {charity.website_url && (
                      <Button variant="outline" size="icon" asChild>
                        <a href={charity.website_url} target="_blank" rel="noopener noreferrer">
                          <Globe className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {charity.facebook_url && (
                      <Button variant="outline" size="icon" asChild>
                        <a href={charity.facebook_url} target="_blank" rel="noopener noreferrer">
                          <Facebook className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {charity.twitter_url && (
                      <Button variant="outline" size="icon" asChild>
                        <a href={charity.twitter_url} target="_blank" rel="noopener noreferrer">
                          <Twitter className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {charity.instagram_url && (
                      <Button variant="outline" size="icon" asChild>
                        <a href={charity.instagram_url} target="_blank" rel="noopener noreferrer">
                          <Instagram className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
