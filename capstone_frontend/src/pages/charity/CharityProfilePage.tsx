import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { charityService } from "@/services/charity";
import { buildApiUrl, buildStorageUrl } from "@/lib/api";
import { ProfileHeader } from "@/components/charity/ProfileHeader";
import { ProfileStats } from "@/components/charity/ProfileStats";
import { ProfileTabs } from "@/components/charity/ProfileTabs";
import { ProfileSidebar } from "@/components/charity/ProfileSidebar";
import { UpdatesSidebar } from "@/components/charity/UpdatesSidebar";
import { CampaignsSidebar } from "@/components/charity/CampaignsSidebar";
import { ActionBar } from "@/components/charity/ActionBar";
import { ImageViewerModal } from "@/components/charity/ImageViewerModal";
import { FollowersModal } from "@/components/charity/FollowersModal";
import { updatesService } from "@/services/updates";

// Interface definitions moved to separate section for clarity
interface CharityData {
  id: number;
  name: string;
  acronym?: string;
  mission?: string;
  vision?: string;
  description?: string;
  tagline?: string;
  logo_path?: string;
  cover_image?: string;
  banner_path?: string;
  email?: string;
  contact_email?: string;
  primary_email?: string;
  phone?: string;
  contact_phone?: string;
  primary_phone?: string;
  address?: string;
  full_address?: string;
  region?: string;
  municipality?: string;
  province?: string;
  website?: string;
  website_url?: string;
  operating_hours?: string;
  facebook_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  linkedin_url?: string;
  youtube_url?: string;
  verification_status?: string;
  is_verified?: boolean;
  created_at?: string;
}

interface Stats {
  total_followers?: number;
  followers_count?: number;
  total_donations?: number;
  total_received?: number;
  total_campaigns?: number;
  active_campaigns?: number;
  total_updates?: number;
  updates_count?: number;
  total_donors?: number;
}

interface Campaign {
  id: number;
  title: string;
  description?: string;
  target_amount?: number;
  goal_amount?: number;
  current_amount?: number;
  raised_amount?: number;
  deadline_at?: string;
  end_date?: string;
  status: string;
  cover_image_path?: string;
  image_path?: string;
  banner_image?: string;
  donors_count?: number;
}

interface Update {
  id: number;
  charity_id: number;
  title?: string;
  content: string;
  media_urls?: string[];
  is_pinned: boolean;
  created_at: string;
  likes_count: number;
  comments_count: number;
  shares_count?: number;
}

export default function CharityProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [charity, setCharity] = useState<CharityData | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentUpdates, setRecentUpdates] = useState<Update[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeTab, setActiveTab] = useState("about");
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  
  // Image viewer modal states
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerType, setImageViewerType] = useState<"profile" | "cover">("profile");
  
  // Followers modal state
  const [followersModalOpen, setFollowersModalOpen] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, [user]);

  const loadProfileData = async () => {
    if (!user?.charity?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');

      // Load charity profile
      const charityResponse = await fetch(buildApiUrl(`/charities/${user.charity.id}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (charityResponse.ok) {
        const charityData = await charityResponse.json();
        setCharity(charityData.data || charityData);
      } else {
        console.warn('Failed to load charity profile');
      }

      // Load stats only if feature flag is enabled to avoid 404 noise in dev
      const enableStats = (import.meta.env.VITE_FEATURE_CHARITY_STATS === 'true');
      if (enableStats) {
        try {
          const statsData = await charityService.getDashboardStats(user.charity.id);
          setStats(statsData.data || statsData);
        } catch {
          setStats({
            total_campaigns: 0,
            active_campaigns: 0,
            followers_count: 0,
            total_donations: 0,
          });
        }
      } else {
        setStats({
          total_campaigns: 0,
          active_campaigns: 0,
          followers_count: 0,
          total_donations: 0,
        });
      }

      // Load recent updates (includes like status)
      try {
        const updatesData = await updatesService.getMyUpdates();
        const updates = (updatesData.data || updatesData || []);
        setRecentUpdates(updates);
      } catch (error) {
        // Silently ignore updates failure here; Updates tab will handle its own errors
      }

      // Load campaigns
      try {
        const campaignsData = await charityService.getCharityCampaigns(user.charity.id);
        const campaignsList = (campaignsData.data || campaignsData || []);
        setCampaigns(campaignsList);
      } catch (error) {
        // Silently ignore campaigns failure here
      }
      console.info('✅ Charity profile loaded successfully');
    } catch (error) {
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  // Helper: re-fetch updates only (used after creating a new update from modal)
  const refreshUpdates = async () => {
    try {
      const updatesData = await updatesService.getMyUpdates();
      const updates = (updatesData.data || updatesData || []);
      setRecentUpdates(updates);
    } catch (error) {
      console.log('Updates not available');
    }
  };

  // Helper: re-fetch campaigns only (used after create from Campaigns tab modal)
  const refreshCampaigns = async () => {
    try {
      const uid = user?.charity?.id;
      if (!uid) return;
      const campaignsData = await charityService.getCharityCampaigns(uid);
      const campaignsList = (campaignsData.data || campaignsData || []);
      setCampaigns(campaignsList);
    } catch (error) {
      console.log('Campaigns not available');
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/charities/${charity?.id || user?.charity?.id}`;
    if (navigator.share) {
      navigator.share({
        title: charity?.name || 'Our Charity',
        text: charity?.mission || 'Check out our charity profile',
        url,
      });
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Profile link copied to clipboard!');
    }
  };

  // Image viewer handlers
  const handleProfileClick = () => {
    setImageViewerType("profile");
    setImageViewerOpen(true);
  };

  const handleCoverClick = () => {
    setImageViewerType("cover");
    setImageViewerOpen(true);
  };

  const handleImageUpdate = async (file: File, type: "profile" | "cover") => {
    if (!charity?.id) return;

    const formData = new FormData();
    if (type === "profile") {
      formData.append("logo", file);
    } else {
      formData.append("cover_photo", file);
    }

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(buildApiUrl(`/charities/${charity.id}/profile`), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        await loadProfileData();
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      throw error;
    }
  };

  // Stat card handlers
  const handleTotalRaisedClick = () => {
    navigate('/charity/donations');
  };

  const handleCampaignsClick = () => {
    navigate('/charity/campaigns');
  };

  const handleFollowersClick = () => {
    setFollowersModalOpen(true);
  };

  const handleUpdatesClick = () => {
    navigate('/charity/updates');
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '₱0';
    return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!charity && !user?.charity) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center">
          <h2 className="text-xl font-semibold mb-2">No Charity Profile</h2>
          <p className="text-muted-foreground mb-4">
            Your account doesn't have a charity profile set up yet.
          </p>
        </div>
      </div>
    );
  }

  const displayCharity = charity || user?.charity;
  const logoUrl = displayCharity?.logo_path ? buildStorageUrl(displayCharity.logo_path) : null;
  const coverUrl = displayCharity?.cover_image || displayCharity?.banner_path 
    ? buildStorageUrl(displayCharity.cover_image || displayCharity.banner_path) 
    : null;

  const statsData = {
    totalRaised: stats?.total_received || stats?.total_donations || 0,
    campaigns: stats?.total_campaigns || stats?.active_campaigns || campaigns.length || 0,
    followers: stats?.total_followers || stats?.followers_count || 0,
    updates: stats?.total_updates || stats?.updates_count || recentUpdates.length || 0,
  };


  // Transform campaigns data to match ProfileTabs interface
  const transformedCampaigns = campaigns.map(campaign => ({
    id: campaign.id,
    title: campaign.title,
    description: campaign.description,
    amountRaised: campaign.current_amount || 0,
    goal: campaign.target_amount || 0,
    donorsCount: campaign.donors_count || 0,
    status: campaign.status || 'active',
    bannerImage: campaign.cover_image_path,
    deadline: campaign.deadline_at || campaign.end_date,
  }));

  // Campaign metrics for sidebar
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter(c => (c.status || '').toLowerCase() === 'active').length;
  const totalRaisedCampaigns = campaigns.reduce((sum, c) => sum + (c.current_amount || 0), 0);
  const goals = campaigns.map(c => c.target_amount || 0).filter(g => g > 0);
  const avgCompletion = goals.length
    ? Math.round(
        (campaigns.reduce((sum, c) => sum + ((c.current_amount || 0) / Math.max(1, (c.target_amount || 0))), 0) / goals.length) * 100
      )
    : 0;
  const topCampaignRaw = campaigns
    .map(c => ({
      id: c.id,
      title: c.title,
      bannerImage: c.cover_image_path,
      amountRaised: c.current_amount || 0,
      goal: c.target_amount || 0,
      ratio: (c.current_amount || 0) / Math.max(1, (c.target_amount || 0)),
    }))
    .sort((a,b) => b.ratio - a.ratio)[0];

  const topCampaign = topCampaignRaw
    ? {
        id: topCampaignRaw.id,
        title: topCampaignRaw.title,
        bannerImage: topCampaignRaw.bannerImage ? buildStorageUrl(topCampaignRaw.bannerImage) : undefined,
        amountRaised: topCampaignRaw.amountRaised,
        goal: topCampaignRaw.goal,
      }
    : null;

  const isOwner = (user?.role === 'charity_admin') && (!!displayCharity?.id && user?.charity?.id === displayCharity.id);

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-8">
      {/* Profile Header */}
      <ProfileHeader
        charity={displayCharity}
        logoUrl={logoUrl}
        coverUrl={coverUrl}
        onEdit={() => navigate('/charity/organization/manage')}
        onShare={handleShare}
        onBack={() => navigate('/charity/updates')}
        onProfileClick={handleProfileClick}
        onCoverClick={handleCoverClick}
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 lg:px-8 pt-6">
        {/* Stats - Proper spacing from profile */}
        <ProfileStats 
          stats={statsData} 
          formatCurrency={formatCurrency}
          onTotalRaisedClick={handleTotalRaisedClick}
          onCampaignsClick={handleCampaignsClick}
          onFollowersClick={handleFollowersClick}
          onUpdatesClick={handleUpdatesClick}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content Area - 8 columns */}
          <div className="lg:col-span-8">
            <ProfileTabs
              charity={displayCharity}
              recentUpdates={recentUpdates}
              campaigns={transformedCampaigns}
              formatDate={formatDate}
              getTimeAgo={getTimeAgo}
              buildStorageUrl={buildStorageUrl}
              formatCurrency={formatCurrency}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onCampaignsRefresh={refreshCampaigns}
              onUpdatesRefresh={refreshUpdates}
              onProfileRefresh={loadProfileData}
            />
          </div>

          {/* Sidebar - 4 columns (align with first main card) */}
          <div className="lg:col-span-4 lg:pt-14">
            {activeTab === 'updates' ? (
              <UpdatesSidebar
                totalLikes={recentUpdates.reduce((sum, u) => sum + (u.likes_count || 0), 0)}
                totalComments={recentUpdates.reduce((sum, u) => sum + (u.comments_count || 0), 0)}
                totalPosts={stats?.total_updates || stats?.updates_count || recentUpdates.length || 0}
                recentUpdates={recentUpdates}
                canCreate={isOwner}
              />
            ) : activeTab === 'campaigns' ? (
              <CampaignsSidebar
                totalCampaigns={totalCampaigns}
                activeCampaigns={activeCampaigns}
                totalRaised={totalRaisedCampaigns}
                avgCompletion={avgCompletion}
                topCampaign={topCampaign}
              />
            ) : (
              <ProfileSidebar charity={displayCharity} />
            )}
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <ActionBar
        onEdit={() => navigate('/charity/organization/manage')}
        onPostUpdate={() => navigate('/charity/updates?create=1')}
        onCreateCampaign={() => navigate('/charity/campaigns')}
      />

      {/* Image Viewer & Upload Modal */}
      <ImageViewerModal
        open={imageViewerOpen}
        onOpenChange={setImageViewerOpen}
        imageUrl={imageViewerType === "profile" ? logoUrl : coverUrl}
        imageType={imageViewerType}
        charityName={displayCharity?.name || "Your Charity"}
        onImageUpdate={handleImageUpdate}
      />

      {/* Followers Modal */}
      {displayCharity?.id && (
        <FollowersModal
          open={followersModalOpen}
          onOpenChange={setFollowersModalOpen}
          charityId={displayCharity.id}
          charityName={displayCharity.name}
        />
      )}
    </div>
  );
}
