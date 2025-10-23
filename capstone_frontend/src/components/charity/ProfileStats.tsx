import { TrendingUp, Target, Users, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ProfileStatsProps {
  stats: {
    totalRaised: number;
    campaigns: number;
    followers: number;
    updates: number;
  };
  formatCurrency: (amount: number) => string;
  onTotalRaisedClick?: () => void;
  onCampaignsClick?: () => void;
  onFollowersClick?: () => void;
  onUpdatesClick?: () => void;
}

export function ProfileStats({ 
  stats, 
  formatCurrency,
  onTotalRaisedClick,
  onCampaignsClick,
  onFollowersClick,
  onUpdatesClick
}: ProfileStatsProps) {
  const statItems = [
    {
      icon: TrendingUp,
      label: "Total Raised",
      value: formatCurrency(stats.totalRaised),
      gradient: "from-emerald-500/20 via-emerald-400/10 to-transparent",
      ring: "ring-emerald-500/30",
      iconColor: "text-emerald-400",
      valueColor: "text-emerald-400",
      onClick: onTotalRaisedClick,
    },
    {
      icon: Target,
      label: "Active Campaigns",
      value: stats.campaigns.toString(),
      gradient: "from-indigo-500/20 via-indigo-400/10 to-transparent",
      ring: "ring-indigo-500/30",
      iconColor: "text-indigo-400",
      valueColor: "text-indigo-400",
      onClick: onCampaignsClick,
    },
    {
      icon: Users,
      label: "Followers",
      value: stats.followers.toString(),
      gradient: "from-sky-500/20 via-sky-400/10 to-transparent",
      ring: "ring-sky-500/30",
      iconColor: "text-sky-400",
      valueColor: "text-sky-400",
      onClick: onFollowersClick,
    },
    {
      icon: FileText,
      label: "Updates",
      value: stats.updates.toString(),
      gradient: "from-fuchsia-500/20 via-fuchsia-400/10 to-transparent",
      ring: "ring-fuchsia-500/30",
      iconColor: "text-fuchsia-400",
      valueColor: "text-fuchsia-400",
      onClick: onUpdatesClick,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4 mb-8">
      {statItems.map((item, index) => (
        <Card
          key={index}
          className={`relative overflow-hidden bg-background/40 border-border/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-150 cursor-pointer rounded-2xl ring-1 ${item.ring} hover:ring-2 active:scale-[0.98]`}
          onClick={item.onClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && item.onClick?.()}
        >
          {/* Gradient tint */}
          <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${item.gradient}`} />
          <CardContent className="relative p-5 h-24 lg:h-28 flex items-center justify-between">
            {/* Left: value + label */}
            <div>
              <p className={`text-2xl lg:text-3xl font-extrabold ${item.valueColor}`}>{item.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
            </div>

            {/* Right: decorative icon bubble to balance space */}
            <div className="shrink-0">
              <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-white/5 ring-1 ring-white/10 flex items-center justify-center">
                <item.icon className={`h-5 w-5 lg:h-6 lg:w-6 ${item.iconColor}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
