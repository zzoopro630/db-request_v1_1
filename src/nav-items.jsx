import { HomeIcon, Settings } from "lucide-react";
import Index from "./pages/Index.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";

/**
 * Central place for defining the navigation items. Used for navigation components and routing.
 */
export const navItems = [
  {
    title: "Home",
    to: "/",
    icon: <HomeIcon className="h-4 w-4" />,
    page: <Index />,
  },
  {
    title: "Admin",
    to: "/admin",
    icon: <Settings className="h-4 w-4" />,
    page: <AdminDashboard />,
  },
];
