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
  Plus,
  Edit as EditIcon,
  Trash2,
  FileText,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { campaignService } from "@/services/campaigns";
import { charityService } from "@/services/charity";
import { buildStorageUrl } from "@/lib/api";
import { DonationChannelsCard } from "@/components/campaign/DonationChannelsCard";
import { CampaignUpdateModal } from "@/components/campaign/CampaignUpdateModal";
import { useAuth } from "@/context/AuthContext";
import FundUsageFormModal from "@/components/campaign/FundUsageFormModal";

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
    id: number;
    category: string;
    amount: number;
    description?: string;
    spent_at?: string;
    attachment_path?: string;
  }>;
  gallery?: string[];
}

interface Update {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  image_path?: string;
  is_milestone?: boolean;
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
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("story");
  // Updates CRUD state
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<Update | null>(null);
  const [updateDeleteDialogOpen, setUpdateDeleteDialogOpen] = useState(false);
  const [deletingUpdateId, setDeletingUpdateId] = useState<number | null>(null);
  // Updates stats & milestones (for sidebar)
  const [updateStats, setUpdateStats] = useState<{ total_updates: number; milestone_count: number; last_update_date: string | null } | null>(null);
  const [milestones, setMilestones] = useState<Update[]>([]);
  const [highlightedUpdateId, setHighlightedUpdateId] = useState<number | null>(null);
  
  // Fund Usage CRUD state
  const [fundUsageModalOpen, setFundUsageModalOpen] = useState(false);
  const [editingFundUsage, setEditingFundUsage] = useState<any | null>(null);
  const [deleteFundUsageId, setDeleteFundUsageId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    loadCampaignData();
  }, [id]);

  // Load updates stats for sidebar
  const loadCampaignUpdateStats = async (campaignId: number) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/campaigns/${campaignId}/updates/stats`);
      if (res.ok) {
        const data = await res.json();
        setUpdateStats(data);
      }
    } catch (e) {
      console.error('Failed to load update stats', e);
      setUpdateStats(null);
    }
  };

  // Load recent milestones for sidebar
  const loadRecentMilestones = async (campaignId: number) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/campaigns/${campaignId}/updates/milestones`);
      if (res.ok) {
        const data = await res.json();
        const list = (data.data || []).map((u: any) => ({
          id: u.id,
          title: u.title,
          content: u.content || '',
          createdAt: u.created_at,
          image_path: u.image_path,
          is_milestone: !!u.is_milestone,
        })) as Update[];
        setMilestones(list);
      }
    } catch (e) {
      console.error('Failed to load milestones', e);
      setMilestones([]);
    }
  };

  // Refresh all update-related data after create/edit/delete
  const refreshCampaignUpdates = async () => {
    if (!id) return;
    try {
      const updatesData = await campaignService.getCampaignUpdates(parseInt(id));
      const mapped = (updatesData || []).map((update: any) => ({
        id: update.id,
        title: update.title,
        content: update.content || "",
        createdAt: update.created_at || update.date,
        image_path: update.image_path,
        is_milestone: !!update.is_milestone,
      })) as Update[];
      setUpdates(mapped);
      await Promise.all([
        loadCampaignUpdateStats(parseInt(id)),
        loadRecentMilestones(parseInt(id))
      ]);
    } catch (e) {
      console.error('Failed to refresh campaign updates', e);
    }
  };

  // CRUD handlers for campaign updates
  const openCreateUpdate = () => { setEditingUpdate(null); setUpdateModalOpen(true); };
  const openEditUpdate = (u: Update) => { setEditingUpdate(u); setUpdateModalOpen(true); };
  const confirmDeleteUpdate = (id: number) => { setDeletingUpdateId(id); setUpdateDeleteDialogOpen(true); };
  const handleDeleteUpdate = async () => {
    if (!deletingUpdateId) return;
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || '';
      const res = await fetch(`${import.meta.env.VITE_API_URL}/campaign-updates/${deletingUpdateId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast({ title: 'Deleted', description: 'Update deleted successfully' });
        await refreshCampaignUpdates();
      } else {
        toast({ title: 'Error', description: 'Failed to delete update', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to delete update', variant: 'destructive' });
    } finally {
      setUpdateDeleteDialogOpen(false);
      setDeletingUpdateId(null);
    }
  };

  const scrollToUpdate = (updateId: number) => {
    const el = document.getElementById(`camp-update-${updateId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setHighlightedUpdateId(updateId);
      window.setTimeout(() => {
        setHighlightedUpdateId((prev) => (prev === updateId ? null : prev));
      }, 2000);
    }
  };

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
          outcome: campaignResponse.expected_outcome || campaignResponse.outcome || "",
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

      // Fetch updates (campaign-specific)
      let campaignUpdates: Update[] = [];
      try {
        console.log('🔍 Fetching updates for campaign:', id);
        const updatesData = await campaignService.getCampaignUpdates(parseInt(id));
        console.log('📦 Raw updates data:', updatesData);
        console.log('📊 Is array?', Array.isArray(updatesData));
        console.log('📊 Data length:', updatesData?.length);
        
        if (Array.isArray(updatesData)) {
          campaignUpdates = updatesData.map((update: any) => ({
            id: update.id,
            title: update.title,
            content: update.content || "",
            createdAt: update.created_at || update.date,
            image_path: update.image_path,
            is_milestone: !!update.is_milestone,
          }));
          console.log('✅ Mapped updates:', campaignUpdates);
        } else {
          console.warn('⚠️ Updates data is not an array:', typeof updatesData);
        }
      } catch (err: any) {
        console.error('❌ Error fetching updates:', err);
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

      // Fetch fund usage (from backend API)
      try {
        console.log('🔍 Fetching fund usage for campaign:', id);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/campaigns/${id}/fund-usage`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || ''}`,
          },
        });
        
        if (response.ok) {
          const fundUsageData = await response.json();
          console.log('📦 Fund usage data:', fundUsageData);
          
          if (fundUsageData.data && Array.isArray(fundUsageData.data)) {
            mappedCampaign.fundUsage = fundUsageData.data.map((item: any) => ({
              id: item.id,
              category: item.category,
              amount: parseFloat(item.amount),
              description: item.description,
              spent_at: item.spent_at,
              attachment_path: item.attachment_path,
            }));
            console.log('✅ Mapped fund usage:', mappedCampaign.fundUsage);
          }
        }
      } catch (err: any) {
        console.error('❌ Error fetching fund usage:', err);
      }

      // Final fallback for display label
      if (!mappedCampaign.charity.name) {
        mappedCampaign.charity.name = "Unknown Charity";
      }
      setCampaign(mappedCampaign);
      console.log('🎯 Setting updates to state:', campaignUpdates, 'Count:', campaignUpdates.length);
      setUpdates(campaignUpdates);
      setSupporters(campaignSupporters);
      // Load sidebar data for Updates tab
      try {
        await Promise.all([
          loadCampaignUpdateStats(parseInt(id)),
          loadRecentMilestones(parseInt(id))
        ]);
      } catch {}
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

  // Check if current user is the charity owner
  const isCharityOwner = user?.role === 'charity_admin' && user?.charity?.id === campaign?.charity.id;

  const handleDeleteFundUsage = async () => {
    if (!deleteFundUsageId) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/fund-usage/${deleteFundUsageId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || ''}`,
        },
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Fund usage record deleted successfully",
        });
        loadCampaignData(); // Reload to refresh the list
      } else {
        toast({
          title: "Error",
          description: "Failed to delete fund usage record",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to delete fund usage:', error);
      toast({
        title: "Error",
        description: "Failed to delete fund usage record",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeleteFundUsageId(null);
    }
  };

  const handleFundUsageSuccess = () => {
    loadCampaignData(); // Reload to refresh the list
    setEditingFundUsage(null);
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

                    {campaign.story?.problem && (
                      <>
                        <Separator />
                        <div>
                          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                            <span className="text-red-500">⚠️</span> The Problem
                          </h3>
                          <p className="text-muted-foreground leading-relaxed">
                            {campaign.story.problem}
                          </p>
                        </div>
                      </>
                    )}

                    {campaign.story?.solution && (
                      <>
                        <Separator />
                        <div>
                          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                            <span className="text-blue-500">💡</span> The Solution
                          </h3>
                          <p className="text-muted-foreground leading-relaxed">
                            {campaign.story.solution}
                          </p>
                        </div>
                      </>
                    )}

                    {campaign.story?.outcome && (
                      <>
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
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Campaign Updates</h2>
                  {isCharityOwner && (
                    <Button onClick={openCreateUpdate}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Update
                    </Button>
                  )}
                </div>
                {updates.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground">No updates yet</p>
                      {isCharityOwner && (
                        <Button className="mt-4" onClick={openCreateUpdate}>
                          <Plus className="h-4 w-4 mr-2" /> Create First Update
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  updates.map((update) => (
                    <Card key={update.id} id={`camp-update-${update.id}`} className={`${update.is_milestone ? "border-yellow-500/50 bg-yellow-500/5" : ""} ${highlightedUpdateId === update.id ? "ring-2 ring-primary" : ""}`}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={buildStorageUrl(campaign.charity.logo) || undefined} />
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                {campaign.charity.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold">{campaign.charity.name}</p>
                                {update.is_milestone && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500 text-white">
                                    🏁 Milestone
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(update.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {isCharityOwner && (
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => openEditUpdate(update)}>
                                <EditIcon className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => confirmDeleteUpdate(update.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold mb-2">{update.title}</h3>
                        {update.image_path && (
                          <img
                            src={buildStorageUrl(update.image_path) || undefined}
                            alt={update.title}
                            className="w-full h-64 object-cover rounded-lg mb-3"
                          />
                        )}
                        <p className="text-foreground leading-relaxed whitespace-pre-line">{update.content}</p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              {/* Tab 3: Fund Usage */}
              <TabsContent value="usage" className="space-y-4 mt-6">
                {/* Header with Add button for charity owner */}
                {isCharityOwner && (
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Fund Usage Records</h2>
                    <Button 
                      onClick={() => {
                        setEditingFundUsage(null);
                        setFundUsageModalOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Expense
                    </Button>
                  </div>
                )}
                
                {campaign.fundUsage && campaign.fundUsage.length > 0 ? (
                  campaign.fundUsage.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold capitalize mb-1">
                              {item.category === 'supplies' && '📦'}
                              {item.category === 'staffing' && '👥'}
                              {item.category === 'transport' && '🚚'}
                              {item.category === 'operations' && '⚙️'}
                              {item.category === 'other' && '📋'}
                              {' '}{item.category}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              {item.spent_at && new Date(item.spent_at).toLocaleDateString('en-PH', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-2xl font-bold text-primary">
                                {formatCurrency(item.amount)}
                              </p>
                            </div>
                            {/* CRUD buttons - only for charity owner */}
                            {isCharityOwner && (
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingFundUsage(item);
                                    setFundUsageModalOpen(true);
                                  }}
                                >
                                  <EditIcon className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setDeleteFundUsageId(item.id);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        {item.description && (
                          <p className="text-foreground leading-relaxed">
                            {item.description}
                          </p>
                        )}
                        {item.attachment_path && (
                          <div className="mt-3 pt-3 border-t">
                            <a
                              href={`http://127.0.0.1:8000/storage/${item.attachment_path}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                            >
                              <FileText className="h-4 w-4" />
                              View Proof of Expense
                            </a>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground">No fund usage records yet</p>
                    </CardContent>
                  </Card>
                )}
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
                        <div className="grid grid-cols-3 gap-4 items-end">
                          {supporters.slice(0, 3).map((supporter, index) => {
                            const medals = [
                              { icon: Trophy, color: "text-yellow-500", ring: "ring-yellow-400", chip: "bg-yellow-500/15 text-yellow-600" },
                              { icon: Medal, color: "text-gray-400", ring: "ring-gray-300", chip: "bg-gray-300/15 text-gray-400" },
                              { icon: Award, color: "text-orange-600", ring: "ring-orange-500", chip: "bg-orange-500/15 text-orange-600" },
                            ];
                            const medal = medals[index];
                            const MedalIcon = medal.icon;

                            const containerClasses =
                              index === 0
                                ? "col-span-3 md:col-span-1 md:scale-110 md:-translate-y-2"
                                : "opacity-95";

                            return (
                              <div
                                key={supporter.id}
                                className={`relative flex flex-col items-center p-5 rounded-xl border border-border/40 bg-background/60 shadow-sm ${containerClasses}`}
                              >
                                <div className="relative mb-3">
                                  <Avatar className={`h-20 w-20 ${index === 0 ? `ring-4 ${medal.ring}` : `ring-2 ${medal.ring}`} ring-offset-2 ring-offset-background`}>
                                    <AvatarFallback className={`bg-background/70 ${medal.color} text-2xl font-bold`}>
                                      {supporter.isAnonymous ? "?" : supporter.name.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className={`absolute -top-1 -right-1 rounded-full p-1.5 border-2 border-background ${medal.chip}`}>
                                    <MedalIcon className={`h-4 w-4 ${medal.color}`} />
                                  </div>
                                </div>
                                <p className="font-semibold text-center">
                                  {supporter.isAnonymous ? "Anonymous Donor" : supporter.name}
                                </p>
                                <p className={`text-xl font-bold mt-1 ${medal.color}`}>
                                  {formatCurrency(supporter.amount)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">Rank #{supporter.rank}</p>
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
                              "text-yellow-700 bg-yellow-500/15",
                              "text-gray-600 bg-gray-300/20",
                              "text-orange-700 bg-orange-500/15",
                            ];

                            return (
                              <div
                                key={supporter.id}
                                className={`flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-background/40 hover:bg-muted/50 transition-colors ${
                                  isTopThree ? "ring-1 ring-primary/20" : ""
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
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium">
                                      {supporter.isAnonymous ? "Anonymous Donor" : supporter.name}
                                    </p>
                                    {supporter.isAnonymous && (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted/70 text-muted-foreground">Anonymous</span>
                                    )}
                                    {isTopThree && (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">Top Donor</span>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(supporter.donatedAt).toLocaleDateString()}
                                  </p>
                                </div>

                                {/* Amount */}
                                <div className="text-right min-w-[100px]">
                                  <p className="font-extrabold text-primary">
                                    {formatCurrency(supporter.amount)}
                                  </p>
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

          {/* Right Sidebar - Dynamic based on active tab */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-4">
              {/* Progress & CTA Card - Show on Story tab only */}
              {activeTab === "story" && (
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
                      {!isCharityOwner && (
                        <Button
                          size="lg"
                          className="w-full bg-primary hover:bg-primary/90 text-lg h-12"
                          onClick={() => navigate(`/donor/campaigns/${campaign.id}/donate`)}
                        >
                          <Heart className="mr-2 h-5 w-5" />
                          Donate Now
                        </Button>
                      )}

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
              )}

              {/* Updates Sidebar - Show on Updates tab */}
              {activeTab === "updates" && (
                <>
                  {/* Recent Updates Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Recent Updates</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {updates.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No updates yet</p>
                      ) : (
                        <div className="space-y-3">
                          {updates.slice(0, 3).map((u) => (
                            <button
                              key={u.id}
                              className="w-full text-left p-3 rounded-lg border border-border/30 hover:bg-muted/50 transition-colors"
                              onClick={() => scrollToUpdate(u.id)}
                            >
                              <p className="font-medium text-sm truncate">{u.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{new Date(u.createdAt).toLocaleString()}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Engagement Overview (Stats) */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Engagement Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Updates</p>
                        <p className="text-2xl font-bold">{updateStats?.total_updates ?? updates.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Milestones</p>
                        <p className="text-2xl font-bold text-yellow-500">{updateStats?.milestone_count ?? updates.filter(u => u.is_milestone).length}</p>
                      </div>
                      {updateStats?.last_update_date && (
                        <div>
                          <p className="text-sm text-muted-foreground">Last Update</p>
                          <p className="text-sm font-medium">{new Date(updateStats.last_update_date).toLocaleDateString()}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Add New Update (owner only) */}
                  {isCharityOwner && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Add New Update</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Button className="w-full" onClick={openCreateUpdate}>
                          <Plus className="h-4 w-4 mr-2" />
                          New Update
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {/* Fund Usage Summary - Show on Fund Usage tab */}
              {activeTab === "usage" && campaign.fundUsage && campaign.fundUsage.length > 0 && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Spending Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Spent</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(campaign.fundUsage.reduce((sum, item) => sum + item.amount, 0))}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Records</p>
                        <p className="text-2xl font-bold">{campaign.fundUsage.length}</p>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">By Category</p>
                        {Object.entries(
                          campaign.fundUsage.reduce((acc: Record<string, number>, item) => {
                            acc[item.category] = (acc[item.category] || 0) + item.amount;
                            return acc;
                          }, {})
                        ).map(([category, amount]) => (
                          <div key={category} className="flex items-center justify-between text-sm">
                            <span className="capitalize">{category}</span>
                            <span className="font-medium">{formatCurrency(amount as number)}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Recent Fund Entries */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Recent Entries</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {campaign.fundUsage.slice(0, 3).map((item) => (
                          <div key={item.id} className="border-l-2 border-primary pl-3 py-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium text-sm capitalize">{item.category}</p>
                              <p className="text-sm font-bold text-primary">{formatCurrency(item.amount)}</p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {item.spent_at && new Date(item.spent_at).toLocaleDateString('en-PH', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Supporters Summary - Show on Supporters tab */}
              {activeTab === "supporters" && supporters.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Supporter Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Supporters</p>
                      <p className="text-2xl font-bold">{supporters.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Raised</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(supporters.reduce((sum, s) => sum + s.amount, 0))}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Average Donation</p>
                      <p className="text-xl font-bold">
                        {formatCurrency(supporters.reduce((sum, s) => sum + s.amount, 0) / supporters.length)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Donation Channels - Show on Story & Supporters tabs */}
              {(activeTab === "story" || activeTab === "supporters") && (
                <DonationChannelsCard campaignId={campaign.id} />
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Fund Usage Form Modal */}
      <FundUsageFormModal
        open={fundUsageModalOpen}
        onOpenChange={setFundUsageModalOpen}
        campaignId={campaign.id}
        fundUsage={editingFundUsage}
        onSuccess={handleFundUsageSuccess}
      />

      {/* Campaign Update Modal */}
      <CampaignUpdateModal
        open={updateModalOpen}
        onOpenChange={(open) => { setUpdateModalOpen(open); if (!open) setEditingUpdate(null); }}
        campaignId={campaign.id}
        update={editingUpdate ? ({
          id: editingUpdate.id,
          campaign_id: campaign.id,
          title: editingUpdate.title,
          content: editingUpdate.content,
          is_milestone: !!editingUpdate.is_milestone,
          image_path: editingUpdate.image_path,
          created_at: editingUpdate.createdAt,
        } as any) : null}
        onSuccess={refreshCampaignUpdates}
      />

      {/* Delete Fund Usage Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Fund Usage Record?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this expense record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFundUsage} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Campaign Update Confirmation */}
      <AlertDialog open={updateDeleteDialogOpen} onOpenChange={setUpdateDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Update?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this update.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUpdate} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
