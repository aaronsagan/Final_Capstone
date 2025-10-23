import { ArrowLeft, Edit, Share2, MoreVertical, CheckCircle, MapPin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProfileHeaderProps {
  charity: {
    name: string;
    acronym?: string;
    tagline?: string;
    mission?: string;
    logo_path?: string;
    cover_image?: string;
    banner_path?: string;
    is_verified?: boolean;
    verification_status?: string;
    municipality?: string;
    province?: string;
  };
  logoUrl: string | null;
  coverUrl: string | null;
  onEdit: () => void;
  onShare: () => void;
  onBack: () => void;
  onProfileClick?: () => void;
  onCoverClick?: () => void;
}

export function ProfileHeader({ 
  charity, 
  logoUrl, 
  coverUrl, 
  onEdit, 
  onShare, 
  onBack,
  onProfileClick,
  onCoverClick
}: ProfileHeaderProps) {
  return (
    <div className="relative bg-gradient-to-br from-orange-50/30 via-pink-50/20 to-blue-50/30 dark:from-orange-950/10 dark:via-pink-950/10 dark:to-blue-950/10">
      {/* Breadcrumb / Back Button */}
      <div className="container mx-auto px-4 lg:px-8 pt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md backdrop-blur-sm"
          aria-label="Back to Updates"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Updates
        </Button>
      </div>

      {/* Cover Photo with Side Margins - Personal Profile Style */}
      <div className="container mx-auto px-4 lg:px-8 pt-4 pb-16">
        <div 
          className="relative h-[280px] lg:h-[340px] rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-orange-100/50 via-pink-100/40 to-blue-100/50 dark:from-orange-900/20 dark:via-pink-900/20 dark:to-blue-900/20 cursor-pointer group transition-transform hover:scale-[1.01] duration-200"
          onClick={onCoverClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onCoverClick?.()}
        >
          {coverUrl ? (
            <img 
              src={coverUrl} 
              alt={`${charity.name} cover`}
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center relative">
              {/* Decorative background pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-200/40 via-pink-200/30 to-blue-200/40 dark:from-orange-800/20 dark:via-pink-800/20 dark:to-blue-800/20" />
              <div className="absolute inset-0 opacity-10">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="hearts" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                      <path d="M50 70 L30 50 Q20 40 30 30 T50 30 T70 30 Q80 40 70 50 Z" fill="currentColor" opacity="0.1"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#hearts)"/>
                </svg>
              </div>
            </div>
          )}
          
          {/* Subtle gradient overlay - lighter than before */}
          <div className="absolute inset-0 bg-gradient-to-t from-white/40 via-transparent to-transparent dark:from-gray-900/40 group-hover:from-white/50 transition-colors" />
          
          {/* Hover hint */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-medium">
              Click to view or change cover photo
            </div>
          </div>
        </div>
      </div>

      {/* Profile Content - Logo overlaps cover slightly */}
      <div className="container mx-auto px-4 lg:px-8">
        <div className="relative -mt-24 lg:-mt-28">
          <div className="flex flex-col lg:flex-row items-start lg:items-end gap-4 lg:gap-6 lg:pl-6">
            {/* Logo - Slightly overlapping cover bottom, positioned more to the right */}
            <Avatar 
              className="h-32 w-32 lg:h-40 lg:w-40 ring-6 ring-white dark:ring-gray-900 shadow-2xl transition-transform duration-200 hover:scale-105 bg-white dark:bg-gray-800 lg:ml-8 cursor-pointer group"
              onClick={onProfileClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onProfileClick?.()}
            >
              <AvatarImage src={logoUrl || undefined} alt={charity.name} />
              <AvatarFallback className="text-4xl lg:text-5xl font-bold bg-gradient-to-br from-[#F2A024] to-orange-500 text-white">
                {charity.acronym || charity.name?.substring(0, 2).toUpperCase() || 'HK'}
              </AvatarFallback>
              {/* Hover hint overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-sm rounded-full">
                <span className="text-white text-xs font-medium text-center px-2">Click to view</span>
              </div>
            </Avatar>

            {/* Info & Actions - Better spacing */}
            <div className="flex-1 pb-2 w-full">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                {/* Left: Name & Info */}
                <div className="flex-1 pt-0">
                  <h1 className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight leading-tight mb-1">
                    {charity.name}
                  </h1>
                  
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {(charity.verification_status === 'approved' || charity.is_verified) && (
                      <Badge className="bg-green-500 hover:bg-green-600 text-white border-0 flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium">
                        <CheckCircle className="h-4 w-4" />
                        Verified
                      </Badge>
                    )}
                    <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-0 px-3 py-1.5 text-sm font-medium">
                      Community Development
                    </Badge>
                  </div>
                  
                  {charity.municipality && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>
                        {charity.municipality}
                        {charity.province && `, ${charity.province}`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Right: Action Buttons */}
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    onClick={onEdit}
                    className="bg-[#F2A024] hover:bg-[#E89015] text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-150 focus:ring-2 focus:ring-offset-2 focus:ring-[#F2A024]"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={onShare}
                    className="shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                    aria-label="Share profile"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon"
                        className="shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                        aria-label="More options"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={onEdit}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={onShare}>
                        <Share2 className="h-4 w-4 mr-2" />
                        Share Profile
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
