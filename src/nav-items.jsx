import { HomeIcon } from "lucide-react";
import Index from "./pages/Index.jsx";
// import AdminDashboard from "./pages/AdminDashboard.jsx"; // Supabase 미사용으로 비활성화

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
  // AdminDashboard는 Supabase 설정 후 활성화 가능
  // {
  //   title: "Admin",
  //   to: "/admin",
  //   icon: <Settings className="h-4 w-4" />,
  //   page: <AdminDashboard />,
  // },
];
