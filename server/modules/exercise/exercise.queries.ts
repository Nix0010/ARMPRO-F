import { eq, and, asc } from "drizzle-orm";
import { getDb } from "../../lib/database";
import { cached, invalidate } from "../../lib/cache";
import { exerciseTemplates, type ExerciseTemplate } from "../../../drizzle/schema";

type ExerciseCategory = "armwrestling" | "strength" | "technique" | "conditioning" | "mobility";
type ExerciseDifficulty = "beginner" | "intermediate" | "advanced" | "elite";

type CreateExerciseInput = {
  name: string;
  nameEn?: string | null;
  description?: string | null;
  category?: ExerciseCategory;
  difficulty?: ExerciseDifficulty;
  muscles?: string[];
  equipment?: string[];
  instructions?: string[];
  tips?: string[];
  commonMistakes?: string[];
  imageUrl?: string | null;
  videoUrl?: string | null;
  isPublic?: boolean;
  createdById?: number | null;
};

/** Stable cache key that reflects the active filters. */
function exerciseCacheKey(filters?: { category?: string; difficulty?: string; search?: string }) {
  const cat  = filters?.category   || "all";
  const diff = filters?.difficulty || "all";
  const srch = filters?.search     || "";
  return `exercises:list:${cat}:${diff}:${srch}`;
}

/**
 * getExercises — cached (5 minutes).
 *
 * Exercises change rarely (only when admins add/edit them) so caching
 * all reads reduces DB load significantly under high traffic:
 *   - 10 000 users browsing exercises → 0 DB queries (all from cache).
 *   - Cache invalidated automatically when createExercise() is called.
 */
export async function getExercises(filters?: {
  category?: string;
  difficulty?: string;
  search?: string;
}) {
  const key = exerciseCacheKey(filters);

  return cached<ExerciseTemplate[]>(key, 300, async () => {
    const db = await getDb();
    if (!db) return [];

    const conditions = [eq(exerciseTemplates.isPublic, true)] as ReturnType<typeof eq>[];
    if (filters?.category && filters.category !== "all") {
      conditions.push(eq(exerciseTemplates.category, filters.category as ExerciseCategory));
    }
    if (filters?.difficulty && filters.difficulty !== "all") {
      conditions.push(eq(exerciseTemplates.difficulty, filters.difficulty as ExerciseDifficulty));
    }

    const results = await db
      .select()
      .from(exerciseTemplates)
      .where(and(...conditions))
      .orderBy(asc(exerciseTemplates.name));

    // Full-text search is done in JS because MySQL LIKE on small sets (< 10k rows)
    // is fast enough and avoids adding a full-text index dependency.
    if (filters?.search) {
      const s = filters.search.toLowerCase();
      return results.filter(
        e => e.name.toLowerCase().includes(s) ||
             (e.description && e.description.toLowerCase().includes(s)),
      );
    }
    return results;
  });
}

export async function getExerciseById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(exerciseTemplates)
    .where(eq(exerciseTemplates.id, id))
    .limit(1);
  return result[0];
}

export async function createExercise(data: CreateExerciseInput) {
  const db = await getDb();
  if (!db) return;
  const result = await db.insert(exerciseTemplates).values({
    name:           data.name,
    nameEn:         data.nameEn          ?? null,
    description:    data.description     ?? null,
    category:       data.category        ?? "strength",
    difficulty:     data.difficulty      ?? "beginner",
    muscles:        data.muscles         ?? [],
    equipment:      data.equipment       ?? [],
    instructions:   data.instructions    ?? [],
    tips:           data.tips            ?? [],
    commonMistakes: data.commonMistakes  ?? [],
    imageUrl:       data.imageUrl        ?? null,
    videoUrl:       data.videoUrl        ?? null,
    isPublic:       data.isPublic        ?? true,
    createdById:    data.createdById     ?? null,
    usageCount:     0,
    rating:         "0.00",
  });

  // Invalidate the exercises cache so next read reflects the new exercise
  await invalidate("exercises:list:*");

  return result[0].insertId;
}
