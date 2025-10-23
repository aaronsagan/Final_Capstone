import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Upload, X, Loader2, CheckCircle, Heart, TrendingUp, Target } from "lucide-react";
import { toast } from "sonner";
import { buildApiUrl, buildStorageUrl, getAuthToken } from "@/lib/api";

interface Campaign {
  id: number;
  title: string;
  description: string;
  target_amount: number;
  current_amount: number;
  cover_image_path?: string;
  charity?: {
    name: string;
    logo_path?: string;
  };
}

interface DonationChannel {
  id: number;
  type: string;
  label: string;
  is_active: boolean;
  details?: any;
}

export default function DonateToCampaign() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [channels, setChannels] = useState<DonationChannel[]>([]);

  const [formData, setFormData] = useState({
    donor_name: "",
    donor_email: "",
    amount: "",
    channel_used: "",
    reference_number: "",
    message: "",
    is_anonymous: false,
  });

  const [proofImage, setProofImage] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaignDetails();
    fetchDonationChannels();
  }, [campaignId]);

  const fetchCampaignDetails = async () => {
    try {
      const response = await fetch(buildApiUrl(`/campaigns/${campaignId}`));
      if (!response.ok) throw new Error("Campaign not found");
      const data = await response.json();
      setCampaign(data);
    } catch (error) {
      console.error("Error fetching campaign:", error);
      toast.error("Failed to load campaign details");
      navigate("/donor");
    } finally {
      setLoading(false);
    }
  };

  const fetchDonationChannels = async () => {
    try {
      const response = await fetch(buildApiUrl(`/campaigns/${campaignId}/donation-channels`));
      if (!response.ok) return;
      const data = await response.json();
      const activeChannels = (data.data || data).filter((ch: DonationChannel) => ch.is_active);
      setChannels(activeChannels);
    } catch (error) {
      console.error("Error fetching donation channels:", error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2048 * 1024) {
        toast.error("Image must be less than 2MB");
        return;
      }
      setProofImage(file);
      setProofPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.donor_name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error("Please enter a valid donation amount");
      return;
    }
    if (!formData.channel_used) {
      toast.error("Please select a donation channel");
      return;
    }
    if (!formData.reference_number.trim()) {
      toast.error("Reference number is required");
      return;
    }
    if (!proofImage) {
      toast.error("Please upload proof of donation");
      return;
    }

    setSubmitting(true);

    try {
      const token = getAuthToken();
      if (!token) {
        toast.error("Please login to continue");
        navigate("/auth/login");
        return;
      }

      const submitData = new FormData();
      submitData.append("donor_name", formData.donor_name);
      if (formData.donor_email) submitData.append("donor_email", formData.donor_email);
      submitData.append("amount", formData.amount);
      submitData.append("channel_used", formData.channel_used);
      submitData.append("reference_number", formData.reference_number);
      if (formData.message) submitData.append("message", formData.message);
      submitData.append("is_anonymous", formData.is_anonymous ? "1" : "0");
      submitData.append("proof_image", proofImage);

      const response = await fetch(buildApiUrl(`/campaigns/${campaignId}/donate`), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: submitData,
      });

      if (response.ok) {
        const result = await response.json();
        setSubmitted(true);
        toast.success(result.message || "Donation proof submitted successfully!");
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to submit donation");
      }
    } catch (error) {
      console.error("Error submitting donation:", error);
      toast.error("Failed to submit donation");
    } finally {
      setSubmitting(false);
    }
  };

  const calculateProgress = () => {
    if (!campaign) return 0;
    return Math.min(Math.round((campaign.current_amount / campaign.target_amount) * 100), 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading campaign details...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Campaign not found</p>
            <Button onClick={() => navigate("/donor")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="max-w-2xl mx-auto px-4">
          <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
            <CardContent className="pt-12 pb-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500 mb-6">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Thank You!</h2>
              <p className="text-muted-foreground mb-6">
                Your proof of donation has been submitted for review. The charity will verify your donation shortly.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => navigate("/donor")}>
                  Back to Dashboard
                </Button>
                <Button variant="outline" onClick={() => navigate(`/campaigns/${campaignId}`)}>
                  View Campaign
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Back Button */}
        <Button
          variant="outline"
          className="mb-6 h-10 px-3 border-border/60 bg-background/70 hover:bg-accent hover:text-foreground"
          onClick={() => navigate(`/campaigns/${campaignId}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Campaign
        </Button>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Support This Campaign
          </h1>
          <p className="text-muted-foreground">
            Submit your donation proof and help make a difference
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Campaign Details Sidebar */}
          <div className="lg:col-span-2">
            <Card className="sticky top-4 border-primary/20 shadow-lg">
              <CardContent className="p-6 space-y-4">
                {/* Campaign Image */}
                {campaign.cover_image_path && (
                  <div className="rounded-xl overflow-hidden border border-border/50">
                    <img
                      src={buildStorageUrl(campaign.cover_image_path) || undefined}
                      alt={campaign.title}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <h3 className="text-xl font-bold line-clamp-2">{campaign.title}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Heart className="h-3 w-3 fill-primary text-primary" />
                    {campaign.charity?.name}
                  </p>
                </div>

                <div className="h-px bg-border" />

                {/* Progress */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Campaign Progress</span>
                    <span className="text-lg font-bold text-primary">{calculateProgress()}%</span>
                  </div>
                  <Progress value={calculateProgress()} className="h-3" />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-500" />
                      <p className="text-xs font-medium text-muted-foreground">Raised</p>
                    </div>
                    <p className="text-lg font-bold text-green-600 dark:text-green-500">
                      ₱{campaign.current_amount.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="h-4 w-4 text-primary" />
                      <p className="text-xs font-medium text-muted-foreground">Goal</p>
                    </div>
                    <p className="text-lg font-bold text-primary">
                      ₱{campaign.target_amount.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted/50 border border-border/40">
                  <p className="text-xs text-muted-foreground mb-1">✨ Your Contribution</p>
                  <p className="text-sm leading-relaxed">
                    Every donation makes a difference. Your generosity helps us reach our goal and create lasting impact.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Donation Form */}
          <div className="lg:col-span-3">
            <Card className="border-primary/20 shadow-lg">
              <CardHeader className="space-y-1 pb-6">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Heart className="h-6 w-6 text-primary fill-primary" />
                  Submit Donation Proof
                </CardTitle>
                <CardDescription className="text-base">
                  Fill in your donation details below. The charity will verify your submission.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Donor Information Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <div className="h-5 w-1 bg-primary rounded-full" />
                      Donor Information
                    </h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Name */}
                      <div className="space-y-2">
                        <Label htmlFor="donor_name" className="text-sm font-medium">
                          Full Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="donor_name"
                          value={formData.donor_name}
                          onChange={(e) => setFormData({ ...formData, donor_name: e.target.value })}
                          placeholder="John Doe"
                          className="h-11"
                          required
                        />
                      </div>

                      {/* Email */}
                      <div className="space-y-2">
                        <Label htmlFor="donor_email" className="text-sm font-medium">Email (Optional)</Label>
                        <Input
                          id="donor_email"
                          type="email"
                          value={formData.donor_email}
                          onChange={(e) => setFormData({ ...formData, donor_email: e.target.value })}
                          placeholder="john@example.com"
                          className="h-11"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Donation Details Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <div className="h-5 w-1 bg-primary rounded-full" />
                      Donation Details
                    </h3>

                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Amount */}
                      <div className="space-y-2">
                        <Label htmlFor="amount" className="text-sm font-medium">
                          Amount Donated <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₱</span>
                          <Input
                            id="amount"
                            type="number"
                            min="1"
                            step="0.01"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            placeholder="0.00"
                            className="h-11 pl-7"
                            required
                          />
                        </div>
                      </div>

                      {/* Channel Used */}
                      <div className="space-y-2">
                        <Label htmlFor="channel_used" className="text-sm font-medium">
                          Payment Channel <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={formData.channel_used}
                          onValueChange={(value) => setFormData({ ...formData, channel_used: value })}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                          <SelectContent>
                            {channels.length === 0 ? (
                              <div className="p-2 text-sm text-muted-foreground text-center">
                                No channels available
                              </div>
                            ) : (
                              channels.map((channel) => (
                                <SelectItem key={channel.id} value={channel.label}>
                                  {channel.label} ({channel.type})
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Reference Number */}
                    <div className="space-y-2">
                      <Label htmlFor="reference_number" className="text-sm font-medium">
                        Reference Number <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="reference_number"
                        value={formData.reference_number}
                        onChange={(e) =>
                          setFormData({ ...formData, reference_number: e.target.value })}
                        placeholder="Transaction/Reference number"
                        className="h-11"
                        required
                      />
                      <p className="text-xs text-muted-foreground">Enter the transaction ID from your payment</p>
                    </div>
                  </div>

                  {/* Proof Upload Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <div className="h-5 w-1 bg-primary rounded-full" />
                      Upload Proof of Payment
                    </h3>

                    {/* Proof Image Upload */}
                    <div className="space-y-2">
                      {proofPreview ? (
                        <div className="relative">
                          <img
                            src={proofPreview}
                            alt="Proof preview"
                            className="w-full h-64 object-cover rounded-xl border-2 border-primary/20"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setProofImage(null);
                              setProofPreview(null);
                            }}
                            className="absolute top-3 right-3 p-2 bg-destructive text-white rounded-full hover:bg-destructive/90 shadow-lg"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-xs">
                            ✓ Image uploaded
                          </div>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-primary/30 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
                          <div className="flex flex-col items-center justify-center p-6 text-center">
                            <div className="p-3 rounded-full bg-primary/10 mb-3">
                              <Upload className="h-8 w-8 text-primary" />
                            </div>
                            <p className="text-sm font-medium mb-1">
                              Click to upload receipt or screenshot <span className="text-destructive">*</span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Supported formats: JPG, PNG (Max 2MB)
                            </p>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                            required
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Additional Details Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <div className="h-5 w-1 bg-primary rounded-full" />
                      Additional Details (Optional)
                    </h3>
                    
                    {/* Message */}
                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-sm font-medium">Personal Message</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Share why you're supporting this campaign..."
                        rows={4}
                        className="resize-none"
                      />
                    </div>
                  </div>

                  {/* Anonymous Toggle */}
                  <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                    <div className="flex items-start space-x-3">
                      <Switch
                        id="is_anonymous"
                        checked={formData.is_anonymous}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, is_anonymous: checked })}
                      />
                      <div className="flex-1">
                        <Label htmlFor="is_anonymous" className="font-medium cursor-pointer block mb-1">
                          Make this donation anonymous
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Your name will be hidden from public donation lists and supporters
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate(`/campaigns/${campaignId}`)}
                      disabled={submitting}
                      className="flex-1 h-12"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={submitting} 
                      className="flex-1 h-12 bg-primary hover:bg-primary/90 text-base font-medium"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Heart className="mr-2 h-5 w-5" />
                          Submit Donation Proof
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
