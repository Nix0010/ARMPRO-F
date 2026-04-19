import { eq, and, desc, asc, count } from "drizzle-orm";
import { getDb } from "../../lib/database";
import { cached, invalidate } from "../../lib/cache";
import { achievements, userAchievements, users } from "../../../drizzle/schema";

export async function getAllAchievements() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(achievements).orderBy(asc(achievements.name));
}

export async function getUserAchievements(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userAchievements).where(eq(userAchievements.userId, userId));
}

export async function unlockAchievement(userId: number, achievementId: number) {
  const db = await getDb();
  if (!db) return;
  const existing = await db
    .select()
    .from(userAchievements)
    .where(and(eq(userAchievements.userId, userId), eq(userAchievements.achievementId, achievementId)))
    .limit(1);
  if (existing.length > 0) return false;

  await db.insert(userAchievements).values({
    userId,
    achievementId,
    progress: "100.00",
  });

  const achievement = await db
    .select()
    .from(achievements)
    .where(eq(achievements.id, achievementId))
    .limit(1);
  if (achievement[0]) await addXpToUser(userId, achievement[0].xpReward);

  // New unlock changes leaderboard positions — invalidate cache
  await invalidate("leaderboard:*");
  return true;
}

export async function addXpToUser(userId: number, xpAmount: number) {
  const db = await getDb();
  if (!db) return;
  const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const user = userResult[0];
  if (!user) return;
  const newXp    = (user.xp || 0) + xpAmount;
  const newLevel = Math.floor(newXp / 500) + 1;
  await db.update(users).set({ xp: newXp, level: newLevel }).where(eq(users.id, userId));

  // XP change shifts leaderboard — invalidate cache
  await invalidate("leaderboard:*");
  return { xp: newXp, level: newLevel, leveledUp: newLevel > (user.level || 1) };
}

/**
 * getLeaderboard — cached (2 minutes).
 *
 * The leaderboard is one of the most-read endpoints.
 * At 10 000 users, N concurrent requests would all hit MySQL without cache.
 * With a 2-minute TTL, a burst of 1 000 requests results in 1 DB query.
 *
 * Invalidated automatically whenever a user gains XP or unlocks an achievement.
 */
export async function getLeaderboard(limit = 20) {
  return cached(`leaderboard:${limit}`, 120, async () => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select({
        id:            users.id,
        name:          users.name,
        avatar:        users.avatar,
        xp:            users.xp,
        level:         users.level,
        streak:        users.streak,
        totalWorkouts: users.totalWorkouts,
        country:       users.country,
      })
      .from(users)
      .orderBy(desc(users.xp))
      .limit(limit);
  });
}
