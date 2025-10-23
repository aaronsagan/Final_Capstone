import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Calendar, Shield, MapPin, Phone, CreditCard, Activity, Heart, TrendingUp, Building2, FileText, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Donation {
  id: number;
  amount: number | null;
  campaign_title: string;
  charity_name: string;
  created_at: string;
}

interface UserDetail {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  phone?: string;
  location?: string;
  address?: string;
  city?: string;
  province?: string;
  total_donations?: number;
  donation_count?: number;
  campaigns_supported?: number;
  last_login?: string;
  verified?: boolean;
  email_verified_at?: string;
}

interface UserDetailModalProps {
  user: UserDetail | null;
  open: boolean;
  onClose: () => void;
  onAction?: (action: string, userId: number) => void;
}

export const UserDetailModal = ({ user, open, onClose, onAction }: UserDetailModalProps) => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loadingDonations, setLoadingDonations] = useState(false);

  useEffect(() => {
    if (open && user && user.role === 'donor') {
      fetchDonations();
    }
  }, [open, user]);

  const fetchDonations = async () => {
    if (!user) return;
    setLoadingDonations(true);
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/users/${user.id}/donations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDonations(Array.isArray(data) ? data : data?.data || []);
      } else if (response.status === 404) {
        // Endpoint not implemented yet, silently set empty array
        setDonations([]);
      }
    } catch (error) {
      // Network error or endpoint not available, silently set empty array
      setDonations([]);
    } finally {
      setLoadingDonations(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="user-detail-description">
        <DialogHeader>
          <DialogTitle className="text-2xl">User Details</DialogTitle>
          <DialogDescription id="user-detail-description">View comprehensive information about this user</DialogDescription>
        </DialogHeader>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Header Section */}
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold">{user.name}</h3>
              <p className="text-muted-foreground">{user.email}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant={user.role === 'donor' ? 'default' : 'secondary'}>{user.role}</Badge>
                <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>{user.status}</Badge>
                {user.verified && <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Verified</Badge>}
              </div>
            </div>
          </div>

          <Separator />

          {/* Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/10 dark:to-blue-800/5 border border-blue-200/50 dark:border-blue-700/20">
              <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{user.email}</p>
              </div>
            </div>

            {user.phone && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/10 dark:to-emerald-800/5 border border-emerald-200/50 dark:border-emerald-700/20">
                <Phone className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm font-medium">{user.phone}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/10 dark:to-purple-800/5 border border-purple-200/50 dark:border-purple-700/20">
              <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Role</p>
                <p className="text-sm font-medium capitalize">{user.role}</p>
              </div>
            </div>

            {user.location && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-br from-pink-50 to-pink-100/50 dark:from-pink-900/10 dark:to-pink-800/5 border border-pink-200/50 dark:border-pink-700/20">
                <MapPin className="h-5 w-5 text-pink-600 dark:text-pink-400 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="text-sm font-medium">{user.location}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/10 dark:to-amber-800/5 border border-amber-200/50 dark:border-amber-700/20">
              <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Joined</p>
                <p className="text-sm font-medium">{new Date(user.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            {user.last_login && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-br from-cyan-50 to-cyan-100/50 dark:from-cyan-900/10 dark:to-cyan-800/5 border border-cyan-200/50 dark:border-cyan-700/20">
                <Activity className="h-5 w-5 text-cyan-600 dark:text-cyan-400 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Last Login</p>
                  <p className="text-sm font-medium">{new Date(user.last_login).toLocaleString()}</p>
                </div>
              </div>
            )}

            {user.total_donations !== undefined && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/10 dark:to-green-800/5 border border-green-200/50 dark:border-green-700/20">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Donated</p>
                  <p className="text-sm font-medium">₱{(user.total_donations ?? 0).toLocaleString()}</p>
                </div>
              </div>
            )}

            {user.donation_count !== undefined && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-900/10 dark:to-indigo-800/5 border border-indigo-200/50 dark:border-indigo-700/20">
                <Heart className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Donations Made</p>
                  <p className="text-sm font-medium">{user.donation_count}</p>
                </div>
              </div>
            )}

            {user.campaigns_supported !== undefined && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/10 dark:to-orange-800/5 border border-orange-200/50 dark:border-orange-700/20">
                <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Campaigns Supported</p>
                  <p className="text-sm font-medium">{user.campaigns_supported}</p>
                </div>
              </div>
            )}

            {(user.address || user.city || user.province) && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-br from-teal-50 to-teal-100/50 dark:from-teal-900/10 dark:to-teal-800/5 border border-teal-200/50 dark:border-teal-700/20">
                <MapPin className="h-5 w-5 text-teal-600 dark:text-teal-400 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Full Address</p>
                  <p className="text-sm font-medium">{user.address}</p>
                  {(user.city || user.province) && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {[user.city, user.province].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Donation History for Donors */}
          {user.role === 'donor' && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Donation History ({donations.length})
                </h4>
                {loadingDonations ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : donations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4 border rounded-lg">No donations yet</p>
                ) : (
                  <ScrollArea className="h-[200px] rounded-lg border">
                    <div className="p-3 space-y-2">
                      {donations.map((donation) => (
                        <div key={donation.id} className="p-3 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900/20 dark:to-slate-800/10 border border-slate-200/50 dark:border-slate-700/20">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{donation.campaign_title}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <Building2 className="h-3 w-3" />
                                {donation.charity_name}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(donation.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              ₱{(donation.amount ?? 0).toLocaleString()}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </>
          )}

          <Separator />

          {/* Actions */}
          {onAction && (
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={onClose} className="dark:bg-gray-900/50">Close</Button>
              {user.status === 'active' ? (
                <Button variant="destructive" onClick={() => onAction('suspend', user.id)}>Suspend User</Button>
              ) : (
                <Button onClick={() => onAction('activate', user.id)}>Activate User</Button>
              )}
            </div>
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};
