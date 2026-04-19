import { eq, and, desc, asc, lte, inArray } from "drizzle-orm";
import { getDb } from "../../lib/database";
import {
  workoutSessions,
  workoutExercises,
  routines,
  routineExercises,
  exerciseTemplates,
  users,
  type ExerciseTemplate,
} from "../../../drizzle/schema";

// ─── HELPERS (private) ───────────────────────────────────

function normalizeDateKey(date: Date) {
  return `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`;
}

function getDayDifference(from: Date, to: Date) {
  const fromUtc = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  const toUtc   = Date.UTC(to.getUTCFullYear(),   to.getUTCMonth(),   to.getUTCDate());
  return Math.round((toUtc - fromUtc) / (1000 * 60 * 60 * 24));
}

function parseRepCount(reps?: string | null) {
  if (!reps) return 0;
  const match = reps.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function calculateExerciseVolume(exercise: typeof workoutExercises.$inferSelect) {
  if (Array.isArray(exercise.setData) && exercise.setData.length > 0) {
    return exercise.setData.reduce((sum, set) => {
      if (!set?.completed) return sum;
      return sum + (Number(set.reps) || 0) * (Number(set.weight) || 0);
    }, 0);
  }
  const reps         = parseRepCount(exercise.reps);
  const completedSets = exercise.completedSets || 0;
  const weight        = Number(exercise.weight) || 0;
  return reps * completedSets * weight;
}

// ─── WORKOUT QUERIES ─────────────────────────────────────

export async function startWorkout(userId: number, routineId: number) {
  const db = await getDb();
  if (!db) return;

  const routine = await db
    .select()
    .from(routines)
    .where(and(eq(routines.id, routineId), eq(routines.createdById, userId)))
    .limit(1);
  if (!routine[0]) return;

  const exercises = await db
    .select()
    .from(routineExercises)
    .where(eq(routineExercises.routineId, routineId))
    .orderBy(asc(routineExercises.orderIndex));

  const templateIds = exercises.map(e => e.templateId);
  let templates: ExerciseTemplate[] = [];
  if (templateIds.length > 0) {
    // ✅ inArray() instead of sql.raw()
    templates = await db
      .select()
      .from(exerciseTemplates)
      .where(inArray(exerciseTemplates.id, templateIds));
  }

  // ✅ Typed insert — no "as any"
  const result = await db.insert(workoutSessions).values({
    userId,
    routineId,
    status: "in_progress",
  });
  const sessionId = result[0].insertId;

  // ✅ Batch insert instead of sequential loop
  if (exercises.length > 0) {
    const exerciseRows = exercises.map(ex => {
      const template = templates.find(t => t.id === ex.templateId);
      return {
        sessionId,
        templateId: ex.templateId,
        exerciseName: template?.name ?? "Exercise",
        targetSets: ex.sets,
        reps: ex.reps,
        weight: ex.weight != null ? String(ex.weight) : null,
        orderIndex: ex.orderIndex,
        completedSets: 0,
        isCompleted: false,
        isPR: false,
      };
    });
    await db.insert(workoutExercises).values(exerciseRows);
  }

  return sessionId;
}

export async function getActiveWorkout(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const sessions = await db
    .select()
    .from(workoutSessions)
    .where(and(eq(workoutSessions.userId, userId), eq(workoutSessions.status, "in_progress")))
    .orderBy(desc(workoutSessions.startedAt))
    .limit(1);
  if (!sessions[0]) return undefined;

  const exercises = await db
    .select()
    .from(workoutExercises)
    .where(eq(workoutExercises.sessionId, sessions[0].id))
    .orderBy(asc(workoutExercises.orderIndex));

  return { ...sessions[0], exercises };
}

export async function getWorkoutExerciseForUser(exerciseId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select({ exercise: workoutExercises, session: workoutSessions })
    .from(workoutExercises)
    .innerJoin(workoutSessions, eq(workoutExercises.sessionId, workoutSessions.id))
    .where(and(eq(workoutExercises.id, exerciseId), eq(workoutSessions.userId, userId)))
    .limit(1);
  return result[0];
}

// ─── Types for updateWorkoutExercise ─────────────────────

type WorkoutExerciseUpdate = {
  completedSets?: number;
  weight?: number | string | null;
  isCompleted?: boolean;
  isPR?: boolean;
  setData?: Array<{ reps: number; weight: number; completed: boolean }> | null;
};

export async function updateWorkoutExercise(
  userId: number,
  exerciseId: number,
  data: WorkoutExerciseUpdate,
) {
  const db = await getDb();
  if (!db) return;
  const ownedExercise = await getWorkoutExerciseForUser(exerciseId, userId);
  if (!ownedExercise || ownedExercise.session.status !== "in_progress") return false;

  // ✅ Build a typed update payload — no "as any"
  const updatePayload: Partial<typeof workoutExercises.$inferInsert> = {};
  if (data.completedSets !== undefined) updatePayload.completedSets = data.completedSets;
  if (data.weight        !== undefined) updatePayload.weight        = data.weight != null ? String(data.weight) : null;
  if (data.isCompleted   !== undefined) updatePayload.isCompleted   = data.isCompleted;
  if (data.isPR          !== undefined) updatePayload.isPR          = data.isPR;
  if (data.setData       !== undefined) updatePayload.setData       = data.setData;

  await db.update(workoutExercises).set(updatePayload).where(eq(workoutExercises.id, exerciseId));
  return true;
}

export async function getWorkoutSessionForUser(sessionId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(workoutSessions)
    .where(and(eq(workoutSessions.id, sessionId), eq(workoutSessions.userId, userId)))
    .limit(1);
  return result[0];
}

export async function getWorkoutExercisesBySession(sessionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(workoutExercises)
    .where(eq(workoutExercises.sessionId, sessionId))
    .orderBy(asc(workoutExercises.orderIndex));
}

/**
 * Calculates the completion rate of a workout based on completed exercises vs total exercises.
 * A set is considered complete if completedSets >= targetSets.
 * @param {Array<{ isCompleted: boolean; completedSets?: number | null; targetSets?: number | null }>} exercises
 * @returns {number} Completion rate between 0 and 1.
 */
function calculateCompletionRate(exercises: any[]): number {
  if (exercises.length === 0) return 1;
  const completedCount = exercises.filter(
    ex => ex.isCompleted || (ex.completedSets || 0) >= (ex.targetSets || 0)
  ).length;
  return completedCount / exercises.length;
}

/**
 * Calculates the experience points earned from a workout.
 * @param {number} completionRate - The rate of completion (0-1).
 * @param {number} durationSeconds - The total duration of the workout in seconds.
 * @returns {number} XP earned.
 */
function calculateWorkoutXP(completionRate: number, durationSeconds: number): number {
  const durationMinutes = durationSeconds / 60;
  return Math.round(50 + completionRate * 50 + durationMinutes * 5);
}

/**
 * Completes a workout session, calculates experience/volume, and updates the database.
 * @param {number} userId - ID of the user.
 * @param {number} sessionId - ID of the workout session.
 * @param {Object} data - Optional data including duration, notes, and mood.
 */
export async function completeWorkout(
  userId: number,
  sessionId: number,
  data: { duration?: number; notes?: string; mood?: string },
) {
  const db = await getDb();
  if (!db) return;
  const session = await getWorkoutSessionForUser(sessionId, userId);
  if (!session || session.status !== "in_progress") return false;

  const exercises     = await getWorkoutExercisesBySession(sessionId);
  const completedAt   = new Date();
  const inferredDuration =
    data.duration && data.duration > 0
      ? data.duration
      : Math.max(60, Math.round((completedAt.getTime() - new Date(session.startedAt).getTime()) / 1000));

  const completionRate = calculateCompletionRate(exercises);
  const totalVolume    = exercises.reduce((sum, ex) => sum + calculateExerciseVolume(ex), 0);
  const xpEarned       = calculateWorkoutXP(completionRate, inferredDuration);

  // ✅ Typed update payload — no "as any"
  await db.update(workoutSessions).set({
    duration:       inferredDuration,
    xpEarned,
    totalVolume:    String(totalVolume),
    completionRate: String(completionRate),
    notes:          data.notes ?? null,
    mood:           data.mood  ?? null,
    status:         "completed",
    completedAt,
  }).where(eq(workoutSessions.id, sessionId));

  return { duration: inferredDuration, xpEarned, totalVolume, completionRate, completedAt };
}

export async function getUserWorkoutHistory(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(workoutSessions)
    .where(and(eq(workoutSessions.userId, userId), eq(workoutSessions.status, "completed")))
    .orderBy(desc(workoutSessions.completedAt))
    .limit(limit);
}

export async function incrementUserWorkoutStats(userId: number, completedAt: Date) {
  const db = await getDb();
  if (!db) return undefined;
  const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const user = userResult[0];
  if (!user) return undefined;

  const previousSession = await db
    .select()
    .from(workoutSessions)
    .where(and(
      eq(workoutSessions.userId, userId),
      eq(workoutSessions.status, "completed"),
      lte(workoutSessions.completedAt, completedAt),
    ))
    .orderBy(desc(workoutSessions.completedAt))
    .limit(2);

  const priorCompleted = previousSession.find(
    s => normalizeDateKey(s.completedAt as Date) !== normalizeDateKey(completedAt),
  );

  let nextStreak = 1;
  if (priorCompleted?.completedAt) {
    const dayGap = getDayDifference(priorCompleted.completedAt as Date, completedAt);
    if      (dayGap === 0) nextStreak = user.streak || 1;
    else if (dayGap === 1) nextStreak = (user.streak || 0) + 1;
  }

  const totalWorkouts  = (user.totalWorkouts || 0) + 1;
  const longestStreak  = Math.max(user.longestStreak || 0, nextStreak);

  await db.update(users).set({ totalWorkouts, streak: nextStreak, longestStreak }).where(eq(users.id, userId));
  return { totalWorkouts, streak: nextStreak, longestStreak };
}
