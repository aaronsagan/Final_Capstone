import { useState } from "react";
import { 
  CheckCircle, XCircle, Eye, ChevronDown, ChevronUp, 
  ChevronsUpDown, FileText, Clock
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Donation } from "@/services/donations";
import { cn } from "@/lib/utils";

interface DonationsTableProps {
  donations: Donation[];
  loading: boolean;
  selectedRows: number[];
  onSelectRows: (ids: number[]) => void;
  onViewDetails: (donation: Donation) => void;
  onConfirm: (id: number) => void;
  onReject: (id: number) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

type SortField = 'date' | 'amount' | 'donor' | 'status';
type SortDirection = 'asc' | 'desc';

export default function DonationsTable({
  donations,
  loading,
  selectedRows,
  onSelectRows,
  onViewDetails,
  onConfirm,
  onReject,
  currentPage,
  totalPages,
  onPageChange,
}: DonationsTableProps) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [expandedRows, setExpandedRows] = useState<number[]>([]);

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Sort donations
  const sortedDonations = [...donations].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'date':
        comparison = new Date(a.donated_at).getTime() - new Date(b.donated_at).getTime();
        break;
      case 'amount':
        comparison = Number(a.amount) - Number(b.amount);
        break;
      case 'donor':
        comparison = (a.donor?.name || '').localeCompare(b.donor?.name || '');
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Handle row selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectRows(donations.map(d => d.id));
    } else {
      onSelectRows([]);
    }
  };

  const handleSelectRow = (id: number, checked: boolean) => {
    if (checked) {
      onSelectRows([...selectedRows, id]);
    } else {
      onSelectRows(selectedRows.filter(rowId => rowId !== id));
    }
  };

  // Toggle row expansion
  const toggleRowExpansion = (id: number) => {
    if (expandedRows.includes(id)) {
      setExpandedRows(expandedRows.filter(rowId => rowId !== id));
    } else {
      setExpandedRows([...expandedRows, id]);
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Get payment method badge
  const getPaymentMethodBadge = (method?: string) => {
    if (!method) return <span className="text-muted-foreground text-sm">N/A</span>;
    
    return (
      <Badge variant="outline" className="font-normal">
        {method}
      </Badge>
    );
  };

  // Render sort icon
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ChevronsUpDown className="h-4 w-4 ml-1 text-muted-foreground" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="h-4 w-4 ml-1" />
      : <ChevronDown className="h-4 w-4 ml-1" />;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading donations...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (donations.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <FileText className="h-12 w-12 text-muted-foreground" />
            <div className="text-center">
              <h3 className="font-semibold text-lg">No donations found</h3>
              <p className="text-muted-foreground text-sm">
                Donations will appear here when donors contribute to your campaigns
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedRows.length === donations.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Transaction ID</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('donor')}
                >
                  <div className="flex items-center">
                    Donor
                    <SortIcon field="donor" />
                  </div>
                </TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center">
                    Amount
                    <SortIcon field="amount" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center">
                    Date & Time
                    <SortIcon field="date" />
                  </div>
                </TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    Status
                    <SortIcon field="status" />
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedDonations.map((donation) => (
                <>
                  <TableRow 
                    key={donation.id}
                    className={cn(
                      "hover:bg-muted/50 transition-colors",
                      selectedRows.includes(donation.id) && "bg-muted/30"
                    )}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedRows.includes(donation.id)}
                        onCheckedChange={(checked) => handleSelectRow(donation.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      #{donation.id.toString().padStart(6, '0')}
                    </TableCell>
                    <TableCell className="font-medium">
                      {donation.is_anonymous ? (
                        <span className="text-muted-foreground italic">Anonymous</span>
                      ) : (
                        donation.donor?.name || "Unknown"
                      )}
                    </TableCell>
                    <TableCell>
                      {donation.campaign?.title || (
                        <span className="text-muted-foreground">General Donation</span>
                      )}
                    </TableCell>
                    <TableCell className="font-bold text-primary">
                      ₱{Number(donation.amount).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(donation.donated_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                      <br />
                      <span className="text-xs text-muted-foreground">
                        {new Date(donation.donated_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getPaymentMethodBadge(donation.proof_type)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(donation.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onViewDetails(donation)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {donation.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onConfirm(donation.id)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                              title="Confirm"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onReject(donation.id)}
                              className="text-destructive hover:bg-destructive/10"
                              title="Reject"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  
                  {/* Expanded Row Details */}
                  {expandedRows.includes(donation.id) && (
                    <TableRow>
                      <TableCell colSpan={9} className="bg-muted/30 p-4">
                        <div className="space-y-2 text-sm">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="font-medium">External Ref:</span>{' '}
                              {donation.external_ref || 'N/A'}
                            </div>
                            <div>
                              <span className="font-medium">Receipt No:</span>{' '}
                              {donation.receipt_no || 'N/A'}
                            </div>
                            <div>
                              <span className="font-medium">Purpose:</span>{' '}
                              {donation.purpose}
                            </div>
                            <div>
                              <span className="font-medium">Recurring:</span>{' '}
                              {donation.is_recurring ? 'Yes' : 'No'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t p-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => onPageChange(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
