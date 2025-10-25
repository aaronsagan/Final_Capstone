import { LayoutDashboard, Users, Building2, Settings, AlertTriangle, Activity, ShieldAlert, Wallet, ShieldCheck, Heart } from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { motion } from "framer-motion";

const navItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Charities", url: "/admin/charities", icon: Building2 },
  { title: "Compliance", url: "/admin/compliance", icon: ShieldAlert },
  { title: "Fund Tracking", url: "/admin/funds", icon: Wallet },
  { title: "Reports", url: "/admin/reports", icon: AlertTriangle },
  { title: "Action Logs", url: "/admin/action-logs", icon: Activity },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

export const AdminSidebar = () => {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="w-56">
      <SidebarContent>
        <SidebarGroup>
          <div className={`py-6 ${isCollapsed ? 'px-0' : 'px-4'}`}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-center gap-2'}`}
            >
              <Heart className="h-8 w-8 text-primary fill-primary flex-shrink-0" />
              {!isCollapsed && (
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent whitespace-nowrap">
                  CharityHub
                </span>
              )}
            </motion.div>
          </div>
          <SidebarGroupContent>
            <SidebarMenu className={`space-y-2 ${isCollapsed ? 'px-0' : 'px-3'}`}>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/admin"}
                      className={({ isActive }) =>
                        `flex items-center w-full ${isCollapsed ? 'justify-center px-0 py-3' : 'gap-3 pl-6 pr-3 py-2.5'} rounded-lg transition-colors ${
                          isActive
                            ? "bg-sidebar-accent text-sidebar-primary font-medium"
                            : "hover:bg-sidebar-accent/50"
                        }`
                      }
                    >
                      <item.icon className={isCollapsed ? "h-6 w-6 flex-shrink-0" : "h-5 w-5 flex-shrink-0"} />
                      {!isCollapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
