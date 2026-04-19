/**
 * Barrel re-export file.
 *
 * All query / service functions that previously lived in this monolithic file
 * have been moved to domain-specific modules under `server/modules/`.
 *
 * This file re-exports every public function so that:
 *   1. Existing tests (`vi.mock("./db")`) keep working without changes.
 *   2. External consumers (oauth.ts, sdk.ts) keep working.
 *   3. Module routers can `import * as db from "../../db"` and use the same API.
 */

// ─── Database connection ─────────────────────────────────
export { getDb } from "./lib/database";

// ─── User ────────────────────────────────────────────────
export {
  upsertUser,
  getUserByOpenId,
  getUserById,
  updateUserProfile,
  getAllUsers,
} from "./modules/user/user.queries";

// ─── Exercise ────────────────────────────────────────────
export {
  getExercises,
  getExerciseById,
  createExercise,
} from "./modules/exercise/exercise.queries";

// ─── Routine ─────────────────────────────────────────────
export {
  getUserRoutines,
  getRoutineById,
  createRoutine,
  addExerciseToRoutine,
  deleteRoutine,
  countUserRoutines,
} from "./modules/routine/routine.queries";


// ─── Workout ─────────────────────────────────────────────
export {
  startWorkout,
  getActiveWorkout,
  getWorkoutExerciseForUser,
  updateWorkoutExercise,
  getWorkoutSessionForUser,
  getWorkoutExercisesBySession,
  completeWorkout,
  getUserWorkoutHistory,
  incrementUserWorkoutStats,
} from "./modules/workout/workout.queries";

// ─── Progress ────────────────────────────────────────────
export {
  addProgressEntry,
  getUserProgress,
  getUserStats,
} from "./modules/progress/progress.queries";

// ─── Gamification ────────────────────────────────────────
export {
  getAllAchievements,
  getUserAchievements,
  unlockAchievement,
  addXpToUser,
  getLeaderboard,
} from "./modules/gamification/gamification.queries";

export {
  syncUserAchievements,
} from "./modules/gamification/gamification.service";

// ─── AI Coach ────────────────────────────────────────────
export {
  getChatHistory,
  saveChatMessage,
  clearChatHistory,
} from "./modules/aiCoach/aiCoach.queries";

// ─── Calendar ────────────────────────────────────────────
export {
  getUserCalendarEvents,
  createCalendarEvent,
  getCalendarEventForUser,
  updateCalendarEvent,
  deleteCalendarEvent,
} from "./modules/calendar/calendar.queries";

// ─── Marketplace ─────────────────────────────────────────
export {
  getPublishedPrograms,
  getProgramById,
  getUserPurchasedPrograms,
  purchaseProgram,
  purchaseFreeProgram,
} from "./modules/marketplace/marketplace.queries";

// ─── Coach ───────────────────────────────────────────────
export {
  getCoachAthletes,
  getCoachDashboard,
} from "./modules/coach/coach.queries";

// ─── Notification ────────────────────────────────────────
export {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "./modules/notification/notification.queries";

// ─── Admin ───────────────────────────────────────────────
export {
  getSystemStats,
} from "./modules/admin/admin.queries";
