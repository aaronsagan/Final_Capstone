import { useState, useEffect } from "react";
import { Search, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { authService } from "@/services/auth";
import CharityCard from "@/components/donor/CharityCard";

interface Charity {
  id: number;
  name: string;
  mission?: string;
  vision?: string;
  category?: string;
  region?: string;
  municipality?: string;
  logo_path?: string;
  verification_status: string;
  created_at: string;
}

interface ApiResponse {
  charities: {
    data: Charity[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  filters: {
    categories: string[];
    regions: string[];
  };
}

export default function BrowseCharities() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [charities, setCharities] = useState<Charity[]>([]);
  const [filters, setFilters] = useState({ categories: [], regions: [] });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [followStatus, setFollowStatus] = useState<{[key: number]: boolean}>({});
  
  // Add missing reset function to avoid runtime ReferenceError
  const resetFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setRegionFilter("all");
    setSortBy("name");
    setCurrentPage(1);
  };

  useEffect(() => {
    fetchCharities();
  }, [searchTerm, categoryFilter, regionFilter, sortBy, currentPage]);

  const fetchCharities = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        ...(searchTerm && { q: searchTerm }),
        ...(categoryFilter !== 'all' && { category: categoryFilter }),
        ...(regionFilter !== 'all' && { region: regionFilter }),
        ...(sortBy && { sort: sortBy }),
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/charities?${params}`);
      if (!response.ok) throw new Error('Failed to fetch charities');

      const data: ApiResponse = await response.json();
      setCharities(data.charities.data || []);
      setFilters(data.filters || { categories: [], regions: [] });
      setTotalPages(data.charities.last_page);
    } catch (error) {
      console.error('Error fetching charities:', error);
      toast.error('Failed to load charities');
      setCharities([]);
      setFilters({ categories: [], regions: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUpdate = (charityId: number) => {
    // Refresh follow statuses after a follow/unfollow action
    fetchFollowStatuses();
  };

  useEffect(() => {
    if (charities.length > 0) {
      fetchFollowStatuses();
    }
  }, [charities]);

  const fetchFollowStatuses = async () => {
    try {
      const token = authService.getToken();
      if (!token) return;

      const statusPromises = charities.map(async (charity) => {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/charities/${charity.id}/follow-status`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            return { charityId: charity.id, isFollowing: data.is_following };
          }
        } catch (error) {
          console.error(`Error fetching follow status for charity ${charity.id}:`, error);
        }
        return { charityId: charity.id, isFollowing: false };
      });

      const statuses = await Promise.all(statusPromises);
      const statusMap: {[key: number]: boolean} = {};
      statuses.forEach(status => {
        statusMap[status.charityId] = status.isFollowing;
      });
      setFollowStatus(statusMap);
    } catch (error) {
      console.error('Error fetching follow statuses:', error);
    }
  };


  return (
    <div>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-4">Browse Charities</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Discover verified organizations making a difference
          </p>

          {/* Search and Filter */}
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search charities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {filters.categories && filters.categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {filters.regions && filters.regions.map(region => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="total_received">Most Raised</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={resetFilters}>
                <Filter className="mr-2 h-4 w-4" />
                Reset Filters
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Results Count and Loading */}
        <div className="mb-6 flex justify-between items-center">
          <p className="text-muted-foreground">
            {loading ? 'Loading...' : `Showing ${charities.length} of ${filters.categories.length > 0 ? 'many' : '0'} charities`}
          </p>
          {charities.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="px-3 py-2 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>

        {/* Charities Grid */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-56 bg-muted rounded-t-lg"></div>
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded mb-4"></div>
                  <div className="h-8 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
            {charities.map((charity) => (
              <CharityCard
                key={charity.id}
                charity={charity}
                isFollowing={followStatus[charity.id]}
                onFollowToggle={handleFollowUpdate}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && charities.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">
              No charities found matching your criteria. Try adjusting your search or filters.
            </p>
          </Card>
        )}
      </div>

    </div>
  );
}
