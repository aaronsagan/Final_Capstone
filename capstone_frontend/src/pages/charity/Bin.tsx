import { useState, useEffect } from "react";
import { Trash2, RotateCcw, Loader2, AlertCircle, Calendar, Clock, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { authService } from "@/services/auth";
import { buildApiUrl, buildStorageUrl } from "@/lib/api";
import { DeleteDialog } from "@/components/ui/delete-dialog";
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

interface TrashedUpdate {
  id: number;
  charity_id: number;
  content: string;
  media_urls: string[];
  created_at: string;
  deleted_at: string;
  is_pinned: boolean;
  likes_count: number;
  comments_count: number;
}

export default function Bin() {
  const navigate = useNavigate();
  const [trashedUpdates, setTrashedUpdates] = useState<TrashedUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUpdateId, setSelectedUpdateId] = useState<number | null>(null);

  useEffect(() => {
    fetchTrashedUpdates();
  }, []);

  const fetchTrashedUpdates = async () => {
    try {
      setLoading(true);
      const token = authService.getToken();
      const response = await fetch(buildApiUrl("/updates/trash"), {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch trashed updates");

      const data = await response.json();
      setTrashedUpdates(data.data || []);
    } catch (error) {
      console.error("Error fetching trashed updates:", error);
      toast.error("Failed to load trashed posts");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedUpdateId) return;
    try {
      const token = authService.getToken();
      const response = await fetch(
        buildApiUrl(`/updates/${selectedUpdateId}/restore`),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to restore post");

      toast.success("Post restored successfully");
      fetchTrashedUpdates();
      setRestoreDialogOpen(false);
      setSelectedUpdateId(null);
    } catch (error) {
      console.error("Error restoring post:", error);
      toast.error("Failed to restore post");
    }
  };

  const handlePermanentDelete = async () => {
    if (!selectedUpdateId) return;
    try {
      const token = authService.getToken();
      const response = await fetch(
        buildApiUrl(`/updates/${selectedUpdateId}/force`),
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to permanently delete post");

      toast.success("Post permanently deleted");
      fetchTrashedUpdates();
      setDeleteDialogOpen(false);
      setSelectedUpdateId(null);
    } catch (error) {
      console.error("Error permanently deleting post:", error);
      toast.error("Failed to permanently delete post");
    }
  };

  const getDaysRemaining = (deletedAt: string) => {
    const deleted = new Date(deletedAt);
    const expiryDate = new Date(deleted.getTime() + 30 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysLeft);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/charity/updates")}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Updates
        </Button>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Trash2 className="h-8 w-8" />
          Bin
        </h1>
        <p className="text-muted-foreground mt-2">
          Posts in your bin will be automatically deleted after 30 days.
        </p>
      </div>

      {trashedUpdates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Trash2 className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Your bin is empty</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Deleted posts will appear here and can be restored within 30 days.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {trashedUpdates.map((update) => {
            const daysRemaining = getDaysRemaining(update.deleted_at);
            const isExpiringSoon = daysRemaining <= 7;

            return (
              <Card key={update.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant={isExpiringSoon ? "destructive" : "secondary"}
                          className="font-medium"
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          {daysRemaining} {daysRemaining === 1 ? "day" : "days"} remaining
                        </Badge>
                        {update.is_pinned && (
                          <Badge variant="outline">Pinned</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5" />
                        Deleted on {formatDate(update.deleted_at)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUpdateId(update.id);
                          setRestoreDialogOpen(true);
                        }}
                        className="gap-2"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Restore
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedUpdateId(update.id);
                          setDeleteDialogOpen(true);
                        }}
                        className="gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Forever
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground whitespace-pre-wrap break-words">
                    {update.content}
                  </p>
                  {update.media_urls && update.media_urls.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {update.media_urls.slice(0, 4).map((url, index) => (
                        <div
                          key={index}
                          className="relative aspect-video rounded-lg overflow-hidden bg-muted"
                        >
                          <img
                            src={buildStorageUrl(url) || ''}
                            alt={`Media ${index + 1}`}
                            className="w-full h-full object-cover opacity-60"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                    <span>{update.likes_count} likes</span>
                    <span>{update.comments_count} comments</span>
                  </div>
                  {isExpiringSoon && (
                    <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-destructive">
                        This post will be permanently deleted in {daysRemaining}{" "}
                        {daysRemaining === 1 ? "day" : "days"}. Restore it now if you want to keep it.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This post will be restored and will appear in your updates feed again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore}>Restore</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permanent Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This post will be permanently deleted and cannot be recovered. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePermanentDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
