import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Share2, MapPin, Globe, Phone, Mail, Calendar, Award, Users, TrendingUp, FileText, Target, DollarSign, Clock, Download, Eye, CheckCircle, AlertCircle, Loader2, FileCheck, Building2, Receipt, BarChart3, FolderOpen, Upload, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { authService } from "@/services/auth";
import { buildApiUrl, buildStorageUrl } from "@/lib/api";
import PostCard from "@/components/newsfeed/PostCard";

interface CharityProfile {
  id: number;
  name: string;
  acronym?: string;
  mission: string;
  vision?: string;
  goals?: string;
  category?: string;
  region?: string;
  municipality?: string;
  logo_path?: string;
  cover_image?: string;
  website?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  verification_status: string;
  verified_at?: string;
  total_received?: number;
  documents?: any[];
}

interface Update {
  id: number;
  charity_id: number;
  title?: string;
  content: string;
  media_urls: string[];
  is_pinned: boolean;
  created_at: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_liked: boolean;
  charity?: {
    id: number;
    name: string;
    logo_path?: string;
  };
  children?: Update[];
}

interface Comment {
  id: number;
  update_id: number;
  user_id: number;
  content: string;
  created_at: string;
  user?: {
    id: number;
    name: string;
    role: string;
    profile_image?: string;
    charity?: {
      id: number;
      owner_id: number;
      name: string;
      logo_path?: string;
    };
  };
}

interface Campaign {
  id: number;
  title?: string;
  description?: string;
  target_amount?: number;
  goal_amount?: number;
  current_amount?: number;
  start_date?: string;
  end_date?: string;
  status?: string;
  cover_image_path?: string;
  image_path?: string;
  banner_image?: string;
  created_at?: string;
}

export default function CharityProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [charity, setCharity] = useState<CharityProfile | null>(null);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('about');
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState<number | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string>('');

  useEffect(() => {
    if (id) {
      loadCharityProfile();
      loadCharityUpdates();
      loadCharityCampaigns();
      checkFollowStatus();
    }
  }, [id]);

  const loadCharityProfile = async () => {
    try {
      const response = await fetch(buildApiUrl(`/charities/${id}`));
      if (response.ok) {
        const data = await response.json();
        setCharity(data);
      }
    } catch (error) {
      console.error('Error loading charity profile:', error);
      toast.error('Failed to load charity profile');
    }
  };

  const loadCharityUpdates = async () => {
    try {
      const response = await fetch(buildApiUrl(`/charities/${id}/updates`));
      if (response.ok) {
        const data = await response.json();
        const updatesArray = data.data || data || [];
        console.log('Updates received:', updatesArray);
        // Filter out any null/undefined items
        const validUpdates = Array.isArray(updatesArray) ? updatesArray.filter(u => u && u.id) : [];
        setUpdates(validUpdates);
      }
    } catch (error) {
      console.error('Error loading charity updates:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCharityCampaigns = async () => {
    try {
      const response = await fetch(buildApiUrl(`/charities/${id}/campaigns`));
      if (response.ok) {
        const data = await response.json();
        const campaignsArray = data.data || data || [];
        console.log('Campaigns received:', campaignsArray);
        // Filter out any null/undefined items
        const validCampaigns = Array.isArray(campaignsArray) ? campaignsArray.filter(c => c && c.id) : [];
        setCampaigns(validCampaigns);
      }
    } catch (error) {
      console.error('Error loading charity campaigns:', error);
    }
  };

  const checkFollowStatus = async () => {
    try {
      const token = authService.getToken();
      if (!token) return;
      
      const response = await fetch(buildApiUrl(`/charities/${id}/follow-status`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.is_following);
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleFollowToggle = async () => {
    try {
      const token = authService.getToken();
      if (!token) {
        toast.error('Please login to follow charities');
        return;
      }

      const response = await fetch(buildApiUrl(`/charities/${id}/follow`), {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Follow toggle error:', response.status, errorText);
        throw new Error(`Failed to update follow status (${response.status})`);
      }

      const data = await response.json();
      setIsFollowing(data.is_following);
      toast.success(data.message);
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update follow status');
    }
  };

  const handleViewDocument = async (doc: any) => {
    try {
      setSelectedDocument(doc);
      setIsViewModalOpen(true);
      
      // Check if document has file_path
      if (!doc.file_path) {
        toast.error('Document file path not found');
        setIsViewModalOpen(false);
        return;
      }

      // Build storage URL directly from file_path
      const documentUrl = buildStorageUrl(doc.file_path);
      
      if (!documentUrl) {
        toast.error('Unable to generate document URL');
        setIsViewModalOpen(false);
        return;
      }
      
      setDocumentUrl(documentUrl);
    } catch (error) {
      console.error('Error viewing document:', error);
      toast.error('Failed to load document preview');
      setIsViewModalOpen(false);
    }
  };

  const handleDownloadDocument = async (doc: any) => {
    try {
      setIsDownloading(doc.id);
      
      // Check if document has file_path
      if (!doc.file_path) {
        toast.error('Document file path not found');
        setIsDownloading(null);
        return;
      }

      // Build storage URL for the document
      const documentUrl = buildStorageUrl(doc.file_path);
      
      if (!documentUrl) {
        toast.error('Unable to generate document URL');
        setIsDownloading(null);
        return;
      }

      // Create download link and trigger download
      // Using direct link instead of fetch to avoid CORS issues
      const link = document.createElement('a');
      link.href = documentUrl;
      link.download = doc.file_path?.split('/').pop() || `${doc.doc_type}.pdf`;
      link.target = '_blank'; // Open in new tab as fallback
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      
      toast.success('Document download started');
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    } finally {
      setIsDownloading(null);
    }
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedDocument(null);
    setDocumentUrl('');
  };

  // Update interaction handlers
  const handleLike = async (updateId: number) => {
    try {
      const token = authService.getToken();
      if (!token) {
        toast.error('Please login to like updates');
        return;
      }

      // Optimistic update
      setUpdates(prevUpdates =>
        prevUpdates.map(update =>
          update.id === updateId
            ? {
                ...update,
                is_liked: !update.is_liked,
                likes_count: update.is_liked ? update.likes_count - 1 : update.likes_count + 1
              }
            : update
        )
      );

      const response = await fetch(buildApiUrl(`/updates/${updateId}/like`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        // Revert on error
        setUpdates(prevUpdates =>
          prevUpdates.map(update =>
            update.id === updateId
              ? {
                  ...update,
                  is_liked: !update.is_liked,
                  likes_count: update.is_liked ? update.likes_count + 1 : update.likes_count - 1
                }
              : update
          )
        );
        throw new Error('Failed to like update');
      }
    } catch (error) {
      console.error('Error liking update:', error);
    }
  };

  const handleShare = async (updateId: number, platform: string) => {
    try {
      const token = authService.getToken();
      if (!token) {
        toast.error('Please login to share updates');
        return;
      }

      const response = await fetch(buildApiUrl(`/updates/${updateId}/share`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({ platform })
      });

      if (response.ok) {
        setUpdates(prevUpdates =>
          prevUpdates.map(update =>
            update.id === updateId
              ? { ...update, shares_count: (update.shares_count || 0) + 1 }
              : update
          )
        );
        toast.success(`Shared to ${platform}`);
      }
    } catch (error) {
      console.error('Error sharing update:', error);
      toast.error('Failed to share update');
    }
  };

  const handleFetchComments = async (updateId: number): Promise<Comment[]> => {
    try {
      const token = authService.getToken();
      const response = await fetch(buildApiUrl(`/updates/${updateId}/comments`), {
        headers: {
          Accept: 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.data || data || [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
  };

  const handleAddComment = async (updateId: number, content: string) => {
    try {
      const token = authService.getToken();
      if (!token) {
        toast.error('Please login to comment');
        return;
      }

      const response = await fetch(buildApiUrl(`/updates/${updateId}/comments`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({ content })
      });

      if (response.ok) {
        setUpdates(prevUpdates =>
          prevUpdates.map(update =>
            update.id === updateId
              ? { ...update, comments_count: update.comments_count + 1 }
              : update
          )
        );
        toast.success('Comment added');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const handleDeleteComment = async (commentId: number, updateId: number) => {
    try {
      const token = authService.getToken();
      if (!token) return;

      const response = await fetch(buildApiUrl(`/comments/${commentId}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        setUpdates(prevUpdates =>
          prevUpdates.map(update =>
            update.id === updateId
              ? { ...update, comments_count: Math.max(0, update.comments_count - 1) }
              : update
          )
        );
        toast.success('Comment deleted');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading charity profile...</p>
        </div>
      </div>
    );
  }

  if (!charity) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-muted-foreground mb-2">Charity Not Found</h1>
          <p className="text-muted-foreground">The charity you're looking for doesn't exist or isn't available.</p>
          <Button className="mt-4" onClick={() => navigate('/donor/charities')}>
            Back to Charities
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Cover Image Banner */}
      <div className="relative">
        <div className="w-full h-48 md:h-60 bg-gradient-to-r from-primary/20 to-secondary/20 overflow-hidden">
          {charity.cover_image ? (
            <img
              src={buildStorageUrl(charity.cover_image) || ''}
              alt="Cover"
              className="w-full h-full object-cover transition-all duration-300 hover:brightness-90"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20"></div>
        </div>

        {/* Profile Header Container */}
        <div className="bg-card border-b shadow-md">
          <div className="max-w-6xl mx-auto px-4 md:px-6">
            {/* Logo & Info Row */}
            <div className="relative">
              {/* Charity Logo - Overlapping Banner */}
              <div className="absolute -top-12 md:-top-16 left-0">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-card bg-card shadow-xl">
                  {charity.logo_path ? (
                    <img
                      src={buildStorageUrl(charity.logo_path) || ''}
                      alt={charity.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                      <span className="text-2xl md:text-3xl font-bold text-primary">
                        {charity.acronym || charity.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Header Content - Name, Badges, Buttons */}
              <div className="pt-16 md:pt-20 pb-4">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  {/* Left Side - Charity Info */}
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2 break-words">
                      {charity.name}
                    </h1>
                    {charity.acronym && (
                      <p className="text-base md:text-lg text-muted-foreground mb-3">
                        {charity.acronym}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      {charity.verification_status === 'approved' && (
                        <Badge className="bg-green-600 hover:bg-green-700 text-white border-0 shadow-sm">
                          <Award className="w-3.5 h-3.5 mr-1.5" />
                          Verified
                        </Badge>
                      )}
                      {charity.category && (
                        <Badge variant="secondary" className="text-sm font-medium">
                          {charity.category}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Right Side - Action Buttons */}
                  <div className="flex gap-2 flex-shrink-0 lg:pt-2">
                    <Button 
                      variant={isFollowing ? "default" : "outline"} 
                      onClick={handleFollowToggle}
                      className={`${
                        isFollowing 
                          ? "bg-red-500 hover:bg-red-600 text-white" 
                          : "hover:bg-primary/10"
                      } transition-all duration-200`}
                    >
                      <Heart className={`w-4 h-4 mr-2 ${isFollowing ? 'fill-current' : ''}`} />
                      {isFollowing ? 'Following' : 'Follow'}
                    </Button>
                    <Button variant="outline" className="hover:bg-primary/10 transition-all duration-200">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-3 gap-3 md:gap-4 pb-6">
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-950/10 border-2 border-green-200 dark:border-green-800/50 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
                <div className="text-lg md:text-2xl font-bold text-green-600 dark:text-green-500 mb-1">
                  ₱{charity.total_received?.toLocaleString() || '0'}
                </div>
                <div className="text-xs md:text-sm font-medium text-green-700 dark:text-green-400">
                  Total Raised
                </div>
              </div>
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-950/10 border-2 border-blue-200 dark:border-blue-800/50 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
                <div className="text-lg md:text-2xl font-bold text-blue-600 dark:text-blue-500 mb-1">
                  {campaigns?.length || 0}
                </div>
                <div className="text-xs md:text-sm font-medium text-blue-700 dark:text-blue-400">
                  Active Campaigns
                </div>
              </div>
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-950/10 border-2 border-purple-200 dark:border-purple-800/50 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
                <div className="text-lg md:text-2xl font-bold text-purple-600 dark:text-purple-500 mb-1">
                  {updates?.length || 0}
                </div>
                <div className="text-xs md:text-sm font-medium text-purple-700 dark:text-purple-400">
                  Updates
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div>

          {/* Tabbed Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
            <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="updates">
                Updates {updates && updates.length > 0 && <Badge variant="secondary" className="ml-2">{updates.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="campaigns">
                Campaigns {campaigns && campaigns.length > 0 && <Badge variant="secondary" className="ml-2">{campaigns.length}</Badge>}
              </TabsTrigger>
            </TabsList>

            {/* About Tab */}
            <TabsContent value="about" className="space-y-6 mt-6">
              {/* Mission & Vision */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      Mission
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{charity.mission}</p>
                  </CardContent>
                </Card>

                {charity.vision && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Vision
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{charity.vision}</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Contact Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {charity.contact_email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{charity.contact_email}</span>
                      </div>
                    )}
                    {charity.contact_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{charity.contact_phone}</span>
                      </div>
                    )}
                    {charity.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <a href={charity.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {charity.website}
                        </a>
                      </div>
                    )}
                    {charity.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{charity.address}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Documents & Certificates - Redesigned */}
              {charity.documents && charity.documents.length > 0 && (
                <Card className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-xl">
                          <FileText className="w-5 h-5 text-primary" />
                          Documents & Certificates
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Official records and compliance files for verification
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {/* Document Cards Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {charity.documents.map((doc: any) => {
                        // Determine icon based on document type
                        const getDocIcon = (type: string) => {
                          const lowerType = type.toLowerCase();
                          if (lowerType.includes('tax')) return <Receipt className="w-6 h-6" />;
                          if (lowerType.includes('registration') || lowerType.includes('certificate')) return <Building2 className="w-6 h-6" />;
                          if (lowerType.includes('audit') || lowerType.includes('financial')) return <BarChart3 className="w-6 h-6" />;
                          return <FolderOpen className="w-6 h-6" />;
                        };

                        // Determine status badge (mock for now - can be dynamic from backend)
                        const getStatusBadge = () => {
                          // You can add doc.status from backend
                          return (
                            <Badge className="bg-green-600 hover:bg-green-700 text-white border-0">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          );
                        };

                        return (
                          <Card 
                            key={doc.id} 
                            className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-2 hover:border-primary/50 overflow-hidden"
                          >
                            {/* Card Header with Icon & Status */}
                            <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-4 border-b">
                              <div className="flex items-start justify-between mb-2">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:scale-110 transition-transform">
                                  {getDocIcon(doc.doc_type)}
                                </div>
                                {getStatusBadge()}
                              </div>
                              <h3 className="font-semibold text-base text-foreground line-clamp-2 min-h-[3rem]">
                                {doc.doc_type}
                              </h3>
                            </div>

                            {/* Card Body with Metadata */}
                            <CardContent className="p-4 space-y-3">
                              {/* Upload Date */}
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                <span>Uploaded {new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              </div>

                              {/* File Info (if available) */}
                              {doc.file_size && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <FileCheck className="w-4 h-4" />
                                  <span>{doc.file_size} • PDF</span>
                                </div>
                              )}

                              {/* Action Buttons */}
                              <div className="flex gap-2 pt-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="flex-1 hover:bg-primary/10 hover:text-primary hover:border-primary transition-all"
                                  onClick={() => handleViewDocument(doc)}
                                >
                                  <Eye className="w-4 h-4 mr-1.5" />
                                  View
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="flex-1 hover:bg-green-50 hover:text-green-600 hover:border-green-600 dark:hover:bg-green-950/20 transition-all"
                                  onClick={() => handleDownloadDocument(doc)}
                                  disabled={isDownloading === doc.id}
                                >
                                  {isDownloading === doc.id ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                                      Downloading...
                                    </>
                                  ) : (
                                    <>
                                      <Download className="w-4 h-4 mr-1.5" />
                                      Download
                                    </>
                                  )}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>

                    {/* Empty State (if needed) */}
                    {charity.documents.length === 0 && (
                      <div className="text-center py-12">
                        <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                        <p className="text-muted-foreground text-lg mb-2">No documents uploaded yet</p>
                        <p className="text-sm text-muted-foreground">Documents will appear here once uploaded</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Updates Tab */}
            <TabsContent value="updates" className="mt-6">
              <div className="max-w-2xl mx-auto space-y-4">
                {!updates || updates.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No updates yet. Check back later for news from {charity.name}!</p>
                    </CardContent>
                  </Card>
                ) : (
                  updates.filter(update => update && update.id).map((update) => (
                    <PostCard
                      key={update.id}
                      update={update}
                      currentUserId={undefined}
                      onLike={handleLike}
                      onShare={handleShare}
                      onFetchComments={handleFetchComments}
                      onAddComment={handleAddComment}
                      onDeleteComment={handleDeleteComment}
                    />
                  ))
                )}
              </div>
            </TabsContent>

            {/* Campaigns Tab */}
            <TabsContent value="campaigns" className="space-y-4 mt-6">
              {!campaigns || campaigns.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No active campaigns at the moment.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {campaigns.filter(campaign => campaign && campaign.id).map((campaign) => {
                    const currentAmount = campaign.current_amount || 0;
                    const goalAmount = campaign.target_amount || campaign.goal_amount || 1;
                    const progress = Math.min(Math.round((currentAmount / goalAmount) * 100), 100);
                    const daysLeft = campaign.end_date ? Math.max(0, Math.ceil((new Date(campaign.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0;
                    
                    // Status configuration
                    const statusConfig: Record<string, { label: string; color: string }> = {
                      active: { label: "Active", color: "bg-green-500 hover:bg-green-600" },
                      completed: { label: "Completed", color: "bg-blue-500 hover:bg-blue-600" },
                      draft: { label: "Draft", color: "bg-yellow-500 hover:bg-yellow-600" },
                      expired: { label: "Expired", color: "bg-red-500 hover:bg-red-600" },
                    };
                    const status = statusConfig[campaign.status || 'active'] || statusConfig.active;
                    
                    return (
                      <Card key={campaign.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-border/40">
                        {/* Banner Image */}
                        <div className="relative h-[180px] overflow-hidden bg-muted">
                          {(campaign.cover_image_path || campaign.image_path || campaign.banner_image) ? (
                            <img
                              src={buildStorageUrl(campaign.cover_image_path || campaign.image_path || campaign.banner_image) || ''}
                              alt={campaign.title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5"><svg class="w-16 h-16 text-muted-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/><path d="M12 6v6l4 2" stroke-width="2" stroke-linecap="round"/></svg></div>';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                              <Target className="w-16 h-16 text-muted-foreground/30" />
                            </div>
                          )}
                          
                          {/* Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                          
                          {/* Status Badge */}
                          <div className="absolute top-3 left-3">
                            <Badge className={`${status.color} text-white border-0 shadow-lg px-3 py-1 text-xs font-semibold`}>
                              {status.label}
                            </Badge>
                          </div>
                        </div>

                        {/* Content */}
                        <CardHeader className="pb-2">
                          <h3 className="text-lg font-bold text-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                            {campaign.title || 'Untitled Campaign'}
                          </h3>
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {campaign.description || 'No description available'}
                          </p>
                        </CardHeader>

                        <CardContent className="space-y-3">
                          {/* Progress Bar */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground font-medium">Progress</span>
                              <span className="text-primary font-bold">{progress}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-2 gap-3 pt-1">
                            {/* Left Column */}
                            <div className="space-y-2">
                              <div className="flex items-start gap-1.5">
                                <TrendingUp className="h-3.5 w-3.5 text-green-600 dark:text-green-500 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-[10px] text-muted-foreground">Raised</p>
                                  <p className="text-sm font-bold text-foreground">
                                    ₱{currentAmount.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-purple-600 dark:text-purple-500 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-[10px] text-muted-foreground">Days Left</p>
                                  <p className="text-sm font-semibold text-foreground">
                                    {daysLeft > 0 ? daysLeft : "Ended"}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-2">
                              <div className="flex items-start gap-1.5">
                                <Target className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-[10px] text-muted-foreground">Goal</p>
                                  <p className="text-sm font-bold text-foreground">
                                    ₱{goalAmount.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start gap-1.5">
                                <DollarSign className="h-3.5 w-3.5 text-blue-600 dark:text-blue-500 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-[10px] text-muted-foreground">To Go</p>
                                  <p className="text-sm font-semibold text-foreground">
                                    ₱{Math.max(0, goalAmount - currentAmount).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Button */}
                          <Button 
                            className="w-full h-9 bg-primary hover:bg-primary/90 text-sm" 
                            onClick={() => navigate(`/donor/donate/${charity.id}`)}
                          >
                            <Heart className="w-3.5 h-3.5 mr-1.5" />
                            Donate Now
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Document View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-5xl h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b bg-card">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <DialogTitle className="text-xl font-bold">
                  {selectedDocument?.doc_type || 'Document Preview'}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  Uploaded {selectedDocument?.created_at && new Date(selectedDocument.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeViewModal}
                className="hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto bg-muted/30 p-4">
            {documentUrl ? (
              <div className="w-full h-full bg-white rounded-lg shadow-inner">
                {selectedDocument?.file_path?.toLowerCase().endsWith('.pdf') || 
                 selectedDocument?.doc_type?.toLowerCase().includes('pdf') ? (
                  <iframe
                    src={documentUrl}
                    className="w-full h-full min-h-[600px] rounded-lg"
                    title="Document Preview"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <FileText className="w-20 h-20 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Preview Not Available</h3>
                    <p className="text-muted-foreground mb-4">
                      This file type cannot be previewed in the browser.
                    </p>
                    <Button 
                      onClick={() => handleDownloadDocument(selectedDocument)}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download to View
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading document...</p>
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t bg-card flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {selectedDocument?.file_size && (
                <span className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4" />
                  {selectedDocument.file_size} • PDF
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={closeViewModal}>
                Close
              </Button>
              <Button 
                onClick={() => selectedDocument && handleDownloadDocument(selectedDocument)}
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={isDownloading === selectedDocument?.id}
              >
                {isDownloading === selectedDocument?.id ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bottom Spacing */}
      <div className="h-16 md:h-20"></div>
    </div>
  );
}
