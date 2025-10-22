import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  ShieldCheck,
  CheckCircle2,
  FileText,
  ExternalLink
} from "lucide-react";

interface ProfileSidebarProps {
  charity: {
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    municipality?: string;
    province?: string;
    is_verified?: boolean;
    verification_status?: string;
    registration_number?: string;
    created_at?: string;
    facebook_url?: string;
    instagram_url?: string;
    twitter_url?: string;
  };
  insights?: never;
}

export function ProfileSidebar({ charity }: ProfileSidebarProps) {
  return (
    <aside className="space-y-6">
      {/* Contact Information */}
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardHeader>
          <h3 className="font-bold text-lg">Contact Information</h3>
          <CardDescription>Get in touch with us</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {charity.email && (
            <a 
              href={`mailto:${charity.email}`}
              className="flex items-start gap-3 group hover:text-primary transition-colors"
            >
              <Mail className="h-5 w-5 text-primary mt-0.5 group-hover:scale-110 transition-transform" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Email</p>
                <p className="text-sm font-medium break-words group-hover:underline">
                  {charity.email}
                </p>
              </div>
            </a>
          )}
          
          {charity.phone && (
            <a 
              href={`tel:${charity.phone}`}
              className="flex items-start gap-3 group hover:text-primary transition-colors"
            >
              <Phone className="h-5 w-5 text-primary mt-0.5 group-hover:scale-110 transition-transform" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Phone</p>
                <p className="text-sm font-medium group-hover:underline">{charity.phone}</p>
              </div>
            </a>
          )}
          
          {charity.website && (
            <a 
              href={charity.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 group hover:text-primary transition-colors"
            >
              <Globe className="h-5 w-5 text-primary mt-0.5 group-hover:scale-110 transition-transform" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Website</p>
                <p className="text-sm font-medium break-all group-hover:underline">
                  {charity.website}
                </p>
              </div>
            </a>
          )}
          
          {charity.address && (
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Address</p>
                <p className="text-sm font-medium leading-relaxed">
                  {charity.address}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Social Profiles (placed between Contact and Verification) */}
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardHeader>
          <h3 className="font-bold text-lg">Social Profiles</h3>
          <CardDescription>Connect with us</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {charity.facebook_url || charity.instagram_url || charity.twitter_url ? (
            <>
              {charity.facebook_url && (
                <a href={charity.facebook_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 group transition-colors rounded-lg px-3 py-2 ring-1 ring-white/10 bg-white/5 hover:bg-white/10">
                  <ExternalLink className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Facebook</p>
                    <p className="text-xs text-muted-foreground truncate">{charity.facebook_url}</p>
                  </div>
                </a>
              )}
              {charity.instagram_url && (
                <a href={charity.instagram_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 group transition-colors rounded-lg px-3 py-2 ring-1 ring-white/10 bg-white/5 hover:bg-white/10">
                  <ExternalLink className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Instagram</p>
                    <p className="text-xs text-muted-foreground truncate">{charity.instagram_url}</p>
                  </div>
                </a>
              )}
              {charity.twitter_url && (
                <a href={charity.twitter_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 group transition-colors rounded-lg px-3 py-2 ring-1 ring-white/10 bg-white/5 hover:bg-white/10">
                  <ExternalLink className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Twitter</p>
                    <p className="text-xs text-muted-foreground truncate">{charity.twitter_url}</p>
                  </div>
                </a>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No social profiles added yet.</p>
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
