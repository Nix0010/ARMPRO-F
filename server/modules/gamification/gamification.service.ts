import { eq, and, sql } from "drizzle-orm";
import { getDb } from "../../lib/database";
import { workoutSessions, workoutExercises } from "../../../drizzle/schema";
import { getAllAchievements, unlockAchievement } from "./gamification.queries";
import { getUserStats } from "../progress/progress.queries";

/**
 * Evaluate all achievements for a user and unlock any that are newly met.
 * Returns an array of newly unlocked achievement IDs.
 */
export async function syncUserAchievements(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const stats = await getUserStats(userId);
  if (!stats) return [];
  const prCountResult = await db.select({ count: sql<number>`count(*)` }).from(workoutExercises)
    .innerJoin(workoutSessions, eq(workoutExercises.sessionId, workoutSessions.id))
    .where(and(eq(workoutSessions.userId, userId), eq(workoutExercises.isPR, true)));
  const metrics = {
    totalWorkouts: stats.totalWorkouts,
    streak: stats.streak,
    longestStreak: stats.longestStreak,
    totalVolume: stats.totalVolume,
    prs: Number(prCountResult[0]?.count || 0),
    hookExercises: 0,
    toprollExercises: 0,
    earlyWorkout: 0,
    lateWorkout: 0,
  };
  const completedSessions = await db.select().from(workoutSessions)
    .where(and(eq(workoutSessions.userId, userId), eq(workoutSessions.status, "completed")));
  for (const session of completedSessions) {
    const completedAt = session.completedAt ? new Date(session.completedAt) : null;
    if (completedAt) {
      const hour = completedAt.getHours();
      if (hour < 7) metrics.earlyWorkout += 1;
      if (hour >= 22) metrics.lateWorkout += 1;
    }
  }
  const exerciseRows = await db.select({
    exerciseName: workoutExercises.exerciseName,
    isCompleted: workoutExercises.isCompleted,
    completedSets: workoutExercises.completedSets,
  }).from(workoutExercises)
    .innerJoin(workoutSessions, eq(workoutExercises.sessionId, workoutSessions.id))
    .where(and(
      eq(workoutSessions.userId, userId),
      eq(workoutSessions.status, "completed"),
    ));
  for (const exercise of exerciseRows) {
    const performed = exercise.isCompleted || (exercise.completedSets || 0) > 0;
    if (!performed) continue;
    const name = (exercise.exerciseName || "").toLowerCase();
    if (name.includes("hook")) metrics.hookExercises += 1;
    if (name.includes("toproll")) metrics.toprollExercises += 1;
  }
  const allAchievements = await getAllAchievements();
  const unlocked: number[] = [];
  for (const achievement of allAchievements) {
    const criteria = achievement.criteria || {};
    const criteriaEntries = Object.entries(criteria);
    if (criteriaEntries.length === 0) continue;
    const matches = criteriaEntries.every(([key, value]) => {
      const metricValue = metrics[key as keyof typeof metrics];
      if (metricValue === undefined) return false;
      return metricValue >= Number(value);
    });
    if (!matches) continue;
    const didUnlock = await unlockAchievement(userId, achievement.id);
    if (didUnlock) unlocked.push(achievement.id);
  }
  return unlocked;
}
