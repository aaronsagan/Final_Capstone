import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { CampaignUpdateModal } from "@/components/campaign/CampaignUpdateModal";
import { buildApiUrl, getAuthToken } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Edit, Trash2, TrendingUp, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface CampaignUpdate {
  id: number;
  campaign_id: number;
  title: string;
  content: string;
  is_milestone: boolean;
  image_path?: string;
  created_at: string;
}

interface UpdateStats {
  total_updates: number;
  milestone_count: number;
  last_update_date: string | null;
}

interface CampaignUpdatesTabProps {
  campaignId: number;
}

export default function CampaignUpdatesTab({ campaignId }: CampaignUpdatesTabProps) {
  const [updates, setUpdates] = useState<CampaignUpdate[]>([]);
  const [milestones, setMilestones] = useState<CampaignUpdate[]>([]);
  const [stats, setStats] = useState<UpdateStats>({ total_updates: 0, milestone_count: 0, last_update_date: null });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<CampaignUpdate | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    loadUpdates();
    loadMilestones();
    loadStats();
  }, [campaignId]);

  const loadUpdates = async () => {
    try {
      setLoading(true);
      console.log('🔍 [CampaignUpdatesTab] Loading updates for campaign ID:', campaignId);
      const response = await fetch(buildApiUrl(`/campaigns/${campaignId}/updates`));
      console.log('📡 [CampaignUpdatesTab] Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('📦 [CampaignUpdatesTab] Raw data:', data);
        console.log('📊 [CampaignUpdatesTab] Updates array:', data.data);
        console.log('📈 [CampaignUpdatesTab] Updates count:', data.data?.length || 0);
        setUpdates(data.data || []);
      } else {
        console.error('❌ [CampaignUpdatesTab] Failed response:', response.status, response.statusText);
      }
    } catch (error) {
      console.error("❌ [CampaignUpdatesTab] Failed to load updates:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMilestones = async () => {
    try {
      const response = await fetch(buildApiUrl(`/campaigns/${campaignId}/updates/milestones`));
      if (response.ok) {
        const data = await response.json();
        setMilestones(data.data || []);
      }
    } catch (error) {
      console.error("Failed to load milestones:", error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(buildApiUrl(`/campaigns/${campaignId}/updates/stats`));
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      const token = getAuthToken();
      const response = await fetch(buildApiUrl(`/campaign-updates/${deletingId}`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success("Update deleted successfully");
        loadUpdates();
        loadMilestones();
        loadStats();
      } else {
        toast.error("Failed to delete update");
      }
    } catch (error) {
      console.error("Error deleting update:", error);
      toast.error("Failed to delete update");
    } finally {
      setDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const handleSuccess = () => {
    loadUpdates();
    loadMilestones();
    loadStats();
    setEditingUpdate(null);
  };

  const truncateContent = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Updates List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Campaign Updates</h2>
            <Button onClick={() => {
              setEditingUpdate(null);
              setModalOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Update
            </Button>
          </div>

          {/* Updates List */}
          {updates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">No updates yet</p>
                <Button onClick={() => setModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Update
                </Button>
              </CardContent>
            </Card>
          ) : (
            updates.map((update) => (
              <Card key={update.id} className={update.is_milestone ? "border-yellow-500/50" : ""}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold">{update.title}</h3>
                        {update.is_milestone && (
                          <Badge className="bg-yellow-500 hover:bg-yellow-600">
                            🏁 Milestone
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(update.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingUpdate(update);
                          setModalOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDeletingId(update.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  {update.image_path && (
                    <img
                      src={`http://127.0.0.1:8000/storage/${update.image_path}`}
                      alt={update.title}
                      className="w-full h-48 object-cover rounded-lg mb-3"
                    />
                  )}

                  <p className="text-foreground leading-relaxed whitespace-pre-line">
                    {truncateContent(update.content)}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Engagement Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Engagement Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Updates</p>
                <p className="text-2xl font-bold">{stats.total_updates}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Milestones</p>
                <p className="text-2xl font-bold text-yellow-500">{stats.milestone_count}</p>
              </div>
              {stats.last_update_date && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Update</p>
                  <p className="text-sm font-medium">
                    {formatDistanceToNow(new Date(stats.last_update_date), { addSuffix: true })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Milestones */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-yellow-500" />
                Recent Milestones
              </CardTitle>
            </CardHeader>
            <CardContent>
              {milestones.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No milestones yet
                </p>
              ) : (
                <div className="space-y-3">
                  {milestones.map((milestone) => (
                    <div key={milestone.id} className="border-l-2 border-yellow-500 pl-3 py-1">
                      <p className="font-medium text-sm">{milestone.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(milestone.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Update Modal */}
      <CampaignUpdateModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        campaignId={campaignId}
        update={editingUpdate}
        onSuccess={handleSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Update?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this update.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
