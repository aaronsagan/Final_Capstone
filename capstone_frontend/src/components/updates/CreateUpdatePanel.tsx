import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, X, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { updatesService } from "@/services/updates";

interface CreateUpdatePanelProps {
  charityName?: string;
  charityLogoUrl?: string | null;
  onSuccess?: () => void;
}

export function CreateUpdatePanel({ charityName, charityLogoUrl, onSuccess }: CreateUpdatePanelProps) {
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

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = async () => {
    if (!content.trim()) { toast.error('Please enter some content'); return; }
    setPosting(true);
    try {
      await updatesService.createUpdate({ content, media: images });
      toast.success('Update posted successfully!');
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
    <Card>
      <CardHeader className="px-6 pt-6 pb-4 border-b border-border/40">
        <h2 className="text-xl font-bold">Create Update</h2>
      </CardHeader>
      <CardContent className="px-6 py-5 space-y-5">
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
                  onClick={() => removeImage(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        <div className="px-0 pt-2 flex items-center justify-between">
          <div>
            <input
              type="file"
              id="update-images-inline"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(Array.from(e.target.files || []))}
              disabled={images.length >= 4}
            />
            <label htmlFor="update-images-inline">
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
      </CardContent>
    </Card>
  );
}
