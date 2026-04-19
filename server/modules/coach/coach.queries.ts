import { eq, and, desc, inArray } from "drizzle-orm";
import { getDb } from "../../lib/database";
import { users, workoutSessions } from "../../../drizzle/schema";

export async function getCoachAthletes(coachId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatar: users.avatar,
      level: users.level,
      xp: users.xp,
      streak: users.streak,
      totalWorkouts: users.totalWorkouts,
      country: users.country,
      subscriptionTier: users.subscriptionTier,
    })
    .from(users)
    .where(eq(users.assignedCoachId, coachId))
    .orderBy(desc(users.updatedAt));
}

export async function getCoachDashboard(coachId: number) {
  const db = await getDb();
  if (!db) return null;

  const athletes   = await getCoachAthletes(coachId);
  const athleteIds = athletes.map(a => a.id);

  if (athleteIds.length === 0) {
    return { athleteCount: 0, activeThisWeek: 0, totalWorkouts: 0, averageLevel: 0, athletes: [], recentSessions: [] };
  }

  // ✅ inArray() instead of sql.raw()
  const recentSessions = await db
    .select({
      id:             workoutSessions.id,
      userId:         workoutSessions.userId,
      startedAt:      workoutSessions.startedAt,
      completedAt:    workoutSessions.completedAt,
      duration:       workoutSessions.duration,
      xpEarned:       workoutSessions.xpEarned,
      completionRate: workoutSessions.completionRate,
      athleteName:    users.name,
    })
    .from(workoutSessions)
    .innerJoin(users, eq(workoutSessions.userId, users.id))
    .where(and(
      inArray(workoutSessions.userId, athleteIds),
      eq(workoutSessions.status, "completed"),
    ))
    .orderBy(desc(workoutSessions.completedAt))
    .limit(10);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const activeAthletes = new Set(
    recentSessions
      .filter(s => s.completedAt && new Date(s.completedAt) >= weekAgo)
      .map(s => s.userId),
  );

  const totalWorkouts = athletes.reduce((sum, a) => sum + (a.totalWorkouts || 0), 0);
  const averageLevel  =
    athletes.length > 0
      ? Math.round((athletes.reduce((sum, a) => sum + (a.level || 1), 0) / athletes.length) * 10) / 10
      : 0;

  return {
    athleteCount:  athletes.length,
    activeThisWeek: activeAthletes.size,
    totalWorkouts,
    averageLevel,
    athletes,
    recentSessions,
  };
}
