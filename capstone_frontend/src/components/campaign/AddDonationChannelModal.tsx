import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Wallet, Building2, Upload, X, QrCode } from "lucide-react";
import { toast } from "sonner";
import { buildApiUrl, createMultipartHeaders } from "@/lib/api";

interface AddDonationChannelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type ChannelType = "ewallet" | "bank_transfer";

interface FormData {
  type: ChannelType;
  channelSubtype: string;
  accountName: string;
  accountNumber: string;
  label: string;
  qrCode: File | null;
}

export function AddDonationChannelModal({
  open,
  onOpenChange,
  onSuccess,
}: AddDonationChannelModalProps) {
  const [channelType, setChannelType] = useState<ChannelType>("ewallet");
  const [formData, setFormData] = useState<FormData>({
    type: "ewallet",
    channelSubtype: "",
    accountName: "",
    accountNumber: "",
    label: "",
    qrCode: null,
  });
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ewalletOptions = [
    { value: "gcash", label: "GCash" },
    { value: "maya", label: "Maya (formerly PayMaya)" },
    { value: "paymaya", label: "PayMaya" },
  ];

  const handleChannelTypeChange = (type: ChannelType) => {
    setChannelType(type);
    setFormData({
      type,
      channelSubtype: "",
      accountName: "",
      accountNumber: "",
      label: "",
      qrCode: null,
    });
    setQrPreview(null);
    setErrors({});
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setErrors({ ...errors, qrCode: "Please select an image file" });
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setErrors({ ...errors, qrCode: "Image size must be less than 2MB" });
      return;
    }

    setFormData({ ...formData, qrCode: file });
    setErrors({ ...errors, qrCode: "" });

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setQrPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeQrCode = () => {
    setFormData({ ...formData, qrCode: null });
    setQrPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.channelSubtype) {
      newErrors.channelSubtype = channelType === "ewallet" 
        ? "Please select an e-wallet type" 
        : "Bank name is required";
    }

    if (!formData.accountName.trim()) {
      newErrors.accountName = channelType === "ewallet"
        ? "Recipient name is required"
        : "Account name is required";
    }

    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = channelType === "ewallet"
        ? "E-wallet number is required"
        : "Account number is required";
    }

    if (!formData.qrCode) {
      newErrors.qrCode = "QR code image is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = new FormData();

      // Generate label
      const label = channelType === "ewallet"
        ? `${formData.channelSubtype.toUpperCase()} - ${formData.accountName}`
        : `${formData.channelSubtype} - ${formData.accountName}`;

      const typeValue = channelType === "ewallet"
        ? formData.channelSubtype.toLowerCase()
        : "bank";
      submitData.append("type", typeValue);
      submitData.append("label", label);
      submitData.append("account_name", formData.accountName);
      submitData.append("account_number", formData.accountNumber);
      
      if (formData.qrCode) {
        submitData.append("qr_code", formData.qrCode);
      }

      const response = await fetch(buildApiUrl(`/charity/donation-channels`), {
        method: "POST",
        headers: createMultipartHeaders(),
        body: submitData,
      });

      if (response.ok) {
        toast.success("Donation channel added successfully!");
        onSuccess?.();
        handleClose();
      } else {
        // Try JSON first, then fall back to text (e.g., HTML error page)
        let message = "Failed to add donation channel";
        try {
          const error = await response.json();
          message = error?.message || error?.error || message;
        } catch {
          const text = await response.text();
          if (response.status === 401 || response.status === 419) {
            message = "Please sign in again to continue.";
          } else if (text?.startsWith("<!DOCTYPE")) {
            message = "Server returned an HTML error. Please try again after signing in.";
          }
        }
        toast.error(message);
      }
    } catch (error) {
      console.error("Error adding donation channel:", error);
      toast.error("Failed to add donation channel");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      type: "ewallet",
      channelSubtype: "",
      accountName: "",
      accountNumber: "",
      label: "",
      qrCode: null,
    });
    setQrPreview(null);
    setErrors({});
    setChannelType("ewallet");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Add Donation Channel</DialogTitle>
          <DialogDescription>
            Add a new payment method for donors to contribute to this campaign
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {/* Channel Type Selection */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleChannelTypeChange("ewallet")}
              className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                channelType === "ewallet"
                  ? "border-primary bg-primary/10 shadow-lg"
                  : "border-border hover:border-primary/50 hover:bg-accent"
              }`}
            >
              <Wallet className={`h-8 w-8 mx-auto mb-3 ${
                channelType === "ewallet" ? "text-primary" : "text-muted-foreground"
              }`} />
              <p className="font-semibold text-center">E-Wallet</p>
              <p className="text-xs text-muted-foreground text-center mt-1">
                GCash, Maya, etc.
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleChannelTypeChange("bank_transfer")}
              className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                channelType === "bank_transfer"
                  ? "border-primary bg-primary/10 shadow-lg"
                  : "border-border hover:border-primary/50 hover:bg-accent"
              }`}
            >
              <Building2 className={`h-8 w-8 mx-auto mb-3 ${
                channelType === "bank_transfer" ? "text-primary" : "text-muted-foreground"
              }`} />
              <p className="font-semibold text-center">Bank Transfer</p>
              <p className="text-xs text-muted-foreground text-center mt-1">
                Bank account details
              </p>
            </button>
          </div>

          {/* Dynamic Form Fields */}
          <div className="space-y-4">
            {/* E-Wallet Type / Bank Name */}
            <div>
              <Label htmlFor="channelSubtype">
                {channelType === "ewallet" ? "E-Wallet Type" : "Bank Name"} *
              </Label>
              {channelType === "ewallet" ? (
                <Select
                  value={formData.channelSubtype}
                  onValueChange={(value) =>
                    setFormData({ ...formData, channelSubtype: value })
                  }
                >
                  <SelectTrigger className={errors.channelSubtype ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select e-wallet" />
                  </SelectTrigger>
                  <SelectContent>
                    {ewalletOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="channelSubtype"
                  placeholder="e.g., BDO, BPI, Metrobank"
                  value={formData.channelSubtype}
                  onChange={(e) =>
                    setFormData({ ...formData, channelSubtype: e.target.value })
                  }
                  className={errors.channelSubtype ? "border-destructive" : ""}
                />
              )}
              {errors.channelSubtype && (
                <p className="text-sm text-destructive mt-1">{errors.channelSubtype}</p>
              )}
            </div>

            {/* Account/Recipient Name */}
            <div>
              <Label htmlFor="accountName">
                {channelType === "ewallet" ? "Recipient Name" : "Account Name"} *
              </Label>
              <Input
                id="accountName"
                placeholder={channelType === "ewallet" ? "Juan Dela Cruz" : "Juan Dela Cruz"}
                value={formData.accountName}
                onChange={(e) =>
                  setFormData({ ...formData, accountName: e.target.value })
                }
                className={errors.accountName ? "border-destructive" : ""}
              />
              {errors.accountName && (
                <p className="text-sm text-destructive mt-1">{errors.accountName}</p>
              )}
            </div>

            {/* Account/E-Wallet Number */}
            <div>
              <Label htmlFor="accountNumber">
                {channelType === "ewallet" ? "E-Wallet Number" : "Account Number"} *
              </Label>
              <Input
                id="accountNumber"
                placeholder={
                  channelType === "ewallet" ? "09XX XXX XXXX" : "XXXX XXXX XXXX"
                }
                value={formData.accountNumber}
                onChange={(e) =>
                  setFormData({ ...formData, accountNumber: e.target.value })
                }
                className={errors.accountNumber ? "border-destructive" : ""}
              />
              {errors.accountNumber && (
                <p className="text-sm text-destructive mt-1">{errors.accountNumber}</p>
              )}
            </div>

            {/* QR Code Upload */}
            <div>
              <Label htmlFor="qrCode" className="flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                Upload QR Code *
              </Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleFileSelect}
                className="hidden"
              />
              {qrPreview ? (
                <div className="mt-2 relative inline-block">
                  <img
                    src={qrPreview}
                    alt="QR Code Preview"
                    className="w-48 h-48 object-contain border-2 border-border rounded-lg bg-muted"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-8 w-8 rounded-full shadow-lg"
                    onClick={removeQrCode}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full mt-2 h-32 border-dashed ${
                    errors.qrCode ? "border-destructive" : ""
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm">Click to upload QR code</span>
                    <span className="text-xs text-muted-foreground">
                      JPG, PNG (max 2MB)
                    </span>
                  </div>
                </Button>
              )}
              {errors.qrCode && (
                <p className="text-sm text-destructive mt-1">{errors.qrCode}</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#F2A024] hover:bg-[#E89015]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Channel"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
