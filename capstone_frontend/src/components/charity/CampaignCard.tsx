import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Eye,
  Heart,
  MoreVertical,
  Edit,
  Pause,
  Play,
  Trash2,
  Share2,
  Users,
  Target,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DonationsModal } from "./DonationsModal";
import { buildStorageUrl } from "@/lib/api";

export interface Campaign {
  id: number;
  title: string;
  description: string;
  goal: number;
  amountRaised: number;
  donorsCount: number;
  views: number;
  status: "active" | "completed" | "draft" | "expired";
  bannerImage?: string;
  endDate: string;
  createdAt: string;
}

interface CampaignCardProps {
  campaign: Campaign;
  viewMode?: "admin" | "donor";
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  onToggleStatus?: (id: number, currentStatus: string) => void;
  onShare?: (id: number) => void;
}

export const CampaignCard = ({
  campaign,
  viewMode = "admin",
  onEdit,
  onDelete,
  onToggleStatus,
  onShare,
}: CampaignCardProps) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  const [showDonationsModal, setShowDonationsModal] = useState(false);

  // Calculate progress percentage
  const progressPercentage = Math.min(
    Math.round((campaign.amountRaised / campaign.goal) * 100),
    100
  );

  // Calculate days left
  const daysLeft = Math.max(
    0,
    Math.ceil(
      (new Date(campaign.endDate).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );

  // Status badge configuration
  const statusConfig = {
    active: {
      label: "Active",
      color: "bg-green-500 hover:bg-green-600",
      tooltip: "Campaign is active and accepting donations",
    },
    completed: {
      label: "Completed",
      color: "bg-blue-500 hover:bg-blue-600",
      tooltip: "Campaign has reached its goal",
    },
    draft: {
      label: "Draft",
      color: "bg-yellow-500 hover:bg-yellow-600",
      tooltip: "Campaign is in draft mode",
    },
    expired: {
      label: "Expired",
      color: "bg-red-500 hover:bg-red-600",
      tooltip: "Campaign has ended",
    },
  };

  const currentStatus = statusConfig[campaign.status];

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Default banner image
  const fallbackBanner = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='400'%3E%3Crect fill='%23f0f0f0' width='800' height='400'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='40' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3ECampaign Banner%3C/text%3E%3C/svg%3E";
  const bannerUrl = campaign.bannerImage && !imageError
    ? buildStorageUrl(campaign.bannerImage) || fallbackBanner
    : fallbackBanner;

  return (
    <>
    <Card className="group h-full flex flex-col overflow-hidden hover:shadow-xl transition-all duration-300 border-border/40 bg-card">
      {/* Banner Image Section */}
      <div className="relative h-44 md:h-48 overflow-hidden bg-muted">
        <img
          src={bannerUrl}
          alt={campaign.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => setImageError(true)}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <Badge
            className={`${currentStatus.color} text-white border-0 shadow-lg px-3 py-1 text-xs font-semibold`}
            title={currentStatus.tooltip}
          >
            {currentStatus.label}
          </Badge>
        </div>

        {/* Admin Actions Dropdown */}
        {viewMode === "admin" && (
          <div className="absolute top-3 right-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 bg-white dark:bg-gray-900 hover:bg-white dark:hover:bg-gray-800 shadow-lg backdrop-blur-sm border border-gray-200 dark:border-gray-700"
                >
                  <MoreVertical className="h-4 w-4 text-gray-900 dark:text-white" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onEdit?.(campaign.id)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Campaign
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onToggleStatus?.(campaign.id, campaign.status)}
                >
                  {campaign.status === "active" ? (
                    <>
                      <Pause className="mr-2 h-4 w-4" />
                      Pause Campaign
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Activate Campaign
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onShare?.(campaign.id)}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Campaign
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowDonationsModal(true)}>
                  <Heart className="mr-2 h-4 w-4" />
                  View Donations
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete?.(campaign.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Campaign
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Content Section */}
      <CardHeader className="pb-3 min-h-[120px]">
        <h3 className="text-xl font-bold text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
          {campaign.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {campaign.description}
        </p>
      </CardHeader>

      <CardContent className="space-y-4 flex flex-col flex-1">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-medium">Progress</span>
            <span className="text-primary font-bold text-base">
              {progressPercentage}%
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2.5" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          {/* Left Column */}
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Raised</p>
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(campaign.amountRaised)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Donors</p>
                <p className="text-base font-semibold text-foreground">
                  {campaign.donorsCount}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <Target className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Goal</p>
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(campaign.goal)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Days Left</p>
                <p className="text-base font-semibold text-foreground">
                  {daysLeft > 0 ? daysLeft : "Ended"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 mt-auto">
          {viewMode === "admin" ? (
            <>
              <Button
                variant="outline"
                className="flex-1 h-10"
                onClick={() => navigate(`/campaigns/${campaign.id}`)}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Campaign
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-10"
                onClick={() => setShowDonationsModal(true)}
              >
                <Heart className="mr-2 h-4 w-4" />
                View Donations
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="default"
                className="flex-1 h-10 bg-primary hover:bg-primary/90"
                onClick={() => navigate(`/donor/campaigns/${campaign.id}/donate`)}
              >
                <Heart className="mr-2 h-4 w-4" />
                Donate Now
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-10"
                onClick={() => navigate(`/campaigns/${campaign.id}`)}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>

    {/* Donations Modal */}
    <DonationsModal
      open={showDonationsModal}
      onOpenChange={setShowDonationsModal}
      campaignId={campaign.id}
      campaignTitle={campaign.title}
    />
  </>
  );
};
