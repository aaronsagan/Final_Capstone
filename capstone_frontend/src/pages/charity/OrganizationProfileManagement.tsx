import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Save, Eye, Users, Image as ImageIcon, Megaphone, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

// Tab Components
import ProfileOverviewTab from "./profile-tabs/ProfileOverviewTab";
import AboutTab from "./profile-tabs/AboutTab";
import TeamTab from "./profile-tabs/TeamTab";
import MediaTab from "./profile-tabs/MediaTab";
import CampaignsTab from "./profile-tabs/CampaignsTab";

export default function OrganizationProfileManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const API_URL = import.meta.env.VITE_API_URL;

  // Shared state for all tabs
  const [profileData, setProfileData] = useState({
    // Basic Info
    name: user?.charity?.name || "",
    tagline: user?.charity?.tagline || "",
    description: user?.charity?.description || "",
    
    // Mission & Vision
    mission: user?.charity?.mission || "",
    vision: user?.charity?.vision || "",
    core_values: user?.charity?.core_values || "",
    history: user?.charity?.history || "",
    
    // Focus Areas
    focus_areas: user?.charity?.focus_areas || [],
    
    // Contact
    address: user?.charity?.address || "",
    email: user?.charity?.email || "",
    phone: user?.charity?.phone || "",
    website: user?.charity?.website || "",
    
    // Social Media
    social_links: user?.charity?.social_links || {},
    
    // Images
    logo: null as File | null,
    banner: null as File | null,
    logoPreview: user?.charity?.logo ? `${API_URL}/storage/${user.charity.logo}` : null,
    bannerPreview: user?.charity?.cover_image ? `${API_URL}/storage/${user.charity.cover_image}` : null,
  });

  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);

  useEffect(() => {
    loadCharityData();
  }, [user]);

  const loadCharityData = async () => {
    if (!user?.charity?.id) return;
    
    try {
      // TODO: Load full charity data from API
      // const response = await fetch(`${API_URL}/api/charities/${user.charity.id}`);
      // const data = await response.json();
      // setProfileData(prev => ({ ...prev, ...data }));
    } catch (error) {
      console.error('Error loading charity data:', error);
    }
  };

  const handleSaveChanges = async () => {
    try {
      setLoading(true);
      
      const formData = new FormData();
      
      // Append all profile data
      Object.entries(profileData).forEach(([key, value]) => {
        if (value !== null && value !== undefined && key !== 'logo' && key !== 'banner' && key !== 'logoPreview' && key !== 'bannerPreview') {
          if (typeof value === 'object') {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value.toString());
          }
        }
      });
      
      // Append files
      if (profileData.logo) formData.append('logo', profileData.logo);
      if (profileData.banner) formData.append('banner', profileData.banner);
      
      // Append team members
      formData.append('team_members', JSON.stringify(teamMembers));

      // TODO: API call to save data
      // const response = await fetch(`${API_URL}/api/charities/${user.charity.id}`, {
      //   method: 'PUT',
      //   body: formData,
      //   headers: { 'Authorization': `Bearer ${token}` }
      // });

      toast.success("Profile updated successfully!");
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleViewPublicProfile = () => {
    if (user?.charity?.id) {
      window.open(`/charity/${user.charity.id}`, '_blank');
    }
  };

  const markAsChanged = () => {
    setHasChanges(true);
  };

  // Prevent navigation with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container flex items-center justify-between px-4 py-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Organization Profile</h1>
            <p className="text-muted-foreground">Manage your public presence</p>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                Unsaved Changes
              </Badge>
            )}
            <Button variant="outline" onClick={handleViewPublicProfile}>
              <Eye className="h-4 w-4 mr-2" />
              Preview Public
            </Button>
            <Button onClick={handleSaveChanges} disabled={loading || !hasChanges}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="about" className="gap-2">
              <Info className="h-4 w-4" />
              <span className="hidden sm:inline">About</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Team</span>
            </TabsTrigger>
            <TabsTrigger value="media" className="gap-2">
              <ImageIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Media</span>
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-2">
              <Megaphone className="h-4 w-4" />
              <span className="hidden sm:inline">Campaigns</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <ProfileOverviewTab
              profileData={profileData}
              setProfileData={setProfileData}
              markAsChanged={markAsChanged}
            />
          </TabsContent>

          <TabsContent value="about">
            <AboutTab
              profileData={profileData}
              setProfileData={setProfileData}
              markAsChanged={markAsChanged}
            />
          </TabsContent>

          <TabsContent value="team">
            <TeamTab
              teamMembers={teamMembers}
              setTeamMembers={setTeamMembers}
              markAsChanged={markAsChanged}
            />
          </TabsContent>

          <TabsContent value="media">
            <MediaTab
              mediaItems={mediaItems}
              setMediaItems={setMediaItems}
              markAsChanged={markAsChanged}
              charityId={user?.charity?.id}
            />
          </TabsContent>

          <TabsContent value="campaigns">
            <CampaignsTab
              campaigns={campaigns}
              setCampaigns={setCampaigns}
              charityId={user?.charity?.id}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
