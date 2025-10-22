import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, MessageCircle, FileText, Plus, ChevronRight, Trash2, Lightbulb } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UpdatesSidebarProps {
  totalLikes: number;
  totalComments: number;
  totalPosts: number;
}

export function UpdatesSidebar({ totalLikes, totalComments, totalPosts }: UpdatesSidebarProps) {
  const navigate = useNavigate();

  return (
    <aside className="space-y-6">
      {/* Insights */}
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">Insights</h3>
          </div>
          <CardDescription>Engagement metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-border/30 bg-background/40 p-3 text-center">
              <div className="flex items-center justify-center mb-1">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="text-xl font-bold text-emerald-400">{totalLikes}</p>
              <p className="text-xs text-muted-foreground">Total Likes</p>
            </div>
            <div className="rounded-xl border border-border/30 bg-background/40 p-3 text-center">
              <div className="flex items-center justify-center mb-1">
                <MessageCircle className="h-4 w-4 text-sky-400" />
              </div>
              <p className="text-xl font-bold text-sky-400">{totalComments}</p>
              <p className="text-xs text-muted-foreground">Comments</p>
            </div>
            <div className="rounded-xl border border-border/30 bg-background/40 p-3 text-center">
              <div className="flex items-center justify-center mb-1">
                <FileText className="h-4 w-4 text-fuchsia-400" />
              </div>
              <p className="text-xl font-bold text-fuchsia-400">{totalPosts}</p>
              <p className="text-xs text-muted-foreground">Posts</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardHeader>
          <h3 className="font-bold text-lg">Quick Actions</h3>
          <CardDescription>Manage your updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            className="w-full justify-start h-9 hover:shadow-sm"
            onClick={() => window.dispatchEvent(new Event('open-update-create'))}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Update
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start h-9 hover:bg-muted/50"
            onClick={() => navigate('/charity/campaigns')}
          >
            <ChevronRight className="h-4 w-4 mr-2" />
            View Campaigns
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start h-9 hover:bg-muted/50"
            onClick={() => navigate('/charity/dashboard')}
          >
            <ChevronRight className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
        </CardContent>
      </Card>

      {/* Bin */}
      <Card className="hover:shadow-md transition-shadow duration-200 border-red-500/20">
        <CardHeader>
          <h3 className="font-bold text-lg flex items-center gap-2"><Trash2 className="h-4 w-4 text-red-500" /> Bin</h3>
          <CardDescription>Deleted posts are kept for 30 days before permanent removal.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="w-full justify-start h-9 hover:bg-muted/50"
            onClick={() => navigate('/charity/bin')}
          >
            <ChevronRight className="h-4 w-4 mr-2" />
            View Bin
          </Button>
        </CardContent>
      </Card>

      {/* Pro Tip */}
      <Card className="hover:shadow-md transition-shadow duration-200 bg-gradient-to-br from-yellow-500/10 via-orange-500/5 to-transparent border-yellow-500/20">
        <CardHeader>
          <h3 className="font-bold text-lg flex items-center gap-2"><Lightbulb className="h-4 w-4 text-yellow-400" /> Pro Tip</h3>
          <CardDescription>
            Regular updates keep your supporters engaged. Share impact stories, behind-the-scenes moments, and milestones!
          </CardDescription>
        </CardHeader>
      </Card>
    </aside>
  );
}
