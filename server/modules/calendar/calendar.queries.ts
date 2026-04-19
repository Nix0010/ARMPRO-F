import { eq, and, asc, gte, lte } from "drizzle-orm";
import { getDb } from "../../lib/database";
import { calendarEvents } from "../../../drizzle/schema";

type CalendarEventType = "workout" | "rest" | "competition" | "custom";

export async function getUserCalendarEvents(userId: number, startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(calendarEvents.userId, userId)] as ReturnType<typeof eq>[];
  if (startDate) conditions.push(gte(calendarEvents.scheduledAt, startDate));
  if (endDate)   conditions.push(lte(calendarEvents.scheduledAt, endDate));
  return db
    .select()
    .from(calendarEvents)
    .where(and(...conditions))
    .orderBy(asc(calendarEvents.scheduledAt));
}

export async function createCalendarEvent(data: {
  userId: number;
  title: string;
  description?: string | null;
  type?: CalendarEventType;
  routineId?: number | null;
  scheduledAt: Date;
  duration?: number | null;
}) {
  const db = await getDb();
  if (!db) return;
  // ✅ Typed insert — no "as any"
  const result = await db.insert(calendarEvents).values({
    userId:      data.userId,
    title:       data.title,
    description: data.description ?? null,
    type:        data.type ?? "workout",
    routineId:   data.routineId ?? null,
    scheduledAt: data.scheduledAt,
    duration:    data.duration ?? 60,
    isCompleted: false,
  });
  return result[0].insertId;
}

export async function getCalendarEventForUser(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(calendarEvents)
    .where(and(eq(calendarEvents.id, id), eq(calendarEvents.userId, userId)))
    .limit(1);
  return result[0];
}

export async function updateCalendarEvent(
  userId: number,
  id: number,
  data: Partial<{ title: string; description: string; scheduledAt: Date; isCompleted: boolean }>,
) {
  const db = await getDb();
  if (!db) return;
  const ownedEvent = await getCalendarEventForUser(id, userId);
  if (!ownedEvent) return false;
  // ✅ Typed update — no "as any"
  await db.update(calendarEvents).set(data).where(eq(calendarEvents.id, id));
  return true;
}

export async function deleteCalendarEvent(userId: number, id: number) {
  const db = await getDb();
  if (!db) return;
  const ownedEvent = await getCalendarEventForUser(id, userId);
  if (!ownedEvent) return false;
  await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
  return true;
}
