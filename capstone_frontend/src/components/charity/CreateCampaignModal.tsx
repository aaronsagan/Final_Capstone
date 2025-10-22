import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { campaignService } from "@/services/campaigns";

interface CreateCampaignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  charityId?: number;
  onSuccess?: () => void;
}

export function CreateCampaignModal({ open, onOpenChange, charityId, onSuccess }: CreateCampaignModalProps) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    problem: "",
    solution: "",
    outcome: "",
    targetAmount: "",
    donationType: "one_time" as "one_time" | "recurring",
    status: "draft" as "draft" | "published",
    startDate: "",
    endDate: "",
    image: null as File | null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setForm({
      title: "",
      description: "",
      problem: "",
      solution: "",
      outcome: "",
      targetAmount: "",
      donationType: "one_time",
      status: "draft",
      startDate: "",
      endDate: "",
      image: null,
    });
    setErrors({});
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.description.trim()) e.description = "About this campaign is required";
    if (!form.problem || form.problem.trim().length < 50) e.problem = "Problem must be at least 50 characters";
    if (!form.solution || form.solution.trim().length < 50) e.solution = "Solution must be at least 50 characters";
    if (form.outcome && (form.outcome.trim().length < 30 || form.outcome.trim().length > 300)) e.outcome = "Expected Outcome must be 30–300 characters";
    if (!form.targetAmount || Number(form.targetAmount) <= 0) e.targetAmount = "Target amount must be greater than 0";
    if (form.startDate && form.endDate && new Date(form.endDate) < new Date(form.startDate)) e.endDate = "End date must be after start date";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    try {
      if (!charityId) {
        toast({ title: "Error", description: "Charity not found", variant: "destructive" });
        return;
      }
      if (!validate()) {
        toast({ title: "Fix errors", description: "Please correct the highlighted fields", variant: "destructive" });
        return;
      }
      setSubmitting(true);
      await campaignService.createCampaign(charityId, {
        title: form.title,
        description: form.description,
        target_amount: Number(form.targetAmount),
        donation_type: form.donationType,
        status: form.status,
        start_date: form.startDate || undefined,
        end_date: form.endDate || undefined,
        cover_image: form.image || undefined,
        problem: form.problem,
        solution: form.solution,
        outcome: form.outcome || undefined,
      } as any);
      toast({ title: "Success", description: "Campaign created successfully" });
      onOpenChange(false);
      reset();
      onSuccess && onSuccess();
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.message || "Failed to create campaign", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="sm:max-w-[820px] max-h-[90vh] overflow-y-auto animate-in fade-in-50 zoom-in-95">
        <DialogHeader>
          <DialogTitle>Create New Campaign</DialogTitle>
          <DialogDescription>Provide details for your fundraising campaign</DialogDescription>
        </DialogHeader>

        {/* Basic Info */}
        <div className="grid gap-5 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="cc-title">Campaign Title *</Label>
            <Input id="cc-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g., Education Fund 2025" />
            {errors.title && <p className="text-xs text-destructive mt-1">{errors.title}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cc-about">About This Campaign *</Label>
            <Textarea id="cc-about" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe your campaign goals and impact" />
            {errors.description && <p className="text-xs text-destructive mt-1">{errors.description}</p>}
          </div>

          <Separator />

          {/* Story Fields */}
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cc-problem">The Problem *</Label>
              <Textarea id="cc-problem" rows={4} value={form.problem} onChange={(e) => setForm({ ...form, problem: e.target.value })} placeholder="Explain the problem this campaign addresses (min 50 characters)" />
              {errors.problem && <p className="text-xs text-destructive mt-1">{errors.problem}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cc-solution">The Solution *</Label>
              <Textarea id="cc-solution" rows={4} value={form.solution} onChange={(e) => setForm({ ...form, solution: e.target.value })} placeholder="Describe your solution and plan (min 50 characters)" />
              {errors.solution && <p className="text-xs text-destructive mt-1">{errors.solution}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cc-outcome">Expected Outcome (optional)</Label>
              <Textarea id="cc-outcome" rows={3} value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value })} placeholder="What positive outcomes do you expect? (30–300 characters)" />
              {errors.outcome && <p className="text-xs text-destructive mt-1">{errors.outcome}</p>}
            </div>
          </div>

          <Separator />

          {/* Financials & Media */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cc-target">Target Amount (₱) *</Label>
              <Input id="cc-target" type="number" inputMode="numeric" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} />
              {errors.targetAmount && <p className="text-xs text-destructive mt-1">{errors.targetAmount}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cc-image">Campaign Image</Label>
              <Input id="cc-image" type="file" accept="image/*" onChange={(e) => setForm({ ...form, image: e.target.files?.[0] || null })} />
            </div>
          </div>

          {/* Scheduling */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cc-start">Start Date</Label>
              <Input id="cc-start" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cc-end">End Date</Label>
              <Input id="cc-end" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              {errors.endDate && <p className="text-xs text-destructive mt-1">{errors.endDate}</p>}
            </div>
          </div>

          {/* Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Donation Type *</Label>
              <Select value={form.donationType} onValueChange={(v: any) => setForm({ ...form, donationType: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select donation type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_time">One-Time</SelectItem>
                  <SelectItem value="recurring">Recurring</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status *</Label>
              <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button className="bg-primary hover:bg-primary/90" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Creating..." : "Create Campaign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
