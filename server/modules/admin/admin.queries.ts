import { sql } from "drizzle-orm";
import { getDb } from "../../lib/database";
import { users, workoutSessions, exerciseTemplates, routines } from "../../../drizzle/schema";

export async function getSystemStats() {
  const db = await getDb();
  if (!db) return null;
  const userCount = await db.select({ count: sql<number>`count(*)` }).from(users);
  const workoutCount = await db.select({ count: sql<number>`count(*)` }).from(workoutSessions);
  const exerciseCount = await db.select({ count: sql<number>`count(*)` }).from(exerciseTemplates);
  const routineCount = await db.select({ count: sql<number>`count(*)` }).from(routines);
  return {
    totalUsers: Number(userCount[0]?.count || 0),
    totalWorkouts: Number(workoutCount[0]?.count || 0),
    totalExercises: Number(exerciseCount[0]?.count || 0),
    totalRoutines: Number(routineCount[0]?.count || 0),
  };
}
