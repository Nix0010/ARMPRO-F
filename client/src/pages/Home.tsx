import { useAuth } from "@/_core/hooks/useAuth";
import { lazy, Suspense } from "react";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import type { AppUser } from "@/lib/types";

// Sub-dashboards are lazy-loaded — only the one matching the user role is fetched
const AthleteDashboard = lazy(() => import("./home/AthleteDashboard"));
const CoachDashboard   = lazy(() => import("./home/CoachDashboard"));
const AdminDashboard   = lazy(() => import("./home/AdminDashboard"));

function DashboardFallback() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
      </div>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Use typed fields — no more (user as any)
  const appRole = (user as AppUser | null)?.appRole;
  const role    = (user as AppUser | null)?.role;

  return (
    <Suspense fallback={<DashboardFallback />}>
      {appRole === "coach"  && <CoachDashboard />}
      {role    === "admin"  && <AdminDashboard />}
      {appRole !== "coach" && role !== "admin" && (
        <AthleteDashboard setLocation={setLocation} user={user as AppUser | null} />
      )}
    </Suspense>
  );
}
