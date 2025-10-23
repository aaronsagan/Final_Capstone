import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, MessageCircle, FileText, Plus } from "lucide-react";

interface UpdatesSidebarProps {
  totalLikes: number;
  totalComments: number;
  totalPosts: number;
  recentUpdates?: Array<{ id: number; title?: string; content: string; created_at: string }>;
  canCreate?: boolean;
}

export function UpdatesSidebar({ totalLikes, totalComments, totalPosts, recentUpdates = [], canCreate = false }: UpdatesSidebarProps) {
  return (
    <aside className="space-y-6">
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">Recent Updates Summary</h3>
          </div>
          <CardDescription>Latest posts</CardDescription>
        </CardHeader>
        <CardContent>
          {recentUpdates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No updates yet</p>
          ) : (
            <div className="space-y-3">
              {recentUpdates.slice(0, 3).map((u) => (
                <button
                  key={u.id}
                  className="w-full text-left p-3 rounded-lg border border-border/30 hover:bg-muted/50 transition-colors"
                  onClick={() => window.dispatchEvent(new CustomEvent('scroll-to-update', { detail: { id: u.id } }))}
                >
                  <p className="font-medium text-sm truncate">{u.title || (u.content || '').slice(0, 80)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{new Date(u.created_at).toLocaleString()}</p>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">Engagement Overview</h3>
          </div>
          <CardDescription>Key metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-border/30 bg-background/40 p-3 text-center">
              <div className="flex items-center justify-center mb-1">
                <FileText className="h-4 w-4 text-fuchsia-400" />
              </div>
              <p className="text-xl font-bold text-fuchsia-400">{totalPosts}</p>
              <p className="text-xs text-muted-foreground">Total Updates</p>
            </div>
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
          </div>
        </CardContent>
      </Card>

      {canCreate && (
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader>
            <h3 className="font-bold text-lg">Quick Actions</h3>
            <CardDescription>Create a new update</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              className="w-full justify-start h-9 hover:shadow-sm"
              onClick={() => window.dispatchEvent(new Event('open-update-create'))}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Update
            </Button>
          </CardContent>
        </Card>
      )}
    </aside>
  );
}
