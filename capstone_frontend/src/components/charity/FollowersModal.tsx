import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Users, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { buildApiUrl, buildStorageUrl } from "@/lib/api";
import { useNavigate } from "react-router-dom";

interface Follower {
  id: number;
  user_id: number;
  followed_at: string;
  user: {
    id: number;
    name: string;
    email?: string;
    profile_image?: string;
    user_type?: string;
  };
}

interface FollowersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  charityId: number;
  charityName: string;
}

export function FollowersModal({
  open,
  onOpenChange,
  charityId,
  charityName,
}: FollowersModalProps) {
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      fetchFollowers();
    }
  }, [open, charityId]);

  const fetchFollowers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(buildApiUrl(`/charities/${charityId}/followers`), {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFollowers(data.data || data || []);
      } else {
        toast.error("Failed to load followers");
      }
    } catch (error) {
      console.error("Error fetching followers:", error);
      toast.error("Failed to load followers");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  };

  const handleViewProfile = (userId: number, userType?: string) => {
    if (userType === "donor") {
      // Navigate to donor profile if route exists
      navigate(`/donor/${userId}`);
    }
    // Add more user type navigation as needed
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Followers
          </DialogTitle>
          <DialogDescription>
            People who follow {charityName}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] px-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : followers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-900/20 dark:to-blue-900/20 flex items-center justify-center mb-4">
                <Users className="h-10 w-10 text-sky-400" />
              </div>
              <p className="text-lg font-medium text-foreground mb-2">
                No followers yet
              </p>
              <p className="text-sm text-muted-foreground max-w-sm">
                When people follow your charity, they'll appear here. Share your profile to gain more followers!
              </p>
            </div>
          ) : (
            <div className="space-y-3 py-4">
              {followers.map((follower) => (
                <div
                  key={follower.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-white/50 to-gray-50/50 dark:from-gray-800/50 dark:to-gray-900/50 hover:from-white dark:hover:from-gray-800 hover:shadow-md transition-all duration-200 border border-border/50"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <Avatar className="h-12 w-12 ring-2 ring-background shadow-sm">
                      <AvatarImage
                        src={
                          follower.user?.profile_image
                            ? buildStorageUrl(follower.user.profile_image)
                            : undefined
                        }
                        alt={follower.user?.name}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
                        {follower.user?.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2) || "U"}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {follower.user?.name || "Anonymous User"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Followed {formatDate(follower.followed_at)}
                      </p>
                    </div>
                  </div>

                  {follower.user?.user_type && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleViewProfile(
                          follower.user.id,
                          follower.user.user_type
                        )
                      }
                      className="ml-3"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {followers.length > 0 && (
          <div className="px-6 py-4 border-t bg-muted/30">
            <p className="text-sm text-muted-foreground text-center">
              Total Followers: <span className="font-semibold text-foreground">{followers.length}</span>
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
