import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  VisuallyHidden,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MessageSquare, 
  Heart, 
  ArrowRight,
  Target,
  Image as ImageIcon,
  Pin,
  Loader2,
  Share2,
  ChevronLeft,
  ChevronRight,
  Plus,
  MoreVertical,
  Edit2,
  PinOff,
  Trash2,
  Calendar,
  Pencil,
  ExternalLink,
  Mail,
  Phone,
  Globe,
  MapPin,
  Clock,
  CheckCircle2,
  User,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Wallet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { charityService } from "@/services/charity";
import { toast } from "sonner";
import { updatesService } from "@/services/updates";
import { getStorageUrl } from "@/lib/storage";
import { CampaignCardSkeleton } from "@/components/charity/CampaignCardSkeleton";
import { CampaignCard, Campaign as DashboardCampaign } from "@/components/charity/CampaignCard";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreateCampaignModal } from "@/components/charity/CreateCampaignModal";
import { campaignService } from "@/services/campaigns";
import { CreateUpdateModal } from "@/components/updates/CreateUpdateModal";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { OperatingHoursInput } from "@/components/charity/OperatingHoursInput";
import { AddDonationChannelModal } from "@/components/campaign/AddDonationChannelModal";

interface Update {
  id: number;
  title?: string;
  content: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  media_urls?: string[];
  is_pinned?: boolean;
  is_liked?: boolean;
  like?: boolean;
}

interface Comment {
  id: number;
  content: string;
  created_at: string;
  likes_count?: number;
  is_liked?: boolean;
  user?: {
    id?: number;
    name?: string;
    role?: string;
    profile_image?: string;
    charity?: { id?: number; name?: string; logo_path?: string };
  };

}

interface Campaign {
  id: number;
  title: string;
  description?: string;
  amountRaised: number;
  goal: number;
  donorsCount: number;
  status: string;
  bannerImage?: string;
  deadline?: string;
}

interface ProfileTabsProps {
  charity: {
    id?: number;
    name?: string;
    logo_path?: string;
    mission?: string;
    vision?: string;
    description?: string;
    registration_number?: string;
    created_at?: string;
    email?: string;
    contact_email?: string;
    primary_email?: string;
    phone?: string;
    contact_phone?: string;
    primary_phone?: string;
    address?: string;
    full_address?: string;
    website?: string;
    website_url?: string;
    operating_hours?: string;
    facebook_url?: string;
    instagram_url?: string;
    twitter_url?: string;
    linkedin_url?: string;
    youtube_url?: string;
    is_email_verified?: boolean;
    is_phone_verified?: boolean;
  };
  recentUpdates: Update[];
  campaigns: Campaign[];
  formatDate: (date: string) => string;
  getTimeAgo: (date: string) => string;
  buildStorageUrl: (path: string) => string;
  formatCurrency: (amount: number) => string;
  activeTab: string;
  onTabChange: (value: string) => void;
  campaignsLoading?: boolean;
  onCampaignsRefresh?: () => void;
  onUpdatesRefresh?: () => void;
  onProfileRefresh?: () => void;
}

export function ProfileTabs({ 
  charity, 
  recentUpdates, 
  campaigns,
  formatDate,
  getTimeAgo,
  buildStorageUrl,
  formatCurrency,
  activeTab,
  onTabChange,
  campaignsLoading,
  onCampaignsRefresh,
  onUpdatesRefresh,
  onProfileRefresh
}: ProfileTabsProps) {
  const navigate = useNavigate();
  const derivedEmail = (charity as any)?.email || (charity as any)?.contact_email;
  const derivedPhone = (charity as any)?.phone || (charity as any)?.contact_phone;
  const derivedWebsite = (charity as any)?.website || (charity as any)?.website_url;
  const [updates, setUpdates] = useState<Update[]>(recentUpdates || []);
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [comments, setComments] = useState<Record<number, Comment[]>>({});
  const [newComment, setNewComment] = useState<Record<number, string>>({});
  const [loadingComments, setLoadingComments] = useState<Set<number>>(new Set());
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [selectedPostModal, setSelectedPostModal] = useState<Update | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [campaignFilter, setCampaignFilter] = useState<'all'|'active'|'completed'|'pending'>('all');
  const [campaignSort, setCampaignSort] = useState<'newest'|'most_funded'|'ending_soon'>('newest');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    targetAmount: '',
    donationType: 'one_time' as 'one_time' | 'recurring',
    status: 'draft' as 'draft' | 'published' | 'closed' | 'archived',
    deadline: '',
    startDate: '',
    endDate: '',
    image: null as File | null,
  });
  const [createErrors, setCreateErrors] = useState<{ title?: string; targetAmount?: string; description?: string; deadline?: string }>({});

  // New Update modal (reused shared component)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // Post options (edit, delete, pin)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<Update | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [updateToDelete, setUpdateToDelete] = useState<number | null>(null);
  const [highlightedUpdateId, setHighlightedUpdateId] = useState<number | null>(null);

  // About Tab Edit Modals
  const [isMissionModalOpen, setIsMissionModalOpen] = useState(false);
  const [isVisionModalOpen, setIsVisionModalOpen] = useState(false);
  const [isAboutUsModalOpen, setIsAboutUsModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);

  // Edit Form States
  const [missionText, setMissionText] = useState("");
  const [visionText, setVisionText] = useState("");
  const [aboutUsText, setAboutUsText] = useState("");
  const [contactForm, setContactForm] = useState({
    email: "",
    phone: "",
    address: "",
    operating_hours: "",
    website: ""
  });
  const [socialForm, setSocialForm] = useState({
    facebook_url: "",
    instagram_url: "",
    twitter_url: "",
    linkedin_url: "",
    youtube_url: ""
  });

  // Saving states
  const [isSavingMission, setIsSavingMission] = useState(false);
  const [isSavingVision, setIsSavingVision] = useState(false);
  const [isSavingAboutUs, setIsSavingAboutUs] = useState(false);
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [isSavingSocial, setIsSavingSocial] = useState(false);

  // Donation Channel modal states (for Campaigns tab)
  const [isDonationChannelModalOpen, setIsDonationChannelModalOpen] = useState(false);

  const filteredCampaigns = useMemo(() => {
    let list = [...campaigns];
    if (campaignFilter !== 'all') {
      list = list.filter(c => (c.status || '').toLowerCase() === (campaignFilter === 'pending' ? 'pending' : campaignFilter));
    }
    switch (campaignSort) {
      case 'most_funded':
        list.sort((a,b) => (b.amountRaised / Math.max(1, b.goal)) - (a.amountRaised / Math.max(1, a.goal)));
        break;
      case 'ending_soon':
        list.sort((a,b) => {
          const da = a.deadline ? new Date(a.deadline).getTime() : Number.MAX_SAFE_INTEGER;
          const db = b.deadline ? new Date(b.deadline).getTime() : Number.MAX_SAFE_INTEGER;
          return da - db;
        });
        break;
      case 'newest':
      default:
        list.sort((a,b) => b.id - a.id);
    }
    return list;
  }, [campaigns, campaignFilter, campaignSort]);

  useEffect(() => {
    const handler = () => setIsCreateOpen(true);
    window.addEventListener('open-campaign-create', handler as EventListener);
    return () => window.removeEventListener('open-campaign-create', handler as EventListener);
  }, []);

  // Listen for open event from UpdatesSidebar to open modal in-place
  useEffect(() => {
    const openUpdate = () => setIsUpdateModalOpen(true);
    window.addEventListener('open-update-create', openUpdate as EventListener);
    return () => window.removeEventListener('open-update-create', openUpdate as EventListener);
  }, []);

  // Listen for contact edit event from ProfileSidebar
  useEffect(() => {
    const openContactEdit = () => handleOpenContactModal();
    window.addEventListener('open-contact-edit', openContactEdit as EventListener);
    return () => window.removeEventListener('open-contact-edit', openContactEdit as EventListener);
  }, [charity]);

  // Listen for social edit event from ProfileSidebar
  useEffect(() => {
    const openSocialEdit = () => handleOpenSocialModal();
    window.addEventListener('open-social-edit', openSocialEdit as EventListener);
    return () => window.removeEventListener('open-social-edit', openSocialEdit as EventListener);
  }, [charity]);

  useEffect(() => {
    setUpdates(recentUpdates || []);
  }, [recentUpdates]);

  useEffect(() => {
    const handler = (e: any) => {
      const id = e?.detail?.id as number | undefined;
      if (!id) return;
      const el = document.getElementById(`update-${id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setHighlightedUpdateId(id);
        window.setTimeout(() => {
          setHighlightedUpdateId((prev) => (prev === id ? null : prev));
        }, 2000);
      }
    };
    window.addEventListener('scroll-to-update', handler as EventListener);
    return () => window.removeEventListener('scroll-to-update', handler as EventListener);
  }, []);

  const mapCampaignStatus = (status: string): DashboardCampaign["status"] => {
    const s = (status || '').toLowerCase();
    if (s === 'published' || s === 'active') return 'active';
    if (s === 'completed') return 'completed';
    if (s === 'draft') return 'draft';
    if (s === 'expired' || s === 'closed' || s === 'archived') return 'expired';
    return 'active';
  };

  const handleToggleLike = async (updateId: number) => {
    try {
      const result = await updatesService.toggleLike(updateId);
      setUpdates((prev) => prev.map((u) =>
        u.id === updateId ? { ...u, is_liked: result.liked, likes_count: result.likes_count } : u
      ));
    } catch (error) {
      toast.error("Failed to like update");
      console.error("Error toggling like:", error);
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
      if (!comments[updateId]) fetchComments(updateId);
    }
  };

  const handleAddComment = async (updateId: number) => {
    const content = newComment[updateId];
    if (!content?.trim()) return;
    try {
      const created = await updatesService.addComment(updateId, content);
      setComments((prev) => ({ ...prev, [updateId]: [ ...(prev[updateId] || []), created ] }));
      setNewComment((prev) => ({ ...prev, [updateId]: "" }));
      setUpdates((prev) => prev.map((u) => u.id === updateId ? { ...u, comments_count: u.comments_count + 1 } : u));
      toast.success("Comment added");
    } catch (error) {
      toast.error("Failed to add comment");
      console.error("Error adding comment:", error);
    }
  };

  // Post options: pin/unpin, delete (with confirmation), edit (modal)
  const handleTogglePin = async (id: number, currentlyPinned: boolean) => {
    try {
      await updatesService.togglePin(id);
      toast.success(currentlyPinned ? "Update unpinned" : "Update pinned to top");
      onUpdatesRefresh && onUpdatesRefresh();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to update pin status");
      console.error("Error toggling pin:", error);
    }
  };

  const handleDelete = (id: number) => {
    setUpdateToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!updateToDelete) return;
    try {
      await updatesService.deleteUpdate(updateToDelete);
      toast.success("Post moved to bin. It will be permanently deleted after 30 days.");
      setDeleteDialogOpen(false);
      setUpdateToDelete(null);
      onUpdatesRefresh && onUpdatesRefresh();
    } catch (error) {
      toast.error("Failed to delete post");
      console.error("Error deleting update:", error);
    }
  };

  const handleEdit = async () => {
    if (!editingUpdate || !editContent.trim()) return;
    try {
      await updatesService.updateUpdate(editingUpdate.id, editContent);
      toast.success("Update edited successfully");
      setIsEditModalOpen(false);
      setEditingUpdate(null);
      onUpdatesRefresh && onUpdatesRefresh();
    } catch (error) {
      toast.error("Failed to edit update");
      console.error("Error editing update:", error);
    }
  };

  const handleOpenPostModal = (update: Update, imageIndex: number = 0) => {
    setSelectedPostModal(update);
    setSelectedImageIndex(imageIndex);
    setIsPostModalOpen(true);
    if (!comments[update.id]) fetchComments(update.id);
  };

  const handleNextImage = () => {
    if (selectedPostModal && selectedPostModal.media_urls) {
      setSelectedImageIndex((prev) => prev < selectedPostModal.media_urls.length - 1 ? prev + 1 : 0);
    }
  };
  const handlePrevImage = () => {
    if (selectedPostModal && selectedPostModal.media_urls) {
      setSelectedImageIndex((prev) => prev > 0 ? prev - 1 : selectedPostModal.media_urls.length - 1);
    }
  };

  // Word count utility
  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  // About Tab Modal Handlers
  const handleOpenMissionModal = () => {
    setMissionText(charity.mission || "");
    setIsMissionModalOpen(true);
  };

  const handleOpenVisionModal = () => {
    setVisionText(charity.vision || "");
    setIsVisionModalOpen(true);
  };

  const handleOpenAboutUsModal = () => {
    setAboutUsText(charity.description || "");
    setIsAboutUsModalOpen(true);
  };

  const handleOpenContactModal = () => {
    setContactForm({
      email: (charity as any)?.contact_email || (charity as any)?.email || (charity as any)?.primary_email || "",
      phone: (charity as any)?.contact_phone || (charity as any)?.phone || (charity as any)?.primary_phone || "",
      address: charity.address || (charity as any)?.full_address || "",
      operating_hours: charity.operating_hours || "",
      website: (charity as any)?.website || (charity as any)?.website_url || ""
    });
    setIsContactModalOpen(true);
  };

  const handleOpenSocialModal = () => {
    setSocialForm({
      facebook_url: (charity as any)?.facebook_url || "",
      instagram_url: (charity as any)?.instagram_url || "",
      twitter_url: (charity as any)?.twitter_url || "",
      linkedin_url: (charity as any)?.linkedin_url || "",
      youtube_url: (charity as any)?.youtube_url || ""
    });
    setIsSocialModalOpen(true);
  };

  // Save Handlers
  const handleSaveMission = async () => {
    if (getWordCount(missionText) > 1000) {
      toast.error("Mission text exceeds 1000 words");
      return;
    }
    setIsSavingMission(true);
    try {
      await charityService.updateProfile({ mission: missionText });
      toast.success("Mission updated successfully");
      setIsMissionModalOpen(false);
      if (onProfileRefresh) onProfileRefresh();
    } catch (error) {
      toast.error("Failed to update mission");
      console.error("Error updating mission:", error);
    } finally {
      setIsSavingMission(false);
    }
  };

  const handleSaveVision = async () => {
    if (getWordCount(visionText) > 1000) {
      toast.error("Vision text exceeds 1000 words");
      return;
    }
    setIsSavingVision(true);
    try {
      await charityService.updateProfile({ vision: visionText });
      toast.success("Vision updated successfully");
      setIsVisionModalOpen(false);
      if (onProfileRefresh) onProfileRefresh();
    } catch (error) {
      toast.error("Failed to update vision");
      console.error("Error updating vision:", error);
    } finally {
      setIsSavingVision(false);
    }
  };

  const handleSaveAboutUs = async () => {
    if (getWordCount(aboutUsText) > 2000) {
      toast.error("About Us text exceeds 2000 words");
      return;
    }
    setIsSavingAboutUs(true);
    try {
      await charityService.updateProfile({ description: aboutUsText });
      toast.success("About Us updated successfully");
      setIsAboutUsModalOpen(false);
      if (onProfileRefresh) onProfileRefresh();
    } catch (error) {
      toast.error("Failed to update About Us");
      console.error("Error updating About Us:", error);
    } finally {
      setIsSavingAboutUs(false);
    }
  };

  const handleSaveContact = async () => {
    // Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (contactForm.email && !emailRegex.test(contactForm.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSavingContact(true);
    try {
      await charityService.updateProfile({
        email: contactForm.email,
        phone: contactForm.phone,
        address: contactForm.address,
        operating_hours: contactForm.operating_hours,
        website: contactForm.website
      });
      toast.success("Contact information updated successfully");
      setIsContactModalOpen(false);
      if (onProfileRefresh) onProfileRefresh();
    } catch (error) {
      toast.error("Failed to update contact information");
      console.error("Error updating contact:", error);
    } finally {
      setIsSavingContact(false);
    }
  };

  const handleSaveSocial = async () => {
    setIsSavingSocial(true);
    try {
      await charityService.updateProfile(socialForm);
      toast.success("Social profiles updated successfully");
      setIsSocialModalOpen(false);
      if (onProfileRefresh) onProfileRefresh();
    } catch (error) {
      toast.error("Failed to update social profiles");
      console.error("Error updating social profiles:", error);
    } finally {
      setIsSavingSocial(false);
    }
  };

  // Derive admin name
  const adminName = (charity as any)?.owner?.name || 
                   [(charity as any)?.first_name, (charity as any)?.middle_initial, (charity as any)?.last_name].filter(Boolean).join(' ').trim() ||
                   [(charity as any)?.primary_first_name, (charity as any)?.primary_middle_initial, (charity as any)?.primary_last_name].filter(Boolean).join(' ').trim();

  return (
    <>
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <div className="w-full mb-4">
        <TabsList 
          className="bg-transparent p-0"
          role="tablist"
        >
          <div className="flex items-center gap-4">
            <TabsTrigger 
              value="about"
              role="tab"
              aria-selected="true"
              aria-controls="about-panel"
              className="rounded-lg px-5 py-2 text-base text-muted-foreground hover:bg-white/10 transition-colors data-[state=active]:bg-white/15 data-[state=active]:text-foreground"
            >
              About
            </TabsTrigger>
            <TabsTrigger 
              value="updates"
              role="tab"
              aria-controls="updates-panel"
              className="rounded-lg px-5 py-2 text-base text-muted-foreground hover:bg-white/10 transition-colors data-[state=active]:bg-white/15 data-[state=active]:text-foreground"
            >
              <span className="mr-2">Updates</span>
              {recentUpdates.length > 0 && (
                <span className="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-sky-600 text-white text-xs font-semibold">
                  {recentUpdates.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="campaigns"
              role="tab"
              aria-controls="campaigns-panel"
              className="rounded-lg px-5 py-2 text-base text-muted-foreground hover:bg-white/10 transition-colors data-[state=active]:bg-white/15 data-[state=active]:text-foreground"
            >
              <span className="mr-2">Campaigns</span>
              {campaigns.length > 0 && (
                <span className="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-indigo-600 text-white text-xs font-semibold">
                  {campaigns.length}
                </span>
              )}
            </TabsTrigger>
          </div>
        </TabsList>
      </div>

      {/* About Tab */}
      <TabsContent value="about" id="about-panel" role="tabpanel" className="space-y-6">
        {/* Mission Card */}
        {charity.mission && (
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Mission</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
                  aria-label="Edit Mission"
                  onClick={handleOpenMissionModal}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">{charity.mission}</p>
            </CardContent>
          </Card>
        )}

        {/* Vision Card */}
        {charity.vision && (
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Vision</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
                  aria-label="Edit Vision"
                  onClick={handleOpenVisionModal}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">{charity.vision}</p>
            </CardContent>
          </Card>
        )}

        {/* About Us Card */}
        {charity.description && (
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">About Us</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
                  aria-label="Edit About Us"
                  onClick={handleOpenAboutUsModal}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{charity.description}</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Updates Tab */}
      <TabsContent value="updates" id="updates-panel" role="tabpanel" className="space-y-4">
        {updates.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <MessageSquare className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No updates yet</h3>
            <p className="text-muted-foreground text-sm mb-4">Share your first update with your supporters</p>
            <Button onClick={() => navigate('/charity/updates')}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Post Your First Update
            </Button>
          </Card>
        ) : (
          <>
            {updates.map((update) => {
              const media = update.media_urls || [];
              return (
                <Card 
                  key={update.id}
                  id={`update-${update.id}`}
                  className={`bg-card border-border/40 hover:shadow-lg transition-all duration-200 hover:border-border/60 ${highlightedUpdateId === update.id ? 'ring-2 ring-primary' : ''}`}
                >
                  <CardHeader className="pb-0">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <Avatar className="h-10 w-10 ring-2 ring-background shadow-sm">
                          <AvatarImage src={charity?.logo_path ? buildStorageUrl(charity.logo_path) : ''} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {(charity?.name || 'CH').substring(0,2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-sm text-foreground">{charity?.name || 'Your Charity'}</p>
                            {update.is_pinned && (
                              <Badge variant="secondary" className="flex items-center gap-1 text-xs bg-primary/10 text-primary border-0">
                                <Pin className="h-3 w-3" />
                                Pinned
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0">{getTimeAgo(update.created_at)}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingUpdate(update);
                              setEditContent(update.content);
                              setIsEditModalOpen(true);
                            }}
                          >
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edit Post
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTogglePin(update.id, !!update.is_pinned)}>
                            {update.is_pinned ? (
                              <>
                                <PinOff className="mr-2 h-4 w-4" />
                                Unpin from Top
                              </>
                            ) : (
                              <>
                                <Pin className="mr-2 h-4 w-4" />
                                Pin to Top
                              </>
                            )}
                          </DropdownMenuItem>
                          <Separator className="my-1" />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(update.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Post
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0 p-6">
                    {/* Content */}
                    <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground -mt-1">
                      {update.content}
                    </p>

                    {/* Media Grid */}
                    {media.length > 0 && (
                      <div
                        className={`grid gap-1 rounded-xl overflow-hidden ${
                          media.length === 1
                            ? 'grid-cols-1'
                            : media.length === 2
                              ? 'grid-cols-2'
                              : media.length >= 3
                                ? 'grid-cols-2 grid-rows-2'
                                : ''
                        }`}
                      >
                        {media.map((url, index) => (
                          <img
                            key={index}
                            src={buildStorageUrl(url)}
                            alt={`Update media ${index + 1}`}
                            onClick={() => handleOpenPostModal(update, index)}
                            className={`w-full object-cover cursor-pointer hover:opacity-90 hover:brightness-95 transition-all ${
                              media.length === 1
                                ? 'rounded-lg max-h-[450px]'
                                : media.length === 2
                                  ? 'rounded-lg h-[280px]'
                                  : media.length === 3
                                    ? index === 0
                                      ? 'rounded-lg row-span-2 h-full min-h-[350px] max-h-[450px]'
                                      : 'rounded-lg h-[172px]'
                                    : 'rounded-lg h-[180px]'
                            }`}
                          />
                        ))}
                      </div>
                    )}

                    {/* Divider directly above actions for consistent layout */}
                    <Separator className="mt-3 mb-2 bg-border/70" />

                    {/* Reactions Summary */}
                    {(update.likes_count > 0 || update.comments_count > 0) && (
                      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                        {update.likes_count > 0 && (
                          <button className="hover:underline" onClick={() => handleToggleLike(update.id)}>
                            <Heart className="h-3.5 w-3.5 inline mr-1 fill-red-500 text-red-500" />
                            {update.likes_count} {update.likes_count === 1 ? 'like' : 'likes'}
                          </button>
                        )}
                        {update.comments_count > 0 && (
                          <button className="hover:underline" onClick={() => handleToggleComments(update.id)}>
                            {update.comments_count} {update.comments_count === 1 ? 'comment' : 'comments'}
                          </button>
                        )}
                      </div>
                    )}

                    {/* View comments link */}
                    {update.comments_count > 0 && !expandedComments.has(update.id) && (
                      <div className="pt-2 pb-1">
                        <button
                          className="text-sm text-muted-foreground hover:underline cursor-pointer font-medium"
                          onClick={() => handleToggleComments(update.id)}
                        >
                          View all {update.comments_count} {update.comments_count === 1 ? 'comment' : 'comments'}
                        </button>
                      </div>
                    )}

                    {/* Action buttons row */}
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 h-10 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
                        onClick={() => handleToggleLike(update.id)}
                      >
                        <Heart className={`mr-2 h-4 w-4 ${update.is_liked ? 'fill-red-500 text-red-500' : ''}`} />
                        <span className="font-medium">Like</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 h-10 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200"
                        onClick={() => handleToggleComments(update.id)}
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        <span className="font-medium">Comment</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 h-10 hover:bg-green-50 dark:hover:bg-green-950/30 hover:text-green-600 dark:hover:text-green-400 transition-all duration-200"
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.origin + '/charity/updates/' + update.id);
                          toast.success('Link copied to clipboard!');
                        }}
                      >
                        <Share2 className="mr-2 h-4 w-4" />
                        <span className="font-medium">Share</span>
                      </Button>
                    </div>

                    {/* Comments Section */}
                    {expandedComments.has(update.id) && (
                      <>
                        <Separator />
                        <div className="space-y-3 pt-2">
                          {loadingComments.has(update.id) ? (
                            <div className="flex justify-center py-4">
                              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                          ) : (
                            <>
                              {comments[update.id] && comments[update.id].length > 0 && (
                                <div className="space-y-3">
                                  {comments[update.id].map((comment) => {
                                    const isReply = comment.content?.trim().startsWith('@');
                                    return (
                                      <div key={comment.id} className={`group flex gap-2.5 ${isReply ? 'ml-12' : ''}`}>
                                        <Avatar className={`${isReply ? 'h-8 w-8' : 'h-9 w-9'} mt-0.5 flex-shrink-0`}>
                                          <AvatarImage src={comment.user?.charity?.logo_path ? buildStorageUrl(comment.user.charity.logo_path) : (comment.user?.profile_image ? getStorageUrl(comment.user.profile_image) || undefined : undefined)} />
                                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                            {(comment.user?.charity?.name || comment.user?.name || 'U').substring(0,2).toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                          <div className="bg-muted/40 dark:bg-muted/30 rounded-2xl px-3.5 py-2">
                                            <p className="font-semibold text-sm text-foreground mb-0.5">
                                              {comment.user?.charity?.name || comment.user?.name || 'User'}
                                            </p>
                                            <p className="text-[15px] text-foreground leading-relaxed break-words">{comment.content}</p>
                                          </div>
                                          <div className="flex items-center gap-3 mt-1 px-3">
                                            <span className="text-xs text-muted-foreground font-medium">
                                              {comment.created_at ? getTimeAgo(comment.created_at) : ''}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                              <div className="flex gap-3 pt-3">
                                <Avatar className="h-8 w-8 mt-1 ring-2 ring-background">
                                  <AvatarImage src={charity?.logo_path ? buildStorageUrl(charity.logo_path) : ''} />
                                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                    {(charity?.name || 'CH').substring(0,2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 flex gap-2">
                                  <input
                                    type="text"
                                    placeholder="Write a comment..."
                                    value={newComment[update.id] || ''}
                                    onChange={(e) => setNewComment((prev) => ({ ...prev, [update.id]: e.target.value }))}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment(update.id)}
                                    className="flex-1 px-4 py-2.5 bg-muted/40 border border-border/60 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                  />
                                  <Button size="sm" onClick={() => handleAddComment(update.id)} disabled={!newComment[update.id]?.trim()} className="rounded-full h-10 w-10 p-0 bg-primary hover:bg-primary/90">
                                    <ArrowRight className="h-4 w-4" />
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
              );
            })}
          </>
        )}
      </TabsContent>

      {/* Campaigns Tab */}
      <TabsContent value="campaigns" id="campaigns-panel" role="tabpanel" className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h2 className="text-xl font-bold">Your Campaigns</h2>
          <div className="flex items-center gap-3">
            <Button className="bg-primary hover:bg-primary/90 h-10 transition-transform hover:scale-[1.01]" onClick={() => setIsCreateOpen(true)} aria-label="Create New Campaign">
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
            <Button
              variant="outline"
              className="h-10 transition-transform hover:scale-[1.01]"
              onClick={() => setIsDonationChannelModalOpen(true)}
              aria-label="Add Donation Channel"
            >
              <Wallet className="h-4 w-4 mr-2" />
              Add Donation Channel
            </Button>
          </div>
        </div>

        {/* Filters & Sort */}
        <div className="flex flex-wrap items-center gap-3 bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Filter:</span>
            <div className="flex rounded-lg border border-border/50 overflow-hidden">
              {(['all','active','completed','pending'] as const).map(f => (
                <button
                  key={f}
                  role="tab"
                  aria-pressed={campaignFilter===f}
                  onClick={() => setCampaignFilter(f)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${campaignFilter===f ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent text-muted-foreground hover:text-foreground'}`}
                >
                  {f === 'all' ? 'All' : f.charAt(0).toUpperCase()+f.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm font-medium text-muted-foreground">Sort:</span>
            <Select value={campaignSort} onValueChange={(v: any) => setCampaignSort(v)}>
              <SelectTrigger className="w-[150px]" aria-label="Sort campaigns">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="most_funded">Most Funded</SelectItem>
                <SelectItem value="ending_soon">Ending Soon</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Content */}
        {campaignsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            <CampaignCardSkeleton />
            <CampaignCardSkeleton />
            <CampaignCardSkeleton />
            <CampaignCardSkeleton />
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <Target className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No campaigns yet</h3>
            <p className="text-muted-foreground text-sm mb-4">Create your first campaign to start raising funds</p>
            <Button className="transition-transform hover:scale-[1.01]" onClick={() => setIsCreateOpen(true)} aria-label="Create Your First Campaign">
              <Target className="h-4 w-4 mr-2" />
              Create Your First Campaign
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {filteredCampaigns.map((c) => {
              const mapped: DashboardCampaign = {
                id: c.id,
                title: c.title,
                description: c.description || "",
                goal: Math.max(0, c.goal || 0),
                amountRaised: Math.max(0, c.amountRaised || 0),
                donorsCount: c.donorsCount || 0,
                views: 0,
                status: mapCampaignStatus(c.status || 'active'),
                bannerImage: c.bannerImage,
                endDate: c.deadline || new Date().toISOString(),
                createdAt: new Date().toISOString(),
              };
              return (
                <CampaignCard
                  key={c.id}
                  campaign={mapped}
                  viewMode="admin"
                  onEdit={(id) => navigate(`/charity/campaigns/${id}/edit`)}
                  onShare={(id) => {
                    const shareUrl = `${window.location.origin}/campaigns/${id}`;
                    if (navigator.share) {
                      navigator.share({ title: mapped.title, text: mapped.description, url: shareUrl });
                    } else {
                      navigator.clipboard.writeText(shareUrl);
                      toast.success("Campaign link copied to clipboard");
                    }
                  }}
                />
              );
            })}
          </div>
        )}
      </TabsContent>

      {/* Gallery Tab */}
      <TabsContent value="gallery" id="gallery-panel" role="tabpanel" className="space-y-4">
        <Card className="p-12 text-center border-dashed">
          <ImageIcon className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">Gallery coming soon</h3>
          <p className="text-muted-foreground text-sm">
            Photo gallery feature will be available soon
          </p>
        </Card>
      </TabsContent>
    </Tabs>

    {/* Add Donation Channel Modal */}
    <AddDonationChannelModal
      open={isDonationChannelModalOpen}
      onOpenChange={(open) => {
        setIsDonationChannelModalOpen(open);
      }}
      onSuccess={() => {
        toast.success("Donation channel added successfully!");
        setIsDonationChannelModalOpen(false);
      }}
    />

    {/* Post Modal */}
    <Dialog open={isPostModalOpen} onOpenChange={setIsPostModalOpen}>
      <DialogContent className="max-w-[98vw] w-full h-[98vh] p-0 gap-0 overflow-hidden bg-black/95">
        <VisuallyHidden>
          <DialogTitle>Post Details</DialogTitle>
          <DialogDescription>View post image and interact with comments</DialogDescription>
        </VisuallyHidden>
        <div className="flex h-full">
          <div className="flex-1 relative bg-black flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsPostModalOpen(false)}
              className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-gray-800/80 hover:bg-gray-700 text-white"
            >
              <ArrowRight className="h-5 w-5 rotate-180" />
            </Button>
            {selectedPostModal && selectedPostModal.media_urls && selectedPostModal.media_urls.length > 1 && (
              <>
                <Button variant="ghost" size="icon" onClick={handlePrevImage} className="absolute left-4 z-10 h-12 w-12 rounded-full bg-gray-800/80 hover:bg-gray-700 text-white">
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleNextImage} className="absolute right-4 z-10 h-12 w-12 rounded-full bg-gray-800/80 hover:bg-gray-700 text-white">
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}
            {selectedPostModal && selectedPostModal.media_urls && selectedPostModal.media_urls[selectedImageIndex] && (
              <img
                src={buildStorageUrl(selectedPostModal.media_urls[selectedImageIndex])}
                alt={`Post image ${selectedImageIndex + 1}`}
                className="max-h-[90vh] max-w-full object-contain"
              />
            )}
          </div>
          <div className="w-[350px] bg-card border-l border-border flex flex-col max-h-[98vh]">
            <div className="p-4 border-b border-border">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 ring-2 ring-background">
                  <AvatarImage src={charity?.logo_path ? buildStorageUrl(charity.logo_path) : ''} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {(charity?.name || 'CH').substring(0,2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-foreground">{charity?.name || 'Your Charity'}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedPostModal ? getTimeAgo(selectedPostModal.created_at) : ''}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 border-b border-border">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{selectedPostModal?.content}</p>
            </div>
            {selectedPostModal && (selectedPostModal.likes_count > 0 || selectedPostModal.comments_count > 0) && (
              <div className="px-4 py-2 border-b border-border">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {selectedPostModal.likes_count > 0 && (
                    <span className="flex items-center gap-1">
                      <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" />
                      {selectedPostModal.likes_count}
                    </span>
                  )}
                  {selectedPostModal.comments_count > 0 && (
                    <span>
                      {selectedPostModal.comments_count} {selectedPostModal.comments_count === 1 ? 'comment' : 'comments'}
                    </span>
                  )}
                </div>
              </div>
            )}
            <div className="px-4 py-2 border-b border-border">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="flex-1 h-9" onClick={() => selectedPostModal && handleToggleLike(selectedPostModal.id)}>
                  <Heart className={`mr-2 h-4 w-4 ${selectedPostModal?.is_liked ? 'fill-red-500 text-red-500' : ''}`} />
                  <span className="font-medium text-xs">Like</span>
                </Button>
                <Button variant="ghost" size="sm" className="flex-1 h-9" onClick={() => {
                  if (selectedPostModal) handleToggleComments(selectedPostModal.id);
                }}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  <span className="font-medium text-xs">Comment</span>
                </Button>
                <Button variant="ghost" size="sm" className="flex-1 h-9" onClick={() => {
                  if (selectedPostModal) {
                    navigator.clipboard.writeText(window.location.origin + '/charity/updates/' + selectedPostModal.id);
                    toast.success('Link copied to clipboard!');
                  }
                }}>
                  <Share2 className="mr-2 h-4 w-4" />
                  <span className="font-medium text-xs">Share</span>
                </Button>
              </div>
            </div>
            <ScrollArea className="flex-1 px-4 py-3">
              <div className="space-y-4">
                {selectedPostModal && loadingComments.has(selectedPostModal.id) ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    {selectedPostModal && comments[selectedPostModal.id]?.map((comment) => {
                      const isReply = comment.content?.trim().startsWith('@');
                      return (
                        <div key={comment.id} className={`group flex gap-2 ${isReply ? 'ml-12' : ''}`}>
                          <Avatar className={`${isReply ? 'h-7 w-7' : 'h-8 w-8'} mt-0.5 ring-2 ring-background flex-shrink-0`}>
                            <AvatarImage src={comment.user?.charity?.logo_path ? buildStorageUrl(comment.user.charity.logo_path) : (comment.user?.profile_image ? getStorageUrl(comment.user.profile_image) || undefined : undefined)} />
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {(comment.user?.charity?.name || comment.user?.name || 'U').substring(0,2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="bg-muted/30 dark:bg-muted/20 rounded-2xl px-3 py-2">
                              <div className="flex items-start justify-between gap-2">
                                <p className="font-semibold text-xs text-foreground mb-0.5">{comment.user?.charity?.name || comment.user?.name || 'User'}</p>
                              </div>
                              <p className="text-sm text-foreground/90 leading-relaxed break-words">{comment.content}</p>
                            </div>
                            <div className="flex items-center gap-3 mt-1 px-3">
                              <span className="text-xs text-muted-foreground">{comment.created_at ? getTimeAgo(comment.created_at) : ''}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </ScrollArea>
            <div className="p-4 border-t border-border bg-muted/20">
              <div className="flex gap-2">
                <Avatar className="h-8 w-8 mt-1 ring-2 ring-background flex-shrink-0">
                  <AvatarImage src={charity?.logo_path ? buildStorageUrl(charity.logo_path) : ''} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">{(charity?.name || 'CH').substring(0,2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    value={selectedPostModal ? (newComment[selectedPostModal.id] || '') : ''}
                    onChange={(e) => selectedPostModal && setNewComment((prev) => ({ ...prev, [selectedPostModal.id]: e.target.value }))}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && selectedPostModal) handleAddComment(selectedPostModal.id);
                    }}
                    className="flex-1 px-4 py-2 bg-background border border-border/60 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                  <Button size="sm" onClick={() => selectedPostModal && handleAddComment(selectedPostModal.id)} disabled={!selectedPostModal || !newComment[selectedPostModal.id]?.trim()} className="rounded-full h-9 w-9 p-0 bg-primary hover:bg-primary/90">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Edit Post Modal */}
    <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Edit Update</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={8}
            className="resize-none text-[15px] leading-relaxed border-border/60 focus:border-primary"
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleEdit} disabled={!editContent.trim()} className="bg-primary hover:bg-primary/90">
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Delete Confirmation Dialog */}
    <DeleteDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onConfirm={confirmDelete} />

    {/* New Update modal (shared) */}
    <CreateUpdateModal
      open={isUpdateModalOpen}
      onOpenChange={setIsUpdateModalOpen}
      onSuccess={onUpdatesRefresh}
      charityName={charity?.name}
      charityLogoUrl={charity?.logo_path ? buildStorageUrl(charity.logo_path) : null}
    />

    <CreateCampaignModal
      open={isCreateOpen}
      onOpenChange={setIsCreateOpen}
      charityId={charity?.id}
      onSuccess={onCampaignsRefresh}
    />

    {/* Mission Edit Modal */}
    <Dialog open={isMissionModalOpen} onOpenChange={setIsMissionModalOpen}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Edit Mission</DialogTitle>
          <DialogDescription>
            Share your charity's core mission statement (max 1000 words)
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Textarea
              value={missionText}
              onChange={(e) => setMissionText(e.target.value)}
              placeholder="Enter your mission statement..."
              rows={8}
              className="resize-none text-base leading-relaxed border-border/60 focus:border-primary"
            />
            <div className="flex justify-between items-center mt-2 text-sm">
              <span className={`${getWordCount(missionText) > 1000 ? 'text-red-500' : 'text-muted-foreground'}`}>
                {getWordCount(missionText)} / 1000 words
              </span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsMissionModalOpen(false)} disabled={isSavingMission}>
            Cancel
          </Button>
          <Button onClick={handleSaveMission} disabled={isSavingMission || !missionText.trim() || getWordCount(missionText) > 1000}>
            {isSavingMission ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Vision Edit Modal */}
    <Dialog open={isVisionModalOpen} onOpenChange={setIsVisionModalOpen}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Edit Vision</DialogTitle>
          <DialogDescription>
            Share your charity's vision for the future (max 1000 words)
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Textarea
              value={visionText}
              onChange={(e) => setVisionText(e.target.value)}
              placeholder="Enter your vision statement..."
              rows={8}
              className="resize-none text-base leading-relaxed border-border/60 focus:border-primary"
            />
            <div className="flex justify-between items-center mt-2 text-sm">
              <span className={`${getWordCount(visionText) > 1000 ? 'text-red-500' : 'text-muted-foreground'}`}>
                {getWordCount(visionText)} / 1000 words
              </span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsVisionModalOpen(false)} disabled={isSavingVision}>
            Cancel
          </Button>
          <Button onClick={handleSaveVision} disabled={isSavingVision || !visionText.trim() || getWordCount(visionText) > 1000}>
            {isSavingVision ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* About Us Edit Modal */}
    <Dialog open={isAboutUsModalOpen} onOpenChange={setIsAboutUsModalOpen}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Edit About Us</DialogTitle>
          <DialogDescription>
            Tell your charity's story and what makes you unique (max 2000 words)
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Textarea
              value={aboutUsText}
              onChange={(e) => setAboutUsText(e.target.value)}
              placeholder="Tell us about your charity..."
              rows={12}
              className="resize-none text-base leading-relaxed border-border/60 focus:border-primary"
            />
            <div className="flex justify-between items-center mt-2 text-sm">
              <span className={`${getWordCount(aboutUsText) > 2000 ? 'text-red-500' : 'text-muted-foreground'}`}>
                {getWordCount(aboutUsText)} / 2000 words
              </span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsAboutUsModalOpen(false)} disabled={isSavingAboutUs}>
            Cancel
          </Button>
          <Button onClick={handleSaveAboutUs} disabled={isSavingAboutUs || !aboutUsText.trim() || getWordCount(aboutUsText) > 2000}>
            {isSavingAboutUs ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Contact Information Edit Modal */}
    <Dialog open={isContactModalOpen} onOpenChange={setIsContactModalOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Edit Contact Information</DialogTitle>
          <DialogDescription>
            Update your charity's contact details
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={contactForm.email}
              onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
              placeholder="contact@charity.org"
              className="border-border/60 focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Contact Number
            </Label>
            <Input
              id="phone"
              type="tel"
              value={contactForm.phone}
              onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
              placeholder="+1 (555) 123-4567"
              className="border-border/60 focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Address
            </Label>
            <Textarea
              id="address"
              value={contactForm.address}
              onChange={(e) => setContactForm({...contactForm, address: e.target.value})}
              placeholder="123 Main Street, City, State, ZIP"
              rows={3}
              className="resize-none border-border/60 focus:border-primary"
            />
          </div>

          <div>
            <OperatingHoursInput
              value={contactForm.operating_hours}
              onChange={(value) => setContactForm({...contactForm, operating_hours: value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Website
            </Label>
            <Input
              id="website"
              type="url"
              value={contactForm.website}
              onChange={(e) => setContactForm({...contactForm, website: e.target.value})}
              placeholder="https://www.yourcharity.org"
              className="border-border/60 focus:border-primary"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsContactModalOpen(false)} disabled={isSavingContact}>
            Cancel
          </Button>
          <Button onClick={handleSaveContact} disabled={isSavingContact}>
            {isSavingContact ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Social Profiles Edit Modal */}
    <Dialog open={isSocialModalOpen} onOpenChange={setIsSocialModalOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Edit Social Profiles</DialogTitle>
          <DialogDescription>
            Add or update your charity's social media links
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="facebook" className="flex items-center gap-2">
              <Facebook className="h-4 w-4 text-blue-600" />
              Facebook
            </Label>
            <Input
              id="facebook"
              type="url"
              value={socialForm.facebook_url}
              onChange={(e) => setSocialForm({...socialForm, facebook_url: e.target.value})}
              placeholder="https://facebook.com/yourcharity"
              className="border-border/60 focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instagram" className="flex items-center gap-2">
              <Instagram className="h-4 w-4 text-pink-600" />
              Instagram
            </Label>
            <Input
              id="instagram"
              type="url"
              value={socialForm.instagram_url}
              onChange={(e) => setSocialForm({...socialForm, instagram_url: e.target.value})}
              placeholder="https://instagram.com/yourcharity"
              className="border-border/60 focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="twitter" className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              X (Twitter)
            </Label>
            <Input
              id="twitter"
              type="url"
              value={socialForm.twitter_url}
              onChange={(e) => setSocialForm({...socialForm, twitter_url: e.target.value})}
              placeholder="https://x.com/yourcharity"
              className="border-border/60 focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedin" className="flex items-center gap-2">
              <Linkedin className="h-4 w-4 text-blue-700" />
              LinkedIn
            </Label>
            <Input
              id="linkedin"
              type="url"
              value={socialForm.linkedin_url}
              onChange={(e) => setSocialForm({...socialForm, linkedin_url: e.target.value})}
              placeholder="https://linkedin.com/company/yourcharity"
              className="border-border/60 focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="youtube" className="flex items-center gap-2">
              <Youtube className="h-4 w-4 text-red-600" />
              YouTube
            </Label>
            <Input
              id="youtube"
              type="url"
              value={socialForm.youtube_url}
              onChange={(e) => setSocialForm({...socialForm, youtube_url: e.target.value})}
              placeholder="https://youtube.com/@yourcharity"
              className="border-border/60 focus:border-primary"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsSocialModalOpen(false)} disabled={isSavingSocial}>
            Cancel
          </Button>
          <Button onClick={handleSaveSocial} disabled={isSavingSocial}>
            {isSavingSocial ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
