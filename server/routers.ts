/**
 * Main application router.
 *
 * Composes the appRouter from domain-specific module routers.
 * Each module lives in `server/modules/<domain>/` with its own
 * queries, service (optional), and router files.
 */

import { router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";

// ─── Module routers ──────────────────────────────────────
import { authRouter } from "./modules/auth/auth.router";
import { exerciseRouter } from "./modules/exercise/exercise.router";
import { routineRouter } from "./modules/routine/routine.router";
import { workoutRouter } from "./modules/workout/workout.router";
import { progressRouter } from "./modules/progress/progress.router";
import { gamificationRouter } from "./modules/gamification/gamification.router";
import { aiCoachRouter } from "./modules/aiCoach/aiCoach.router";
import { calendarRouter } from "./modules/calendar/calendar.router";
import { marketplaceRouter } from "./modules/marketplace/marketplace.router";
import { notificationRouter } from "./modules/notification/notification.router";
import { coachRouter } from "./modules/coach/coach.router";
import { adminRouter } from "./modules/admin/admin.router";

// ─── MAIN ROUTER ─────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  exercise: exerciseRouter,
  routine: routineRouter,
  workout: workoutRouter,
  progress: progressRouter,
  gamification: gamificationRouter,
  aiCoach: aiCoachRouter,
  calendar: calendarRouter,
  marketplace: marketplaceRouter,
  notification: notificationRouter,
  coach: coachRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
