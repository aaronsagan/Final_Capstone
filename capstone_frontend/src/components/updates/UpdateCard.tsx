import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Heart, MessageCircle, Share2, Pin } from "lucide-react";

export interface UpdateItem {
  id: number;
  content: string;
  created_at: string;
  media_urls?: string[];
  likes_count: number;
  comments_count: number;
  is_pinned?: boolean;
  is_liked?: boolean;
}

interface UpdateCardProps {
  update: UpdateItem;
  charityName?: string;
  charityLogoUrl?: string | null;
  timeAgo: (iso: string) => string;
  storageUrl: (path: string) => string;
  commentsExpanded?: boolean;
  onLike: (id: number) => void;
  onToggleComments: (id: number) => void;
  onOpenPostModal?: (update: UpdateItem, index: number) => void;
}

export function UpdateCard({
  update,
  charityName,
  charityLogoUrl,
  timeAgo,
  storageUrl,
  commentsExpanded,
  onLike,
  onToggleComments,
  onOpenPostModal,
}: UpdateCardProps) {
  const media = update.media_urls || [];
  return (
    <Card className="mb-4 bg-card border-border/40 hover:shadow-lg transition-all duration-200 hover:border-border/60">
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <Avatar className="h-10 w-10 ring-2 ring-background shadow-sm">
              <AvatarImage src={charityLogoUrl || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {(charityName || 'CH').substring(0,2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-sm text-foreground">{charityName || 'Your Charity'}</p>
                {update.is_pinned && (
                  <Badge variant="secondary" className="flex items-center gap-1 text-xs bg-primary/10 text-primary border-0">
                    <Pin className="h-3 w-3" />
                    Pinned
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0">{timeAgo(update.created_at)}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0 p-6">
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground -mt-1">{update.content}</p>

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
                src={storageUrl(url)}
                alt={`Update media ${index + 1}`}
                onClick={() => onOpenPostModal && onOpenPostModal(update, index)}
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

        {media.length > 0 && <Separator className="mt-3 mb-2 bg-border/70" />}

        {(update.likes_count > 0 || update.comments_count > 0) && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
            {update.likes_count > 0 && (
              <button className="hover:underline" onClick={() => onLike(update.id)}>
                <Heart className="h-3.5 w-3.5 inline mr-1 fill-red-500 text-red-500" />
                {update.likes_count} {update.likes_count === 1 ? 'like' : 'likes'}
              </button>
            )}
            {update.comments_count > 0 && (
              <button className="hover:underline" onClick={() => onToggleComments(update.id)}>
                {update.comments_count} {update.comments_count === 1 ? 'comment' : 'comments'}
              </button>
            )}
          </div>
        )}

        {!commentsExpanded && update.comments_count > 0 && (
          <div className="pt-2 pb-1">
            <button
              className="text-sm text-muted-foreground hover:underline cursor-pointer font-medium"
              onClick={() => onToggleComments(update.id)}
            >
              View all {update.comments_count} {update.comments_count === 1 ? 'comment' : 'comments'}
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 mt-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-10 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
            onClick={() => onLike(update.id)}
          >
            <Heart className={`mr-2 h-4 w-4 ${update.is_liked ? 'fill-red-500 text-red-500' : ''}`} />
            <span className="font-medium">Like</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-10 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200"
            onClick={() => onToggleComments(update.id)}
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
            }}
          >
            <Share2 className="mr-2 h-4 w-4" />
            <span className="font-medium">Share</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
