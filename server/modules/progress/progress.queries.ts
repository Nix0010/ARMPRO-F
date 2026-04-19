import { eq, and, desc, asc, sum, count } from "drizzle-orm";
import { getDb } from "../../lib/database";
import { progressEntries, workoutSessions, userAchievements, users } from "../../../drizzle/schema";

// ─── PROGRESS QUERIES ────────────────────────────────────

export async function addProgressEntry(data: {
  userId: number;
  type: string;
  metric: string;
  value: number;
  previousValue?: number;
  unit?: string;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(progressEntries).values({
    userId:        data.userId,
    type:          data.type,
    metric:        data.metric,
    value:         String(data.value),
    previousValue: data.previousValue != null ? String(data.previousValue) : null,
    unit:          data.unit ?? "kg",
    notes:         data.notes ?? null,
  });
}

export async function getUserProgress(userId: number, metric?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(progressEntries.userId, userId)] as ReturnType<typeof eq>[];
  if (metric) conditions.push(eq(progressEntries.metric, metric));
  return db
    .select()
    .from(progressEntries)
    .where(and(...conditions))
    .orderBy(desc(progressEntries.date))
    .limit(100);
}

// ─── STATS QUERIES ────────────────────────────────────────

/**
 * Optimized getUserStats.
 *
 * BEFORE: fetched ALL completed sessions into JS, then did two `.reduce()` loops
 *         → O(n) data transfer from DB even for users with 1 000 workouts.
 *
 * AFTER:  single SQL query with SUM() and COUNT() aggregations.
 *         MySQL does the math, only 1 row is transferred.
 *         For a user with 1 000 workouts this goes from ~40 KB → ~100 bytes.
 */
export async function getUserStats(userId: number) {
  const db = await getDb();
  if (!db) return null;

  // Fetch user fields (xp, level, streak) — already indexed by primary key
  const userResult = await db
    .select({
      xp:            users.xp,
      level:         users.level,
      streak:        users.streak,
      longestStreak: users.longestStreak,
      totalWorkouts: users.totalWorkouts,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const user = userResult[0];
  if (!user) return null;

  // ✅ SQL aggregation — replaces two JS .reduce() loops over full result set
  const aggResult = await db
    .select({
      totalVolume:   sum(workoutSessions.totalVolume).as("totalVolume"),
      totalDuration: sum(workoutSessions.duration).as("totalDuration"),
      sessionCount:  count(workoutSessions.id).as("sessionCount"),
    })
    .from(workoutSessions)
    .where(and(
      eq(workoutSessions.userId, userId),
      eq(workoutSessions.status, "completed"),
    ));

  const agg = aggResult[0];
  const totalVolume   = Number(agg?.totalVolume   ?? 0);
  const totalDuration = Number(agg?.totalDuration ?? 0);
  const sessionCount  = Number(agg?.sessionCount  ?? 0);

  // ✅ SQL COUNT — replaces full SELECT + .length
  const achResult = await db
    .select({ cnt: count(userAchievements.id).as("cnt") })
    .from(userAchievements)
    .where(eq(userAchievements.userId, userId));

  const achievementCount = Number(achResult[0]?.cnt ?? 0);

  return {
    totalWorkouts:        user.totalWorkouts || 0,
    totalVolume:          Math.round(totalVolume),
    totalDuration:        Math.round(totalDuration / 60),
    averageDuration:      sessionCount > 0 ? Math.round(totalDuration / sessionCount / 60) : 0,
    xp:                   user.xp || 0,
    level:                user.level || 1,
    streak:               user.streak || 0,
    longestStreak:        user.longestStreak || 0,
    achievementsUnlocked: achievementCount,
  };
}
