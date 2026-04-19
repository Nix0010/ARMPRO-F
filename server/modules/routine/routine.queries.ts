import { eq, and, desc, asc, inArray } from "drizzle-orm";
import { getDb } from "../../lib/database";
import {
  routines,
  routineExercises,
  exerciseTemplates,
  type ExerciseTemplate,
  type Routine,
} from "../../../drizzle/schema";

// ─── Types ───────────────────────────────────────────────

type CreateRoutineInput = {
  name: string;
  description?: string | null;
  difficulty?: "beginner" | "intermediate" | "advanced" | "elite";
  duration?: number;
  createdById: number;
  aiGenerated?: boolean;
  tags?: string[];
  isPublic?: boolean;
  isTemplate?: boolean;
};

type AddExerciseInput = {
  routineId: number;
  templateId: number;
  sets?: number;
  reps?: string;
  restSeconds?: number;
  weight?: number | string | null;
  notes?: string | null;
  orderIndex?: number;
};

// ─── QUERIES ─────────────────────────────────────────────

/**
 * Lightweight count of routines owned by a user.
 * Used by tier enforcement in routine.router.ts.
 */
export async function countUserRoutines(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db
    .select({ id: routines.id })
    .from(routines)
    .where(eq(routines.createdById, userId));
  return rows.length;
}

export async function getUserRoutines(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const userRoutines = await db
    .select()
    .from(routines)
    .where(eq(routines.createdById, userId))
    .orderBy(desc(routines.updatedAt));
  if (userRoutines.length === 0) return [];

  const routineIds = userRoutines.map(r => r.id);
  const counts = await db
    .select({ routineId: routineExercises.routineId, count: routineExercises.id })
    .from(routineExercises)
    .where(inArray(routineExercises.routineId, routineIds));

  // Count manually to avoid GROUP BY / sql<number> cast issues
  const countsByRoutine = new Map<number, number>();
  for (const row of counts) {
    const prev = countsByRoutine.get(row.routineId) ?? 0;
    countsByRoutine.set(row.routineId, prev + 1);
  }

  return userRoutines.map(routine => ({
    ...routine,
    exerciseCount: countsByRoutine.get(routine.id) ?? 0,
  }));
}

export async function getRoutineById(id: number, userId?: number) {
  const db = await getDb();
  if (!db) return undefined;
  const conditions = [eq(routines.id, id)] as ReturnType<typeof eq>[];
  if (userId !== undefined) conditions.push(eq(routines.createdById, userId));
  const routine = await db
    .select()
    .from(routines)
    .where(and(...conditions))
    .limit(1);
  if (!routine[0]) return undefined;

  const exercises = await db
    .select()
    .from(routineExercises)
    .where(eq(routineExercises.routineId, id))
    .orderBy(asc(routineExercises.orderIndex));

  const templateIds = exercises.map(e => e.templateId);
  let templates: ExerciseTemplate[] = [];
  if (templateIds.length > 0) {
    templates = await db
      .select()
      .from(exerciseTemplates)
      .where(inArray(exerciseTemplates.id, templateIds));
  }

  return {
    ...routine[0],
    exercises: exercises.map(e => ({
      ...e,
      template: templates.find(t => t.id === e.templateId),
    })),
  };
}

export async function createRoutine(data: CreateRoutineInput) {
  const db = await getDb();
  if (!db) return;
  const result = await db.insert(routines).values({
    name: data.name,
    description: data.description ?? null,
    difficulty: data.difficulty ?? "beginner",
    duration: data.duration ?? 45,
    createdById: data.createdById,
    aiGenerated: data.aiGenerated ?? false,
    tags: data.tags ?? [],
    isPublic: data.isPublic ?? true,
    isTemplate: data.isTemplate ?? false,
  });
  return result[0].insertId;
}

export async function addExerciseToRoutine(data: AddExerciseInput) {
  const db = await getDb();
  if (!db) return;
  await db.insert(routineExercises).values({
    routineId: data.routineId,
    templateId: data.templateId,
    sets: data.sets ?? 3,
    reps: data.reps ?? "10",
    restSeconds: data.restSeconds ?? 60,
    weight: data.weight != null ? String(data.weight) : null,
    notes: data.notes ?? null,
    orderIndex: data.orderIndex ?? 0,
  });
}

export async function deleteRoutine(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  const existing = await db
    .select({ id: routines.id })
    .from(routines)
    .where(and(eq(routines.id, id), eq(routines.createdById, userId)))
    .limit(1);
  if (!existing[0]) return false;
  // FK CASCADE handles routineExercises deletion, but explicit delete is safer
  // without relying on DB-level FK setup in all environments.
  await db.delete(routineExercises).where(eq(routineExercises.routineId, id));
  await db.delete(routines).where(eq(routines.id, id));
  return true;
}
