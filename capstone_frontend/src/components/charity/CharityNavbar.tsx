import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Heart, Moon, Sun, User, LogOut, Bell, Building2, FileText, Users, TrendingUp, Settings, ChevronDown, BarChart3, Upload, HelpCircle } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

export const CharityNavbar = () => {
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
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/charity')}>
            <Heart className="h-8 w-8 text-primary fill-primary" />
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              CharityHub
            </span>
          </div>

          {/* Main Navigation - Website Style */}
          <div className="hidden md:flex items-center gap-8">
            <NavLink
              to="/charity"
              end
              className={({ isActive }) =>
                `text-sm font-medium transition-colors hover:text-primary ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/charity/updates"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors hover:text-primary ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`
              }
            >
              Updates
            </NavLink>
            <NavLink
              to="/charity/campaigns"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors hover:text-primary ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`
              }
            >
              Campaigns
            </NavLink>
            <NavLink
              to="/charity/donations"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors hover:text-primary ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`
              }
            >
              Donations
            </NavLink>
            
            {/* Reports & Compliance Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-sm font-medium transition-colors hover:text-primary text-muted-foreground flex items-center gap-1">
                  Reports & Compliance
                  <ChevronDown className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onClick={() => navigate('/charity/reports')} className="cursor-pointer">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Reports & Analytics
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/charity/documents')} className="cursor-pointer">
                  <Upload className="mr-2 h-4 w-4" />
                  Document Uploads / Audits
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                navigate('/charity/notifications');
              }}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] leading-none px-1.5 py-0.5 rounded-full">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
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
                <Button variant="ghost" size="icon" className="rounded-full">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name || 'Charity Admin'}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/charity/profile')} className="cursor-pointer">
                  <Building2 className="mr-2 h-4 w-4" />
                  Charity Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/charity/settings')} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/charity/help-center')} className="cursor-pointer">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Help Center
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};
