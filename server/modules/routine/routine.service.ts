import { invokeLLMSafe } from "../../_core/llm-safe";
import * as db from "../../db";
import { logger } from "../../lib/logger";

/**
 * Builds the prompt messages for the AI routine generator.
 */
function buildRoutinePrompt(
  exercises: any[],
  params: { goal: string; level: string; duration?: number; equipment?: string[]; focusAreas?: string[] }
) {
  const exerciseList = exercises
    .map(e => `ID:${e.id} - ${e.name} (${e.category}, ${e.difficulty})`)
    .join("\n");

  return [
    {
      role: "system" as const,
      content: `You are an expert armwrestling coach. Create a training routine using ONLY exercises from this list:\n${exerciseList}\n\nRespond in JSON format with: { "name": string, "description": string, "exercises": [{ "templateId": number, "sets": number, "reps": string, "restSeconds": number }] }`,
    },
    {
      role: "user" as const,
      content: `Create a ${params.level} level routine for: ${params.goal}. Duration: ${params.duration || 45} minutes. Equipment: ${params.equipment?.join(", ") || "any"}. Focus: ${params.focusAreas?.join(", ") || "general"}.`,
    },
  ];
}

/**
 * Parses and validates the AI JSON response.
 */
function parseRoutineResponse(content: string) {
  try {
    return JSON.parse(content) as {
      name?: string;
      description?: string;
      exercises?: Array<{ templateId?: number; sets?: number; reps?: string; restSeconds?: number }>;
    };
  } catch (err) {
    logger.error({ err, content }, "Failed to parse AI routine response");
    throw new Error("AI generated invalid format");
  }
}

/**
 * Generate a training routine using AI based on user goals and available exercises.
 * 
 * @param {Object} params - User preferences for the routine
 * @returns {Promise<Object>} The created routine and its ID
 */
export async function generateRoutineWithAI(params: {
  userId: number;
  goal: string;
  level: "beginner" | "intermediate" | "advanced" | "elite";
  duration?: number;
  equipment?: string[];
  focusAreas?: string[];
}) {
  const exercises = await db.getExercises({});
  const messages  = buildRoutinePrompt(exercises, params);

  const response = await invokeLLMSafe({
    messages,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== "string") throw new Error("AI failed to generate routine");
  
  const parsed = parseRoutineResponse(content);

  const routineId = await db.createRoutine({
    name:        parsed.name || `AI Routine - ${params.goal}`,
    description: parsed.description,
    difficulty:  params.level,
    duration:    params.duration || 45,
    createdById: params.userId,
    aiGenerated: true,
    tags:        params.focusAreas || [],
  });

  // ✅ Batch insert instead of sequential for loop
  if (routineId && Array.isArray(parsed.exercises) && parsed.exercises.length > 0) {
    const validExercises = parsed.exercises
      .map((ex, i) => ({ ex, i }))
      .filter(({ ex }) => typeof ex.templateId === "number" && ex.templateId > 0);

    // addExerciseToRoutine is a single-row helper; batch via Promise.all
    // (true batch insert could be added later if routineExercises bulk insert is exposed)
    await Promise.all(
      validExercises.map(({ ex, i }) =>
        db.addExerciseToRoutine({
          routineId,
          templateId:  ex.templateId!,
          sets:        ex.sets        ?? 3,
          reps:        ex.reps        ?? "10",
          restSeconds: ex.restSeconds ?? 60,
          orderIndex:  i,
        }),
      ),
    );
  }

  return { id: routineId, routine: parsed };
}
