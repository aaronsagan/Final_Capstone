import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  CheckCircle2,
  Calendar,
  TrendingUp,
  Flag,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  X,
  Send,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import CommentSection from "./CommentSection";
import ThreadSection from "./ThreadSection";
import ShareModal from "./ShareModal";
import { getCharityLogoUrl, getStorageUrl } from "@/lib/storage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  VisuallyHidden,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

const API_URL = import.meta.env.VITE_API_URL;

interface Update {
  id: number;
  charity_id: number;
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
  likes_count?: number;
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

interface PostCardProps {
  update: Update;
  currentUserId?: number;
  onLike: (updateId: number) => void;
  onShare: (updateId: number, platform: string) => void;
  onFetchComments: (updateId: number) => Promise<Comment[]>;
  onAddComment: (updateId: number, content: string) => Promise<void>;
  onDeleteComment: (commentId: number, updateId: number) => Promise<void>;
}

export default function PostCard({
  update,
  currentUserId,
  onLike,
  onShare,
  onFetchComments,
  onAddComment,
  onDeleteComment,
}: PostCardProps) {
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [modalComments, setModalComments] = useState<Comment[]>([]);
  const [newModalComment, setNewModalComment] = useState("");
  const [loadingModalComments, setLoadingModalComments] = useState(false);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const toggleComments = async () => {
    if (!showComments && comments.length === 0) {
      setLoadingComments(true);
      try {
        const fetchedComments = await onFetchComments(update.id);
        setComments(fetchedComments);
      } finally {
        setLoadingComments(false);
      }
    }
    setShowComments(!showComments);
  };

  const handleAddComment = async (content: string) => {
    await onAddComment(update.id, content);
    // Refresh comments
    const fetchedComments = await onFetchComments(update.id);
    setComments(fetchedComments);
  };

  const handleDeleteComment = async (commentId: number) => {
    await onDeleteComment(commentId, update.id);
    setComments(comments.filter((c) => c.id !== commentId));
  };

  const handleShareClick = () => {
    setShowShareModal(true);
  };

  const handleShare = (platform: string) => {
    onShare(update.id, platform);
  };

  const handleOpenModal = async (index: number) => {
    setSelectedImageIndex(index);
    setIsModalOpen(true);
    // Load comments for modal
    if (modalComments.length === 0) {
      setLoadingModalComments(true);
      try {
        const fetchedComments = await onFetchComments(update.id);
        setModalComments(fetchedComments);
      } finally {
        setLoadingModalComments(false);
      }
    }
  };

  const handlePrevImage = () => {
    setSelectedImageIndex((prev) =>
      prev > 0 ? prev - 1 : (update.media_urls?.length || 1) - 1
    );
  };

  const handleNextImage = () => {
    setSelectedImageIndex((prev) =>
      prev < (update.media_urls?.length || 1) - 1 ? prev + 1 : 0
    );
  };

  const handleAddModalComment = async () => {
    if (!newModalComment.trim()) return;
    await onAddComment(update.id, newModalComment);
    setNewModalComment("");
    // Refresh comments
    const fetchedComments = await onFetchComments(update.id);
    setModalComments(fetchedComments);
  };

  const handleDeleteModalComment = async (commentId: number) => {
    await onDeleteComment(commentId, update.id);
    setModalComments(modalComments.filter((c) => c.id !== commentId));
  };

  // Truncate content if too long
  const contentLimit = 300;
  const shouldTruncate = update.content.length > contentLimit;
  const displayContent = shouldTruncate && !showFullContent
    ? update.content.substring(0, contentLimit) + "..."
    : update.content;

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            {/* Charity Info */}
            <div className="flex items-center gap-3 flex-1">
              <Avatar
                className="w-12 h-12 cursor-pointer ring-2 ring-primary/10 hover:ring-primary/30 transition-all"
                onClick={() => navigate(`/donor/charities/${update.charity_id}`)}
              >
                <AvatarImage
                  src={getCharityLogoUrl(update.charity?.logo_path) || undefined}
                />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {update.charity?.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3
                    className="text-base font-semibold hover:underline cursor-pointer truncate"
                    onClick={() => navigate(`/donor/charities/${update.charity_id}`)}
                  >
                    {update.charity?.name}
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                  {update.is_pinned && (
                    <Badge variant="outline" className="text-xs">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Pinned
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Calendar className="h-3 w-3" />
                  {formatTimeAgo(update.created_at)}
                </p>
              </div>
            </div>

            {/* More Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Flag className="mr-2 h-4 w-4" />
                  Report Post
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Hide Post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Post Content */}
          <div>
            <p className="whitespace-pre-wrap text-foreground leading-relaxed">
              {displayContent}
            </p>
            {shouldTruncate && (
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto font-semibold"
                onClick={() => setShowFullContent(!showFullContent)}
              >
                {showFullContent ? "See less" : "See more"}
              </Button>
            )}
          </div>

          {/* Post Media - Facebook Style Grid */}
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
                  onClick={() => handleOpenModal(index)}
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

          <Separator />

          {/* Engagement Stats */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="hover:underline cursor-pointer">
              {update.likes_count} {update.likes_count === 1 ? 'like' : 'likes'}
            </span>
            <div className="flex gap-3">
              <span className="hover:underline cursor-pointer" onClick={toggleComments}>
                {update.comments_count} {update.comments_count === 1 ? 'comment' : 'comments'}
              </span>
              <span>
                {update.shares_count || 0} {update.shares_count === 1 ? 'share' : 'shares'}
              </span>
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "flex-1 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors",
                update.is_liked && "text-red-500"
              )}
              onClick={() => onLike(update.id)}
            >
              <Heart
                className={cn(
                  "mr-2 h-5 w-5 transition-all",
                  update.is_liked && "fill-red-500 text-red-500 scale-110"
                )}
              />
              <span className="font-semibold">Like</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              onClick={toggleComments}
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              <span className="font-semibold">Comment</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-600 dark:hover:text-green-400 transition-colors"
              onClick={handleShareClick}
            >
              <Share2 className="mr-2 h-5 w-5" />
              <span className="font-semibold">Share</span>
            </Button>
          </div>

          {/* Thread Section */}
          {update.children && update.children.length > 0 && (
            <ThreadSection
              threads={update.children}
              onLike={onLike}
              onComment={toggleComments}
              onShare={handleShareClick}
            />
          )}

          {/* Comments Section */}
          {showComments && (
            <CommentSection
              updateId={update.id}
              comments={comments}
              currentUserId={currentUserId}
              onAddComment={handleAddComment}
              onDeleteComment={handleDeleteComment}
            />
          )}
        </CardContent>
      </Card>

      {/* Share Modal */}
      <ShareModal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        updateId={update.id}
        onShare={handleShare}
      />

      {/* Full-Screen Image Modal - Facebook Style */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
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
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-gray-800/80 hover:bg-gray-700 text-white"
              >
                <X className="h-5 w-5" />
              </Button>

              {/* Image Navigation */}
              {update.media_urls && update.media_urls.length > 1 && (
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
              {update.media_urls && update.media_urls[selectedImageIndex] && (
                <img
                  src={getStorageUrl(update.media_urls[selectedImageIndex]) || ""}
                  alt={`Post image ${selectedImageIndex + 1}`}
                  className="max-h-[90vh] max-w-full object-contain"
                />
              )}

              {/* Image Counter */}
              {update.media_urls && update.media_urls.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800/80 text-white px-4 py-2 rounded-full text-sm">
                  {selectedImageIndex + 1} / {update.media_urls.length}
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
                      src={getCharityLogoUrl(update.charity?.logo_path) || ""}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {update.charity?.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{update.charity?.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {formatTimeAgo(update.created_at)}
                    </p>
                  </div>
                </div>
                {update.content && (
                  <p className="mt-3 text-sm whitespace-pre-wrap">{update.content}</p>
                )}
              </div>

              {/* Comments Section */}
              <ScrollArea className="flex-1 p-4">
                {loadingModalComments ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : modalComments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No comments yet. Be the first to comment!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {modalComments.map((comment) => {
                      const isReply = comment.content.startsWith('@');
                      return (
                        <div key={comment.id} className={`group flex gap-2.5 ${isReply ? 'ml-12' : ''}`}>
                          <Avatar 
                            className={`${isReply ? 'h-8 w-8' : 'h-9 w-9'} mt-0.5 flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all`}
                            onClick={() => {
                              if (comment.user?.role === "charity_admin" && comment.user?.charity?.id) {
                                navigate(`/donor/charities/${comment.user.charity.id}`);
                              }
                            }}
                          >
                            <AvatarImage
                              src={
                                comment.user?.role === "charity_admin" && comment.user?.charity?.logo_path
                                  ? getCharityLogoUrl(comment.user.charity.logo_path) || undefined
                                  : getStorageUrl(comment.user?.profile_image) || undefined
                              }
                            />
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {(comment.user?.role === "charity_admin" && comment.user?.charity?.name
                                ? comment.user.charity.name.substring(0, 2).toUpperCase()
                                : comment.user?.name?.substring(0, 2).toUpperCase()) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className={`${isReply ? 'bg-muted/30 dark:bg-muted/20 rounded-xl px-3 py-1.5' : 'bg-muted/40 dark:bg-muted/30 rounded-2xl px-3.5 py-2'} hover:bg-muted/60 dark:hover:bg-muted/50 transition-all duration-200`}>
                              <p 
                                className={`font-semibold ${isReply ? 'text-xs' : 'text-sm'} text-foreground mb-0.5 ${comment.user?.role === "charity_admin" ? 'cursor-pointer hover:underline' : ''}`}
                                onClick={() => {
                                  if (comment.user?.role === "charity_admin" && comment.user?.charity?.id) {
                                    navigate(`/donor/charities/${comment.user.charity.id}`);
                                  }
                                }}
                              >
                                {comment.user?.role === "charity_admin" && comment.user?.charity?.name
                                  ? comment.user.charity.name
                                  : comment.user?.name || "User"}
                              </p>
                              <p className={`${isReply ? 'text-sm' : 'text-[15px]'} text-foreground leading-relaxed`}>
                                {comment.content}
                              </p>
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
                                onClick={() => {
                                  // Like comment functionality - placeholder
                                  // Will be implemented when backend endpoint is ready
                                }}
                              >
                                <Heart
                                  className={`h-3 w-3 mr-1 ${
                                    comment.is_liked ? "fill-current" : ""
                                  }`}
                                />
                                {comment.likes_count && comment.likes_count > 0 ? comment.likes_count : ''}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground font-semibold"
                                onClick={() => {
                                  const userName = comment.user?.role === "charity_admin" && comment.user?.charity?.name
                                    ? comment.user.charity.name
                                    : comment.user?.name || "User";
                                  setNewModalComment(`@${userName} `);
                                }}
                              >
                                <MessageCircle className="h-3 w-3 mr-1" />
                                Reply
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>

              {/* Comment Input */}
              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Write a comment..."
                    value={newModalComment}
                    onChange={(e) => setNewModalComment(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleAddModalComment();
                      }
                    }}
                    className="min-h-[40px] max-h-[100px] resize-none"
                  />
                  <Button
                    size="icon"
                    onClick={handleAddModalComment}
                    disabled={!newModalComment.trim()}
                    className="h-10 w-10 flex-shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
