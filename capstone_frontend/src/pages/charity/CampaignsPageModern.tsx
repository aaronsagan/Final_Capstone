import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { CampaignCard, Campaign } from "@/components/charity/CampaignCard";
import { CampaignCardSkeleton } from "@/components/charity/CampaignCardSkeleton";
import { Search, Plus, Grid3x3, List, Filter } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { charityService } from "@/services/charity";
import { CreateCampaignModal } from "@/components/charity/CreateCampaignModal";

/**
 * Modern Campaigns Page with Card View
 * Features card grid layout with filters and search
 */
const CampaignsPageModern = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<number | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    loadCampaigns();
  }, [statusFilter]);

  const mapBackendStatus = (status?: string): Campaign["status"] => {
    const s = (status || "").toLowerCase();
    if (s === "published" || s === "active") return "active";
    if (s === "completed") return "completed";
    if (s === "draft") return "draft";
    if (s === "expired" || s === "closed" || s === "archived") return "expired";
    return "active";
  };

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const charityId = user?.charity?.id;
      if (!charityId) {
        setCampaigns([]);
        return;
      }

      // Map UI filter to backend status values
      const backendStatus =
        statusFilter === "all"
          ? undefined
          : statusFilter === "active"
          ? "published"
          : statusFilter === "completed"
          ? "closed"
          : statusFilter === "expired"
          ? "archived"
          : statusFilter;

      // Fetch campaigns for the current charity from backend
      const res = await charityService.getCharityCampaigns(charityId, {
        status: backendStatus,
      });
      const backendCampaigns = res.data || res || [];

      // Map backend fields to CampaignCard type
      const mapped: Campaign[] = backendCampaigns
        .filter((c: any) => c)
        .map((c: any) => ({
          id: c.id,
          title: c.title,
          description: c.description || "",
          goal: c.target_amount || 0,
          amountRaised: c.current_amount || 0,
          donorsCount: c.donors_count || 0,
          views: c.views || 0,
          status: mapBackendStatus(c.status),
          bannerImage: c.cover_image_path || c.banner_image || c.image_path,
          endDate: c.end_date || c.deadline_at || "",
          createdAt: c.start_date || c.created_at,
        }));

      // Filter by search (client-side)
      const filtered = search
        ? mapped.filter(
            (c) =>
              c.title.toLowerCase().includes(search.toLowerCase()) ||
              c.description.toLowerCase().includes(search.toLowerCase())
          )
        : mapped;

      setCampaigns(filtered);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to load campaigns",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadCampaigns();
  };

  const handleEdit = (id: number) => {
    navigate(`/charity/campaigns/${id}/edit`);
  };

  const handleDelete = async () => {
    if (!campaignToDelete) return;
    try {
      // TODO: Replace with actual API call
      // await campaignsService.deleteCampaign(campaignToDelete);
      
      toast({ 
        title: "Success", 
        description: "Campaign deleted successfully" 
      });
      
      setCampaigns(campaigns.filter((c) => c.id !== campaignToDelete));
      setDeleteDialogOpen(false);
      setCampaignToDelete(null);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete campaign",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    try {
      // TODO: Replace with actual API call
      // await campaignsService.updateCampaignStatus(id, newStatus);
      
      // Keep within supported statuses for CampaignCard
      const newStatus: Campaign["status"] = currentStatus === "active" ? "draft" : "active";
      
      setCampaigns(
        campaigns.map((c) =>
          c.id === id ? { ...c, status: newStatus } : c
        )
      );
      
      toast({
        title: "Success",
        description: `Campaign ${newStatus === "active" ? "activated" : "paused"} successfully`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update campaign status",
        variant: "destructive",
      });
    }
  };

  const handleShare = (id: number) => {
    const campaign = campaigns.find((c) => c.id === id);
    if (!campaign) return;

    const shareUrl = `${window.location.origin}/campaigns/${id}`;
    
    if (navigator.share) {
      navigator.share({
        title: campaign.title,
        text: campaign.description,
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link Copied",
        description: "Campaign link copied to clipboard",
      });
    }
  };

  const confirmDelete = (id: number) => {
    setCampaignToDelete(id);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Campaigns</h1>
          <p className="text-muted-foreground mt-1">
            Manage and monitor your fundraising campaigns
          </p>
        </div>
        <Button
          size="lg"
          className="bg-primary hover:bg-primary/90"
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus className="h-5 w-5 mr-2" />
          Create Campaign
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search campaigns by title or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campaigns</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>

            {/* View Toggle */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            {/* Search Button */}
            <Button onClick={handleSearch}>Search</Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">
              {campaigns.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600 dark:text-green-500">
              {campaigns.filter((c) => c.status === "active").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Raised
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">
              ₱{campaigns.reduce((sum, c) => sum + c.amountRaised, 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Donors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">
              {campaigns.reduce((sum, c) => sum + c.donorsCount, 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Grid/List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <CampaignCardSkeleton key={i} />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground text-lg">No campaigns found</p>
            <p className="text-muted-foreground text-sm mt-2">
              {search || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "Create your first campaign to get started"}
            </p>
            {!search && statusFilter === "all" && (
              <Button
                className="mt-4"
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              viewMode="admin"
              onEdit={handleEdit}
              onDelete={confirmDelete}
              onToggleStatus={handleToggleStatus}
              onShare={handleShare}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              campaign and all associated data including donations and updates.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Campaign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Campaign Modal (shared) */}
      <CreateCampaignModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        charityId={user?.charity?.id}
        onSuccess={loadCampaigns}
      />
    </div>
  );
};

export default CampaignsPageModern;
