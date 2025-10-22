import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getCharityLogoUrl, getProfileImageUrl } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Trash2, CheckCircle2, Edit2, Reply, MoreHorizontal, Heart } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL;

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

interface CommentSectionProps {
  updateId: number;
  comments: Comment[];
  currentUserId?: number;
  onAddComment: (content: string) => Promise<void>;
  onDeleteComment: (commentId: number) => Promise<void>;
  onEditComment?: (commentId: number, content: string) => Promise<void>;
  onLikeComment?: (commentId: number) => Promise<void>;
}

export default function CommentSection({
  updateId,
  comments,
  currentUserId,
  onAddComment,
  onDeleteComment,
  onEditComment,
  onLikeComment,
}: CommentSectionProps) {
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");

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

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddComment(newComment.trim());
      setNewComment("");
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleEdit = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };

  const handleSaveEdit = async (commentId: number) => {
    if (!editContent.trim() || !onEditComment) return;
    try {
      await onEditComment(commentId, editContent.trim());
      setEditingCommentId(null);
      setEditContent("");
    } catch (error) {
      toast.error("Failed to update comment");
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditContent("");
  };

  const handleReply = (comment: Comment) => {
    setReplyingToId(comment.id);
    const userName = comment.user?.role === "charity_admin" && comment.user?.charity?.name
      ? comment.user.charity.name
      : comment.user?.name || "User";
    setReplyContent(`@${userName} `);
  };

  const handleSendReply = async () => {
    if (!replyContent.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddComment(replyContent.trim());
      setReplyingToId(null);
      setReplyContent("");
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pt-4 border-t">
      {/* Comments List */}
      <ScrollArea className="max-h-96">
        <div className="space-y-3 pr-4">
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            comments.map((comment) => {
              const isReply = comment.content.startsWith('@');
              return (
              <div
                key={comment.id}
                className={`group flex gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/60 transition-all duration-200 hover:shadow-sm ${isReply ? 'ml-12' : ''}`}
              >
                <Avatar className={`${isReply ? 'w-7 h-7' : 'w-8 h-8'} shrink-0`}>
                  <AvatarImage
                    src={
                      comment.user?.role === "charity_admin" && comment.user?.charity?.logo_path
                        ? getCharityLogoUrl(comment.user.charity.logo_path) || undefined
                        : getProfileImageUrl(comment.user?.profile_image) || undefined
                    }
                    alt={comment.user?.name}
                  />
                  <AvatarFallback className="text-xs">
                    {(comment.user?.role === "charity_admin" && comment.user?.charity?.name
                      ? comment.user.charity.name.substring(0, 2).toUpperCase()
                      : comment.user?.name?.substring(0, 2).toUpperCase()) || "??"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">
                        {comment.user?.role === "charity_admin" && comment.user?.charity?.name
                          ? comment.user.charity.name
                          : comment.user?.name || "Unknown User"}
                      </span>
                      {comment.user?.role === "charity_admin" && (
                        <Badge variant="secondary" className="text-xs h-5">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(comment.created_at)}
                      </span>
                    </div>
                    {comment.user_id === currentUserId && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(comment)}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDeleteComment(comment.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  {editingCommentId === comment.id ? (
                    <div className="mt-2 space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="min-h-[60px] resize-none"
                        autoFocus
                      />
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(comment.id)}
                          disabled={!editContent.trim()}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-foreground mt-1 whitespace-pre-wrap break-words">
                        {comment.content}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-auto p-0 text-xs font-semibold transition-colors ${
                            comment.is_liked
                              ? "text-red-500 hover:text-red-600"
                              : "text-muted-foreground hover:text-red-500"
                          }`}
                          onClick={() => onLikeComment && onLikeComment(comment.id)}
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
                          onClick={() => handleReply(comment)}
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
            })
          )}
        </div>
      </ScrollArea>

      {/* Reply Section */}
      {replyingToId && (
        <div className="flex gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarFallback className="text-xs">You</AvatarFallback>
          </Avatar>
          <div className="flex-1 flex gap-2">
            <Textarea
              placeholder="Write a reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="min-h-[60px] resize-none"
              autoFocus
            />
            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                onClick={handleSendReply}
                disabled={!replyContent.trim() || isSubmitting}
                className="shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setReplyingToId(null);
                  setReplyContent("");
                }}
                className="shrink-0"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Comment */}
      {!replyingToId && (
        <div className="flex gap-2">
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarFallback className="text-xs">You</AvatarFallback>
          </Avatar>
          <div className="flex-1 flex gap-2">
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={handleKeyPress}
              className="min-h-[60px] resize-none"
              disabled={isSubmitting}
            />
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!newComment.trim() || isSubmitting}
              className="shrink-0 h-[60px]"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
