import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { authService } from "@/services/auth";
import { Building2, MapPin, User, Upload, Loader2, ArrowLeft, Image as ImageIcon } from "lucide-react";
import { PhilippineAddressForm } from "@/components/forms/PhilippineAddressForm";


interface CharityProfile {
  id: number;
  name: string;
  mission: string;
  vision: string;
  description: string;
  logo_path: string | null;
  cover_image: string | null;
  // Alternative field names from registration
  mission_statement?: string;
  vision_statement?: string;
  goals?: string; // Old field that was incorrectly used for description
  // Location fields
  street_address?: string;
  barangay?: string;
  city?: string;
  province?: string;
  region: string;
  full_address?: string;
  // Alternative/legacy field names
  address?: string;
  municipality?: string;
  // Contact fields
  first_name: string;
  middle_initial: string | null;
  last_name: string;
  contact_email: string;
  contact_phone: string;
  // Alternative field names from backend
  primary_first_name?: string;
  primary_middle_initial?: string;
  primary_last_name?: string;
  primary_email?: string;
  primary_phone?: string;
}

export default function EditProfile() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Form data
  const [formData, setFormData] = useState({
    mission: "",
    vision: "",
    description: "",
    street_address: "",
    barangay: "",
    city: "",
    province: "",
    region: "",
    full_address: "",
    first_name: "",
    middle_initial: "",
    last_name: "",
    contact_email: "",
    contact_phone: "",
  });

  // File uploads
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [isDraggingCover, setIsDraggingCover] = useState(false);

  useEffect(() => {
    loadCharityProfile();
  }, []);

  const loadCharityProfile = async () => {
    try {
      const token = authService.getToken();
      if (!token) {
        navigate('/auth/login');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load profile');
      }

      const data = await response.json();
      const charity = data.charity as CharityProfile;

      if (!charity) {
        toast.error('No charity profile found');
        navigate('/charity/updates');
        return;
      }

      console.log('Loaded charity data:', charity); // Debug log

      // Populate form with existing data - try multiple field name variations
      setFormData({
        mission: charity.mission || charity.mission_statement || "",
        vision: charity.vision || charity.vision_statement || "",
        description: charity.description || charity.goals || "",
        street_address: charity.street_address || charity.address || "",
        barangay: charity.barangay || "",
        city: charity.city || charity.municipality || "",
        province: charity.province || "",
        region: charity.region || "",
        full_address: charity.full_address || "",
        first_name: charity.first_name || charity.primary_first_name || "",
        middle_initial: charity.middle_initial || charity.primary_middle_initial || "",
        last_name: charity.last_name || charity.primary_last_name || "",
        contact_email: charity.contact_email || charity.primary_email || "",
        contact_phone: charity.contact_phone || charity.primary_phone || "",
      });

      // Set existing image previews
      if (charity.logo_path) {
        setLogoPreview(`${import.meta.env.VITE_API_URL}/storage/${charity.logo_path}`);
      }
      if (charity.cover_image) {
        setCoverPreview(`${import.meta.env.VITE_API_URL}/storage/${charity.cover_image}`);
      }

    } catch (error) {
      console.error('Failed to load profile:', error);
      toast.error('Failed to load charity profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const processLogoFile = (file: File) => {
    // Validate file type
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      setErrors(prev => ({ ...prev, logo: 'Only PNG and JPG images are allowed' }));
      toast.error('Only PNG and JPG images are allowed');
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, logo: 'Image must be less than 2MB' }));
      toast.error('Image must be less than 2MB');
      return;
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.logo;
      return newErrors;
    });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processLogoFile(file);
  };

  const handleLogoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingLogo(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processLogoFile(file);
  };

  const handleLogoDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingLogo(true);
  };

  const handleLogoDragLeave = () => {
    setIsDraggingLogo(false);
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const processCoverFile = (file: File) => {
    // Validate file type
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      setErrors(prev => ({ ...prev, cover_photo: 'Only PNG and JPG images are allowed' }));
      toast.error('Only PNG and JPG images are allowed');
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, cover_photo: 'Image must be less than 2MB' }));
      toast.error('Image must be less than 2MB');
      return;
    }

    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.cover_photo;
      return newErrors;
    });
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processCoverFile(file);
  };

  const handleCoverDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingCover(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processCoverFile(file);
  };

  const handleCoverDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingCover(true);
  };

  const handleCoverDragLeave = () => {
    setIsDraggingCover(false);
  };

  const removeCover = () => {
    setCoverFile(null);
    setCoverPreview(null);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Only validate fields that have content
    // Mission validation - only if provided
    if (formData.mission.trim()) {
      if (formData.mission.trim().length < 30) {
        newErrors.mission = 'Mission must be at least 30 characters';
      } else if (formData.mission.trim().length > 6000) {
        newErrors.mission = 'Mission must not exceed 6000 characters (~1000 words)';
      }
    }

    // Vision validation - only if provided
    if (formData.vision.trim() && formData.vision.trim().length > 6000) {
      newErrors.vision = 'Vision must not exceed 6000 characters (~1000 words)';
    }

    // Description validation - only if provided
    if (formData.description.trim()) {
      if (formData.description.trim().length < 50) {
        newErrors.description = 'Description must be at least 50 characters';
      } else if (formData.description.trim().length > 12000) {
        newErrors.description = 'Description must not exceed 12000 characters (~2000 words)';
      }
    }

    // Email validation - only if provided
    if (formData.contact_email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      newErrors.contact_email = 'Invalid email format';
    }

    // Phone validation - only if provided
    if (formData.contact_phone.trim() && !/^(09|\+639)\d{9}$/.test(formData.contact_phone)) {
      newErrors.contact_phone = 'Phone must start with 09 or +639 and be 11 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the validation errors');
      return;
    }

    setIsSaving(true);

    try {
      const token = authService.getToken();
      if (!token) {
        navigate('/auth/login');
        return;
      }

      // Create FormData for multipart upload
      const formDataToSend = new FormData();
      
      // Append text fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value) {
          formDataToSend.append(key, value);
        }
      });

      // Append files if selected
      if (logoFile) {
        formDataToSend.append('logo', logoFile);
      }
      if (coverFile) {
        formDataToSend.append('cover_photo', coverFile);
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/charity/profile/update`, {
        method: 'POST', // Using POST with _method override for Laravel
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: formDataToSend
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.errors) {
          setErrors(result.errors);
          toast.error('Validation failed. Please check the form.');
        } else {
          throw new Error(result.message || 'Failed to update profile');
        }
        return;
      }

      toast.success('✅ Charity profile updated successfully');
      navigate('/charity/updates');

    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-muted/30 via-background to-muted/20">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-medium text-foreground mb-2">Loading your profile...</p>
          <p className="text-sm text-muted-foreground">Fetching your charity information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/30 via-background to-muted/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => navigate('/charity/updates')}
            className="mb-6 border-2 hover:bg-primary hover:text-primary-foreground transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Updates
          </Button>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Edit Profile
            </h1>
            <p className="text-lg text-muted-foreground">
              Update your organization and contact information
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                Your current profile information is pre-filled below
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Review and update any fields you'd like to change, then click "Save Changes" at the bottom.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Organization Info */}
          <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="space-y-3 pb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Organization Information</CardTitle>
                  <CardDescription className="text-base mt-1">
                    Tell donors about your mission and work
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label htmlFor="mission" className="text-base font-semibold">
                    Mission
                  </Label>
                  <Textarea
                    id="mission"
                    value={formData.mission}
                    onChange={(e) => handleInputChange('mission', e.target.value)}
                    placeholder="Describe your organization's mission (minimum 30 characters, max 1000 words)"
                    rows={6}
                    maxLength={6000}
                    className={`mt-2 ${errors.mission ? 'border-destructive' : 'border-border/60 focus:border-primary'}`}
                  />
                  {errors.mission && (
                    <p className="text-sm text-destructive mt-2 flex items-center gap-1">
                      <span className="text-base">⚠️</span> {errors.mission}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">
                    {formData.mission.length} / 6000 characters (~{Math.round(formData.mission.length / 6)} words, max 1000 words)
                  </p>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="vision" className="text-base font-semibold">Vision</Label>
                  <Textarea
                    id="vision"
                    value={formData.vision}
                    onChange={(e) => handleInputChange('vision', e.target.value)}
                    placeholder="Describe your organization's vision (optional, max 1000 words)"
                    rows={6}
                    maxLength={6000}
                    className="mt-2 border-border/60 focus:border-primary"
                  />
                  {errors.vision && (
                    <p className="text-sm text-destructive mt-2 flex items-center gap-1">
                      <span className="text-base">⚠️</span> {errors.vision}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">
                    {formData.vision.length} / 6000 characters (~{Math.round(formData.vision.length / 6)} words, max 1000 words)
                  </p>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description" className="text-base font-semibold">
                    Description / About
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Provide a detailed description of your organization (minimum 50 characters, max 2000 words)"
                    rows={12}
                    maxLength={12000}
                    className={`mt-2 ${errors.description ? 'border-destructive' : 'border-border/60 focus:border-primary'}`}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive mt-2 flex items-center gap-1">
                      <span className="text-base">⚠️</span> {errors.description}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">
                    {formData.description.length} / 12000 characters (~{Math.round(formData.description.length / 6)} words, max 2000 words)
                  </p>
                </div>

                {/* Logo Upload */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Organization Logo</Label>
                  <input
                    id="logo"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="logo"
                    onDrop={handleLogoDrop}
                    onDragOver={handleLogoDragOver}
                    onDragLeave={handleLogoDragLeave}
                    className={`relative group block w-full h-52 rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${
                      isDraggingLogo 
                        ? 'border-primary bg-primary/10 scale-[1.01]' 
                        : errors.logo
                        ? 'border-destructive bg-destructive/5'
                        : 'border-muted-foreground/30'
                    }`}
                  >
                    {logoPreview ? (
                      <div className="h-full flex flex-col items-center justify-center p-6 gap-4">
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="w-40 h-40 object-cover rounded-2xl"
                          onError={() => {
                            setLogoPreview(null);
                          }}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            removeLogo();
                          }}
                          className="px-6 py-2 bg-primary/10 hover:bg-primary/20 text-foreground font-medium rounded-lg transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-semibold text-foreground mb-2">Upload Logo</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG up to 2MB</p>
                      </div>
                    )}
                  </label>
                  {errors.logo && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <span>⚠️</span> {errors.logo}
                    </p>
                  )}
                </div>

                {/* Cover Photo Upload */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Cover Image</Label>
                  <input
                    id="cover_photo"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleCoverChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="cover_photo"
                    onDrop={handleCoverDrop}
                    onDragOver={handleCoverDragOver}
                    onDragLeave={handleCoverDragLeave}
                    className={`relative group block w-full h-52 rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${
                      isDraggingCover 
                        ? 'border-primary bg-primary/10 scale-[1.01]' 
                        : errors.cover_photo
                        ? 'border-destructive bg-destructive/5'
                        : 'border-muted-foreground/30'
                    }`}
                  >
                    {coverPreview ? (
                      <div className="h-full flex flex-col items-center justify-center p-6 gap-4">
                        <img
                          src={coverPreview}
                          alt="Cover preview"
                          className="w-[360px] h-[100px] object-cover rounded-2xl"
                          onError={() => {
                            setCoverPreview(null);
                          }}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            removeCover();
                          }}
                          className="px-6 py-2 bg-primary/10 hover:bg-primary/20 text-foreground font-medium rounded-lg transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-semibold text-foreground mb-2">Upload Cover</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                      </div>
                    )}
                  </label>
                  {errors.cover_photo && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <span>⚠️</span> {errors.cover_photo}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Info */}
          <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="space-y-3 pb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Location Information</CardTitle>
                  <CardDescription className="text-base mt-1">
                    Where is your organization located?
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <PhilippineAddressForm
                values={{
                  street_address: formData.street_address,
                  barangay: formData.barangay,
                  city: formData.city,
                  province: formData.province,
                  region: formData.region,
                  full_address: formData.full_address,
                }}
                errors={errors}
                onChange={handleInputChange}
              />
            </CardContent>
          </Card>

          {/* Primary Contact Info */}
          <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="space-y-3 pb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Primary Contact Information</CardTitle>
                  <CardDescription className="text-base mt-1">
                    Main contact person for this organization
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <Label htmlFor="first_name">
                    First Name
                  </Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    placeholder="First name"
                    className={errors.first_name ? 'border-destructive' : ''}
                  />
                  {errors.first_name && (
                    <p className="text-sm text-destructive mt-1">{errors.first_name}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="middle_initial">Middle Initial</Label>
                  <Input
                    id="middle_initial"
                    value={formData.middle_initial}
                    onChange={(e) => handleInputChange('middle_initial', e.target.value.slice(0, 1))}
                    placeholder="M.I."
                    maxLength={1}
                  />
                </div>

                <div>
                  <Label htmlFor="last_name">
                    Last Name
                  </Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    placeholder="Last name"
                    className={errors.last_name ? 'border-destructive' : ''}
                  />
                  {errors.last_name && (
                    <p className="text-sm text-destructive mt-1">{errors.last_name}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="contact_email">
                    Email
                  </Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => handleInputChange('contact_email', e.target.value)}
                    placeholder="contact@charity.org"
                    className={errors.contact_email ? 'border-destructive' : ''}
                  />
                  {errors.contact_email && (
                    <p className="text-sm text-destructive mt-1">{errors.contact_email}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="contact_phone">
                    Phone Number
                  </Label>
                  <Input
                    id="contact_phone"
                    value={formData.contact_phone}
                    onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                    placeholder="09XXXXXXXXX"
                    className={errors.contact_phone ? 'border-destructive' : ''}
                  />
                  {errors.contact_phone && (
                    <p className="text-sm text-destructive mt-1">{errors.contact_phone}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Format: 09XXXXXXXXX or +639XXXXXXXXX
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/charity/updates')}
              disabled={isSaving}
              className="sm:w-auto w-full"
              size="lg"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSaving}
              className="sm:w-auto w-full bg-primary hover:bg-primary/90 shadow-lg"
              size="lg"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
