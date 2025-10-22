import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Loader2, Save, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { FileUploader, type UploadedFile } from '@/components/auth/FileUploader';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import { PhilippineAddressForm } from '@/components/forms/PhilippineAddressForm';
import { PrimaryContactFields } from '@/components/forms/PrimaryContactFields';
import { CharityTermsDialog } from '@/components/legal/CharityTermsDialog';
import { CharityPrivacyDialog } from '@/components/legal/CharityPrivacyDialog';
import { authService, type CharityRegistrationData } from '@/services/auth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 1, name: 'Organization Details', description: 'Basic information about your charity' },
  { id: 2, name: 'Profile & Mission', description: 'Tell us about your mission' },
  { id: 3, name: 'Documents & Compliance', description: 'Upload required documents' },
  { id: 4, name: 'Review & Submit', description: 'Confirm your information' },
];

const NONPROFIT_CATEGORIES = [
  'Education',
  'Healthcare',
  'Environment',
  'Human Rights',
  'Animal Welfare',
  'Arts & Culture',
  'Community Development',
  'Disaster Relief',
  'Other',
];

export default function RegisterCharity() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState<Partial<CharityRegistrationData>>({
    organization_name: '',
    legal_trading_name: '',
    registration_number: '',
    tax_id: '',
    website: '',
    primary_first_name: '',
    primary_middle_initial: '',
    primary_last_name: '',
    primary_position: '',
    primary_email: '',
    primary_phone: '',
    password: '',
    password_confirmation: '',
    street_address: '',
    barangay: '',
    city: '',
    province: '',
    region: '',
    full_address: '',
    nonprofit_category: '',
    mission_statement: '',
    vision_statement: '',
    description: '',
    accept_terms: false,
    confirm_truthfulness: false,
  });

  // Document uploads
  const [documents, setDocuments] = useState<{
    registration_cert: UploadedFile[];
    tax_registration: UploadedFile[];
    financial_statement: UploadedFile[];
    representative_id: UploadedFile[];
    additional_docs: UploadedFile[];
  }>({
    registration_cert: [],
    tax_registration: [],
    financial_statement: [],
    representative_id: [],
    additional_docs: [],
  });

  // Logo and cover image
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      toast.success('Logo uploaded');
    }
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      toast.success('Cover image uploaded');
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.organization_name) newErrors.organization_name = 'Required';
      if (!formData.registration_number) newErrors.registration_number = 'Required';
      if (!formData.tax_id) newErrors.tax_id = 'Required';
      
      // Primary Contact Validation
      if (!formData.primary_first_name) newErrors.primary_first_name = 'First name is required';
      else if (!/^[A-Za-zÑñ\s]+$/.test(formData.primary_first_name)) newErrors.primary_first_name = 'Only letters allowed';
      
      if (formData.primary_middle_initial && !/^[A-Za-zÑñ]$/.test(formData.primary_middle_initial)) {
        newErrors.primary_middle_initial = 'Must be a single letter';
      }
      
      if (!formData.primary_last_name) newErrors.primary_last_name = 'Last name is required';
      else if (!/^[A-Za-zÑñ\s]+$/.test(formData.primary_last_name)) newErrors.primary_last_name = 'Only letters allowed';
      
      if (!formData.primary_email) newErrors.primary_email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.primary_email)) newErrors.primary_email = 'Invalid email format';
      
      if (!formData.primary_phone) newErrors.primary_phone = 'Phone number is required';
      else if (!/^09\d{9}$/.test(formData.primary_phone)) newErrors.primary_phone = 'Must be 09XXXXXXXXX (11 digits)';
      
      // Password strength validation
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else {
        const pwd = formData.password as string;
        if (pwd.length < 8) {
          newErrors.password = 'Password must be at least 8 characters';
        } else if (!/[A-Z]/.test(pwd)) {
          newErrors.password = 'Password must contain an uppercase letter';
        } else if (!/[a-z]/.test(pwd)) {
          newErrors.password = 'Password must contain a lowercase letter';
        } else if (!/\d/.test(pwd)) {
          newErrors.password = 'Password must contain a number';
        } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) {
          newErrors.password = 'Password must contain a special character';
        }
      }
      if (!formData.password_confirmation) newErrors.password_confirmation = 'Required';
      if (formData.password && formData.password_confirmation && formData.password !== formData.password_confirmation) {
        newErrors.password_confirmation = 'Passwords do not match';
      }
      if (!formData.street_address) newErrors.street_address = 'Required';
      if (!formData.region) newErrors.region = 'Required';
      if (!formData.province) newErrors.province = 'Required';
      if (!formData.city) newErrors.city = 'Required';
      if (!formData.nonprofit_category) newErrors.nonprofit_category = 'Required';
    }

    if (step === 2) {
      if (!formData.mission_statement) newErrors.mission_statement = 'Required';
      if (!formData.description) newErrors.description = 'Required';
    }

    if (step === 3) {
      if (documents.registration_cert.length === 0)
        newErrors.registration_cert = 'Registration certificate is required';
      if (documents.tax_registration.length === 0)
        newErrors.tax_registration = 'Tax registration is required';
      if (documents.representative_id.length === 0)
        newErrors.representative_id = 'Representative ID is required';
    }

    if (step === 4) {
      if (!formData.accept_terms) newErrors.accept_terms = 'You must accept the terms';
      if (!formData.confirm_truthfulness)
        newErrors.confirm_truthfulness = 'You must confirm truthfulness';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      // Save draft to localStorage (excluding file objects)
      localStorage.setItem('charity_draft', JSON.stringify({ 
        formData, 
        hasLogo: !!logo,
        hasCover: !!coverImage
      }));
      toast.success('Draft saved', {
        description: 'You can continue your registration later.',
      });
    } catch (error) {
      toast.error('Failed to save draft');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setIsLoading(true);
    try {
      // Prepare FormData for file upload
      const submitData = new FormData();
      
      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          submitData.append(key, value.toString());
        }
      });

      // Add logo and cover image
      if (logo) {
        submitData.append('logo', logo);
      }
      if (coverImage) {
        submitData.append('cover_image', coverImage);
      }

      // Add document files
      documents.registration_cert.forEach((file) => {
        submitData.append('documents[]', file.file);
        submitData.append('doc_types[]', 'registration_cert');
      });
      documents.tax_registration.forEach((file) => {
        submitData.append('documents[]', file.file);
        submitData.append('doc_types[]', 'tax_registration');
      });
      documents.financial_statement.forEach((file) => {
        submitData.append('documents[]', file.file);
        submitData.append('doc_types[]', 'financial_statement');
      });
      documents.representative_id.forEach((file) => {
        submitData.append('documents[]', file.file);
        submitData.append('doc_types[]', 'representative_id');
      });
      documents.additional_docs.forEach((file) => {
        submitData.append('documents[]', file.file);
        submitData.append('doc_types[]', 'additional_docs');
      });

      // Debug log
      console.log('Submitting charity registration with data:', {
        formFields: Object.fromEntries(
          Array.from(submitData.entries()).filter(([key]) => !key.includes('[]'))
        ),
        hasLogo: !!logo,
        hasCover: !!coverImage,
        documentCounts: {
          registration_cert: documents.registration_cert.length,
          tax_registration: documents.tax_registration.length,
          financial_statement: documents.financial_statement.length,
          representative_id: documents.representative_id.length,
          additional_docs: documents.additional_docs.length,
        }
      });

      await authService.registerCharity(submitData as any);

      // Clear draft after successful submission
      localStorage.removeItem('charity_draft');

      toast.success('Registration submitted!', {
        description: 'Your application is under review. We\'ll notify you by email.',
      });

      // Redirect to login page
      navigate('/auth/login');
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle axios errors with response data
      if (error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        const errorMessages: string[] = [];
        
        // Display each validation error
        Object.entries(backendErrors).forEach(([field, messages]) => {
          if (Array.isArray(messages)) {
            messages.forEach((msg) => {
              errorMessages.push(`${field}: ${msg}`);
            });
          }
        });
        
        toast.error('Validation failed', {
          description: errorMessages.join('\n') || 'Please check your input and try again',
        });
        
        // Set errors to display in form
        const formattedErrors: Record<string, string> = {};
        Object.entries(backendErrors).forEach(([field, messages]) => {
          if (Array.isArray(messages) && messages.length > 0) {
            formattedErrors[field] = messages[0];
          }
        });
        setErrors(formattedErrors);
      } else if (error.response?.data?.message) {
        toast.error('Registration failed', { 
          description: error.response.data.message 
        });
      } else if (error instanceof Error) {
        toast.error('Registration failed', { description: error.message });
      } else {
        toast.error('Registration failed', { 
          description: 'An unexpected error occurred' 
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/auth/register"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to registration options
          </Link>
          <h1 className="text-3xl font-bold mb-2">Register your charity</h1>
          <p className="text-muted-foreground">Complete the steps below to join our platform</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, idx) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors',
                      currentStep > step.id && 'bg-primary text-primary-foreground',
                      currentStep === step.id && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                      currentStep < step.id && 'bg-muted text-muted-foreground'
                    )}
                  >
                    {currentStep > step.id ? <Check className="h-5 w-5" /> : step.id}
                  </div>
                  <div className="mt-2 text-center hidden md:block">
                    <p className="text-sm font-medium">{step.name}</p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'h-1 flex-1 mx-2 transition-colors',
                      currentStep > step.id ? 'bg-primary' : 'bg-muted'
                    )}
                  />
                )}
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Form Content */}
        <div className="auth-card">
          {/* Step 1: Organization Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Organization Details</h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="organization_name">
                    Organization name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="organization_name"
                    value={formData.organization_name}
                    onChange={(e) => handleChange('organization_name', e.target.value)}
                    className={cn(errors.organization_name && 'border-destructive')}
                  />
                  {errors.organization_name && (
                    <p className="text-sm text-destructive">{errors.organization_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="legal_trading_name">Legal trading name (if different)</Label>
                  <Input
                    id="legal_trading_name"
                    value={formData.legal_trading_name}
                    onChange={(e) => handleChange('legal_trading_name', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registration_number">
                    Registration number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="registration_number"
                    value={formData.registration_number}
                    onChange={(e) => handleChange('registration_number', e.target.value)}
                    className={cn(errors.registration_number && 'border-destructive')}
                  />
                  {errors.registration_number && (
                    <p className="text-sm text-destructive">{errors.registration_number}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tax_id">
                    Tax ID <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="tax_id"
                    value={formData.tax_id}
                    onChange={(e) => handleChange('tax_id', e.target.value)}
                    className={cn(errors.tax_id && 'border-destructive')}
                  />
                  {errors.tax_id && (
                    <p className="text-sm text-destructive">{errors.tax_id}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleChange('website', e.target.value)}
                    placeholder="https://example.org"
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="text-lg font-semibold mb-4">Account Security</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">
                      Password <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password || ''}
                        onChange={(e) => handleChange('password', e.target.value)}
                        className={cn(errors.password && 'border-destructive', 'pr-10')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password_confirmation">
                      Confirm Password <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="password_confirmation"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.password_confirmation || ''}
                        onChange={(e) => handleChange('password_confirmation', e.target.value)}
                        className={cn(errors.password_confirmation && 'border-destructive', 'pr-10')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password_confirmation && (
                      <p className="text-sm text-destructive">{errors.password_confirmation}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <PasswordStrengthMeter password={formData.password || ''} />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="text-lg font-semibold mb-4">Primary Contact</h3>
                <PrimaryContactFields
                  values={{
                    primary_first_name: formData.primary_first_name || '',
                    primary_middle_initial: formData.primary_middle_initial || '',
                    primary_last_name: formData.primary_last_name || '',
                    primary_position: formData.primary_position || '',
                    primary_email: formData.primary_email || '',
                    primary_phone: formData.primary_phone || '',
                  }}
                  errors={errors}
                  onChange={handleChange}
                />
              </div>

              <div className="pt-4 border-t">
                <h3 className="text-lg font-semibold mb-4">Location</h3>
                <PhilippineAddressForm
                  values={{
                    street_address: formData.street_address || '',
                    barangay: formData.barangay || '',
                    city: formData.city || '',
                    province: formData.province || '',
                    region: formData.region || '',
                    full_address: formData.full_address || '',
                  }}
                  errors={errors}
                  onChange={handleChange}
                />
              </div>

              <div className="pt-4 border-t">
                <h3 className="text-lg font-semibold mb-4">Organization Category</h3>
                <div className="space-y-2">
                  <Label htmlFor="nonprofit_category">
                    Category <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="nonprofit_category"
                    value={formData.nonprofit_category}
                    onChange={(e) => handleChange('nonprofit_category', e.target.value)}
                    className={cn(
                      'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      errors.nonprofit_category && 'border-destructive'
                    )}
                  >
                    <option value="">Select category</option>
                    {NONPROFIT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  {errors.nonprofit_category && (
                    <p className="text-sm text-destructive">{errors.nonprofit_category}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Profile & Mission */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Profile & Mission</h2>
                <p className="text-muted-foreground mt-1">
                  Share your organization's purpose, vision, and impact
                </p>
              </div>

              {/* Mission & Vision Section */}
              <div className="p-6 bg-muted/30 rounded-lg border space-y-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <span className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">1</span>
                  Mission & Vision
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="mission_statement">
                    Mission Statement <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    What is your organization's core purpose? What do you aim to achieve?
                  </p>
                  <Textarea
                    id="mission_statement"
                    value={formData.mission_statement}
                    onChange={(e) => handleChange('mission_statement', e.target.value)}
                    rows={6}
                    maxLength={6000}
                    placeholder="Example: To provide quality education and resources to underprivileged children in Metro Manila..."
                    className={cn(errors.mission_statement && 'border-destructive')}
                  />
                  {errors.mission_statement && (
                    <p className="text-sm text-destructive">{errors.mission_statement}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formData.mission_statement?.length || 0} / 6000 characters (~{Math.round((formData.mission_statement?.length || 0) / 6)} words, max 1000 words)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vision_statement">
                    Vision Statement <span className="text-muted-foreground text-xs">(Optional)</span>
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    What is your long-term aspiration? What future do you envision?
                  </p>
                  <Textarea
                    id="vision_statement"
                    value={formData.vision_statement}
                    onChange={(e) => handleChange('vision_statement', e.target.value)}
                    rows={6}
                    maxLength={6000}
                    placeholder="Example: A Philippines where every child has access to quality education and opportunities to succeed..."
                    className={cn(errors.vision_statement && 'border-destructive')}
                  />
                  {errors.vision_statement && (
                    <p className="text-sm text-destructive">{errors.vision_statement}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formData.vision_statement?.length || 0} / 6000 characters (~{Math.round((formData.vision_statement?.length || 0) / 6)} words, max 1000 words)
                  </p>
                </div>
              </div>

              {/* About Your Organization Section */}
              <div className="p-6 bg-muted/30 rounded-lg border space-y-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <span className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">2</span>
                  About Your Organization
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="description">
                    Detailed Description <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Provide a comprehensive overview of your organization, programs, services, and impact on the community.
                  </p>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={12}
                    maxLength={12000}
                    placeholder="Tell us about:&#10;• Your organization's history and background&#10;• Programs and services you offer&#10;• Communities you serve&#10;• Impact and achievements&#10;• What makes your organization unique"
                    className={cn(errors.description && 'border-destructive')}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive">{errors.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formData.description?.length || 0} / 12000 characters (~{Math.round((formData.description?.length || 0) / 6)} words, max 2000 words)
                  </p>
                </div>
              </div>

              {/* Media Section */}
              <div className="p-6 bg-muted/30 rounded-lg border space-y-6">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <span className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">3</span>
                    Media & Branding
                    <span className="text-xs font-normal text-muted-foreground ml-2">(Optional)</span>
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Add your organization's logo and cover image to create a professional profile.
                  </p>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Logo Upload */}
                  <div className="space-y-2">
                    <Label>Organization Logo</Label>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center">
                      {logoPreview ? (
                        <div className="space-y-2">
                          <img src={logoPreview} alt="Logo preview" className="h-32 w-32 object-cover rounded-lg mx-auto" />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setLogo(null);
                              setLogoPreview(null);
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <input
                            type="file"
                            id="logo-upload"
                            accept="image/*"
                            className="hidden"
                            onChange={handleLogoUpload}
                          />
                          <label htmlFor="logo-upload" className="cursor-pointer">
                            <div className="flex flex-col items-center gap-2">
                              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                                <Save className="h-8 w-8 text-muted-foreground" />
                              </div>
                              <p className="text-sm font-medium">Upload Logo</p>
                              <p className="text-xs text-muted-foreground">PNG, JPG up to 2MB</p>
                            </div>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cover Image Upload */}
                  <div className="space-y-2">
                    <Label>Cover Image</Label>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center">
                      {coverPreview ? (
                        <div className="space-y-2">
                          <img src={coverPreview} alt="Cover preview" className="h-32 w-full object-cover rounded-lg" />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setCoverImage(null);
                              setCoverPreview(null);
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <input
                            type="file"
                            id="cover-upload"
                            accept="image/*"
                            className="hidden"
                            onChange={handleCoverUpload}
                          />
                          <label htmlFor="cover-upload" className="cursor-pointer">
                            <div className="flex flex-col items-center gap-2">
                              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                                <Save className="h-8 w-8 text-muted-foreground" />
                              </div>
                              <p className="text-sm font-medium">Upload Cover</p>
                              <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                            </div>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Documents */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Documents & Compliance</h2>
                <p className="text-muted-foreground">
                  Upload the required documents. All files are securely processed with SHA-256
                  checksums.
                </p>
              </div>

              <FileUploader
                label="Registration certificate / SEC equivalent"
                description="Official registration document from the relevant authority"
                required
                files={documents.registration_cert}
                onChange={(files) =>
                  setDocuments((prev) => ({ ...prev, registration_cert: files }))
                }
              />
              {errors.registration_cert && (
                <p className="text-sm text-destructive -mt-2">{errors.registration_cert}</p>
              )}

              <FileUploader
                label="Tax registration (BIR) or Tax ID"
                description="Tax registration document or proof of tax-exempt status"
                required
                files={documents.tax_registration}
                onChange={(files) =>
                  setDocuments((prev) => ({ ...prev, tax_registration: files }))
                }
              />
              {errors.tax_registration && (
                <p className="text-sm text-destructive -mt-2">{errors.tax_registration}</p>
              )}

              <FileUploader
                label="Latest audited financial statement"
                description="Most recent financial report or accountant's summary (if available)"
                files={documents.financial_statement}
                onChange={(files) =>
                  setDocuments((prev) => ({ ...prev, financial_statement: files }))
                }
              />

              <FileUploader
                label="Representative ID (Government-issued ID)"
                description="Valid government ID of the authorized representative"
                required
                files={documents.representative_id}
                onChange={(files) =>
                  setDocuments((prev) => ({ ...prev, representative_id: files }))
                }
              />
              {errors.representative_id && (
                <p className="text-sm text-destructive -mt-2">{errors.representative_id}</p>
              )}

              <FileUploader
                label="Additional supporting documents"
                description="Any other relevant documents to support your application"
                multiple
                files={documents.additional_docs}
                onChange={(files) =>
                  setDocuments((prev) => ({ ...prev, additional_docs: files }))
                }
              />
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Review & Submit</h2>

              <div className="space-y-6">
                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                  <h3 className="font-semibold">Organization Details</h3>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="text-muted-foreground">Organization:</dt>
                    <dd className="font-medium">{formData.organization_name}</dd>
                    <dt className="text-muted-foreground">Registration #:</dt>
                    <dd className="font-medium">{formData.registration_number}</dd>
                    <dt className="text-muted-foreground">Tax ID:</dt>
                    <dd className="font-medium">{formData.tax_id}</dd>
                    <dt className="text-muted-foreground">Category:</dt>
                    <dd className="font-medium">{formData.nonprofit_category}</dd>
                  </dl>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                  <h3 className="font-semibold">Contact Information</h3>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="text-muted-foreground">Contact person:</dt>
                    <dd className="font-medium">
                      {[
                        formData.primary_first_name,
                        formData.primary_middle_initial,
                        formData.primary_last_name
                      ].filter(Boolean).join(' ')}
                    </dd>
                    {formData.primary_position && (
                      <>
                        <dt className="text-muted-foreground">Position:</dt>
                        <dd className="font-medium">{formData.primary_position}</dd>
                      </>
                    )}
                    <dt className="text-muted-foreground">Email:</dt>
                    <dd className="font-medium">{formData.primary_email}</dd>
                    <dt className="text-muted-foreground">Phone:</dt>
                    <dd className="font-medium">{formData.primary_phone}</dd>
                  </dl>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                  <h3 className="font-semibold">Mission & Vision</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <dt className="text-muted-foreground font-medium mb-1">Mission Statement:</dt>
                      <dd className="text-foreground leading-relaxed">{formData.mission_statement}</dd>
                    </div>
                    {formData.vision_statement && (
                      <div>
                        <dt className="text-muted-foreground font-medium mb-1">Vision Statement:</dt>
                        <dd className="text-foreground leading-relaxed">{formData.vision_statement}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-muted-foreground font-medium mb-1">About:</dt>
                      <dd className="text-foreground leading-relaxed">{formData.description}</dd>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                  <h3 className="font-semibold">Uploaded Documents</h3>
                  <ul className="text-sm space-y-1">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      Registration certificate ({documents.registration_cert.length})
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      Tax registration ({documents.tax_registration.length})
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      Representative ID ({documents.representative_id.length})
                    </li>
                    {documents.financial_statement.length > 0 && (
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        Financial statement ({documents.financial_statement.length})
                      </li>
                    )}
                    {documents.additional_docs.length > 0 && (
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        Additional documents ({documents.additional_docs.length})
                      </li>
                    )}
                  </ul>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="confirm_truthfulness"
                      checked={formData.confirm_truthfulness}
                      onCheckedChange={(checked) =>
                        handleChange('confirm_truthfulness', checked === true)
                      }
                      className={cn(errors.confirm_truthfulness && 'border-destructive')}
                    />
                    <Label htmlFor="confirm_truthfulness" className="font-normal cursor-pointer">
                      I confirm that all information provided is truthful and accurate to the best
                      of my knowledge. <span className="text-destructive">*</span>
                    </Label>
                  </div>
                  {errors.confirm_truthfulness && (
                    <p className="text-sm text-destructive ml-6">{errors.confirm_truthfulness}</p>
                  )}

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="accept_terms"
                      checked={formData.accept_terms}
                      onCheckedChange={(checked) => handleChange('accept_terms', checked === true)}
                      className={cn(errors.accept_terms && 'border-destructive')}
                    />
                    <Label htmlFor="accept_terms" className="font-normal cursor-pointer">
                      I accept the{' '}
                      <button
                        type="button"
                        onClick={() => setShowTermsDialog(true)}
                        className="text-primary hover:underline"
                      >
                        Terms of Service
                      </button>{' '}
                      and{' '}
                      <button
                        type="button"
                        onClick={() => setShowPrivacyDialog(true)}
                        className="text-primary hover:underline"
                      >
                        Privacy Policy
                      </button>
                      <span className="text-destructive ml-1">*</span>
                    </Label>
                  </div>
                  {errors.accept_terms && (
                    <p className="text-sm text-destructive ml-6">{errors.accept_terms}</p>
                  )}
                </div>

                <div className="p-4 bg-accent/50 border border-accent rounded-lg">
                  <p className="text-sm">
                    <strong>Next steps:</strong> After submission, your application will be
                    reviewed by our team. This typically takes 3-5 business days. We'll notify you
                    by email once your review is complete.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t mt-8">
            <div className="flex gap-2">
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                onClick={handleSaveDraft}
                disabled={isSavingDraft}
              >
                {isSavingDraft ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save draft
                  </>
                )}
              </Button>
            </div>

            {currentStep < STEPS.length ? (
              <Button type="button" onClick={nextStep}>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit application'
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Sign In Link */}
        <p className="text-center mt-6 text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/auth/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>

      {/* Dialogs */}
      <CharityTermsDialog open={showTermsDialog} onOpenChange={setShowTermsDialog} />
      <CharityPrivacyDialog open={showPrivacyDialog} onOpenChange={setShowPrivacyDialog} />
    </div>
  );
}
