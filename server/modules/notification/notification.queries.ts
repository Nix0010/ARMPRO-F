import { eq, and, desc } from "drizzle-orm";
import { getDb } from "../../lib/database";
import { notifications } from "../../../drizzle/schema";

export async function getUserNotifications(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(limit);
}

export async function markNotificationRead(userId: number, id: number) {
  const db = await getDb();
  if (!db) return;
  const result = await db.select().from(notifications)
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId))).limit(1);
  if (!result[0]) return false;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  return true;
}

export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return true;
}
