import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Pencil } from "lucide-react";
import { 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  ShieldCheck,
  CheckCircle2,
  FileText,
  ExternalLink,
  User,
  Facebook,
  Instagram,
  Linkedin,
  Youtube
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileSidebarProps {
  charity: {
    name?: string;
    email?: string;
    contact_email?: string;
    primary_email?: string;
    phone?: string;
    contact_phone?: string;
    primary_phone?: string;
    website?: string;
    website_url?: string;
    address?: string;
    full_address?: string;
    municipality?: string;
    province?: string;
    is_verified?: boolean;
    verification_status?: string;
    registration_number?: string;
    created_at?: string;
    facebook_url?: string;
    instagram_url?: string;
    twitter_url?: string;
    linkedin_url?: string;
    youtube_url?: string;
    operating_hours?: string;
    is_email_verified?: boolean;
    is_phone_verified?: boolean;
    logo_path?: string;
    owner?: { name?: string; email?: string };
    first_name?: string;
    middle_initial?: string;
    last_name?: string;
    primary_first_name?: string;
    primary_middle_initial?: string;
    primary_last_name?: string;
  };
  insights?: never;
  onEditContact?: () => void;
  onEditSocial?: () => void;
}

export function ProfileSidebar({ charity, onEditContact, onEditSocial }: ProfileSidebarProps) {
  const navigate = useNavigate();
  // Check all possible field name variations (registration uses primary_email/primary_phone)
  const email = charity.email || (charity as any).contact_email || (charity as any).primary_email;
  const phone = charity.phone || (charity as any).contact_phone || (charity as any).primary_phone;
  const website = charity.website || (charity as any).website_url;
  const adminName = (
    charity.owner?.name ||
    [charity.first_name, charity.middle_initial, charity.last_name].filter(Boolean).join(' ').trim() ||
    [charity.primary_first_name, charity.primary_middle_initial, charity.primary_last_name].filter(Boolean).join(' ').trim()
  );
  
  // Debug logging
  console.log('📧 ProfileSidebar charity data:', {
    email,
    contact_email: (charity as any).contact_email,
    primary_email: (charity as any).primary_email,
    phone,
    contact_phone: (charity as any).contact_phone,
    primary_phone: (charity as any).primary_phone,
    address: charity.address,
    full_address: (charity as any).full_address,
    website,
    operating_hours: charity.operating_hours
  });
  
  return (
    <aside className="space-y-6">
      {/* Contact Information */}
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">Contact Information</h3>
              <CardDescription>Get in touch with us</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
              aria-label="Edit Contact Information"
              onClick={() => {
                if (onEditContact) {
                  onEditContact();
                } else {
                  window.dispatchEvent(new CustomEvent('open-contact-edit'));
                }
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Admin Name */}
          {adminName && (
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Admin Name</p>
                <p className="text-sm font-medium break-words">{adminName}</p>
              </div>
            </div>
          )}
          {/* Charity Name */}
          {charity.name && (
            <div className="flex items-start gap-3">
              <Avatar className="h-5 w-5 mt-0.5">
                <AvatarImage src={charity.logo_path || ''} />
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                  {(charity.name || 'CH').substring(0,2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Charity Name</p>
                <p className="text-sm font-medium break-words">{charity.name}</p>
              </div>
            </div>
          )}

          {/* Email */}
          {email && (
            <a 
              href={`mailto:${email}`}
              className="flex items-start gap-3 group hover:text-primary transition-colors"
            >
              <Mail className="h-5 w-5 text-primary mt-0.5 group-hover:scale-110 transition-transform" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground mb-1">Email address</p>
                  {charity.is_email_verified && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center gap-1 text-[11px] text-green-600 dark:text-green-400 font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Verified
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>This contact detail has been verified by the platform.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                <p className="text-sm font-medium break-words group-hover:underline">
                  {email}
                </p>
              </div>
            </a>
          )}
          
          {/* Phone */}
          {phone && (
            <a 
              href={`tel:${phone}`}
              className="flex items-start gap-3 group hover:text-primary transition-colors"
            >
              <Phone className="h-5 w-5 text-primary mt-0.5 group-hover:scale-110 transition-transform" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground mb-1">Contact number</p>
                  {charity.is_phone_verified && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center gap-1 text-[11px] text-green-600 dark:text-green-400 font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Verified
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>This contact detail has been verified by the platform.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                <p className="text-sm font-medium group-hover:underline">{phone}</p>
              </div>
            </a>
          )}
          
          {/* Address */}
          {(charity.address || (charity as any).full_address) && (
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Address</p>
                <p className="text-sm font-medium leading-relaxed">
                  {charity.address || (charity as any).full_address}
                </p>
              </div>
            </div>
          )}

          {/* Operating hours */}
          {charity.operating_hours && (
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Operating hours</p>
                <p className="text-sm font-medium leading-relaxed">
                  {charity.operating_hours}
                </p>
              </div>
            </div>
          )}

          {/* Website */}
          {website && (
            <a 
              href={(website || '').startsWith('http') ? website : `https://${website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 group hover:text-primary transition-colors"
            >
              <Globe className="h-5 w-5 text-primary mt-0.5 group-hover:scale-110 transition-transform" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Website</p>
                <p className="text-sm font-medium break-all group-hover:underline">
                  {website}
                </p>
              </div>
            </a>
          )}
        </CardContent>
      </Card>

      {/* Social Profiles (placed between Contact and Verification) */}
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">Social Profiles</h3>
              <CardDescription>Connect with us</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
              aria-label="Edit Social Profiles"
              onClick={() => {
                if (onEditSocial) {
                  onEditSocial();
                } else {
                  window.dispatchEvent(new CustomEvent('open-social-edit'));
                }
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {charity.facebook_url || charity.instagram_url || charity.twitter_url || charity.linkedin_url || charity.youtube_url ? (
            <>
              {charity.facebook_url && (
                <a 
                  href={charity.facebook_url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center gap-3 group transition-all duration-200 rounded-xl px-4 py-3 bg-gradient-to-r from-blue-500/10 to-blue-600/10 hover:from-blue-500/20 hover:to-blue-600/20 border border-blue-500/20 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/10"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500 text-white group-hover:scale-110 transition-transform">
                    <Facebook className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground group-hover:text-blue-500 transition-colors">Facebook</p>
                    <p className="text-xs text-muted-foreground truncate">{charity.facebook_url.replace(/^https?:\/\/(www\.)?/, '')}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all" />
                </a>
              )}
              {charity.instagram_url && (
                <a 
                  href={charity.instagram_url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center gap-3 group transition-all duration-200 rounded-xl px-4 py-3 bg-gradient-to-r from-pink-500/10 to-purple-600/10 hover:from-pink-500/20 hover:to-purple-600/20 border border-pink-500/20 hover:border-pink-500/40 hover:shadow-lg hover:shadow-pink-500/10"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 text-white group-hover:scale-110 transition-transform">
                    <Instagram className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground group-hover:text-pink-500 transition-colors">Instagram</p>
                    <p className="text-xs text-muted-foreground truncate">{charity.instagram_url.replace(/^https?:\/\/(www\.)?/, '')}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-pink-500 opacity-0 group-hover:opacity-100 transition-all" />
                </a>
              )}
              {charity.twitter_url && (
                <a 
                  href={charity.twitter_url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center gap-3 group transition-all duration-200 rounded-xl px-4 py-3 bg-gradient-to-r from-slate-700/10 to-slate-900/10 hover:from-slate-700/20 hover:to-slate-900/20 border border-slate-600/20 hover:border-slate-600/40 hover:shadow-lg hover:shadow-slate-600/10"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black text-white group-hover:scale-110 transition-transform">
                    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">X (Twitter)</p>
                    <p className="text-xs text-muted-foreground truncate">{charity.twitter_url.replace(/^https?:\/\/(www\.)?/, '')}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-slate-700 dark:group-hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-all" />
                </a>
              )}
              {charity.linkedin_url && (
                <a 
                  href={charity.linkedin_url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center gap-3 group transition-all duration-200 rounded-xl px-4 py-3 bg-gradient-to-r from-blue-600/10 to-blue-800/10 hover:from-blue-600/20 hover:to-blue-800/20 border border-blue-600/20 hover:border-blue-600/40 hover:shadow-lg hover:shadow-blue-600/10"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white group-hover:scale-110 transition-transform">
                    <Linkedin className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground group-hover:text-blue-600 transition-colors">LinkedIn</p>
                    <p className="text-xs text-muted-foreground truncate">{charity.linkedin_url.replace(/^https?:\/\/(www\.)?/, '')}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all" />
                </a>
              )}
              {charity.youtube_url && (
                <a 
                  href={charity.youtube_url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center gap-3 group transition-all duration-200 rounded-xl px-4 py-3 bg-gradient-to-r from-red-500/10 to-red-700/10 hover:from-red-500/20 hover:to-red-700/20 border border-red-500/20 hover:border-red-500/40 hover:shadow-lg hover:shadow-red-500/10"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-600 text-white group-hover:scale-110 transition-transform">
                    <Youtube className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground group-hover:text-red-600 transition-colors">YouTube</p>
                    <p className="text-xs text-muted-foreground truncate">{charity.youtube_url.replace(/^https?:\/\/(www\.)?/, '')}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all" />
                </a>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <div className="flex justify-center gap-2 mb-3 opacity-30">
                <Facebook className="h-6 w-6" />
                <Instagram className="h-6 w-6" />
                <Linkedin className="h-6 w-6" />
              </div>
              <p className="text-sm text-muted-foreground">No social profiles added yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Connect your social media to reach more donors</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verification & Compliance */}
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardHeader>
          <h3 className="font-bold text-lg">Verification & Compliance</h3>
          <CardDescription>Trust and transparency</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(charity.is_verified || charity.verification_status === 'approved') && (
            <div className="flex items-center gap-2 text-green-500">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">Verified Organization</span>
            </div>
          )}
          {charity.registration_number && (
            <div className="flex items-start gap-3">
              <FileText className="h-4 w-4 text-primary mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Registration Number</p>
                <p className="text-sm font-medium">{charity.registration_number}</p>
              </div>
            </div>
          )}
          {charity.created_at && (
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-4 w-4 text-primary mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">On Platform Since</p>
                <p className="text-sm font-medium">{new Date(charity.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </aside>
  );
}
