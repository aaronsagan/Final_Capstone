import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, MapPin, CheckCircle, Eye, Users, Target, Star, UserPlus, UserMinus, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { authService } from "@/services/auth";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CharityCardProps {
  charity: {
    id: number;
    name: string;
    mission?: string;
    category?: string;
    region?: string;
    municipality?: string;
    logo_path?: string;
    verification_status: string;
  };
  isFollowing?: boolean;
  onFollowToggle?: (charityId: number) => void;
}

interface CharityStats {
  followers_count: number;
  campaigns_count: number;
  total_raised: number;
  average_rating?: number;
}

export default function CharityCard({ charity, isFollowing = false, onFollowToggle }: CharityCardProps) {
  const navigate = useNavigate();
  const [stats, setStats] = useState<CharityStats>({
    followers_count: 0,
    campaigns_count: 0,
    total_raised: 0,
  });
  const [isHovered, setIsHovered] = useState(false);
  const [following, setFollowing] = useState(isFollowing);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setFollowing(isFollowing);
  }, [isFollowing]);

  useEffect(() => {
    fetchCharityStats();
  }, [charity.id]);

  const fetchCharityStats = async () => {
    try {
      // Fetch follower count
      const followersResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/charities/${charity.id}/followers-count`
      );
      if (followersResponse.ok) {
        const followersData = await followersResponse.json();
        setStats((prev) => ({ ...prev, followers_count: followersData.followers_count }));
      }

      // Fetch campaigns
      const campaignsResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/charities/${charity.id}/campaigns`
      );
      if (campaignsResponse.ok) {
        const campaignsData = await campaignsResponse.json();
        const campaigns = campaignsData.data || campaignsData || [];
        setStats((prev) => ({ ...prev, campaigns_count: campaigns.length }));
      }

      // Fetch charity details for total raised
      const charityResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/charities/${charity.id}`
      );
      if (charityResponse.ok) {
        const charityData = await charityResponse.json();
        setStats((prev) => ({ 
          ...prev, 
          total_raised: charityData.total_received || 0 
        }));
      }
    } catch (error) {
      console.error("Error fetching charity stats:", error);
    }
  };

  const handleFollowToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      setIsLoading(true);
      const token = authService.getToken();
      if (!token) {
        toast.error("Please login to follow charities");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/charities/${charity.id}/follow`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Follow toggle error:", response.status, errorText);
        throw new Error(`Failed to update follow status (${response.status})`);
      }

      const data = await response.json();
      setFollowing(data.is_following);
      
      // Update follower count
      setStats((prev) => ({
        ...prev,
        followers_count: data.is_following 
          ? prev.followers_count + 1 
          : Math.max(0, prev.followers_count - 1),
      }));

      toast.success(data.message);
      
      if (onFollowToggle) {
        onFollowToggle(charity.id);
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update follow status");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDonate = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/donor/donate/${charity.id}`);
  };

  const handleViewProfile = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigate(`/donor/charities/${charity.id}`);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const isFeatured = charity.verification_status === 'approved' && stats.total_raised > 100000;

  return (
    <Card
      className="group overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border-border/40 relative flex flex-col h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleViewProfile}
    >
      {/* Featured Badge */}
      {isFeatured && (
        <div className="absolute top-4 left-4 z-20">
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg">
            <Star className="w-3 h-3 mr-1 fill-current" />
            Featured
          </Badge>
        </div>
      )}

      {/* Image Container with Hover Effect */}
      <div className="relative h-56 overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10">
        <img
          src={
            charity.logo_path
              ? `${import.meta.env.VITE_API_URL}/storage/${charity.logo_path}`
              : "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600"
          }
          alt={charity.name}
          className={`w-full h-full object-cover transition-all duration-500 ${
            isHovered ? "scale-110" : "scale-100"
          }`}
          loading="lazy"
        />
        
        {/* Gradient Overlay */}
        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-300 ${
            isHovered ? "opacity-100" : "opacity-60"
          }`}
        />

        {/* Verification Badge */}
        {charity.verification_status === "approved" && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute top-4 right-4 z-10">
                  <Badge className="bg-green-600 hover:bg-green-700 text-white border-0 shadow-lg">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Verified
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">This charity has been verified by CharityHub</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* View Profile Overlay */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="text-center text-white">
            <Eye className="w-12 h-12 mx-auto mb-2" />
            <p className="text-lg font-semibold">View Profile</p>
          </div>
        </div>
      </div>

      {/* Card Header - Flexible Content Area */}
      <CardHeader className="pb-3 flex-grow">
        <CardTitle
          className="text-xl font-bold hover:text-primary transition-colors cursor-pointer line-clamp-1"
          onClick={handleViewProfile}
        >
          {charity.name}
        </CardTitle>
        
        {/* Description with Tooltip */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-2 leading-relaxed min-h-[2.5rem]">
                {charity.mission || "Making a difference in our community"}
              </p>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">{charity.mission || "Making a difference in our community"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>

      {/* Card Content - Pinned to Bottom */}
      <CardContent className="space-y-4 mt-auto">
        {/* Location & Category */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="line-clamp-1">
              {charity.region && charity.municipality
                ? `${charity.municipality}, ${charity.region}`
                : charity.region || "Location not specified"}
            </span>
          </div>
          {charity.category && (
            <Badge variant="outline" className="text-xs">
              {charity.category}
            </Badge>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 py-3 border-y border-border/50">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-primary mb-1">
                    <Users className="h-4 w-4" />
                    <span className="text-sm font-bold">{formatNumber(stats.followers_count)}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Followers</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{stats.followers_count.toLocaleString()} followers</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center border-x border-border/50">
                  <div className="flex items-center justify-center gap-1 text-blue-600 dark:text-blue-400 mb-1">
                    <Target className="h-4 w-4" />
                    <span className="text-sm font-bold">{stats.campaigns_count}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Campaigns</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{stats.campaigns_count} active campaigns</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400 mb-1">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm font-bold">₱{formatNumber(stats.total_raised)}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Raised</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">₱{stats.total_raised.toLocaleString()} total raised</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-primary/20"
            onClick={handleDonate}
          >
            <Heart className="mr-2 h-4 w-4" />
            Donate
          </Button>
          
          <Button
            variant={following ? "default" : "secondary"}
            onClick={handleFollowToggle}
            disabled={isLoading}
            className={`transition-all duration-300 ${
              following 
                ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
                : "bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-input"
            }`}
          >
            {following ? (
              <UserMinus className="h-4 w-4" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
          </Button>
          
          <Button
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              handleViewProfile();
            }}
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-input transition-all duration-300"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>

        {/* Social Proof (if available) */}
        {stats.followers_count > 100 && (
          <div className="text-xs text-center text-muted-foreground pt-2 border-t border-border/50">
            Supported by <span className="font-semibold text-primary">{formatNumber(stats.followers_count)}</span> donors
          </div>
        )}
      </CardContent>
    </Card>
  );
}
