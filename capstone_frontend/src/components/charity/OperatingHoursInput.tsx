import { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Plus, X } from "lucide-react";

interface TimeSlot {
  id: string;
  days: string;
  openTime: string;
  closeTime: string;
}

interface OperatingHoursInputProps {
  value: string;
  onChange: (value: string) => void;
}

const DAY_OPTIONS = [
  { value: "Mon-Fri", label: "Monday - Friday" },
  { value: "Mon-Sat", label: "Monday - Saturday" },
  { value: "Mon-Sun", label: "Monday - Sunday" },
  { value: "Sat-Sun", label: "Saturday - Sunday" },
  { value: "Monday", label: "Monday" },
  { value: "Tuesday", label: "Tuesday" },
  { value: "Wednesday", label: "Wednesday" },
  { value: "Thursday", label: "Thursday" },
  { value: "Friday", label: "Friday" },
  { value: "Saturday", label: "Saturday" },
  { value: "Sunday", label: "Sunday" },
];

const TIME_OPTIONS = [
  "12:00 AM", "12:30 AM", "1:00 AM", "1:30 AM", "2:00 AM", "2:30 AM",
  "3:00 AM", "3:30 AM", "4:00 AM", "4:30 AM", "5:00 AM", "5:30 AM",
  "6:00 AM", "6:30 AM", "7:00 AM", "7:30 AM", "8:00 AM", "8:30 AM",
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
  "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM",
  "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM",
  "9:00 PM", "9:30 PM", "10:00 PM", "10:30 PM", "11:00 PM", "11:30 PM"
];

export function OperatingHoursInput({ value, onChange }: OperatingHoursInputProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    { id: "1", days: "Mon-Fri", openTime: "9:00 AM", closeTime: "5:00 PM" }
  ]);
  const isInitialized = useRef(false);

  // Parse existing value on mount only
  useEffect(() => {
    if (!isInitialized.current && value && value.trim()) {
      const parsed = parseOperatingHours(value);
      if (parsed.length > 0) {
        setTimeSlots(parsed);
      }
      isInitialized.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Update parent when slots change (but only after initialization)
  useEffect(() => {
    if (isInitialized.current) {
      const formatted = formatOperatingHours(timeSlots);
      if (formatted !== value) {
        onChange(formatted);
      }
    } else if (timeSlots.length > 0 && timeSlots[0].days === "Mon-Fri") {
      // First render with default - mark as initialized
      isInitialized.current = true;
    }
  }, [timeSlots, value, onChange]);

  const parseOperatingHours = (str: string): TimeSlot[] => {
    try {
      // Try to parse formats like "Mon-Fri: 9:00 AM-5:00 PM" or "Mon-Fri: 9am-5pm"
      const parts = str.split(/[,;]/).map(s => s.trim()).filter(Boolean);
      return parts.map((part, idx) => {
        const match = part.match(/^(.+?):\s*(.+?)\s*-\s*(.+?)$/);
        if (match) {
          const [, days, open, close] = match;
          return {
            id: String(idx + 1),
            days: days.trim(),
            openTime: normalizeTime(open.trim()),
            closeTime: normalizeTime(close.trim())
          };
        }
        return { id: String(idx + 1), days: "Mon-Fri", openTime: "9:00 AM", closeTime: "5:00 PM" };
      });
    } catch {
      return [];
    }
  };

  const normalizeTime = (time: string): string => {
    // Convert formats like "9am" to "9:00 AM"
    const ampm = time.toLowerCase().includes("pm") ? "PM" : "AM";
    const numStr = time.replace(/[^\d:]/g, "");
    if (numStr.includes(":")) return numStr + " " + ampm;
    return numStr + ":00 " + ampm;
  };

  const formatOperatingHours = (slots: TimeSlot[]): string => {
    return slots
      .filter(slot => slot.days && slot.openTime && slot.closeTime)
      .map(slot => `${slot.days}: ${slot.openTime}-${slot.closeTime}`)
      .join(", ");
  };

  const addTimeSlot = () => {
    setTimeSlots([
      ...timeSlots,
      { id: String(Date.now()), days: "Mon-Fri", openTime: "9:00 AM", closeTime: "5:00 PM" }
    ]);
  };

  const removeTimeSlot = (id: string) => {
    if (timeSlots.length > 1) {
      setTimeSlots(timeSlots.filter(slot => slot.id !== id));
    }
  };

  const updateTimeSlot = (id: string, field: keyof TimeSlot, value: string) => {
    setTimeSlots(timeSlots.map(slot => 
      slot.id === id ? { ...slot, [field]: value } : slot
    ));
  };

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <Clock className="h-4 w-4" />
        Operating Hours
      </Label>
      
      <div className="space-y-3">
        {timeSlots.map((slot, index) => (
          <div key={slot.id} className="flex items-center gap-2">
            <div className="flex-1 grid grid-cols-3 gap-2">
              <Select value={slot.days} onValueChange={(value) => updateTimeSlot(slot.id, "days", value)}>
                <SelectTrigger className="border-border/60 focus:border-primary">
                  <SelectValue placeholder="Select days" />
                </SelectTrigger>
                <SelectContent>
                  {DAY_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={slot.openTime} onValueChange={(value) => updateTimeSlot(slot.id, "openTime", value)}>
                <SelectTrigger className="border-border/60 focus:border-primary">
                  <SelectValue placeholder="Open" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {TIME_OPTIONS.map(time => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={slot.closeTime} onValueChange={(value) => updateTimeSlot(slot.id, "closeTime", value)}>
                <SelectTrigger className="border-border/60 focus:border-primary">
                  <SelectValue placeholder="Close" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {TIME_OPTIONS.map(time => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {timeSlots.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeTimeSlot(slot.id)}
                className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {timeSlots.length < 7 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addTimeSlot}
          className="w-full border-dashed"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Time Slot
        </Button>
      )}

      <div className="text-xs text-muted-foreground mt-2">
        Example: Mon-Fri: 9:00 AM-5:00 PM, Sat: 10:00 AM-2:00 PM
      </div>
    </div>
  );
}
