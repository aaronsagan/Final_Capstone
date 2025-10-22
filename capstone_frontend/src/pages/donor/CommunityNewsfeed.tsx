import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Filter,
  ArrowUpDown,
  ChevronDown,
  TrendingUp,
  Users,
  Target,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/auth";
import PostCard from "@/components/newsfeed/PostCard";
import { buildApiUrl, buildStorageUrl } from "@/lib/api";

const API_URL = import.meta.env.VITE_API_URL;

interface Update {
  id: number;
  charity_id: number;
  parent_id?: number | null;
  content: string;
  media_urls: string[];
  created_at: string;
  is_pinned: boolean;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_liked: boolean;
  charity?: {
    id: number;
    name: string;
    logo_path?: string;
  };
  children?: Update[];
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
  cover_image_path?: string;
  current_amount: number;
  target_amount: number;
  charity?: { name: string };
}

interface Charity {
  id: number;
  name: string;
  logo_path?: string;
  category?: string;
}

type FilterType = "all" | "supported" | "liked";
type SortType = "newest" | "popular";

export default function CommunityNewsfeed() {
  const navigate = useNavigate();
  const [updates, setUpdates] = useState<Update[]>([]);
  const [filteredUpdates, setFilteredUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [sortType, setSortType] = useState<SortType>("newest");
  const [supportedCharityIds, setSupportedCharityIds] = useState<number[]>([]);
  const [trendingCampaigns, setTrendingCampaigns] = useState<Campaign[]>([]);
  const [suggestedCharities, setSuggestedCharities] = useState<Charity[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const likeInProgress = useRef<Set<number>>(new Set());

  // Define applyFiltersAndSort before useEffect that uses it
  const applyFiltersAndSort = useCallback(() => {
    let filtered = [...updates];

    if (filterType === "supported") {
      filtered = filtered.filter((u) =>
        supportedCharityIds.includes(u.charity_id)
      );
    } else if (filterType === "liked") {
      filtered = filtered.filter((u) => u.is_liked);
    }

    if (sortType === "newest") {
      filtered.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (sortType === "popular") {
      filtered.sort((a, b) => b.likes_count - a.likes_count);
    }

    setFilteredUpdates(filtered);
  }, [updates, filterType, sortType, supportedCharityIds]);

  useEffect(() => {
    fetchData();
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [applyFiltersAndSort]);

  const fetchCurrentUser = async () => {
    try {
      const token = authService.getToken();
      if (!token) return;
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error("Failed to fetch current user");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchSupportedCharities(),
      fetchUpdates(),
      fetchTrendingCampaigns(),
      fetchSuggestedCharities(),
    ]);
    setLoading(false);
  };

  const fetchSupportedCharities = async () => {
    try {
      const token = authService.getToken();
      if (!token) return;

      const res = await fetch(`${API_URL}/me/donations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const donations = (data.data || data) as any[];
        const charityIds = Array.from(
          new Set<number>(donations.map((d: any) => Number(d.charity_id)))
        );
        setSupportedCharityIds(charityIds as number[]);
      }
    } catch (error) {
      console.error("Failed to fetch supported charities");
    }
  };

  const fetchUpdates = async () => {
    try {
      const res = await fetch(`${API_URL}/charities`);
      if (!res.ok) return;

      const charitiesData = await res.json();
      const charities =
        charitiesData.charities?.data || charitiesData.data || charitiesData;

      const allUpdates: Update[] = [];

      for (const charity of charities.slice(0, 15)) {
        try {
          const token = authService.getToken();
          const updatesRes = await fetch(
            `${API_URL}/charities/${charity.id}/updates`,
            {
              headers: {
                Accept: "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
              },
            }
          );

          if (updatesRes.ok) {
            const updatesData = await updatesRes.json();
            const charityUpdates = updatesData.data || updatesData;

            if (Array.isArray(charityUpdates)) {
              const updatesWithCharity = charityUpdates.map((u: any) => ({
                ...u,
                parent_id: u.parent_id || null,
                children: u.children || [],
                is_liked: u.is_liked || false,
                shares_count: u.shares_count || 0,
                charity: {
                  id: charity.id,
                  name: charity.name,
                  logo_path: charity.logo_path,
                },
              }));
              allUpdates.push(...updatesWithCharity);
            }
          }
        } catch (error) {
          // Skip failed charity
        }
      }

      const organizedUpdates = organizeThreads(allUpdates);
      setUpdates(organizedUpdates);
    } catch (error) {
      toast.error("Failed to load community feed");
    }
  };

  const organizeThreads = (updatesList: Update[]): Update[] => {
    const updateMap = new Map<number, Update>();
    const rootUpdates: Update[] = [];

    updatesList.forEach((update) => {
      updateMap.set(update.id, {
        ...update,
        children: update.children || [],
      });
    });

    updatesList.forEach((update) => {
      const updateWithChildren = updateMap.get(update.id)!;

      if (update.parent_id) {
        const parent = updateMap.get(update.parent_id);
        if (parent) {
          parent.children = parent.children || [];
          if (!parent.children.find((c) => c.id === updateWithChildren.id)) {
            parent.children.push(updateWithChildren);
          }
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

  const fetchTrendingCampaigns = async () => {
    try {
      const res = await fetch(`${API_URL}/charities`);
      if (!res.ok) return;

      const charitiesData = await res.json();
      const charities =
        charitiesData.charities?.data || charitiesData.data || charitiesData;

      const allCampaigns: Campaign[] = [];

      for (const charity of charities.slice(0, 5)) {
        try {
          const campaignsRes = await fetch(
            `${API_URL}/charities/${charity.id}/campaigns`
          );
          if (campaignsRes.ok) {
            const campaignsData = await campaignsRes.json();
            const campaigns = campaignsData.data || campaignsData;

            if (Array.isArray(campaigns)) {
              const published = campaigns
                .filter((c: any) => c.status === "published")
                .map((c: any) => ({ ...c, charity: { name: charity.name } }));
              allCampaigns.push(...published);
            }
          }
        } catch (error) {
          // Skip
        }
      }

      const sorted = allCampaigns.sort((a, b) => {
        const progressA = (a.current_amount / a.target_amount) * 100;
        const progressB = (b.current_amount / b.target_amount) * 100;
        return progressB - progressA;
      });

      setTrendingCampaigns(sorted.slice(0, 3));
    } catch (error) {
      console.error("Failed to fetch campaigns");
    }
  };

  const fetchSuggestedCharities = async () => {
    try {
      const res = await fetch(`${API_URL}/charities`);
      if (!res.ok) return;

      const charitiesData = await res.json();
      const charities =
        charitiesData.charities?.data || charitiesData.data || charitiesData;

      const unsupported = charities.filter(
        (c: any) => !supportedCharityIds.includes(c.id)
      );

      setSuggestedCharities(unsupported.slice(0, 3));
    } catch (error) {
      console.error("Failed to fetch suggested charities");
    }
  };

  const handleLike = useCallback(async (updateId: number) => {
    // Prevent double-clicking
    if (likeInProgress.current.has(updateId)) {
      return;
    }

    try {
      const token = authService.getToken();
      if (!token) {
        toast.error("Please log in to like posts");
        return;
      }

      likeInProgress.current.add(updateId);

      // Find current state for optimistic update
      let currentUpdate: Update | undefined;
      for (const u of updates) {
        if (u.id === updateId) {
          currentUpdate = u;
          break;
        }
        if (u.children) {
          currentUpdate = u.children.find(c => c.id === updateId);
          if (currentUpdate) break;
        }
      }

      if (!currentUpdate) {
        likeInProgress.current.delete(updateId);
        return;
      }

      const willBeLiked = !currentUpdate.is_liked;
      const newLikesCount = willBeLiked 
        ? currentUpdate.likes_count + 1 
        : Math.max(0, currentUpdate.likes_count - 1);

      // Optimistic update - update UI immediately
      const updateState = (prev: Update[]) =>
        prev.map((u) => {
          if (u.id === updateId) {
            return { ...u, is_liked: willBeLiked, likes_count: newLikesCount };
          }
          // Also update in children
          if (u.children) {
            return {
              ...u,
              children: u.children.map((child) =>
                child.id === updateId
                  ? { ...child, is_liked: willBeLiked, likes_count: newLikesCount }
                  : child
              ),
            };
          }
          return u;
        });

      setUpdates(updateState);

      // Send to backend
      const res = await fetch(`${API_URL}/updates/${updateId}/like`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        // Sync with actual backend response
        setUpdates((prev) =>
          prev.map((u) => {
            if (u.id === updateId) {
              return { ...u, is_liked: data.liked, likes_count: data.likes_count };
            }
            if (u.children) {
              return {
                ...u,
                children: u.children.map((child) =>
                  child.id === updateId
                    ? { ...child, is_liked: data.liked, likes_count: data.likes_count }
                    : child
                ),
              };
            }
            return u;
          })
        );
      } else {
        // Revert on error
        setUpdates((prev) =>
          prev.map((u) => {
            if (u.id === updateId) {
              return { ...u, is_liked: currentUpdate!.is_liked, likes_count: currentUpdate!.likes_count };
            }
            if (u.children) {
              return {
                ...u,
                children: u.children.map((child) =>
                  child.id === updateId
                    ? { ...child, is_liked: currentUpdate!.is_liked, likes_count: currentUpdate!.likes_count }
                    : child
                ),
              };
            }
            return u;
          })
        );
        toast.error("Failed to update like");
      }
    } catch (error) {
      toast.error("Failed to like post");
    } finally {
      likeInProgress.current.delete(updateId);
    }
  }, [updates]);

  const handleShare = async (updateId: number, platform: string) => {
    try {
      const token = authService.getToken();
      if (!token) {
        toast.error("Please log in to share posts");
        return;
      }

      const res = await fetch(`${API_URL}/updates/${updateId}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({ platform }),
      });

      if (res.ok) {
        const data = await res.json();
        setUpdates((prev) =>
          prev.map((u) =>
            u.id === updateId
              ? { ...u, shares_count: data.shares_count }
              : u
          )
        );
      }
    } catch (error) {
      console.error("Failed to track share");
    }
  };

  const handleFetchComments = async (updateId: number): Promise<Comment[]> => {
    try {
      const token = authService.getToken();
      const res = await fetch(`${API_URL}/updates/${updateId}/comments`, {
        headers: {
          Accept: "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (res.ok) {
        const data = await res.json();
        return data.data || data;
      }
      return [];
    } catch (error) {
      toast.error("Failed to load comments");
      return [];
    }
  };

  const handleAddComment = async (updateId: number, content: string) => {
    try {
      const token = authService.getToken();
      if (!token) {
        toast.error("Please log in to comment");
        return;
      }

      const res = await fetch(`${API_URL}/updates/${updateId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        setUpdates((prev) =>
          prev.map((u) =>
            u.id === updateId
              ? { ...u, comments_count: u.comments_count + 1 }
              : u
          )
        );
        toast.success("Comment added!");
      }
    } catch (error) {
      toast.error("Failed to add comment");
    }
  };

  const handleDeleteComment = async (commentId: number, updateId: number) => {
    try {
      const token = authService.getToken();
      if (!token) return;

      const res = await fetch(`${API_URL}/comments/${commentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (res.ok) {
        setUpdates((prev) =>
          prev.map((u) =>
            u.id === updateId
              ? { ...u, comments_count: Math.max(0, u.comments_count - 1) }
              : u
          )
        );
        toast.success("Comment deleted");
      }
    } catch (error) {
      toast.error("Failed to delete comment");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-32 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Community Newsfeed
          </h1>
          <p className="text-muted-foreground mb-6">
            See the latest updates from the charities you support
          </p>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  {filterType === "all" && "All Charities"}
                  {filterType === "supported" && "Charities I Support"}
                  {filterType === "liked" && "My Liked Posts"}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilterType("all")}>
                  All Charities
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("supported")}>
                  Charities I Support
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("liked")}>
                  My Liked Posts
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  {sortType === "newest" && "Newest"}
                  {sortType === "popular" && "Most Popular"}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSortType("newest")}>
                  Newest
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortType("popular")}>
                  Most Popular
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            {filteredUpdates.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Sparkles className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">
                    Your feed is waiting to be filled!
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Support a charity to start seeing their updates here.
                  </p>
                  <Button onClick={() => navigate("/donor/charities")}>
                    <Target className="mr-2 h-4 w-4" />
                    Discover Charities
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredUpdates.map((update) => (
                <PostCard
                  key={update.id}
                  update={update}
                  currentUserId={currentUser?.id}
                  onLike={handleLike}
                  onShare={handleShare}
                  onFetchComments={handleFetchComments}
                  onAddComment={handleAddComment}
                  onDeleteComment={handleDeleteComment}
                />
              ))
            )}
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block space-y-6 sticky top-6 self-start">
            {/* Trending Campaigns */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Trending Campaigns</h3>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {trendingCampaigns.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No trending campaigns yet
                  </p>
                ) : (
                  trendingCampaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="group cursor-pointer"
                      onClick={() => navigate(`/campaigns/${campaign.id}`)}
                    >
                      {campaign.cover_image_path && (
                        <div className="rounded-lg overflow-hidden mb-2">
                          <img
                            src={buildStorageUrl(campaign.cover_image_path) || ''}
                            alt={campaign.title}
                            className="w-full h-32 object-cover group-hover:scale-105 transition-transforms"
                          />
                        </div>
                      )}
                      <h4 className="font-medium text-sm mb-1 group-hover:text-primary transition-colors">
                        {campaign.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mb-2">
                        {campaign.charity?.name}
                      </p>
                      <Progress
                        value={
                          (campaign.current_amount / campaign.target_amount) * 100
                        }
                        className="h-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{formatCurrency(campaign.current_amount)}</span>
                        <span>{formatCurrency(campaign.target_amount)}</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Suggested Charities */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Charities You Might Like</h3>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {suggestedCharities.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No suggestions available
                  </p>
                ) : (
                  suggestedCharities.map((charity) => (
                    <div
                      key={charity.id}
                      className="flex items-center gap-3 cursor-pointer group"
                      onClick={() => navigate(`/donor/charities/${charity.id}`)}
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage
                          src={buildStorageUrl(charity.logo_path) || undefined}
                        />
                        <AvatarFallback>
                          {charity.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                          {charity.name}
                        </h4>
                        {charity.category && (
                          <p className="text-xs text-muted-foreground truncate">
                            {charity.category}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
