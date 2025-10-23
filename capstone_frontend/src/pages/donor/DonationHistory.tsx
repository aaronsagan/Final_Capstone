import { useEffect, useState } from "react";
import { Download, Eye, Filter, Calendar, Search, Heart, TrendingUp, Award, DollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { authService } from "@/services/auth";

interface APIDonation {
  id: number;
  amount: number;
  status: 'pending' | 'scheduled' | 'completed' | 'rejected';
  is_recurring: boolean;
  purpose: 'general' | 'project' | 'emergency';
  donated_at: string;
  receipt_no?: string | null;
  charity: { id: number; name: string };
  campaign?: { id: number; title: string } | null;
}

interface DonationRow {
  id: number;
  charity: string;
  campaign: string;
  amount: number;
  date: string;
  status: 'pending' | 'scheduled' | 'completed' | 'rejected';
  type: 'one-time' | 'recurring';
  hasReceipt: boolean;
}

export default function DonationHistory() {
  const [donations, setDonations] = useState<DonationRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDonation, setSelectedDonation] = useState<DonationRow | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      const token = authService.getToken();
      const res = await fetch(`${API_URL}/me/donations`, {
        headers: {
          Accept: 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        }
      });
      if (!res.ok) throw new Error('Failed to load donations');
      const payload = await res.json();
      const items: APIDonation[] = payload.data ?? payload; // handle paginate or array
      const rows: DonationRow[] = items.map((d) => ({
        id: d.id,
        charity: d.charity?.name ?? 'Unknown Charity',
        campaign: d.campaign?.title ?? 'General Fund',
        amount: d.amount,
        date: d.donated_at ?? new Date().toISOString(),
        status: d.status,
        type: d.is_recurring ? 'recurring' : 'one-time',
        hasReceipt: !!d.receipt_no && d.status === 'completed',
      }));
      setDonations(rows);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Unable to fetch donations');
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = async (donationId: number) => {
    try {
      const token = authService.getToken();
      const res = await fetch(`${API_URL}/donations/${donationId}/receipt`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : ''
        }
      });
      if (res.status === 422) {
        const data = await res.json();
        throw new Error(data.message || 'Receipt not available');
      }
      if (!res.ok) throw new Error('Failed to download receipt');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `donation-receipt-${donationId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Receipt download started');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Unable to download receipt');
    }
  };

  const filteredDonations = donations
    .filter(d => filterStatus === "all" || d.status === filterStatus)
    .filter(d => 
      searchQuery === "" ||
      d.charity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.campaign.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const completedDonations = donations.filter(d => d.status === 'completed');
  const totalDonated = completedDonations.reduce((sum, d) => sum + d.amount, 0);
  const totalCampaigns = new Set(donations.map(d => d.campaign)).size;
  const averageDonation = completedDonations.length > 0 
    ? totalDonated / completedDonations.length 
    : 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'completed':
        return <Badge className="bg-green-600">Completed</Badge>;
      case 'scheduled':
        return <Badge variant="outline">Scheduled</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleViewDetails = (donation: DonationRow) => {
    setSelectedDonation(donation);
    setIsDetailsOpen(true);
  };

  return (
    <div>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Heart className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-4xl font-bold">My Donations</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            View and track your donation history and impact
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Donated</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                ₱{totalDonated.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {completedDonations.length} completed donations
              </p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Campaigns Supported</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{totalCampaigns}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across {new Set(donations.map(d => d.charity)).size} charities
              </p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Donations</CardTitle>
                <Heart className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{donations.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {donations.filter(d => d.type === 'recurring').length} recurring
              </p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Average Donation</CardTitle>
                <Award className="h-4 w-4 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">
                ₱{averageDonation.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Per completed donation
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Impact Summary */}
        {completedDonations.length > 0 && (
          <Card className="bg-gradient-to-br from-primary/5 to-background">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Your Impact
              </CardTitle>
              <CardDescription>See how your generosity is making a difference</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Impact Message */}
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-lg font-semibold text-foreground mb-2">
                  🎉 Thank you for your generosity!
                </p>
                <p className="text-muted-foreground">
                  Your donations have supported <span className="font-bold text-primary">{totalCampaigns} campaigns</span> across{" "}
                  <span className="font-bold text-primary">{new Set(donations.map(d => d.charity)).size} charities</span>.
                  You've made a real difference in the lives of those in need!
                </p>
              </div>

              {/* Charity Distribution */}
              <div>
                <h3 className="font-semibold mb-3">Donation Distribution by Charity</h3>
                <div className="space-y-3">
                  {Object.entries(
                    completedDonations.reduce((acc, d) => {
                      acc[d.charity] = (acc[d.charity] || 0) + d.amount;
                      return acc;
                    }, {} as Record<string, number>)
                  )
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([charity, amount]) => {
                      const percentage = (amount / totalDonated) * 100;
                      return (
                        <div key={charity}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{charity}</span>
                            <span className="text-sm text-muted-foreground">
                              ₱{amount.toLocaleString()} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-primary to-primary/60 h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Donations Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Donations</CardTitle>
                <CardDescription>Your complete donation history</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by charity or campaign..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Charity</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDonations.map((donation) => (
                  <TableRow key={donation.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(donation.date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{donation.charity}</TableCell>
                    <TableCell>{donation.campaign}</TableCell>
                    <TableCell className="font-bold text-green-600">
                      ₱{donation.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {donation.type === 'recurring' ? 'Recurring' : 'One-time'}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(donation.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewDetails(donation)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {donation.hasReceipt && (
                          <Button variant="ghost" size="icon" onClick={() => downloadReceipt(donation.id)}>
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Empty State */}
        {filteredDonations.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">
              No donations found matching your criteria.
            </p>
          </Card>
        )}
      </div>

      {/* Donation Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Donation Details</DialogTitle>
            <DialogDescription>Complete information about your donation</DialogDescription>
          </DialogHeader>
          {selectedDonation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Charity</Label>
                  <p className="text-sm font-medium mt-1">{selectedDonation.charity}</p>
                </div>
                <div>
                  <Label>Campaign</Label>
                  <p className="text-sm font-medium mt-1">{selectedDonation.campaign}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Amount</Label>
                  <p className="text-lg font-bold text-green-600 mt-1">
                    ₱{selectedDonation.amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label>Date</Label>
                  <p className="text-sm font-medium mt-1">
                    {new Date(selectedDonation.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <Badge variant="outline" className="capitalize mt-1">
                    {selectedDonation.type}
                  </Badge>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedDonation.status)}</div>
                </div>
              </div>
              {selectedDonation.hasReceipt && (
                <div>
                  <Label>Receipt</Label>
                  <div className="mt-2">
                    <Button variant="outline" size="sm" onClick={() => downloadReceipt(selectedDonation.id)}>
                      <Download className="mr-2 h-4 w-4" />
                      Download Receipt
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
