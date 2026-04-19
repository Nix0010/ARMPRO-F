import { eq, and, desc } from "drizzle-orm";
import { getDb } from "../../lib/database";
import { programs, programPurchases, programReviews, users, type Program } from "../../../drizzle/schema";

type ProgramDifficulty = "beginner" | "intermediate" | "advanced" | "elite";

export async function getPublishedPrograms(filters?: {
  category?: string;
  difficulty?: string;
  search?: string;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(programs.isPublished, true)] as ReturnType<typeof eq>[];
  if (filters?.difficulty && filters.difficulty !== "all") {
    // ✅ Typed enum cast — no "as any"
    conditions.push(eq(programs.difficulty, filters.difficulty as ProgramDifficulty));
  }
  const results = await db
    .select()
    .from(programs)
    .where(and(...conditions))
    .orderBy(desc(programs.rating));

  let filtered = results;
  if (filters?.search) {
    const s = filters.search.toLowerCase();
    filtered = results.filter(
      p => p.name.toLowerCase().includes(s) || (p.description && p.description.toLowerCase().includes(s)),
    );
  }
  if (filters?.category && filters.category !== "all") {
    filtered = filtered.filter(p => p.category === filters.category);
  }
  return filtered;
}

export async function getProgramById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(programs).where(eq(programs.id, id)).limit(1);
  if (!result[0]) return undefined;

  const reviews = await db
    .select()
    .from(programReviews)
    .where(eq(programReviews.programId, id))
    .orderBy(desc(programReviews.createdAt))
    .limit(10);

  let creator: typeof users.$inferSelect | undefined;
  if (result[0].createdById) {
    const creatorResult = await db
      .select()
      .from(users)
      .where(eq(users.id, result[0].createdById))
      .limit(1);
    creator = creatorResult[0];
  }

  return { ...result[0], reviews, creator };
}

export async function getUserPurchasedPrograms(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(programPurchases).where(eq(programPurchases.userId, userId));
}

export async function purchaseProgram(userId: number, programId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const program = await db.select().from(programs).where(eq(programs.id, programId)).limit(1);
  if (!program[0]) return { status: "not_found" as const };

  const existing = await db
    .select()
    .from(programPurchases)
    .where(and(eq(programPurchases.userId, userId), eq(programPurchases.programId, programId)))
    .limit(1);
  if (existing[0]) return { status: "already_owned" as const };

  const price = Number(program[0].price) || 0;

  // ✅ Typed insert — no "as any"
  await db.insert(programPurchases).values({
    userId,
    programId,
    amount: String(price),
  });

  await db.update(programs).set({
    purchaseCount: (program[0].purchaseCount || 0) + 1,
  }).where(eq(programs.id, programId));

  return {
    status:  "acquired" as const,
    amount:  price,
    isFree:  price <= 0,
  };
}

export async function purchaseFreeProgram(userId: number, programId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const program = await db.select().from(programs).where(eq(programs.id, programId)).limit(1);
  if (!program[0]) return { status: "not_found" as const };
  if (Number(program[0].price) > 0) return { status: "paid_only" as const };
  return purchaseProgram(userId, programId);
}
