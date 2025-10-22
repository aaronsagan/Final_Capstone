import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, BarChart3, Users, Plus, ChevronRight, Target, Sparkles } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface TopCampaign {
  id: number;
  title: string;
  bannerImage?: string;
  amountRaised: number;
  goal: number;
}

interface CampaignsSidebarProps {
  totalCampaigns: number;
  activeCampaigns: number;
  totalRaised: number;
  avgCompletion: number; // percentage 0-100
  topCampaign?: TopCampaign | null;
}

export function CampaignsSidebar({ totalCampaigns, activeCampaigns, totalRaised, avgCompletion, topCampaign }: CampaignsSidebarProps) {
  const navigate = useNavigate();
  const [tipIndex, setTipIndex] = useState(0);
  const tips = [
    "Add a compelling cover image to boost engagement.",
    "Share regular updates to keep donors involved.",
    "Set a realistic goal and show progress.",
    "Use clear titles and short, impactful descriptions.",
  ];

  useEffect(() => {
    const id = setInterval(() => setTipIndex((i) => (i + 1) % tips.length), 5000);
    return () => clearInterval(id);
  }, []);

  const formatMoney = (amount: number) => `₱${(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

  return (
    <aside className="space-y-6">
      {/* Summary Card */}
      <Card className="hover:shadow-lg hover:scale-[1.01] transition-all duration-200 animate-in fade-in-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Campaign Summary</CardTitle>
          <CardDescription>Overview of your fundraising</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-border/30 bg-background/40 p-3 transition-all hover:shadow-sm">
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Target className="h-4 w-4 text-indigo-400" /> Total Campaigns</div>
              <div className="text-2xl font-bold">{totalCampaigns}</div>
            </div>
            <div className="rounded-xl border border-border/30 bg-background/40 p-3 transition-all hover:shadow-sm">
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Users className="h-4 w-4 text-emerald-400" /> Active</div>
              <div className="text-2xl font-bold">{activeCampaigns}</div>
            </div>
            <div className="rounded-xl border border-border/30 bg-background/40 p-3 transition-all hover:shadow-sm">
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><TrendingUp className="h-4 w-4 text-amber-400" /> Total Raised</div>
              <div className="text-xl font-bold text-amber-400">{formatMoney(totalRaised)}</div>
            </div>
            <div className="rounded-xl border border-border/30 bg-background/40 p-3 transition-all hover:shadow-sm">
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><BarChart3 className="h-4 w-4 text-sky-400" /> Avg. Completion</div>
              <div className="text-xl font-bold text-sky-400">{avgCompletion}%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card className="hover:shadow-lg hover:scale-[1.01] transition-all duration-200 animate-in fade-in-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Performance Insights</CardTitle>
          <CardDescription>Top highlights from your campaigns</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {topCampaign ? (
            <div className="flex gap-3 items-center">
              {topCampaign.bannerImage ? (
                <img src={topCampaign.bannerImage} alt={topCampaign.title} className="h-14 w-20 rounded-md object-cover border border-border/30" />
              ) : (
                <div className="h-14 w-20 rounded-md bg-muted/40 flex items-center justify-center text-muted-foreground">No Image</div>
              )}
              <div className="min-w-0">
                <p className="font-medium truncate">{topCampaign.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatMoney(topCampaign.amountRaised)} / {formatMoney(topCampaign.goal)}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No campaign performance yet.</p>
          )}
          <Separator />
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Most Recent Donor Activity</span>
            <p className="mt-1">New donations will appear here as they come in.</p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="hover:shadow-lg hover:scale-[1.01] transition-all duration-200 animate-in fade-in-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Quick Actions</CardTitle>
          <CardDescription>Manage your campaigns</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            className="w-full justify-start h-10 hover:shadow-sm"
            onClick={() => window.dispatchEvent(new Event('open-campaign-create'))}
            aria-label="Create Campaign"
          >
            <Plus className="h-4 w-4 mr-2" /> Create Campaign
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start h-10 hover:bg-muted/50 cursor-pointer"
            onClick={() => navigate('/charity/reports')}
            aria-label="View Analytics"
          >
            <BarChart3 className="h-4 w-4 mr-2" /> View Analytics
          </Button>
          <Button variant="outline" className="w-full justify-start h-10 hover:bg-muted/50" onClick={() => navigate('/charity/donations')} aria-label="Manage Donations">
            <ChevronRight className="h-4 w-4 mr-2" /> Manage Donations
          </Button>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="hover:shadow-lg hover:scale-[1.01] transition-all duration-200 animate-in fade-in-50 bg-gradient-to-br from-indigo-500/10 via-amber-500/5 to-transparent border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2"><Sparkles className="h-4 w-4 text-indigo-400" /> Campaign Tip</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{tips[tipIndex]}</p>
        </CardContent>
      </Card>
    </aside>
  );
}
