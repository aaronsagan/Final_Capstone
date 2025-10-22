import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Heart, Moon, Sun, User, LogOut, UserCircle, History, TrendingUp, Bell, AlertTriangle, Settings, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export const DonorNavbar = () => {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    let timer: number | undefined;
    const fetchUnread = async () => {
      try {
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        if (!token) return;
        const res = await fetch(`${API_URL}/notifications/unread-count`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        setUnreadCount(data.count ?? data);
      } catch {
        // ignore polling errors
      }
    };
    fetchUnread();
    timer = window.setInterval(fetchUnread, 30000);
    return () => { if (timer) window.clearInterval(timer); };
  }, [API_URL]);

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/donor')}>
            <Heart className="h-8 w-8 text-primary fill-primary" />
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              CharityHub
            </span>
          </div>

          {/* Main Navigation - Website Style */}
          <div className="hidden md:flex items-center gap-8">
            <NavLink
              to="/donor"
              end
              className={({ isActive }) =>
                `text-sm font-medium transition-colors hover:text-primary ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/donor/news-feed"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors hover:text-primary ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`
              }
            >
              News Feed
            </NavLink>
            <NavLink
              to="/donor/charities"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors hover:text-primary ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`
              }
            >
              Charities
            </NavLink>
            <NavLink
              to="/donor/history"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors hover:text-primary ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`
              }
            >
              My Donations
            </NavLink>
            <NavLink
              to="/donor/help"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors hover:text-primary ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`
              }
            >
              Help Center
            </NavLink>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-full"
              onClick={() => {
                if (!user) { navigate('/auth/login'); return; }
                navigate('/donor/notifications');
              }}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] leading-none px-1.5 py-0.5 rounded-full">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
            {/* Donate Button */}
            <Button onClick={() => navigate('/donor/donate')} size="sm" className="hidden md:flex">
              <Heart className="mr-2 h-4 w-4" />
              Donate Now
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 transition-colors">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-64 shadow-lg animate-in fade-in-0 zoom-in-95 slide-in-from-top-2"
              >
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name || 'Donor'}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* Profile Section */}
                <DropdownMenuItem 
                  onClick={() => navigate('/donor/profile')} 
                  className="cursor-pointer hover:bg-primary/10 focus:bg-primary/10 transition-colors py-2"
                >
                  <UserCircle className="mr-3 h-4 w-4 text-primary" />
                  <span className="font-medium">My Profile</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={() => navigate('/donor/edit-profile')} 
                  className="cursor-pointer hover:bg-primary/10 focus:bg-primary/10 transition-colors py-2"
                >
                  <Settings className="mr-3 h-4 w-4 text-primary" />
                  <span className="font-medium">Edit Profile</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={() => navigate('/donor/settings')} 
                  className="cursor-pointer hover:bg-primary/10 focus:bg-primary/10 transition-colors py-2"
                >
                  <Settings className="mr-3 h-4 w-4 text-primary" />
                  <span className="font-medium">Account Settings</span>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {/* Mobile-only navigation items */}
                <div className="md:hidden">
                  <DropdownMenuItem onClick={() => navigate('/donor/history')} className="cursor-pointer hover:bg-muted transition-colors py-2">
                    <History className="mr-3 h-4 w-4" />
                    Donation History
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/donor/transparency')} className="cursor-pointer hover:bg-muted transition-colors py-2">
                    <TrendingUp className="mr-3 h-4 w-4" />
                    Fund Transparency
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/donor/help')} className="cursor-pointer hover:bg-muted transition-colors py-2">
                    <HelpCircle className="mr-3 h-4 w-4" />
                    Help Center
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </div>
                
                {/* Logout */}
                <DropdownMenuItem 
                  onClick={handleLogout} 
                  className="cursor-pointer text-destructive hover:text-destructive hover:bg-destructive/10 focus:text-destructive focus:bg-destructive/10 transition-colors py-2"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  <span className="font-medium">Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};
