import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { donationsService, Donation } from "@/services/donations";

// Component imports
import DonationsTable from "./DonationsTable";
import DonationFilters from "./DonationFilters";
import DonationDetailsModal from "./DonationDetailsModal";
import DonationStatsSidebar from "./DonationStatsSidebar";
import ReconciliationModal from "./ReconciliationModal";
import ExportMenu from "./ExportMenu";

export interface DonationFilters {
  status?: string;
  campaign?: string;
  paymentMethod?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  amountMin?: number;
  amountMax?: number;
}

export default function DonationsPage() {
  const { user } = useAuth();
  
  // State management
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  
  // Modal states
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isReconciliationModalOpen, setIsReconciliationModalOpen] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState<DonationFilters>({
    status: 'all',
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDonations, setTotalDonations] = useState(0);

  // Load donations
  useEffect(() => {
    loadDonations();
  }, [currentPage, filters]);

  const loadDonations = async () => {
    try {
      if (!user?.charity?.id) {
        toast.error("No charity found for your account");
        setLoading(false);
        return;
      }

      setLoading(true);
      const response = await donationsService.getCharityDonations(user.charity.id, currentPage);
      
      setDonations(response.data);
      setTotalPages(response.last_page);
      setTotalDonations(response.total);
    } catch (error: any) {
      console.error("Failed to load donations:", error);
      toast.error(error.response?.data?.message || "Failed to load donations");
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleViewDetails = (donation: Donation) => {
    setSelectedDonation(donation);
    setIsDetailsModalOpen(true);
  };

  const handleConfirmDonation = async (donationId: number) => {
    try {
      await donationsService.confirmDonation(donationId, 'completed');
      toast.success("Donation confirmed successfully");
      loadDonations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to confirm donation");
    }
  };

  const handleRejectDonation = async (donationId: number, reason: string) => {
    try {
      await donationsService.updateDonationStatus(donationId, 'rejected', reason);
      toast.success("Donation rejected");
      loadDonations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to reject donation");
    }
  };

  const handleBulkAction = async (action: 'confirm' | 'reject' | 'export') => {
    if (selectedRows.length === 0) {
      toast.error("Please select donations first");
      return;
    }

    // TODO: Implement bulk actions
    toast.info(`Bulk ${action} for ${selectedRows.length} donations`);
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    // TODO: Implement export functionality
    toast.info(`Exporting donations as ${format.toUpperCase()}`);
  };

  const handleFilterChange = (newFilters: DonationFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Calculate stats
  const parseAmount = (amount: any) => {
    if (typeof amount === 'string') {
      const numStr = amount.replace(/[^\d.\-]/g, '');
      return parseFloat(numStr) || 0;
    }
    return typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  };

  const stats = {
    totalReceived: donations
      .filter(d => d.status === 'completed')
      .reduce((sum, d) => sum + parseAmount(d.amount), 0),
    totalThisMonth: donations
      .filter(d => {
        const donationDate = new Date(d.donated_at);
        const now = new Date();
        return donationDate.getMonth() === now.getMonth() && 
               donationDate.getFullYear() === now.getFullYear() &&
               d.status === 'completed';
      })
      .reduce((sum, d) => sum + parseAmount(d.amount), 0),
    pendingCount: donations.filter(d => d.status === 'pending').length,
    confirmedCount: donations.filter(d => d.status === 'completed').length,
    rejectedCount: donations.filter(d => d.status === 'rejected').length,
    averageDonation: donations.length > 0 
      ? donations.reduce((sum, d) => sum + parseAmount(d.amount), 0) / donations.length 
      : 0,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex items-center justify-between px-4 py-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Donations</h1>
            <p className="text-muted-foreground">
              Review, verify, and manage incoming donations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ExportMenu 
              onExport={handleExport}
              selectedCount={selectedRows.length}
              onBulkAction={handleBulkAction}
            />
            <Button onClick={() => toast.info("Log new donation feature coming soon")}>
              <Plus className="h-4 w-4 mr-2" />
              Log New Donation
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left: Filters + Table (3 columns) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Filters */}
            <DonationFilters 
              filters={filters}
              onFilterChange={handleFilterChange}
              totalCount={totalDonations}
            />

            {/* Table */}
            <DonationsTable
              donations={donations}
              loading={loading}
              selectedRows={selectedRows}
              onSelectRows={setSelectedRows}
              onViewDetails={handleViewDetails}
              onConfirm={handleConfirmDonation}
              onReject={(id) => {
                const donation = donations.find(d => d.id === id);
                if (donation) {
                  setSelectedDonation(donation);
                  setIsDetailsModalOpen(true);
                }
              }}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>

          {/* Right: Stats Sidebar (1 column) */}
          <div className="lg:col-span-1">
            <DonationStatsSidebar
              stats={stats}
              donations={donations}
              onOpenReconciliation={() => setIsReconciliationModalOpen(true)}
              onRefresh={loadDonations}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <DonationDetailsModal
        donation={selectedDonation}
        open={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedDonation(null);
        }}
        onConfirm={handleConfirmDonation}
        onReject={handleRejectDonation}
        onRefresh={loadDonations}
      />

      <ReconciliationModal
        open={isReconciliationModalOpen}
        onClose={() => setIsReconciliationModalOpen(false)}
        donations={donations}
      />
    </div>
  );
}
