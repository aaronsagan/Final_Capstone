import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { buildApiUrl, getAuthToken } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";

interface CampaignUpdate {
  id: number;
  campaign_id: number;
  title: string;
  content: string;
  is_milestone: boolean;
  image_path?: string;
  created_at: string;
}

interface CampaignUpdateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: number;
  update?: CampaignUpdate | null;
  onSuccess: () => void;
}

export function CampaignUpdateModal({
  open,
  onOpenChange,
  campaignId,
  update,
  onSuccess,
}: CampaignUpdateModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    is_milestone: false,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (update) {
      setFormData({
        title: update.title,
        content: update.content,
        is_milestone: update.is_milestone,
      });
      if (update.image_path) {
        setImagePreview(`http://127.0.0.1:8000/storage/${update.image_path}`);
      }
    } else {
      resetForm();
    }
  }, [update, open]);

  const resetForm = () => {
    setFormData({ title: "", content: "", is_milestone: false });
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2048 * 1024) {
        toast.error("Image must be less than 2MB");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!formData.content.trim()) {
      toast.error("Content is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = getAuthToken();
      if (!token) {
        toast.error("Please login to continue");
        return;
      }

      const submitData = new FormData();
      submitData.append("title", formData.title);
      submitData.append("content", formData.content);
      submitData.append("is_milestone", formData.is_milestone ? "1" : "0");
      if (imageFile) {
        submitData.append("image", imageFile);
      }

      const url = update
        ? buildApiUrl(`/campaign-updates/${update.id}`)
        : buildApiUrl(`/campaigns/${campaignId}/updates`);

      const method = update ? "POST" : "POST"; // Laravel uses POST with _method for PUT
      if (update) {
        submitData.append("_method", "PUT");
      }

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: submitData,
      });

      if (response.ok) {
        toast.success(update ? "Update saved successfully!" : "Update created successfully!");
        onSuccess();
        onOpenChange(false);
        resetForm();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to save update");
      }
    } catch (error) {
      console.error("Error saving update:", error);
      toast.error("Failed to save update");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{update ? "Edit Update" : "Add Campaign Update"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Campaign Milestone Reached"
              maxLength={255}
              required
            />
          </div>

          {/* Content */}
          <div>
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Share details about this update..."
              rows={6}
              required
            />
          </div>

          {/* Image Upload */}
          <div>
            <Label>Image (Optional)</Label>
            <div className="mt-2">
              {imagePreview ? (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Click to upload image</p>
                  <p className="text-xs text-muted-foreground">Max 2MB</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Milestone Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="milestone"
              checked={formData.is_milestone}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_milestone: checked as boolean })
              }
            />
            <Label htmlFor="milestone" className="font-normal cursor-pointer">
              🏁 Mark as Milestone
            </Label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {update ? "Save Changes" : "Create Update"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
