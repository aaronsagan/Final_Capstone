import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  MoreVertical,
  Trash2,
  Edit2,
  Loader2,
  Pin,
  PinOff,
  Image as ImageIcon,
  Send,
  Plus,
  X,
  MapPin,
  TrendingUp,
  Users,
  Calendar,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  FileText,
  Target,
  Mail,
  Globe,
  Share2,
  ChevronLeft,
  ChevronRight,
  Reply,
  MoreHorizontal,
  Edit,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  VisuallyHidden,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { authService } from "@/services/auth";
import { updatesService } from "@/services/updates";
import { getCharityLogoUrl, getStorageUrl } from "@/lib/storage";
import { DeleteDialog } from "@/components/ui/delete-dialog";

interface Update {
  id: number;
  charity_id: number;
  parent_id: number | null;
  content: string;
  media_urls: string[];
  created_at: string;
  updated_at: string;
  is_pinned: boolean;
  likes_count: number;
  comments_count: number;
  charity?: { id: number; name: string; logo_path?: string };
  children?: Update[];
  is_liked?: boolean;
}

interface Comment {
  id: number;
  update_id: number;
  user_id: number;
  content: string;
  created_at: string;
  is_hidden: boolean;
  likes_count: number;
  is_liked?: boolean;
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

export default function CharityUpdates() {
  const navigate = useNavigate();
  const location = useLocation();
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const [charityData, setCharityData] = useState<any>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUpdateContent, setNewUpdateContent] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [editingUpdate, setEditingUpdate] = useState<Update | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<number>>(
    new Set(),
  );
  const [comments, setComments] = useState<Record<number, Comment[]>>({});
  const [newComment, setNewComment] = useState<Record<number, string>>({});
  const [loadingComments, setLoadingComments] = useState<Set<number>>(
    new Set(),
  );
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  
  const [selectedPostModal, setSelectedPostModal] = useState<Update | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentContent, setEditCommentContent] = useState("");
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [updateToDelete, setUpdateToDelete] = useState<number | null>(null);

  useEffect(() => {
    loadCharityData();
    fetchUpdates();
  }, []);

  // Auto-open the existing create modal when routed with ?create=1
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('create') === '1') {
      setIsCreateModalOpen(true);
    }
  }, [location.search]);

  const loadCharityData = async () => {
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
        const me = await res.json();
        setCharityData(me?.charity);
      }
    } catch (error) {
      console.error("Failed to load charity data:", error);
    }
  };

  const fetchUpdates = async () => {
    try {
      setLoading(true);
      const data = await updatesService.getMyUpdates();
      const updatesList = data.data || data;
      const organized = organizeThreads(updatesList);
      setUpdates(organized);
    } catch (error: any) {
      toast.error("Failed to load updates");
    } finally {
      setLoading(false);
    }
  };

  const organizeThreads = (updatesList: Update[]): Update[] => {
    // Threading removed: return a flat, sorted list (pinned first, then newest)
    return (updatesList || []).slice().sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedImages.length > 4) {
      toast.error("Maximum 4 images allowed");
      return;
    }
    setSelectedImages([...selectedImages, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateUpdate = async () => {
    const content = newUpdateContent;
    if (!content.trim()) {
      toast.error("Please enter some content");
      return;
    }
    setCreating(true);
    try {
      await updatesService.createUpdate({
        content,
        media: selectedImages,
      });
      setNewUpdateContent("");
      setSelectedImages([]);
      setImagePreviews([]);
      setIsCreateModalOpen(false);
      toast.success("Update posted successfully!");
      fetchUpdates();
    } catch (error: any) {
      console.error("Error creating update:", error);
      toast.error(error.response?.data?.message || "Failed to create update");
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = async () => {
    if (!editingUpdate || !editContent.trim()) return;
    try {
      await updatesService.updateUpdate(editingUpdate.id, editContent);
      toast.success("Update edited successfully");
      setIsEditModalOpen(false);
      setEditingUpdate(null);
      fetchUpdates();
    } catch (error) {
      toast.error("Failed to edit update");
      console.error("Error editing update:", error);
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
      fetchUpdates();
      setDeleteDialogOpen(false);
      setUpdateToDelete(null);
    } catch (error) {
      toast.error("Failed to delete post");
      console.error("Error deleting update:", error);
    }
  };

  const handleTogglePin = async (id: number, currentlyPinned: boolean) => {
    try {
      await updatesService.togglePin(id);
      toast.success(
        currentlyPinned ? "Update unpinned" : "Update pinned to top",
      );
      fetchUpdates();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update pin status");
      console.error("Error toggling pin:", error);
    }
  };

  const handleToggleLike = async (updateId: number) => {
    try {
      const result = await updatesService.toggleLike(updateId);
      const updateInState = (items: Update[]): Update[] => {
        return items.map((u) =>
          u.id === updateId ? { ...u, is_liked: result.liked, likes_count: result.likes_count } : u
        );
      };
      setUpdates((prev) => updateInState(prev));
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

  const handleToggleThread = (updateId: number) => {
    setExpandedThreads((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(updateId)) {
        newSet.delete(updateId);
      } else {
        newSet.add(updateId);
      }
      return newSet;
    });
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

  const handleAddComment = async (updateId: number) => {
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
      console.error("Error adding comment:", error);
    }
  };

  const handleEditComment = async (updateId: number, commentId: number, content: string) => {
    try {
      const updatedComment = await updatesService.updateComment(commentId, content);
      setComments((prev) => ({
        ...prev,
        [updateId]: prev[updateId].map((c) =>
          c.id === commentId ? updatedComment : c
        ),
      }));
      toast.success("Comment updated successfully");
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error("Failed to update comment");
    }
  };

  const handleLikeComment = async (updateId: number, commentId: number) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/comments/${commentId}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authService.getToken()}`,
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setComments((prev) => ({
          ...prev,
          [updateId]: prev[updateId].map((c) =>
            c.id === commentId
              ? { ...c, likes_count: data.likes_count, is_liked: data.is_liked }
              : c
          ),
        }));
      }
    } catch (error) {
      console.error("Error liking comment:", error);
      toast.error("Failed to like comment");
    }
  };

  const handleDeleteComment = async (updateId: number, commentId: number) => {
    if (!confirm("Delete this comment?")) return;
    try {
      await updatesService.deleteComment(commentId);
      setComments((prev) => ({
        ...prev,
        [updateId]: prev[updateId].filter((c) => c.id !== commentId),
      }));
      const updateCounts = (items: Update[]): Update[] => {
        return items.map((update) => {
          if (update.id === updateId) {
            return {
              ...update,
              comments_count: Math.max(0, update.comments_count - 1),
            };
          }
          if (update.children) {
            return { ...update, children: updateCounts(update.children) };
          }
          return update;
        });
      };
      setUpdates((prev) => updateCounts(prev));
      toast.success("Comment deleted");
    } catch (error) {
      toast.error("Failed to delete comment");
      console.error("Error deleting comment:", error);
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

  const handleOpenPostModal = (update: Update, imageIndex: number = 0) => {
    setSelectedPostModal(update);
    setSelectedImageIndex(imageIndex);
    setIsPostModalOpen(true);
    // Load comments if not already loaded
    if (!comments[update.id]) {
      fetchComments(update.id);
    }
  };

  const handleNextImage = () => {
    if (selectedPostModal && selectedPostModal.media_urls) {
      setSelectedImageIndex((prev) => 
        prev < selectedPostModal.media_urls.length - 1 ? prev + 1 : 0
      );
    }
  };

  const handlePrevImage = () => {
    if (selectedPostModal && selectedPostModal.media_urls) {
      setSelectedImageIndex((prev) => 
        prev > 0 ? prev - 1 : selectedPostModal.media_urls.length - 1
      );
    }
  };

  const renderUpdate = (update: Update): JSX.Element => {
    const isExpanded = expandedComments.has(update.id);
    const updateComments = comments[update.id] || [];
    return (
      <div key={update.id}>
        <Card className="mb-4 bg-card border-border/40 hover:shadow-lg transition-all duration-200 hover:border-border/60">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <Avatar 
                  className="h-11 w-11 ring-2 ring-background shadow-sm cursor-pointer hover:ring-primary/50 transition-all"
                  onClick={() => navigate('/charity/profile')}
                >
                  <AvatarImage
                    src={getCharityLogoUrl(charityData?.logo_path) || ""}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {charityData?.name?.substring(0, 2).toUpperCase() || "CH"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p 
                      className="font-bold text-sm text-foreground cursor-pointer hover:underline"
                      onClick={() => navigate('/charity/profile')}
                    >
                      {charityData?.name || "Your Charity"}
                    </p>
                    {update.is_pinned && (
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1 text-xs bg-primary/10 text-primary border-0"
                      >
                        <Pin className="h-3 w-3" />
                        Pinned
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatTimeAgo(update.created_at)}
                  </p>
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
                  {!update.parent_id && (
                    <DropdownMenuItem
                      onClick={() =>
                        handleTogglePin(update.id, update.is_pinned)
                      }
                    >
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
                  )}
                  
                  <Separator className="my-1" />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => handleDelete(update.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Post
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">
              {update.content}
            </p>
            {update.media_urls && update.media_urls.length > 0 && (
              <div
                className={`grid gap-1 rounded-xl overflow-hidden ${
                  update.media_urls.length === 1
                    ? "grid-cols-1"
                    : update.media_urls.length === 2
                      ? "grid-cols-2"
                      : update.media_urls.length === 3
                        ? "grid-cols-2 grid-rows-2"
                        : "grid-cols-2 grid-rows-2"
                }`}
              >
                {update.media_urls.map((url, index) => (
                  <img
                    key={index}
                    src={getStorageUrl(url) || ""}
                    alt={`Update media ${index + 1}`}
                    onClick={() => handleOpenPostModal(update, index)}
                    className={`w-full object-cover cursor-pointer hover:opacity-90 hover:brightness-95 transition-all ${
                      update.media_urls.length === 1
                        ? "rounded-lg max-h-[450px]"
                        : update.media_urls.length === 2
                          ? "rounded-lg h-[280px]"
                          : update.media_urls.length === 3
                            ? index === 0
                              ? "rounded-lg row-span-2 h-full min-h-[350px] max-h-[450px]"
                              : "rounded-lg h-[172px]"
                            : "rounded-lg h-[180px]"
                    }`}
                  />
                ))}
              </div>
            )}
            {(update.likes_count > 0 || update.comments_count > 0) && (
              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                {update.likes_count > 0 && (
                  <button 
                    className="hover:underline cursor-pointer"
                    onClick={() => handleToggleLike(update.id)}
                  >
                    <Heart className="h-3.5 w-3.5 inline mr-1 fill-red-500 text-red-500" />
                    {update.likes_count}{" "}
                    {update.likes_count === 1 ? "like" : "likes"}
                  </button>
                )}
                {update.comments_count > 0 && (
                  <button 
                    className="hover:underline cursor-pointer"
                    onClick={() => handleToggleComments(update.id)}
                  >
                    {update.comments_count}{" "}
                    {update.comments_count === 1 ? "comment" : "comments"}
                  </button>
                )}
              </div>
            )}
            
            {/* View All Comments Link - Shows above action buttons when there are comments */}
            {update.comments_count > 0 && !isExpanded && (
              <div className="pt-2 pb-1">
                <button
                  className="text-sm text-muted-foreground hover:underline cursor-pointer font-medium"
                  onClick={() => handleToggleComments(update.id)}
                >
                  View all {update.comments_count} {update.comments_count === 1 ? 'comment' : 'comments'}
                </button>
              </div>
            )}
            
            <Separator className="!mt-3" />
            <div className="flex items-center gap-2 !mt-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 h-10 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
                onClick={() => handleToggleLike(update.id)}
              >
                <Heart
                  className={`mr-2 h-4 w-4 transition-all ${update.is_liked ? "fill-red-500 text-red-500 scale-110" : "hover:scale-110"}`}
                />
                <span className="font-medium">Like</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 h-10 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200"
                onClick={() => handleToggleComments(update.id)}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
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
            {isExpanded && (
              <>
                <Separator />
                <div className="space-y-3 pt-2">
                  {loadingComments.has(update.id) ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <>
                      {updateComments.length > 0 && (
                        <div className="space-y-3">
                          {updateComments.map((comment) => {
                            const isReply = comment.content.startsWith('@');
                            return (
                              <div key={comment.id} className={`group flex gap-2.5 ${isReply ? 'ml-12' : ''}`}>
                                <Avatar 
                                  className={`${isReply ? 'h-8 w-8' : 'h-9 w-9'} mt-0.5 flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all`}
                                  onClick={() => {
                                    if (comment.user?.role === "charity_admin" && comment.user?.charity?.id) {
                                      if (comment.user.charity.id === charityData?.id) {
                                        navigate('/charity/profile');
                                      } else {
                                        window.location.href = `/charity/${comment.user.charity.id}`;
                                      }
                                    }
                                  }}
                                >
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
                                  {editingCommentId === comment.id ? (
                                    <div className="space-y-2">
                                      <Textarea
                                        value={editCommentContent}
                                        onChange={(e) => setEditCommentContent(e.target.value)}
                                        className="min-h-[60px] resize-none"
                                        autoFocus
                                      />
                                      <div className="flex gap-2 justify-end">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            setEditingCommentId(null);
                                            setEditCommentContent("");
                                          }}
                                        >
                                          Cancel
                                        </Button>
                                        <Button
                                          size="sm"
                                          onClick={() => {
                                            handleEditComment(update.id, comment.id, editCommentContent);
                                            setEditingCommentId(null);
                                            setEditCommentContent("");
                                          }}
                                          disabled={!editCommentContent.trim()}
                                        >
                                          Save
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <div className={`${isReply ? 'bg-muted/30 dark:bg-muted/20 rounded-xl px-3 py-1.5' : 'bg-muted/40 dark:bg-muted/30 rounded-2xl px-3.5 py-2'} hover:bg-muted/60 dark:hover:bg-muted/50 transition-all duration-200`}>
                                        <div className="flex items-start justify-between gap-2">
                                          <p 
                                            className={`font-semibold ${isReply ? 'text-xs' : 'text-sm'} text-foreground mb-0.5 ${comment.user?.role === "charity_admin" ? 'cursor-pointer hover:underline' : ''}`}
                                            onClick={() => {
                                              if (comment.user?.role === "charity_admin" && comment.user?.charity?.id) {
                                                if (comment.user.charity.id === charityData?.id) {
                                                  navigate('/charity/profile');
                                                } else {
                                                  window.location.href = `/charity/${comment.user.charity.id}`;
                                                }
                                              }
                                            }}
                                          >
                                            {comment.user?.role === "charity_admin" && comment.user?.charity?.name
                                              ? comment.user.charity.name
                                              : comment.user?.name || "User"}
                                          </p>
                                          {comment.user_id === charityData?.owner_id && (
                                            <DropdownMenu>
                                              <DropdownMenuTrigger asChild>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                  <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                              </DropdownMenuTrigger>
                                              <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                  onClick={() => {
                                                    setEditingCommentId(comment.id);
                                                    setEditCommentContent(comment.content);
                                                  }}
                                                >
                                                  <Edit2 className="h-4 w-4 mr-2" />
                                                  Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                  onClick={() => handleDeleteComment(update.id, comment.id)}
                                                  className="text-destructive focus:text-destructive"
                                                >
                                                  <Trash2 className="h-4 w-4 mr-2" />
                                                  Delete
                                                </DropdownMenuItem>
                                              </DropdownMenuContent>
                                            </DropdownMenu>
                                          )}
                                        </div>
                                        <p className={`${isReply ? 'text-sm' : 'text-[15px]'} text-foreground leading-relaxed`}>{comment.content}</p>
                                      </div>
                                      <div className="flex items-center gap-3 mt-1 px-3">
                                        <span className="text-xs text-muted-foreground font-medium">
                                          {formatTimeAgo(comment.created_at)}
                                        </span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className={`h-auto p-0 text-xs font-semibold transition-colors ${
                                            comment.is_liked
                                              ? "text-red-500 hover:text-red-600"
                                              : "text-muted-foreground hover:text-red-500"
                                          }`}
                                          onClick={() => handleLikeComment(update.id, comment.id)}
                                        >
                                          <Heart
                                            className={`h-3 w-3 mr-1 ${
                                              comment.is_liked ? "fill-current" : ""
                                            }`}
                                          />
                                          {comment.likes_count > 0 && comment.likes_count}
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground font-semibold"
                                          onClick={() => {
                                            setReplyingToId(comment.id);
                                            const userName = comment.user?.role === "charity_admin" && comment.user?.charity?.name
                                              ? comment.user.charity.name
                                              : comment.user?.name || "User";
                                            setNewComment((prev) => ({
                                              ...prev,
                                              [update.id]: `@${userName} `,
                                            }));
                                          }}
                                        >
                                          <Reply className="h-3 w-3 mr-1" />
                                          Reply
                                        </Button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          </div>
                      )}
                      <div className="flex gap-3 pt-3">
                        <Avatar className="h-8 w-8 mt-1 ring-2 ring-background">
                          <AvatarImage
                            src={getCharityLogoUrl(charityData?.logo_path) || ""}
                          />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {charityData?.name?.substring(0, 2).toUpperCase() ||
                              "CH"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 flex gap-2">
                          <input
                            type="text"
                            placeholder="Write a comment..."
                            value={newComment[update.id] || ""}
                            onChange={(e) =>
                              setNewComment((prev) => ({
                                ...prev,
                                [update.id]: e.target.value,
                              }))
                            }
                            onKeyPress={(e) =>
                              e.key === "Enter" && handleAddComment(update.id)
                            }
                            className="flex-1 px-4 py-2.5 bg-muted/40 border border-border/60 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleAddComment(update.id)}
                            disabled={!newComment[update.id]?.trim()}
                            className="rounded-full h-10 w-10 p-0 bg-primary hover:bg-primary/90"
                          >
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
        
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading updates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
       {/* Left Panel - Charity Identity (Sticky) */}
      <aside 
        className="hidden lg:block w-[320px] fixed left-0 top-16 bottom-0 bg-[#f8f9fb] dark:bg-[#0e1a32] border-r border-border/40 overflow-y-auto"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'transparent transparent'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.scrollbarColor = 'rgba(156, 163, 175, 0.5) transparent';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.scrollbarColor = 'transparent transparent';
        }}
      >
        <div className="p-5 space-y-5 pt-6">
          {/* Charity Logo & Name */}
          <div className="flex flex-col items-center text-center space-y-3">
            <Avatar 
              className="h-20 w-20 ring-4 ring-primary/10 shadow-lg cursor-pointer hover:ring-primary/30 transition-all"
              onClick={() => navigate('/charity/profile')}
            >
              <AvatarImage
                src={getCharityLogoUrl(charityData?.logo_path) || ""}
              />
              <AvatarFallback className="text-xl font-bold bg-primary text-primary-foreground">
                {charityData?.name?.substring(0, 2).toUpperCase() || "CH"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 
                className="text-lg font-bold text-foreground mb-1 cursor-pointer hover:underline"
                onClick={() => navigate('/charity/profile')}
              >
                {charityData?.name || "Charity Name"}
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {charityData?.mission?.substring(0, 50) || "Empowering communities"}
                {charityData?.mission && charityData.mission.length > 50 && "..."}
              </p>
            </div>
          </div>

          <Separator />

          {/* Key Stats - 2x2 Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Followers Card */}
            <Card className="bg-green-500/5 border-green-500/20 hover:bg-green-500/10 transition-colors">
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="p-2.5 rounded-lg bg-green-500/20">
                    <Users className="h-5 w-5 text-green-600 dark:text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {charityData?.followers_count || 0}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Followers</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Updates Card */}
            <Card className="bg-primary/5 border-primary/20 hover:bg-primary/10 transition-colors">
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="p-2.5 rounded-lg bg-primary/20">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{updates.length}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Updates</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Likes Card */}
            <Card className="bg-red-500/5 border-red-500/20 hover:bg-red-500/10 transition-colors">
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="p-2.5 rounded-lg bg-red-500/20">
                    <Heart className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {updates.reduce((sum, u) => sum + u.likes_count, 0)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Likes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comments Card */}
            <Card className="bg-blue-500/5 border-blue-500/20 hover:bg-blue-500/10 transition-colors">
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="p-2.5 rounded-lg bg-blue-500/20">
                    <MessageCircle className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {updates.reduce((sum, u) => sum + u.comments_count, 0)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Comments</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Share Update CTA */}
          <Button
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Share Update
          </Button>

          <Separator />

          {/* Action Links */}
          <div className="space-y-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start h-9 text-sm"
              onClick={() => (window.location.href = "/charity/edit-profile")}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </div>
      </aside>

      {/* Center Column - Scrollable Feed */}
      <main className="flex-1 lg:ml-[320px] lg:mr-[340px] min-h-screen">
        <div className="w-full px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Updates</h1>
            <p className="text-muted-foreground">Share your impact with supporters</p>
          </div>

          {/* Feed Content */}
          {updates.length === 0 ? (
            <Card className="p-12 text-center border-dashed bg-card">
              <div className="flex flex-col items-center">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <MessageCircle className="h-10 w-10 text-primary" />
                </div>
                <h3 className="font-semibold text-xl mb-2 text-foreground">
                  No updates yet
                </h3>
                <p className="text-muted-foreground text-sm mb-6 max-w-md">
                  🕊️ Share your first story and inspire your supporters!
                </p>
                <Button onClick={() => setIsCreateModalOpen(true)} size="lg">
                  <Plus className="mr-2 h-5 w-5" />
                  Post an Update
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {updates.map((update) => renderUpdate(update, 0))}
            </div>
          )}
        </div>
      </main>

      {/* Right Panel - Context/Engagement (Sticky) */}
      <aside
        className={`hidden lg:block fixed right-0 top-16 bottom-0 bg-[#f8f9fb] dark:bg-[#0e1a32] border-l border-border/40 overflow-y-auto transition-all duration-300 ${
          isRightPanelCollapsed ? "w-12" : "w-[340px]"
        }`}
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'transparent transparent'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.scrollbarColor = 'rgba(156, 163, 175, 0.5) transparent';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.scrollbarColor = 'transparent transparent';
        }}
      >
        {isRightPanelCollapsed ? (
          <div className="p-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsRightPanelCollapsed(false)}
              className="w-full"
            >
              <ChevronDown className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          <div className="p-5 space-y-5 pt-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Insights</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsRightPanelCollapsed(true)}
                className="h-8 w-8"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
            </div>

            {/* Engagement Summary - Insights */}
            <Card className="bg-card border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Likes</span>
                  <span className="font-bold text-foreground">
                    {updates.reduce(
                      (sum, u) =>
                        sum +
                        u.likes_count +
                        (u.children?.reduce((s, c) => s + c.likes_count, 0) || 0),
                      0,
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Comments</span>
                  <span className="font-bold text-foreground">
                    {updates.reduce(
                      (sum, u) =>
                        sum +
                        u.comments_count +
                        (u.children?.reduce((s, c) => s + c.comments_count, 0) || 0),
                      0,
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Posts</span>
                  <span className="font-bold text-foreground">
                    {updates.length}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-card border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-600 dark:text-purple-500" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start h-9 text-xs"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5 mr-2" />
                  New Update
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start h-9 text-xs"
                  onClick={() => window.location.href = "/charity/campaigns"}
                >
                  <TrendingUp className="h-3.5 w-3.5 mr-2" />
                  View Campaigns
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start h-9 text-xs"
                  onClick={() => window.location.href = "/charity/dashboard"}
                >
                  <Calendar className="h-3.5 w-3.5 mr-2" />
                  Dashboard
                </Button>
              </CardContent>
            </Card>

            {/* Bin Section */}
            <Card className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border-red-200 dark:border-red-900/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                  Bin
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Deleted posts are kept for 30 days before permanent removal.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start h-9 text-xs border-red-200 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-950/30"
                  onClick={() => window.location.href = "/charity/bin"}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  View Bin
                </Button>
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  Pro Tip
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Regular updates keep your supporters engaged. Share your impact stories, behind-the-scenes moments, and milestones!
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </aside>

      {/* Floating Action Button */}
      <Button
        size="lg"
        className="fixed bottom-8 right-8 h-16 w-16 rounded-full shadow-2xl hover:shadow-3xl transition-all hover:scale-110 z-50 bg-primary hover:bg-primary/90"
        onClick={() => setIsCreateModalOpen(true)}
      >
        <Plus className="h-7 w-7" />
      </Button>

      {/* Modals */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[650px] p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40">
            <DialogTitle className="text-xl font-bold">Create Update</DialogTitle>
          </DialogHeader>
          <div className="px-6 py-5 space-y-5">
            <div className="flex items-start gap-3">
              <Avatar className="h-11 w-11 ring-2 ring-background shadow-sm">
                <AvatarImage
                  src={getCharityLogoUrl(charityData?.logo_path) || ""}
                />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {charityData?.name?.substring(0, 2).toUpperCase() || "CH"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-bold text-sm text-foreground">
                  {charityData?.name || "Your Charity"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Sharing with your supporters
                </p>
              </div>
            </div>
            <Textarea
              placeholder="Share an update with your supporters..."
              value={newUpdateContent}
              onChange={(e) => setNewUpdateContent(e.target.value)}
              rows={7}
              className="resize-none text-[15px] leading-relaxed border-border/60 focus:border-primary min-h-[160px]"
              autoFocus
            />
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="rounded-xl w-full h-40 object-cover border border-border/40"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="px-6 py-4 bg-muted/30 border-t border-border/40 flex items-center justify-between">
            <div>
              <input
                type="file"
                id="update-images-modal"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageSelect}
                disabled={selectedImages.length >= 4}
              />
              <label htmlFor="update-images-modal">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  disabled={selectedImages.length >= 4}
                  className="cursor-pointer"
                >
                  <span>
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Add Photos ({selectedImages.length}/4)
                  </span>
                </Button>
              </label>
            </div>
            <Button
              onClick={() => handleCreateUpdate()}
              disabled={!newUpdateContent.trim() || creating}
              size="lg"
              className="bg-primary hover:bg-primary/90 px-8"
            >
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-5 w-5" />
                  Post Update
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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
            <Button 
              onClick={handleEdit} 
              disabled={!editContent.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              <Send className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Facebook-Style Post Modal */}
      <Dialog open={isPostModalOpen} onOpenChange={setIsPostModalOpen}>
        <DialogContent className="max-w-[98vw] w-full h-[98vh] p-0 gap-0 overflow-hidden bg-black/95">
          <VisuallyHidden>
            <DialogTitle>Post Details</DialogTitle>
            <DialogDescription>
              View post image and interact with comments
            </DialogDescription>
          </VisuallyHidden>
          <div className="flex h-full">
            {/* Left Side - Image Viewer */}
            <div className="flex-1 relative bg-black flex items-center justify-center">
              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsPostModalOpen(false)}
                className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-gray-800/80 hover:bg-gray-700 text-white"
              >
                <X className="h-5 w-5" />
              </Button>

              {/* Image Navigation */}
              {selectedPostModal && selectedPostModal.media_urls && selectedPostModal.media_urls.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePrevImage}
                    className="absolute left-4 z-10 h-12 w-12 rounded-full bg-gray-800/80 hover:bg-gray-700 text-white"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNextImage}
                    className="absolute right-4 z-10 h-12 w-12 rounded-full bg-gray-800/80 hover:bg-gray-700 text-white"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </>
              )}

              {/* Main Image */}
              {selectedPostModal && selectedPostModal.media_urls && selectedPostModal.media_urls[selectedImageIndex] && (
                <img
                  src={getStorageUrl(selectedPostModal.media_urls[selectedImageIndex]) || ""}
                  alt={`Post image ${selectedImageIndex + 1}`}
                  className="max-h-[90vh] max-w-full object-contain"
                />
              )}

              {/* Image Counter */}
              {selectedPostModal && selectedPostModal.media_urls && selectedPostModal.media_urls.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800/80 text-white px-4 py-2 rounded-full text-sm">
                  {selectedImageIndex + 1} / {selectedPostModal.media_urls.length}
                </div>
              )}
            </div>

            {/* Right Side - Post Details (Facebook Style) */}
            <div className="w-[350px] bg-card border-l border-border flex flex-col max-h-[98vh]">
              {/* Post Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 ring-2 ring-background">
                    <AvatarImage
                      src={getCharityLogoUrl(charityData?.logo_path) || ""}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {charityData?.name?.substring(0, 2).toUpperCase() || "CH"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground">
                      {charityData?.name || "Your Charity"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedPostModal && formatTimeAgo(selectedPostModal.created_at)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Post Content */}
              <div className="p-4 border-b border-border">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {selectedPostModal?.content}
                </p>
              </div>

              {/* Engagement Stats */}
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
                        {selectedPostModal.comments_count} {selectedPostModal.comments_count === 1 ? "comment" : "comments"}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="px-4 py-2 border-b border-border">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 h-9 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
                    onClick={() => selectedPostModal && handleToggleLike(selectedPostModal.id)}
                  >
                    <Heart
                      className={`mr-2 h-4 w-4 transition-all ${selectedPostModal?.is_liked ? "fill-red-500 text-red-500 scale-110" : ""}`}
                    />
                    <span className="font-medium text-xs">Like</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 h-9 hover:bg-green-50 dark:hover:bg-green-950/30 hover:text-green-600 dark:hover:text-green-400 transition-all duration-200"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.origin + '/charity/updates/' + selectedPostModal?.id);
                      toast.success('Link copied to clipboard!');
                    }}
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    <span className="font-medium text-xs">Share</span>
                  </Button>
                </div>
              </div>

              {/* Comments Section */}
              <ScrollArea className="flex-1 px-4 py-3">
                <div className="space-y-4">
                  {selectedPostModal && loadingComments.has(selectedPostModal.id) ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <>
                      {selectedPostModal && comments[selectedPostModal.id]?.map((comment) => (
                        <div key={comment.id} className="group flex gap-2">
                          <Avatar 
                            className="h-8 w-8 mt-0.5 ring-2 ring-background flex-shrink-0 cursor-pointer hover:ring-primary/50 transition-all"
                            onClick={() => {
                              if (comment.user?.role === "charity_admin" && comment.user?.charity?.id) {
                                if (comment.user.charity.id === charityData?.id) {
                                  navigate('/charity/profile');
                                } else {
                                  window.location.href = `/charity/${comment.user.charity.id}`;
                                }
                              }
                            }}
                          >
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
                            {editingCommentId === comment.id ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={editCommentContent}
                                  onChange={(e) => setEditCommentContent(e.target.value)}
                                  className="min-h-[60px] resize-none"
                                  autoFocus
                                />
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setEditingCommentId(null);
                                      setEditCommentContent("");
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      if (selectedPostModal) {
                                        handleEditComment(selectedPostModal.id, comment.id, editCommentContent);
                                        setEditingCommentId(null);
                                        setEditCommentContent("");
                                      }
                                    }}
                                    disabled={!editCommentContent.trim()}
                                  >
                                    Save
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="bg-muted/30 dark:bg-muted/20 rounded-2xl px-3 py-2 hover:bg-muted/60 dark:hover:bg-muted/50 transition-all duration-200 hover:shadow-sm">
                                  <div className="flex items-start justify-between gap-2">
                                    <p 
                                      className={`font-semibold text-xs text-foreground mb-0.5 ${comment.user?.role === "charity_admin" ? 'cursor-pointer hover:underline' : ''}`}
                                      onClick={() => {
                                        if (comment.user?.role === "charity_admin" && comment.user?.charity?.id) {
                                          if (comment.user.charity.id === charityData?.id) {
                                            navigate('/charity/profile');
                                          } else {
                                            window.location.href = `/charity/${comment.user.charity.id}`;
                                          }
                                        }
                                      }}
                                    >
                                      {comment.user?.role === "charity_admin" && comment.user?.charity?.name
                                        ? comment.user.charity.name
                                        : comment.user?.name || "User"}
                                    </p>
                                    {comment.user_id === charityData?.owner_id && (
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                          >
                                            <MoreHorizontal className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem
                                            onClick={() => {
                                              setEditingCommentId(comment.id);
                                              setEditCommentContent(comment.content);
                                            }}
                                          >
                                            <Edit2 className="h-4 w-4 mr-2" />
                                            Edit
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={() => selectedPostModal && handleDeleteComment(selectedPostModal.id, comment.id)}
                                            className="text-destructive focus:text-destructive"
                                          >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    )}
                                  </div>
                                  <p className="text-sm text-foreground/90 leading-relaxed break-words">
                                    {comment.content}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3 mt-1 px-3">
                                  <span className="text-xs text-muted-foreground">
                                    {formatTimeAgo(comment.created_at)}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`h-auto p-0 text-xs font-medium transition-colors ${
                                      comment.is_liked
                                        ? "text-red-500 hover:text-red-600"
                                        : "text-muted-foreground hover:text-red-500"
                                    }`}
                                    onClick={() => selectedPostModal && handleLikeComment(selectedPostModal.id, comment.id)}
                                  >
                                    <Heart
                                      className={`h-3 w-3 mr-1 ${
                                        comment.is_liked ? "fill-current" : ""
                                      }`}
                                    />
                                    {comment.likes_count > 0 && comment.likes_count}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground font-medium"
                                    onClick={() => {
                                      if (selectedPostModal) {
                                        setReplyingToId(comment.id);
                                        const userName = comment.user?.role === "charity_admin" && comment.user?.charity?.name
                                          ? comment.user.charity.name
                                          : comment.user?.name || "User";
                                        setNewComment((prev) => ({
                                          ...prev,
                                          [selectedPostModal.id]: `@${userName} `,
                                        }));
                                      }
                                    }}
                                  >
                                    <Reply className="h-3 w-3 mr-1" />
                                    Reply
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </ScrollArea>

              {/* Add Comment Input */}
              <div className="p-4 border-t border-border bg-muted/20">
                <div className="flex gap-2">
                  <Avatar className="h-8 w-8 mt-1 ring-2 ring-background flex-shrink-0">
                    <AvatarImage
                      src={getCharityLogoUrl(charityData?.logo_path) || ""}
                    />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {charityData?.name?.substring(0, 2).toUpperCase() || "CH"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      placeholder="Write a comment..."
                      value={selectedPostModal ? (newComment[selectedPostModal.id] || "") : ""}
                      onChange={(e) => selectedPostModal && setNewComment((prev) => ({
                        ...prev,
                        [selectedPostModal.id]: e.target.value,
                      }))}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && selectedPostModal) {
                          handleAddComment(selectedPostModal.id);
                        }
                      }}
                      className="flex-1 px-4 py-2 bg-background border border-border/60 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                    <Button
                      size="sm"
                      onClick={() => selectedPostModal && handleAddComment(selectedPostModal.id)}
                      disabled={!selectedPostModal || !newComment[selectedPostModal.id]?.trim()}
                      className="rounded-full h-9 w-9 p-0 bg-primary hover:bg-primary/90"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
