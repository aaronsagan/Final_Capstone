import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface PrimaryContactFieldsProps {
  values: {
    primary_first_name: string;
    primary_middle_initial: string;
    primary_last_name: string;
    primary_position: string;
    primary_email: string;
    primary_phone: string;
  };
  errors: Record<string, string>;
  onChange: (field: string, value: string) => void;
  disabled?: boolean;
}

export function PrimaryContactFields({
  values,
  errors,
  onChange,
  disabled = false,
}: PrimaryContactFieldsProps) {
  
  // Validate and format phone number
  const handlePhoneChange = (field: string, value: string) => {
    // Only allow numbers and limit to 11 digits
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      onChange(field, cleaned);
    }
  };

  // Validate middle initial (single letter only)
  const handleMiddleInitialChange = (value: string) => {
    const cleaned = value.replace(/[^A-Za-z]/g, '').toUpperCase();
    if (cleaned.length <= 1) {
      onChange('primary_middle_initial', cleaned);
    }
  };

  // Validate name fields (letters and spaces only)
  const handleNameChange = (field: string, value: string) => {
    const cleaned = value.replace(/[^A-Za-zÑñ\s]/g, '');
    onChange(field, cleaned);
  };

  return (
    <div className="space-y-4">
      {/* Name Fields Row */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-5 space-y-2">
          <Label htmlFor="primary_first_name">
            First Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="primary_first_name"
            value={values.primary_first_name}
            onChange={(e) => handleNameChange('primary_first_name', e.target.value)}
            placeholder="Juan"
            className={cn(errors.primary_first_name && 'border-destructive')}
            disabled={disabled}
            maxLength={50}
          />
          {errors.primary_first_name && (
            <p className="text-sm text-destructive">{errors.primary_first_name}</p>
          )}
        </div>

        <div className="col-span-2 space-y-2">
          <Label htmlFor="primary_middle_initial">M.I.</Label>
          <Input
            id="primary_middle_initial"
            value={values.primary_middle_initial}
            onChange={(e) => handleMiddleInitialChange(e.target.value)}
            placeholder="D"
            className={cn(
              'text-center uppercase',
              errors.primary_middle_initial && 'border-destructive'
            )}
            disabled={disabled}
            maxLength={1}
          />
          {errors.primary_middle_initial && (
            <p className="text-sm text-destructive">{errors.primary_middle_initial}</p>
          )}
        </div>

        <div className="col-span-5 space-y-2">
          <Label htmlFor="primary_last_name">
            Last Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="primary_last_name"
            value={values.primary_last_name}
            onChange={(e) => handleNameChange('primary_last_name', e.target.value)}
            placeholder="Dela Cruz"
            className={cn(errors.primary_last_name && 'border-destructive')}
            disabled={disabled}
            maxLength={50}
          />
          {errors.primary_last_name && (
            <p className="text-sm text-destructive">{errors.primary_last_name}</p>
          )}
        </div>
      </div>

      {/* Position Field */}
      <div className="space-y-2">
        <Label htmlFor="primary_position">Position / Role</Label>
        <Input
          id="primary_position"
          value={values.primary_position}
          onChange={(e) => onChange('primary_position', e.target.value)}
          placeholder="e.g., Executive Director, President, Coordinator"
          className={cn(errors.primary_position && 'border-destructive')}
          disabled={disabled}
          maxLength={100}
        />
        {errors.primary_position && (
          <p className="text-sm text-destructive">{errors.primary_position}</p>
        )}
      </div>

      {/* Email and Phone Row */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="primary_email">
            Email Address <span className="text-destructive">*</span>
          </Label>
          <Input
            id="primary_email"
            type="email"
            value={values.primary_email}
            onChange={(e) => onChange('primary_email', e.target.value)}
            placeholder="contact@charity.org"
            className={cn(errors.primary_email && 'border-destructive')}
            disabled={disabled}
            maxLength={100}
          />
          {errors.primary_email && (
            <p className="text-sm text-destructive">{errors.primary_email}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="primary_phone">
            Phone Number <span className="text-destructive">*</span>
          </Label>
          <Input
            id="primary_phone"
            type="tel"
            value={values.primary_phone}
            onChange={(e) => handlePhoneChange('primary_phone', e.target.value)}
            placeholder="09XXXXXXXXX"
            className={cn(errors.primary_phone && 'border-destructive')}
            disabled={disabled}
            maxLength={11}
          />
          {errors.primary_phone && (
            <p className="text-sm text-destructive">{errors.primary_phone}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Format: 09XXXXXXXXX (11 digits)
          </p>
        </div>
      </div>
    </div>
  );
}
