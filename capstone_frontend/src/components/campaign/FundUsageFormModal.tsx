import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

interface FundUsageFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: number;
  fundUsage?: any | null;
  onSuccess: () => void;
}

const CATEGORIES = [
  { value: 'supplies', label: '📦 Supplies' },
  { value: 'staffing', label: '👥 Staffing' },
  { value: 'transport', label: '🚚 Transport' },
  { value: 'operations', label: '⚙️ Operations' },
  { value: 'other', label: '📋 Other' },
];

export default function FundUsageFormModal({
  open,
  onOpenChange,
  campaignId,
  fundUsage,
  onSuccess,
}: FundUsageFormModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    category: 'supplies',
    description: '',
    spent_at: new Date().toISOString().split('T')[0],
  });
  const [attachment, setAttachment] = useState<File | null>(null);

  useEffect(() => {
    if (fundUsage) {
      setFormData({
        amount: fundUsage.amount.toString(),
        category: fundUsage.category,
        description: fundUsage.description || '',
        spent_at: fundUsage.spent_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      });
    } else {
      setFormData({
        amount: '',
        category: 'supplies',
        description: '',
        spent_at: new Date().toISOString().split('T')[0],
      });
      setAttachment(null);
    }
  }, [fundUsage, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      const submitData = new FormData();
      submitData.append('amount', formData.amount);
      submitData.append('category', formData.category);
      submitData.append('description', formData.description);
      submitData.append('spent_at', formData.spent_at);
      
      if (attachment) {
        submitData.append('attachment', attachment);
      }

      const url = fundUsage
        ? `${import.meta.env.VITE_API_URL}/fund-usage/${fundUsage.id}`
        : `${import.meta.env.VITE_API_URL}/campaigns/${campaignId}/fund-usage`;

      // For PUT requests with FormData, Laravel needs _method override
      if (fundUsage) {
        submitData.append('_method', 'PUT');
      }

      const response = await fetch(url, {
        method: 'POST', // Always POST for FormData (with _method for PUT)
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || ''}`,
        },
        body: submitData,
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: fundUsage ? "Fund usage updated successfully" : "Fund usage recorded successfully",
        });
        onSuccess();
        onOpenChange(false);
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to save fund usage",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to submit fund usage:', error);
      toast({
        title: "Error",
        description: "Failed to save fund usage",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{fundUsage ? 'Edit' : 'Add'} Fund Usage</DialogTitle>
          <DialogDescription>
            Record how campaign funds were spent. Be transparent with your donors.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₱) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="spent_at">Date Spent *</Label>
            <Input
              id="spent_at"
              type="date"
              max={new Date().toISOString().split('T')[0]}
              value={formData.spent_at}
              onChange={(e) => setFormData({ ...formData, spent_at: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe how the funds were used..."
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Provide details to help donors understand where their money went.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="attachment">Proof of Expense (Optional)</Label>
            <Input
              id="attachment"
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setAttachment(e.target.files?.[0] || null)}
            />
            <p className="text-xs text-muted-foreground">
              Upload a receipt, invoice, or photo as proof. Max 5MB.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : fundUsage ? 'Update' : 'Add Expense'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
