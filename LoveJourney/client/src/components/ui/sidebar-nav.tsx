import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { CalendarHeart, Camera, Calendar, LogOut, Menu } from "lucide-react";
import { useState } from "react";

const routes = [
  {
    title: "Dashboard",
    path: "/",
    icon: CalendarHeart,
  },
  {
    title: "Daily Questions",
    path: "/daily-questions",
    icon: Calendar,
  },
  {
    title: "Memories",
    path: "/memories",
    icon: Camera,
  },
];

export function SidebarNav() {
  const [location] = useLocation();
  const { logoutMutation } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 right-4 z-50 lg:hidden"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <Menu className="h-6 w-6" />
      </Button>

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-background transition-all duration-300 lg:static",
          isCollapsed ? "-translate-x-full lg:translate-x-0 lg:w-64" : "w-64"
        )}
      >
        <div className="px-3 py-4">
          <h2 className="mb-4 px-4 text-lg font-semibold tracking-tight">
            Love Journey
          </h2>
          <div className="space-y-1">
            {routes.map((route) => {
              const Icon = route.icon;
              return (
                <Link key={route.path} href={route.path}>
                  <Button
                    variant={location === route.path ? "secondary" : "ghost"}
                    className={cn("w-full justify-start", {
                      "bg-accent text-accent-foreground":
                        location === route.path,
                    })}
                    onClick={() => setIsCollapsed(true)}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {route.title}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
        <div className="mt-auto p-4">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => logoutMutation.mutate()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}
    </>
  );
}