import { Edit, MessageSquare, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ActionBarProps {
  onEdit: () => void;
  onPostUpdate: () => void;
  onCreateCampaign: () => void;
}

export function ActionBar({ onEdit, onPostUpdate, onCreateCampaign }: ActionBarProps) {
  return (
    <>
      {/* Mobile - Bottom Sticky Only */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-background border-t shadow-lg p-3">
        <div className="flex gap-2 justify-around max-w-md mx-auto">
          <Button
            onClick={onEdit}
            variant="outline"
            size="sm"
            className="flex-1 hover:shadow-md transition-all duration-150"
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            onClick={onPostUpdate}
            variant="outline"
            size="sm"
            className="flex-1 hover:shadow-md transition-all duration-150"
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            Update
          </Button>
          <Button
            onClick={onCreateCampaign}
            variant="outline"
            size="sm"
            className="flex-1 hover:shadow-md transition-all duration-150"
          >
            <Target className="h-4 w-4 mr-1" />
            Campaign
          </Button>
        </div>
      </div>
    </>
  );
}
