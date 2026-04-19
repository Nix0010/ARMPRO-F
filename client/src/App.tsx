import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Lazy-loaded pages ────────────────────────────────────
// Each page is a separate chunk. Only the current route's
// chunk is downloaded, reducing initial bundle by ~60%.
const Home        = lazy(() => import("./pages/Home"));
const Exercises   = lazy(() => import("./pages/Exercises"));
const Routines    = lazy(() => import("./pages/Routines"));
const Workout     = lazy(() => import("./pages/Workout"));
const ProgressPage = lazy(() => import("./pages/Progress"));
const Achievements = lazy(() => import("./pages/Achievements"));
const CoachChat   = lazy(() => import("./pages/CoachChat"));
const Calendar    = lazy(() => import("./pages/Calendar"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const Profile     = lazy(() => import("./pages/Profile"));
const Settings    = lazy(() => import("./pages/Settings"));
const Notifications = lazy(() => import("./pages/Notifications"));

// ─── Page loading fallback ────────────────────────────────
function PageSkeleton() {
  return (
    <div className="space-y-6 p-1">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function Router() {
  return (
    <DashboardLayout>
      <Suspense fallback={<PageSkeleton />}>
        <Switch>
          <Route path="/"              component={Home} />
          <Route path="/exercises"     component={Exercises} />
          <Route path="/routines"      component={Routines} />
          <Route path="/workout"       component={Workout} />
          <Route path="/progress"      component={ProgressPage} />
          <Route path="/achievements"  component={Achievements} />
          <Route path="/coach"         component={CoachChat} />
          <Route path="/calendar"      component={Calendar} />
          <Route path="/marketplace"   component={Marketplace} />
          <Route path="/profile"       component={Profile} />
          <Route path="/settings"      component={Settings} />
          <Route path="/notifications" component={Notifications} />
          <Route path="/404"           component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
