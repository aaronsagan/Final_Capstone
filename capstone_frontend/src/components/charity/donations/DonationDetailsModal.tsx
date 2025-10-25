import { useState } from "react";
import { 
  CheckCircle, XCircle, Download, FileText, User, 
  Calendar, DollarSign, CreditCard, MessageSquare, X
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Donation } from "@/services/donations";

interface DonationDetailsModalProps {
  donation: Donation | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (id: number) => void;
  onReject: (id: number, reason: string) => void;
  onRefresh: () => void;
}

export default function DonationDetailsModal({
  donation,
  open,
  onClose,
  onConfirm,
  onReject,
  onRefresh,
}: DonationDetailsModalProps) {
  const [isRejectMode, setIsRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!donation) return null;

  const handleConfirm = async () => {
    try {
      setSubmitting(true);
      await onConfirm(donation.id);
      toast.success("Donation confirmed successfully");
      onClose();
      onRefresh();
    } catch (error) {
      toast.error("Failed to confirm donation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    try {
      setSubmitting(true);
      await onReject(donation.id, rejectReason);
      toast.success("Donation rejected");
      setIsRejectMode(false);
      setRejectReason("");
      onClose();
      onRefresh();
    } catch (error) {
      toast.error("Failed to reject donation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddNote = () => {
    if (!adminNote.trim()) {
      toast.error("Please enter a note");
      return;
    }
    // TODO: API call to add admin note
    toast.success("Note added successfully");
    setAdminNote("");
  };

  const handleDownloadProof = () => {
    if (donation.proof_path) {
      // TODO: Implement proof download
      toast.info("Downloading proof of payment...");
    }
  };

  const handleDownloadReceipt = () => {
    // TODO: Implement receipt download
    toast.info("Generating receipt...");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">Pending</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300">Completed</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Donation Details</span>
            {getStatusBadge(donation.status)}
          </DialogTitle>
          <DialogDescription>
            Transaction ID: #{donation.id.toString().padStart(6, '0')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Donor Information */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Donor Information
            </h3>
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <Label className="text-xs text-muted-foreground">Name</Label>
                <p className="font-medium">
                  {donation.is_anonymous ? (
                    <span className="italic text-muted-foreground">Anonymous Donor</span>
                  ) : (
                    donation.donor?.name || "Unknown"
                  )}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <p className="font-medium">
                  {donation.is_anonymous ? (
                    <span className="italic text-muted-foreground">Hidden</span>
                  ) : (
                    donation.donor?.email || "N/A"
                  )}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Donation Details */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Donation Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <Label className="text-xs text-muted-foreground">Amount</Label>
                <p className="text-2xl font-bold text-primary">
                  ₱{Number(donation.amount).toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <Label className="text-xs text-muted-foreground">Campaign</Label>
                <p className="font-medium">
                  {donation.campaign?.title || (
                    <span className="text-muted-foreground">General Donation</span>
                  )}
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Date & Time
                </Label>
                <p className="font-medium">
                  {new Date(donation.donated_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(donation.donated_at).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <CreditCard className="h-3 w-3" />
                  Payment Method
                </Label>
                <p className="font-medium capitalize">
                  {donation.proof_type || "Not specified"}
                </p>
              </div>
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-xs text-muted-foreground">Purpose</Label>
                <p className="capitalize">{donation.purpose}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Recurring</Label>
                <p>{donation.is_recurring ? `Yes (${donation.recurring_type})` : 'No'}</p>
              </div>
              {donation.external_ref && (
                <div>
                  <Label className="text-xs text-muted-foreground">External Reference</Label>
                  <p className="font-mono text-xs">{donation.external_ref}</p>
                </div>
              )}
              {donation.receipt_no && (
                <div>
                  <Label className="text-xs text-muted-foreground">Receipt Number</Label>
                  <p className="font-mono text-xs">{donation.receipt_no}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Proof of Payment */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Proof of Payment
            </h3>
            <div className="p-4 border rounded-lg bg-muted/30">
              {donation.proof_path ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Payment proof uploaded</p>
                        <p className="text-xs text-muted-foreground">{donation.proof_path}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleDownloadProof}>
                      <Download className="h-4 w-4 mr-2" />
                      View/Download
                    </Button>
                  </div>
                  {/* TODO: Add image preview if it's an image */}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No proof of payment uploaded
                </p>
              )}
            </div>
          </div>

          {/* Admin Notes Section */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              Admin Notes
            </h3>
            <div className="space-y-2">
              <Textarea
                placeholder="Add internal notes (visible to admins only)..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={3}
              />
              <Button variant="outline" size="sm" onClick={handleAddNote}>
                Add Note
              </Button>
            </div>
            {/* TODO: Display existing notes */}
          </div>

          {/* Reject Mode */}
          {isRejectMode && (
            <div className="space-y-3 p-4 border-2 border-destructive rounded-lg bg-destructive/5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-destructive">Reject Donation</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsRejectMode(false);
                    setRejectReason("");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reject-reason">Rejection Reason *</Label>
                <Textarea
                  id="reject-reason"
                  placeholder="e.g., Invalid proof of payment, duplicate submission, suspicious activity..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                />
              </div>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={submitting || !rejectReason.trim()}
                className="w-full"
              >
                {submitting ? "Rejecting..." : "Confirm Rejection"}
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 flex-1">
            <Button variant="outline" onClick={handleDownloadReceipt} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download Receipt
            </Button>
          </div>
          
          {donation.status === 'pending' && !isRejectMode && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsRejectMode(true)}
                className="text-destructive hover:text-destructive"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button onClick={handleConfirm} disabled={submitting}>
                <CheckCircle className="h-4 w-4 mr-2" />
                {submitting ? "Confirming..." : "Confirm Donation"}
              </Button>
            </div>
          )}
          
          {donation.status !== 'pending' && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
