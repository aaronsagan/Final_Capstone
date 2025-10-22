import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, VisuallyHidden } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updatesService } from "@/services/updates";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Image as ImageIcon, X, Loader2, Send } from "lucide-react";

interface CreateUpdateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  charityName?: string;
  charityLogoUrl?: string | null;
}

export function CreateUpdateModal({ open, onOpenChange, onSuccess, charityName, charityLogoUrl }: CreateUpdateModalProps) {
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);

  const handleFiles = (files: File[]) => {
    const limited = [...images, ...files].slice(0, 4);
    setImages(limited);
    const nextPreviews: string[] = [];
    limited.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        nextPreviews.push(reader.result as string);
        if (nextPreviews.length === limited.length) setPreviews(nextPreviews);
      };
      reader.readAsDataURL(file);
    });
  };

  const submit = async () => {
    if (!content.trim()) { toast.error('Please enter some content'); return; }
    setPosting(true);
    try {
      await updatesService.createUpdate({ content, media: images });
      toast.success('Update posted successfully!');
      onOpenChange(false);
      setContent("");
      setImages([]);
      setPreviews([]);
      onSuccess && onSuccess();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to create update');
    } finally {
      setPosting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40">
          <DialogTitle className="text-xl font-bold">Create Update</DialogTitle>
          <VisuallyHidden>
            <DialogDescription>Compose and share a new charity update</DialogDescription>
          </VisuallyHidden>
        </DialogHeader>
        <div className="px-6 py-5 space-y-5">
          <div className="flex items-start gap-3">
            <Avatar className="h-11 w-11 ring-2 ring-background shadow-sm">
              <AvatarImage src={charityLogoUrl || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {(charityName?.substring(0, 2).toUpperCase()) || "CH"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-bold text-sm text-foreground">{charityName || "Your Charity"}</p>
              <p className="text-xs text-muted-foreground">Sharing with your supporters</p>
            </div>
          </div>
          <Textarea
            placeholder="Share an update with your supporters..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={7}
            className="resize-none text-[15px] leading-relaxed border-border/60 focus:border-primary min-h-[160px]"
            autoFocus
          />
          {previews.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {previews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="rounded-xl w-full h-40 object-cover border border-border/40"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                    onClick={() => {
                      setImages((prev) => prev.filter((_, i) => i !== index));
                      setPreviews((prev) => prev.filter((_, i) => i !== index));
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="px-6 py-4 bg-muted/30 border-t border-border/40 flex items-center justify-between">
          <div>
            <input
              type="file"
              id="update-images-modal"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(Array.from(e.target.files || []))}
              disabled={images.length >= 4}
            />
            <label htmlFor="update-images-modal">
              <Button
                variant="outline"
                size="sm"
                asChild
                disabled={images.length >= 4}
                className="cursor-pointer"
              >
                <span>
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Add Photos ({images.length}/4)
                </span>
              </Button>
            </label>
          </div>
          <Button
            onClick={submit}
            disabled={!content.trim() || posting}
            size="lg"
            className="bg-primary hover:bg-primary/90 px-8"
          >
            {posting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-5 w-5" />
                Post Update
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
