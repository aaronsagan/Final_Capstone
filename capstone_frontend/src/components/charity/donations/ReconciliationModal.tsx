import { useState } from "react";
import { CheckCircle, AlertCircle, Link2, X } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Donation } from "@/services/donations";

interface ReconciliationModalProps {
  open: boolean;
  onClose: () => void;
  donations: Donation[];
}

interface BankTransaction {
  id: string;
  date: string;
  amount: number;
  reference: string;
  description: string;
  matched: boolean;
}

export default function ReconciliationModal({
  open,
  onClose,
  donations,
}: ReconciliationModalProps) {
  const [selectedDonation, setSelectedDonation] = useState<number | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Array<{ donationId: number; transactionId: string }>>([]);

  // Mock bank transactions - in real app, this would come from API
  const [bankTransactions] = useState<BankTransaction[]>([
    {
      id: 'BNK001',
      date: new Date().toISOString(),
      amount: 5000,
      reference: 'REF123456',
      description: 'Online Transfer',
      matched: false,
    },
    {
      id: 'BNK002',
      date: new Date().toISOString(),
      amount: 10000,
      reference: 'REF789012',
      description: 'GCash Payment',
      matched: false,
    },
  ]);

  const unmatchedDonations = donations.filter(
    d => d.status === 'pending' && !matchedPairs.some(p => p.donationId === d.id)
  );

  const unmatchedTransactions = bankTransactions.filter(
    t => !matchedPairs.some(p => p.transactionId === t.id)
  );

  const handleMatch = () => {
    if (!selectedDonation || !selectedTransaction) {
      toast.error("Please select both a donation and a transaction to match");
      return;
    }

    setMatchedPairs([...matchedPairs, {
      donationId: selectedDonation,
      transactionId: selectedTransaction,
    }]);

    setSelectedDonation(null);
    setSelectedTransaction(null);
    toast.success("Match created successfully");
  };

  const handleUnmatch = (donationId: number, transactionId: string) => {
    setMatchedPairs(matchedPairs.filter(
      p => !(p.donationId === donationId && p.transactionId === transactionId)
    ));
    toast.info("Match removed");
  };

  const handleApplyReconciliation = () => {
    if (matchedPairs.length === 0) {
      toast.error("No matches to apply");
      return;
    }

    // TODO: API call to apply reconciliation
    toast.success(`Applied ${matchedPairs.length} reconciliation matches`);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            Donation Reconciliation
          </DialogTitle>
          <DialogDescription>
            Match pending donations with bank/processor transactions
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          {/* Left: Unmatched Donations */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Pending Donations</h3>
              <Badge variant="secondary">{unmatchedDonations.length}</Badge>
            </div>
            <ScrollArea className="h-[400px] border rounded-lg p-3">
              <div className="space-y-2">
                {unmatchedDonations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                    <CheckCircle className="h-12 w-12 text-green-600 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      All donations matched!
                    </p>
                  </div>
                ) : (
                  unmatchedDonations.map((donation) => (
                    <div
                      key={donation.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedDonation === donation.id
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedDonation(donation.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={selectedDonation === donation.id}
                              onCheckedChange={() => setSelectedDonation(donation.id)}
                            />
                            <div>
                              <p className="font-medium text-sm">
                                #{donation.id.toString().padStart(6, '0')}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {donation.donor?.name || 'Anonymous'}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 text-sm">
                            <p className="font-bold text-primary">
                              ₱{Number(donation.amount).toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(donation.donated_at).toLocaleDateString()}
                            </p>
                            {donation.external_ref && (
                              <p className="text-xs font-mono text-muted-foreground">
                                Ref: {donation.external_ref}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Right: Bank Transactions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Bank Transactions</h3>
              <Badge variant="secondary">{unmatchedTransactions.length}</Badge>
            </div>
            <ScrollArea className="h-[400px] border rounded-lg p-3">
              <div className="space-y-2">
                {unmatchedTransactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                    <CheckCircle className="h-12 w-12 text-green-600 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      All transactions matched!
                    </p>
                  </div>
                ) : (
                  unmatchedTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedTransaction === transaction.id
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedTransaction(transaction.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={selectedTransaction === transaction.id}
                              onCheckedChange={() => setSelectedTransaction(transaction.id)}
                            />
                            <div>
                              <p className="font-medium text-sm">{transaction.id}</p>
                              <p className="text-xs text-muted-foreground">
                                {transaction.description}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 text-sm">
                            <p className="font-bold text-primary">
                              ₱{Number(transaction.amount).toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(transaction.date).toLocaleDateString()}
                            </p>
                            <p className="text-xs font-mono text-muted-foreground">
                              Ref: {transaction.reference}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Match Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleMatch}
            disabled={!selectedDonation || !selectedTransaction}
            size="lg"
          >
            <Link2 className="h-4 w-4 mr-2" />
            Create Match
          </Button>
        </div>

        {/* Matched Pairs */}
        {matchedPairs.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Matched Pairs</h3>
                <Badge className="bg-green-600">{matchedPairs.length}</Badge>
              </div>
              <ScrollArea className="max-h-[200px]">
                <div className="space-y-2">
                  {matchedPairs.map((pair, index) => {
                    const donation = donations.find(d => d.id === pair.donationId);
                    const transaction = bankTransactions.find(t => t.id === pair.transactionId);
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-green-50 dark:bg-green-950/20">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              Donation #{donation?.id.toString().padStart(6, '0')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              ₱{donation ? Number(donation.amount).toLocaleString() : ''}
                            </p>
                          </div>
                          <Link2 className="h-4 w-4 text-green-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{transaction?.id}</p>
                            <p className="text-xs text-muted-foreground">
                              ₱{transaction ? Number(transaction.amount).toLocaleString() : ''}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleUnmatch(pair.donationId, pair.transactionId)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </>
        )}

        {/* Unmatched Items Warning */}
        {(unmatchedDonations.length > 0 || unmatchedTransactions.length > 0) && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-900 dark:text-amber-100">
                Unmatched Items Remaining
              </p>
              <p className="text-amber-700 dark:text-amber-300">
                {unmatchedDonations.length} donations and {unmatchedTransactions.length} transactions are still unmatched.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleApplyReconciliation}
            disabled={matchedPairs.length === 0}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Apply Reconciliation ({matchedPairs.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
