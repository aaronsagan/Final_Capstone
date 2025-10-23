import { useEffect, useState } from "react";
import { Heart, Upload, CheckCircle, Gift, Building2, Target, CreditCard, FileText, Sparkles, TrendingUp, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/auth";
import { useAuth } from "@/context/AuthContext";

export default function MakeDonation() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    charityId: "",
    campaignId: "",
    amount: "",
    customAmount: "",
    donationType: "one-time",
    frequency: "monthly",
    message: "",
    isAnonymous: false,
    proofOfPayment: null as File | null,
    channel_used: "",
    reference_number: ""
  });
  const [charities, setCharities] = useState<Array<{ id: number; name: string }>>([]);
  const [campaigns, setCampaigns] = useState<Array<{ id: number; title: string; donation_type?: string }>>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [channels, setChannels] = useState<Array<{ id:number; type:string; label:string; is_active:boolean }>>([]);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchCharities();
  }, []);

  useEffect(() => {
    if (formData.charityId) fetchCampaigns(parseInt(formData.charityId, 10));
    else setCampaigns([]);
  }, [formData.charityId]);

  useEffect(() => {
    // Fetch campaign details and donation channels when a campaign is selected
    if (formData.campaignId && formData.campaignId !== "") {
      if (formData.campaignId === "direct") {
        // For direct donations, fetch charity-level channels
        setSelectedCampaign(null);
        if (formData.charityId) {
          fetchCharityDonationChannels(parseInt(formData.charityId, 10));
        }
      } else {
        const id = parseInt(formData.campaignId, 10);
        if (!isNaN(id)) {
          fetchCampaignDetails(id);
          fetchDonationChannels(id);
        }
      }
    } else {
      setChannels([]);
      setSelectedCampaign(null);
      setFormData(prev => ({ ...prev, channel_used: "", donationType: "one-time" }));
    }
  }, [formData.campaignId]);

  const fetchCharities = async () => {
    try {
      const res = await fetch(`${API_URL}/charities`);
      if (!res.ok) throw new Error('Failed to load charities');
      const data = await res.json();
      // backend returns { charities: { data: [...] } }
      const charitiesArray = data.charities?.data ?? data.charities ?? data.data ?? data;
      setCharities(Array.isArray(charitiesArray) ? charitiesArray : []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Unable to load charities');
    }
  };

  const fetchCampaignDetails = async (campaignId: number) => {
    try {
      const res = await fetch(`${API_URL}/campaigns/${campaignId}`);
      if (!res.ok) return;
      const data = await res.json();
      setSelectedCampaign(data);
      // Auto-set donation type from campaign
      const donationType = data.donation_type === 'recurring' ? 'recurring' : 'one-time';
      setFormData(prev => ({ ...prev, donationType }));
    } catch (e) {
      // silent fail
    }
  };

  const fetchDonationChannels = async (campaignId: number) => {
    try {
      const res = await fetch(`${API_URL}/campaigns/${campaignId}/donation-channels`);
      if (!res.ok) return;
      const data = await res.json();
      const list = (data.data || data || []).filter((c: any) => c.is_active);
      setChannels(list);
    } catch (e) {
      // silent fail
    }
  };

  const fetchCharityDonationChannels = async (charityId: number) => {
    try {
      const res = await fetch(`${API_URL}/charities/${charityId}/donation-channels`);
      if (!res.ok) return;
      const data = await res.json();
      const list = (data.data || data || []).filter((c: any) => c.is_active);
      setChannels(list);
    } catch (e) {
      // silent fail
    }
  };

  const fetchCampaigns = async (charityId: number) => {
    try {
      const res = await fetch(`${API_URL}/charities/${charityId}/campaigns`);
      if (!res.ok) throw new Error('Failed to load campaigns');
      const data = await res.json();
      // backend returns paginated data
      const campaignsArray = data.data ?? data;
      setCampaigns(Array.isArray(campaignsArray) ? campaignsArray : []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Unable to load campaigns');
    }
  };

  const suggestedAmounts = [500, 1000, 2500, 5000, 10000];

  const handleSubmit = async () => {
    if (!formData.charityId || !formData.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const token = authService.getToken();
      if (!token) {
        toast.info('Please log in to donate');
        navigate('/auth/login');
        return;
      }

      // Require campaign selection to ensure channels can be used
      if (!formData.campaignId) {
        toast.error('Please select a campaign to proceed');
        setStep(1);
        return;
      }

      // Validate channel and reference and proof
      if (!formData.channel_used) {
        toast.error('Please select a donation channel');
        return;
      }
      if (!formData.reference_number.trim()) {
        toast.error('Please enter the transaction/reference number');
        return;
      }
      if (!formData.proofOfPayment) {
        toast.error('Please upload proof of payment');
        return;
      }

      // Submit via campaign or charity manual donation endpoint
      const fd = new FormData();
      fd.append('donor_name', user?.name || 'Donor');
      if (user?.email) fd.append('donor_email', user.email);
      fd.append('amount', formData.amount);
      fd.append('channel_used', formData.channel_used);
      fd.append('reference_number', formData.reference_number);
      if (formData.message) fd.append('message', formData.message);
      fd.append('is_anonymous', formData.isAnonymous ? '1' : '0');
      fd.append('proof_image', formData.proofOfPayment);

      const endpoint = formData.campaignId === "direct"
        ? `${API_URL}/charities/${formData.charityId}/donate`
        : `${API_URL}/campaigns/${formData.campaignId}/donate`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to submit donation');
      }

      const result = await res.json();
      toast.success(result.message || 'Donation submitted successfully!');
      
      // Show thank you card instead of navigating
      setSubmitted(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Unable to submit donation');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file (JPG/PNG)');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image must be less than 2MB');
        return;
      }
      setFormData({ ...formData, proofOfPayment: file });
      setProofPreview(URL.createObjectURL(file));
      toast.success("Proof of payment uploaded");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 mb-4">
          <Heart className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">Make a Donation</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Your generosity creates lasting impact. Every contribution matters.</p>
      </div>

      {/* Thank You Card */}
      {submitted ? (
        <div className="flex items-center justify-center">
          <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 max-w-2xl w-full shadow-2xl">
            <CardContent className="pt-12 pb-8 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-green-600 mb-6 shadow-lg">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-3 text-green-700 dark:text-green-400">Thank You for Your Generosity!</h2>
              <p className="text-lg text-muted-foreground mb-2">
                Your donation has been submitted successfully.
              </p>
              <p className="text-muted-foreground mb-8">
                {formData.campaignId === "direct" 
                  ? "Your donation will support the charity's general operations and programs."
                  : "The charity will review your proof of donation and confirm it shortly."}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                <Button 
                  onClick={() => navigate("/donor")}
                  className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                  <Building2 className="mr-2 h-5 w-5" />
                  Back to Dashboard
                </Button>
                {formData.campaignId !== "direct" && (
                  <Button 
                    variant="outline" 
                    onClick={() => navigate(`/campaigns/${formData.campaignId}`)}
                    className="flex-1 h-12 text-base font-semibold border-primary/20"
                  >
                    <Target className="mr-2 h-5 w-5" />
                    View Campaign
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/donor/history")}
                  className="flex-1 h-12 text-base font-semibold border-primary/20"
                >
                  <FileText className="mr-2 h-5 w-5" />
                  My Donations
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
      {/* Progress Steps */}
      <div className="mb-12">
        <div className="relative max-w-3xl mx-auto px-8">
          {/* Connector line - positioned at icon center */}
          <div className="absolute left-0 right-0 top-6 h-0.5 bg-muted" style={{ zIndex: 0 }} />
          <div
            className="absolute left-0 top-6 h-0.5 bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
            style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%', zIndex: 0 }}
          />

          <div className="relative grid grid-cols-3 items-center justify-items-center gap-8" style={{ zIndex: 1 }}>
            {/* Step 1 */}
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all duration-300 cursor-default hover:scale-105 shadow-[0_0_0_4px] shadow-background ${
                  step >= 1
                    ? 'bg-gradient-to-br from-primary to-primary/80 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {step > 1 ? <CheckCircle className="h-6 w-6" /> : <Building2 className="h-6 w-6" />}
              </div>
              <span className={`text-sm font-medium mt-3 ${step >= 1 ? '' : 'text-muted-foreground'}`}>Select Campaign</span>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all duration-300 cursor-default hover:scale-105 shadow-[0_0_0_4px] shadow-background ${
                  step >= 2
                    ? 'bg-gradient-to-br from-primary to-primary/80 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {step > 2 ? <CheckCircle className="h-6 w-6" /> : <Gift className="h-6 w-6" />}
              </div>
              <span className={`text-sm font-medium mt-3 ${step >= 2 ? '' : 'text-muted-foreground'}`}>Donation Amount</span>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all duration-300 cursor-default hover:scale-105 shadow-[0_0_0_4px] shadow-background ${
                  step >= 3
                    ? 'bg-gradient-to-br from-primary to-primary/80 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <CreditCard className="h-6 w-6" />
              </div>
              <span className={`text-sm font-medium mt-3 ${step >= 3 ? '' : 'text-muted-foreground'}`}>Complete</span>
            </div>
          </div>
        </div>
      </div>

      {/* Step 1: Select Charity & Campaign */}
      {step === 1 && (
        <Card className="border-primary/20 shadow-2xl backdrop-blur-sm bg-card/95 max-w-3xl mx-auto">
          <CardHeader className="text-center pb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4 mx-auto">
              <Building2 className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-2xl">Select Campaign to Support</CardTitle>
            <CardDescription className="text-base">Choose the cause you want to make an impact on</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-8 pb-8">
            <div className="space-y-3">
              <Label htmlFor="charity" className="text-base font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Select Charity Organization
              </Label>
              <Select value={formData.charityId} onValueChange={(value) => setFormData({ ...formData, charityId: value, campaignId: "", channel_used: "" })}>
                <SelectTrigger className="h-12 border-primary/20 hover:border-primary/40 transition-colors">
                  <SelectValue placeholder="🏢 Choose a charity organization" />
                </SelectTrigger>
                <SelectContent>
                  {charities.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.charityId && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
                <Label htmlFor="campaign" className="text-base font-semibold flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Select Campaign
                </Label>
                <Select value={formData.campaignId} onValueChange={(value) => setFormData({ ...formData, campaignId: value })}>
                  <SelectTrigger className="h-12 border-primary/20 hover:border-primary/40 transition-colors">
                    <SelectValue placeholder="🎯 Choose a specific campaign or donate directly" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct">
                      💝 Donate Directly to Charity (General Fund)
                    </SelectItem>
                    {campaigns.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.campaignId === "direct" ? (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/20">
                    <p className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Your donation will support the charity's general operations and programs
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Payment channels will be displayed in the next step
                  </p>
                )}
              </div>
            )}

            <div className="pt-6">
              <Button 
                onClick={() => setStep(2)} 
                disabled={!formData.charityId || !formData.campaignId} 
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Continue to Amount
                <TrendingUp className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Amount & Type */}
      {step === 2 && (
        <Card className="border-primary/20 shadow-2xl backdrop-blur-sm bg-card/95 max-w-3xl mx-auto">
          <CardHeader className="text-center pb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4 mx-auto">
              <Gift className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-2xl">Choose Your Contribution</CardTitle>
            <CardDescription className="text-base">Every amount makes a difference</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 px-8 pb-8">
            {/* Campaign Donation Type Info */}
            {selectedCampaign && formData.campaignId !== "direct" && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm mb-1">Campaign Type</p>
                    <p className="text-sm text-muted-foreground">
                      This campaign accepts <span className="font-semibold text-primary">{formData.donationType === 'recurring' ? 'Recurring' : 'One-time'}</span> donations
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Frequency (if recurring) */}
            {formData.donationType === 'recurring' && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
                <Label className="text-base font-semibold">Frequency</Label>
                <Select value={formData.frequency} onValueChange={(value) => setFormData({ ...formData, frequency: value })}>
                  <SelectTrigger className="h-12 border-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">📅 Weekly</SelectItem>
                    <SelectItem value="monthly">📆 Monthly</SelectItem>
                    <SelectItem value="quarterly">🗓️ Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Suggested Amounts */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Quick Select Amount</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {suggestedAmounts.map(amount => (
                  <Button
                    key={amount}
                    type="button"
                    variant={formData.amount === amount.toString() ? "default" : "outline"}
                    onClick={() => setFormData({ ...formData, amount: amount.toString(), customAmount: "" })}
                    className={`h-16 text-lg font-bold transition-all duration-300 ${
                      formData.amount === amount.toString() 
                        ? 'bg-gradient-to-br from-primary to-primary/80 shadow-lg scale-105' 
                        : 'hover:border-primary/40 hover:scale-105'
                    }`}
                  >
                    ₱{amount.toLocaleString()}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <div className="space-y-3">
              <Label htmlFor="customAmount" className="text-base font-semibold">Or Enter Custom Amount</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground">₱</span>
                <Input
                  id="customAmount"
                  type="number"
                  placeholder="0.00"
                  value={formData.customAmount}
                  onChange={(e) => setFormData({ ...formData, customAmount: e.target.value, amount: e.target.value })}
                  className="h-14 pl-10 pr-4 text-lg font-semibold border-primary/20 focus:border-primary"
                />
              </div>
            </div>

            {/* Message */}
            <div className="space-y-3">
              <Label htmlFor="message" className="text-base font-semibold">Personal Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Share why you're supporting this cause..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={4}
                className="resize-none border-primary/20 focus:border-primary"
              />
            </div>

            {/* Anonymous */}
            <div className="p-4 rounded-xl border border-border/50 bg-muted/30">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="anonymous"
                  checked={formData.isAnonymous}
                  onCheckedChange={(checked) => setFormData({ ...formData, isAnonymous: checked as boolean })}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label htmlFor="anonymous" className="cursor-pointer font-semibold block mb-1">
                    Make this donation anonymous
                  </Label>
                  <p className="text-sm text-muted-foreground">Your name will be hidden from public donation lists</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-12 border-primary/20">
                ← Back
              </Button>
              <Button 
                onClick={() => setStep(3)} 
                disabled={!formData.amount} 
                className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Continue to Payment →
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Payment */}
      {step === 3 && (
        <Card className="border-primary/20 shadow-2xl backdrop-blur-sm bg-card/95 max-w-3xl mx-auto">
          <CardHeader className="text-center pb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4 mx-auto">
              <CreditCard className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-2xl">Complete Your Donation</CardTitle>
            <CardDescription className="text-base">Upload proof and finalize your contribution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 px-8 pb-8">
            {/* Summary */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 shadow-inner">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Donation Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Charity:</span>
                  <span className="font-semibold">{charities.find(c => c.id === parseInt(formData.charityId))?.name || 'N/A'}</span>
                </div>
                {formData.campaignId === "direct" ? (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Donation Type:</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">Direct to Charity (General Fund)</span>
                </div>
              ) : formData.campaignId && formData.campaignId !== 'general' ? (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Campaign:</span>
                  <span className="font-semibold">{campaigns.find(c => c.id === parseInt(formData.campaignId))?.title || 'N/A'}</span>
                </div>
              ) : null}  
                {formData.campaignId !== "direct" && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-semibold capitalize">{formData.donationType}</span>
                </div>
              )}
                <div className="flex justify-between items-center pt-3 border-t border-primary/20">
                  <span className="text-lg font-semibold">Total Amount:</span>
                  <span className="text-2xl font-bold text-primary">₱{parseFloat(formData.amount).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Donation Channel */}
            <div className="space-y-3">
              <Label className="text-base font-semibold flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                Payment Channel
              </Label>
              <Select value={formData.channel_used} onValueChange={(v) => setFormData({ ...formData, channel_used: v })}>
                <SelectTrigger className="h-12 border-primary/20">
                  <SelectValue placeholder={channels.length ? '💳 Select payment channel' : 'No channels available'} />
                </SelectTrigger>
                <SelectContent>
                  {channels.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">No channels available</div>
                  ) : (
                    channels.map((ch) => (
                      <SelectItem key={ch.id} value={ch.label}>{ch.label} ({ch.type})</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Reference Number */}
            <div className="space-y-3">
              <Label htmlFor="reference" className="text-base font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Transaction Reference
              </Label>
              <Input 
                id="reference" 
                className="h-12 border-primary/20 focus:border-primary" 
                placeholder="Enter transaction/reference number" 
                value={formData.reference_number} 
                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })} 
              />
            </div>

            {/* Upload Proof */}
            <div className="space-y-3">
              <Label htmlFor="proof" className="text-base font-semibold flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" />
                Proof of Payment
              </Label>
              {proofPreview ? (
                <div className="relative rounded-xl overflow-hidden border-2 border-primary/20">
                  <img src={proofPreview} alt="Proof" className="w-full h-64 object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, proofOfPayment: null });
                      setProofPreview(null);
                    }}
                    className="absolute top-3 right-3 p-2 bg-destructive text-white rounded-full hover:bg-destructive/90 shadow-lg"
                  >
                    ✕
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm text-white p-3 text-sm">
                    ✓ {formData.proofOfPayment?.name}
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-2xl p-8 text-center border-primary/30 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer">
                  <input
                    id="proof"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <label htmlFor="proof" className="cursor-pointer">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-base font-medium mb-1">
                      Click to upload receipt or screenshot
                    </p>
                    <p className="text-sm text-muted-foreground">
                      JPG, PNG up to 2MB
                    </p>
                  </label>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-6">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1 h-12 border-primary/20">
                ← Back
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={!formData.proofOfPayment} 
                className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Heart className="mr-2 h-5 w-5" />
                Submit Donation
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      </>
      )}
      </div>
    </div>
  );
}
