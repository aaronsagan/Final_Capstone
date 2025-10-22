import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Facebook, 
  Twitter, 
  Linkedin, 
  Link2, 
  Check,
  Mail
} from "lucide-react";
import { toast } from "sonner";

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  updateId: number;
  onShare: (platform: string) => void;
}

export default function ShareModal({ open, onClose, updateId, onShare }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/updates/${updateId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      onShare('copy_link');
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleSocialShare = (platform: string, url: string) => {
    window.open(url, '_blank', 'width=600,height=400');
    onShare(platform);
    onClose();
  };

  const shareOptions = [
    {
      name: "Facebook",
      icon: Facebook,
      color: "text-blue-600",
      bgColor: "hover:bg-blue-50",
      onClick: () => handleSocialShare('facebook', `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`),
    },
    {
      name: "Twitter",
      icon: Twitter,
      color: "text-sky-500",
      bgColor: "hover:bg-sky-50",
      onClick: () => handleSocialShare('twitter', `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=Check%20out%20this%20update`),
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      color: "text-blue-700",
      bgColor: "hover:bg-blue-50",
      onClick: () => handleSocialShare('linkedin', `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`),
    },
    {
      name: "Email",
      icon: Mail,
      color: "text-gray-600",
      bgColor: "hover:bg-gray-50",
      onClick: () => {
        window.location.href = `mailto:?subject=Check out this update&body=${encodeURIComponent(shareUrl)}`;
        onShare('email');
        onClose();
      },
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share this update</DialogTitle>
          <DialogDescription>
            Share this update with your friends and followers
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Social Share Options */}
          <div className="grid grid-cols-2 gap-3">
            {shareOptions.map((option) => (
              <Button
                key={option.name}
                variant="outline"
                className={`justify-start ${option.bgColor}`}
                onClick={option.onClick}
              >
                <option.icon className={`mr-2 h-5 w-5 ${option.color}`} />
                {option.name}
              </Button>
            ))}
          </div>

          {/* Copy Link */}
          <div className="space-y-2">
            <Label htmlFor="link">Or copy link</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="link"
                value={shareUrl}
                readOnly
                className="flex-1"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleCopyLink}
                className="shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Link2 className="h-4 w-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
