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
  donated_at?: string;
  created_at?: string;
  receipt_no?: string | null;
  charity?: { id: number; name: string };
  charity_id?: number;
  campaign?: { id: number; title: string } | null;
  campaign_id?: number;
  payment_method?: string;
  message?: string;
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
  rawData?: any;
}

export default function DonationHistory() {
  const [donations, setDonations] = useState<DonationRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [donationDetails, setDonationDetails] = useState<any>(null);

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
      const res = await fetch(`${API_URL}/me/donations?include=charity,campaign`, {
        headers: {
          Accept: 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        }
      });
      if (!res.ok) throw new Error('Failed to load donations');
      const payload = await res.json();
      const items: APIDonation[] = payload.data ?? payload; // handle paginate or array
      
      // Process donations with detailed information
      const rows: DonationRow[] = await Promise.all(items.map(async (d) => {
        // Get detailed charity and campaign info if not included
        let charityName = d.charity?.name || 'Unknown Charity';
        let campaignName = d.campaign?.title || 'General Fund';
        
        // If we only have IDs, fetch the details
        if ((!d.charity?.name && d.charity_id) || (!d.campaign?.title && d.campaign_id)) {
          try {
            if (!d.charity?.name && d.charity_id) {
              const charityRes = await fetch(`${API_URL}/charities/${d.charity_id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (charityRes.ok) {
                const charityData = await charityRes.json();
                charityName = charityData.name || charityData.data?.name || charityName;
              }
            }
            
            if (!d.campaign?.title && d.campaign_id) {
              const campaignRes = await fetch(`${API_URL}/campaigns/${d.campaign_id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (campaignRes.ok) {
                const campaignData = await campaignRes.json();
                campaignName = campaignData.title || campaignData.data?.title || campaignName;
              }
            }
          } catch (e) {
            console.error('Error fetching donation details:', e);
          }
        }
        
        return {
          id: d.id,
          charity: charityName,
          campaign: campaignName,
          amount: d.amount,
          date: d.donated_at ?? d.created_at ?? new Date().toISOString(),
          status: d.status,
          type: d.is_recurring ? 'recurring' : 'one-time',
          hasReceipt: !!d.receipt_no && d.status === 'completed',
          rawData: d // Store raw data for details view
        };
      }));
      
      setDonations(rows);
    } catch (e) {
      console.error('Donation fetch error:', e);
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
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
          <span className="h-2 w-2 rounded-full bg-yellow-500 mr-1.5"></span>
          Pending
        </Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
          <span className="h-2 w-2 rounded-full bg-green-500 mr-1.5"></span>
          Completed
        </Badge>;
      case 'scheduled':
        return <Badge variant="outline" className="border-blue-200 text-blue-800 dark:border-blue-800 dark:text-blue-200">
          <span className="h-2 w-2 rounded-full bg-blue-500 mr-1.5"></span>
          Scheduled
        </Badge>;
      case 'rejected':
        return <Badge variant="destructive">
          <span className="h-2 w-2 rounded-full bg-red-500 mr-1.5"></span>
          Rejected
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleViewDetails = async (donation: DonationRow) => {
    setSelectedDonation(donation);
    
    // If we have raw data with full details, use that
    if (donation.rawData) {
      setDonationDetails(donation.rawData);
      setIsDetailsOpen(true);
      return;
    }
    
    // Otherwise, fetch the full donation details
    try {
      const token = authService.getToken();
      const res = await fetch(`${API_URL}/donations/${donation.id}?include=charity,campaign`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setDonationDetails(data.data || data);
      } else {
        // Fallback to basic info if we can't fetch details
        setDonationDetails({
          ...donation,
          charity: { name: donation.charity },
          campaign: { title: donation.campaign }
        });
      }
    } catch (error) {
      console.error('Error fetching donation details:', error);
      // Still show the modal with basic info
      setDonationDetails({
        ...donation,
        charity: { name: donation.charity },
        campaign: { title: donation.campaign }
      });
    } finally {
      setIsDetailsOpen(true);
    }
  };

  // Format amount with peso sign
  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Format date to be more readable
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const renderDonationDetails = () => {
    if (!donationDetails) return null;

    const details = {
      id: donationDetails.id || 'N/A',
      amount: donationDetails.amount ? formatCurrency(parseFloat(donationDetails.amount)) : 'N/A',
      status: donationDetails.status || 'unknown',
      date: donationDetails.donated_at || donationDetails.created_at ? 
        formatDate(donationDetails.donated_at || donationDetails.created_at) : 'N/A',
      paymentMethod: donationDetails.payment_method || 'Not specified',
      isRecurring: donationDetails.is_recurring || false,
      receiptNo: donationDetails.receipt_no || 'Not available',
      charity: typeof donationDetails.charity === 'object' ? donationDetails.charity.name : (donationDetails.charity || 'Unknown Charity'),
      campaign: typeof donationDetails.campaign === 'object' ? donationDetails.campaign.title : (donationDetails.campaign || 'General Fund'),
      message: donationDetails.message || 'No message provided'
    };

    return (
    <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Donation Details</DialogTitle>
          <DialogDescription>
            Transaction ID: {details.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Summary Card */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="text-2xl font-bold">{details.amount}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="mt-1">{getStatusBadge(details.status)}</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">Recipient</p>
              <p className="font-medium">{details.charity}</p>
              {details.campaign && details.campaign !== 'General Fund' && (
                <p className="text-sm text-muted-foreground">Campaign: {details.campaign}</p>
              )}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium">{details.date}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payment Method</p>
              <p className="font-medium capitalize">{details.paymentMethod.toLowerCase()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <p className="font-medium">{details.isRecurring ? 'Recurring' : 'One-time'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Receipt #</p>
              <p className="font-medium">{details.receiptNo}</p>
            </div>
          </div>

          {/* Donation Message */}
          {details.message && details.message !== 'No message provided' && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Your Message</p>
              <div className="bg-muted/50 p-3 rounded-md">
                <p className="text-sm">{details.message}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
            Close
          </Button>
          {details.status === 'completed' && (
            <Button onClick={() => downloadReceipt(details.id)}>
              <Download className="mr-2 h-4 w-4" />
              Download Receipt
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
    );
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
              {formatCurrency(totalDonated)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {completedDonations.length} completed donations
            </p>
          </CardContent>
        </Card>
        {/* ... */}
      </div>

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
                <TableHead>Charity & Campaign</TableHead>
                <TableHead className="text-right">Amount</TableHead>
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
                  <TableCell className="font-medium">
                    <div className="font-semibold">{donation.charity}</div>
                    <div className="text-xs text-muted-foreground">{donation.campaign}</div>
                    <Badge variant="outline" className="capitalize mt-1" size="sm">
                      {donation.type === 'recurring' ? 'Recurring' : 'One-time'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="font-bold text-lg">{formatCurrency(donation.amount)}</div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(donation.status)}
                  </TableCell>
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
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadReceipt(donation.id);
                          }}
                        >
                          <Download className="h-4 w-4" />
                          <span className="sr-only">Download Receipt</span>
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

      {/* Donation Details Modal */}
      {renderDonationDetails()}
    </div>
  </div>
  );
}
