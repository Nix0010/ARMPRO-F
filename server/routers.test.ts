import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    updateUserProfile: vi.fn(),
    getExercises: vi.fn(() => []),
    getExerciseById: vi.fn(),
    createExercise: vi.fn(),
    getUserRoutines: vi.fn(() => []),
    getRoutineById: vi.fn(),
    createRoutine: vi.fn(),
    addExerciseToRoutine: vi.fn(),
    deleteRoutine: vi.fn(),
    startWorkout: vi.fn(),
    getActiveWorkout: vi.fn(),
    updateWorkoutExercise: vi.fn(),
    completeWorkout: vi.fn(),
    addXpToUser: vi.fn(),
    incrementUserWorkoutStats: vi.fn(),
    syncUserAchievements: vi.fn(),
    getUserWorkoutHistory: vi.fn(() => []),
    addProgressEntry: vi.fn(),
    getUserProgress: vi.fn(() => []),
    getUserStats: vi.fn(() => null),
    getAllAchievements: vi.fn(() => []),
    getUserAchievements: vi.fn(() => []),
    getLeaderboard: vi.fn(() => []),
    saveChatMessage: vi.fn(),
    getChatHistory: vi.fn(() => []),
    clearChatHistory: vi.fn(),
    getUserCalendarEvents: vi.fn(() => []),
    createCalendarEvent: vi.fn(),
    updateCalendarEvent: vi.fn(),
    deleteCalendarEvent: vi.fn(),
    getPublishedPrograms: vi.fn(() => []),
    getProgramById: vi.fn(),
    getUserPurchasedPrograms: vi.fn(() => []),
    purchaseProgram: vi.fn(),
    purchaseFreeProgram: vi.fn(),
    getUserNotifications: vi.fn(() => []),
    markNotificationRead: vi.fn(),
    getCoachDashboard: vi.fn(() => null),
    getAllUsers: vi.fn(() => []),
    getSystemStats: vi.fn(() => null),
  },
}));

vi.mock("./db", () => mockDb);

type CookieCall = { name: string; options: Record<string, unknown> };

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function createAuthContext(): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
  const clearedCookies: CookieCall[] = [];
  const user = createUser();
  return {
    ctx: {
      user,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: (name: string, options: Record<string, unknown>) => { clearedCookies.push({ name, options }); } } as TrpcContext["res"],
    },
    clearedCookies,
  };
}

function createUser(overrides?: Partial<NonNullable<TrpcContext["user"]>>) {
  return {
    id: 1,
    openId: "test-user",
    email: "test@test.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user" as const,
    appRole: "athlete" as const,
    avatar: null,
    bio: null,
    country: null,
    xp: 0,
    level: 1,
    streak: 0,
    longestStreak: 0,
    totalWorkouts: 0,
    subscriptionTier: "free" as const,
    isApproved: true,
    assignedCoachId: null,
    preferences: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
}

function createAuthCaller(userOverrides?: Partial<NonNullable<TrpcContext["user"]>>) {
  const clearedCookies: CookieCall[] = [];
  const ctx: TrpcContext = {
    user: createUser(userOverrides),
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: (name: string, options: Record<string, unknown>) => { clearedCookies.push({ name, options }); } } as TrpcContext["res"],
  };
  return { caller: appRouter.createCaller(ctx), clearedCookies };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockDb.getExercises.mockResolvedValue([]);
  mockDb.getUserRoutines.mockResolvedValue([]);
  mockDb.getUserWorkoutHistory.mockResolvedValue([]);
  mockDb.getUserProgress.mockResolvedValue([]);
  mockDb.getAllAchievements.mockResolvedValue([]);
  mockDb.getUserAchievements.mockResolvedValue([]);
  mockDb.getLeaderboard.mockResolvedValue([]);
  mockDb.getChatHistory.mockResolvedValue([]);
  mockDb.getUserCalendarEvents.mockResolvedValue([]);
  mockDb.getPublishedPrograms.mockResolvedValue([]);
  mockDb.getUserPurchasedPrograms.mockResolvedValue([]);
  mockDb.purchaseProgram.mockResolvedValue({ status: "already_owned", amount: 0, isFree: true });
  mockDb.purchaseFreeProgram.mockResolvedValue({ status: "already_owned" });
  mockDb.getUserNotifications.mockResolvedValue([]);
  mockDb.getCoachDashboard.mockResolvedValue(null);
  mockDb.getRoutineById.mockResolvedValue(undefined);
  mockDb.deleteRoutine.mockResolvedValue(false);
  mockDb.startWorkout.mockResolvedValue(undefined);
  mockDb.updateWorkoutExercise.mockResolvedValue(false);
  mockDb.completeWorkout.mockResolvedValue(false);
  mockDb.addXpToUser.mockResolvedValue({ xp: 100, level: 1, leveledUp: false });
  mockDb.incrementUserWorkoutStats.mockResolvedValue({ totalWorkouts: 1, streak: 1, longestStreak: 1 });
  mockDb.syncUserAchievements.mockResolvedValue([]);
  mockDb.updateUserProfile.mockResolvedValue(undefined);
  mockDb.updateCalendarEvent.mockResolvedValue(false);
  mockDb.deleteCalendarEvent.mockResolvedValue(false);
  mockDb.markNotificationRead.mockResolvedValue(false);
});

describe("auth.me", () => {
  it("returns null for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.name).toBe("Test User");
  });
});

describe("auth.logout", () => {
  it("clears cookie and returns success", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
  });
});

describe("exercise.list", () => {
  it("returns exercises as public procedure", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.exercise.list({});
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("gamification.achievements", () => {
  it("returns achievements list", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.gamification.achievements();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("gamification.leaderboard", () => {
  it("returns leaderboard", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.gamification.leaderboard({ limit: 5 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("marketplace.programs", () => {
  it("returns published programs", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.marketplace.programs({});
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("ownership checks", () => {
  it("blocks reading another user's routine", async () => {
    const { caller } = createAuthCaller({ id: 7 });
    await expect(caller.routine.getById({ id: 99 })).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Routine not found",
    });
    expect(mockDb.getRoutineById).toHaveBeenCalledWith(99, 7);
  });

  it("blocks deleting another user's routine", async () => {
    const { caller } = createAuthCaller({ id: 7 });
    await expect(caller.routine.delete({ id: 99 })).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Routine not found",
    });
    expect(mockDb.deleteRoutine).toHaveBeenCalledWith(99, 7);
  });

  it("blocks updating another user's workout exercise", async () => {
    const { caller } = createAuthCaller({ id: 7 });
    await expect(caller.workout.updateExercise({ exerciseId: 55, completedSets: 3 })).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Workout exercise not found",
    });
    expect(mockDb.updateWorkoutExercise).toHaveBeenCalledWith(7, 55, { completedSets: 3 });
  });

  it("blocks completing another user's or already-finished workout", async () => {
    const { caller } = createAuthCaller({ id: 7 });
    await expect(caller.workout.complete({
      sessionId: 12,
      duration: 1800,
      totalVolume: 1000,
      completionRate: 0.8,
    })).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "Workout session not found or already completed",
    });
    expect(mockDb.completeWorkout).toHaveBeenCalledWith(7, 12, expect.objectContaining({
      duration: 1800,
      totalVolume: 1000,
      completionRate: 0.8,
    }));
  });

  it("blocks editing another user's calendar event", async () => {
    const { caller } = createAuthCaller({ id: 7 });
    await expect(caller.calendar.update({ id: 3, title: "Nuevo" })).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Calendar event not found",
    });
    expect(mockDb.updateCalendarEvent).toHaveBeenCalledWith(7, 3, { title: "Nuevo" });
  });

  it("blocks deleting another user's calendar event", async () => {
    const { caller } = createAuthCaller({ id: 7 });
    await expect(caller.calendar.delete({ id: 3 })).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Calendar event not found",
    });
    expect(mockDb.deleteCalendarEvent).toHaveBeenCalledWith(7, 3);
  });

  it("blocks marking another user's notification as read", async () => {
    const { caller } = createAuthCaller({ id: 7 });
    await expect(caller.notification.markRead({ id: 44 })).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Notification not found",
    });
    expect(mockDb.markNotificationRead).toHaveBeenCalledWith(7, 44);
  });
});

describe("workout completion", () => {
  it("returns server-computed workout results", async () => {
    const { caller } = createAuthCaller({ id: 9 });
    mockDb.completeWorkout.mockResolvedValue({
      duration: 1800,
      xpEarned: 97,
      totalVolume: 2450,
      completionRate: 0.75,
      completedAt: new Date("2026-04-13T10:00:00.000Z"),
    });
    mockDb.addXpToUser.mockResolvedValue({ xp: 597, level: 2, leveledUp: true });
    mockDb.incrementUserWorkoutStats.mockResolvedValue({ totalWorkouts: 5, streak: 3, longestStreak: 3 });
    mockDb.syncUserAchievements.mockResolvedValue([1, 2]);

    const result = await caller.workout.complete({ sessionId: 12, duration: 1, totalVolume: 1, completionRate: 0.01 });

    expect(result).toMatchObject({
      duration: 1800,
      xpEarned: 97,
      totalVolume: 2450,
      completionRate: 0.75,
      xp: 597,
      level: 2,
      leveledUp: true,
      totalWorkouts: 5,
      streak: 3,
      longestStreak: 3,
      unlockedAchievements: [1, 2],
    });
    expect(mockDb.completeWorkout).toHaveBeenCalledWith(9, 12, expect.objectContaining({
      sessionId: 12,
      duration: 1,
    }));
  });
});

describe("aiCoach.clearHistory", () => {
  it("clears chat history for the authenticated user", async () => {
    const { caller } = createAuthCaller({ id: 22 });
    const result = await caller.aiCoach.clearHistory();
    expect(result).toEqual({ success: true });
    expect(mockDb.clearChatHistory).toHaveBeenCalledWith(22);
  });
});

describe("coach.dashboard", () => {
  it("allows coach users to fetch dashboard data", async () => {
    const { caller } = createAuthCaller({ id: 31, appRole: "coach" });
    mockDb.getCoachDashboard.mockResolvedValue({ athleteCount: 2 });
    const result = await caller.coach.dashboard();
    expect(result).toEqual({ athleteCount: 2 });
    expect(mockDb.getCoachDashboard).toHaveBeenCalledWith(31);
  });
});

describe("marketplace.acquireFree", () => {
  it("acquires a free program for the authenticated user", async () => {
    const { caller } = createAuthCaller({ id: 15 });
    mockDb.purchaseFreeProgram.mockResolvedValue({ status: "acquired" });
    const result = await caller.marketplace.acquireFree({ programId: 8 });
    expect(result).toEqual({ success: true, status: "acquired" });
    expect(mockDb.purchaseFreeProgram).toHaveBeenCalledWith(15, 8);
  });
});

describe("marketplace.purchase", () => {
  it("purchases a paid program for the authenticated user", async () => {
    const { caller } = createAuthCaller({ id: 16 });
    mockDb.purchaseProgram.mockResolvedValue({ status: "acquired", amount: 29.99, isFree: false });
    const result = await caller.marketplace.purchase({ programId: 9 });
    expect(result).toEqual({ success: true, status: "acquired", amount: 29.99, isFree: false });
    expect(mockDb.purchaseProgram).toHaveBeenCalledWith(16, 9);
  });
});
