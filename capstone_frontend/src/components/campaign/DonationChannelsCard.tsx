import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, QrCode, Wallet, Building2, Copy, Check } from "lucide-react";
import { buildApiUrl, buildStorageUrl } from "@/lib/api";
import { toast } from "sonner";

interface DonationChannel {
  id: number;
  type: string;
  label: string;
  account_name: string;
  account_number: string;
  qr_code_path?: string;
  qr_code_url?: string;
  is_active: boolean;
}

interface DonationChannelsCardProps {
  campaignId: number;
}

export function DonationChannelsCard({ campaignId }: DonationChannelsCardProps) {
  const [channels, setChannels] = useState<DonationChannel[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    fetchChannels();
  }, [campaignId]);

  const fetchChannels = async () => {
    try {
      const response = await fetch(buildApiUrl(`/campaigns/${campaignId}/donation-channels`));
      if (response.ok) {
        const data = await response.json();
        setChannels(data);
      }
    } catch (error) {
      console.error("Error fetching donation channels:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % channels.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + channels.length) % channels.length);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getChannelIcon = (type: string) => {
    if (type.toLowerCase().includes("bank")) {
      return <Building2 className="h-5 w-5" />;
    }
    return <Wallet className="h-5 w-5" />;
  };

  const getChannelTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      gcash: "GCash",
      maya: "Maya",
      paymaya: "PayMaya",
      bank: "Bank Transfer",
      bank_transfer: "Bank Transfer",
      ewallet: "E-Wallet",
    };
    return typeMap[type.toLowerCase()] || type.toUpperCase();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            Donation Channels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (channels.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            Donation Channels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <QrCode className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              No payment channels available yet
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentChannel = channels[currentIndex];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            Donation Channels
          </CardTitle>
          {channels.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {currentIndex + 1} / {channels.length}
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Current Channel Display */}
        <div className="space-y-4">
          {/* Channel Type Badge */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary">
              {getChannelIcon(currentChannel.type)}
              <span className="text-sm font-semibold">
                {getChannelTypeLabel(currentChannel.type)}
              </span>
            </div>
          </div>

          {/* QR Code Display */}
          {(currentChannel.qr_code_path || currentChannel.qr_code_url) && (
            <div className="flex justify-center mb-4">
              <div className="relative group">
                <img
                  src={currentChannel.qr_code_url || buildStorageUrl(currentChannel.qr_code_path!)}
                  alt="Payment QR Code"
                  className="w-64 h-64 object-contain border-2 border-border rounded-xl bg-white p-4 shadow-lg"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                  <p className="text-white text-sm font-medium">Scan to Pay</p>
                </div>
              </div>
            </div>
          )}

          {/* Account Details */}
          <div className="space-y-3 bg-muted/50 rounded-lg p-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Account Name
              </label>
              <div className="flex items-center justify-between mt-1 group">
                <p className="font-semibold text-foreground">{currentChannel.account_name}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => copyToClipboard(currentChannel.account_name, "name")}
                >
                  {copiedField === "name" ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Account Number
              </label>
              <div className="flex items-center justify-between mt-1 group">
                <p className="font-mono font-semibold text-foreground">
                  {currentChannel.account_number}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => copyToClipboard(currentChannel.account_number, "number")}
                >
                  {copiedField === "number" ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Navigation Arrows */}
          {channels.length > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrev}
                className="rounded-full h-10 w-10 hover:bg-primary hover:text-primary-foreground transition-all"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>

              {/* Dots Indicator */}
              <div className="flex gap-2">
                {channels.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentIndex
                        ? "w-8 bg-primary"
                        : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    }`}
                    aria-label={`Go to channel ${index + 1}`}
                  />
                ))}
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={handleNext}
                className="rounded-full h-10 w-10 hover:bg-primary hover:text-primary-foreground transition-all"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          )}

          {/* Helper Text */}
          <p className="text-xs text-center text-muted-foreground pt-2">
            Scan the QR code or use the account details above to make your donation
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
