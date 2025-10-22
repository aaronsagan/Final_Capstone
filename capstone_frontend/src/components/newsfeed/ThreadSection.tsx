import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Share2, CheckCircle2, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const API_URL = import.meta.env.VITE_API_URL;

interface ThreadUpdate {
  id: number;
  charity_id: number;
  content: string;
  media_urls: string[];
  created_at: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_liked: boolean;
  charity?: {
    id: number;
    name: string;
    logo_path?: string;
  };
}

interface ThreadSectionProps {
  threads: ThreadUpdate[];
  onLike: (updateId: number) => void;
  onComment: (updateId: number) => void;
  onShare: (updateId: number) => void;
}

export default function ThreadSection({
  threads,
  onLike,
  onComment,
  onShare,
}: ThreadSectionProps) {
  const [expanded, setExpanded] = useState(false);

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

  if (!threads || threads.length === 0) return null;

  return (
    <div className="mt-4 space-y-3">
      {/* Thread Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => setExpanded(!expanded)}
      >
        <MessageCircle className="mr-2 h-4 w-4" />
        {expanded ? 'Hide' : 'View'} {threads.length} {threads.length === 1 ? 'Update' : 'Updates'}
        {expanded ? (
          <ChevronUp className="ml-2 h-4 w-4" />
        ) : (
          <ChevronDown className="ml-2 h-4 w-4" />
        )}
      </Button>

      {/* Thread Updates */}
      {expanded && (
        <div className="pl-4 border-l-2 border-primary/20 space-y-3">
          {threads.map((thread) => (
            <Card key={thread.id} className="bg-muted/30 border-muted">
              <CardContent className="pt-4 space-y-3">
                {/* Thread Header */}
                <div className="flex items-start gap-3">
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarImage
                      src={
                        thread.charity?.logo_path
                          ? `${API_URL}/storage/${thread.charity.logo_path}`
                          : undefined
                      }
                    />
                    <AvatarFallback className="text-xs">
                      {thread.charity?.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">
                        {thread.charity?.name}
                      </span>
                      <Badge variant="secondary" className="text-xs h-5">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(thread.created_at)}
                    </span>
                  </div>
                </div>

                {/* Thread Content */}
                <p className="text-sm whitespace-pre-wrap">{thread.content}</p>

                {/* Thread Media */}
                {thread.media_urls && thread.media_urls.length > 0 && (
                  <div className="grid gap-2 grid-cols-2">
                    {thread.media_urls.map((url, idx) => (
                      <img
                        key={idx}
                        src={`${API_URL}/storage/${url}`}
                        alt={`Thread media ${idx + 1}`}
                        className="rounded-lg w-full h-auto max-h-48 object-cover"
                      />
                    ))}
                  </div>
                )}

                {/* Thread Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 px-2 flex-1 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors",
                      thread.is_liked && "text-red-500"
                    )}
                    onClick={() => onLike(thread.id)}
                  >
                    <Heart
                      className={cn(
                        "h-3 w-3 mr-1",
                        thread.is_liked && "fill-red-500 text-red-500"
                      )}
                    />
                    <span className="text-xs">{thread.likes_count}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 flex-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    onClick={() => onComment(thread.id)}
                  >
                    <MessageCircle className="h-3 w-3 mr-1" />
                    <span className="text-xs">{thread.comments_count}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 flex-1 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                    onClick={() => onShare(thread.id)}
                  >
                    <Share2 className="h-3 w-3 mr-1" />
                    <span className="text-xs">{thread.shares_count || 0}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
