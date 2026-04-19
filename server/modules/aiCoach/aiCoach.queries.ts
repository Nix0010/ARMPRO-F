import { eq, asc } from "drizzle-orm";
import { getDb } from "../../lib/database";
import { chatMessages } from "../../../drizzle/schema";

type ChatRole = "user" | "assistant" | "system";

export async function getChatHistory(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.userId, userId))
    .orderBy(asc(chatMessages.createdAt))
    .limit(limit);
}

export async function saveChatMessage(data: {
  userId: number;
  role: ChatRole;
  content: string;
}) {
  const db = await getDb();
  if (!db) return;
  // ✅ Typed insert — no "as any"
  await db.insert(chatMessages).values({
    userId:  data.userId,
    role:    data.role,
    content: data.content,
  });
}

export async function clearChatHistory(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(chatMessages).where(eq(chatMessages.userId, userId));
}
