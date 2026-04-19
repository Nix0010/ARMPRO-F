import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
  index,
  uniqueIndex,
  type AnyMySqlColumn,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

// ─── USERS ───────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  // Extended profile
  appRole: mysqlEnum("appRole", ["athlete", "coach", "admin"]).default("athlete").notNull(),
  avatar: text("avatar"),
  bio: text("bio"),
  country: varchar("country", { length: 100 }),
  xp: int("xp").default(0).notNull(),
  level: int("level").default(1).notNull(),
  streak: int("streak").default(0).notNull(),
  longestStreak: int("longestStreak").default(0).notNull(),
  totalWorkouts: int("totalWorkouts").default(0).notNull(),
  subscriptionTier: mysqlEnum("subscriptionTier", ["free", "premium", "elite"]).default("free").notNull(),
  isApproved: boolean("isApproved").default(true).notNull(),
  /** Self-referential FK: ON DELETE SET NULL (coach can be deleted without deleting athlete) */
  assignedCoachId: int("assignedCoachId").references((): AnyMySqlColumn => users.id, { onDelete: "set null", onUpdate: "cascade" }),
  preferences: json("preferences").$type<{
    theme?: "light" | "dark";
    emailNotifications?: boolean;
    workoutReminders?: boolean;
  }>().default({}),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── EXERCISE TEMPLATES ──────────────────────────────────
export const exerciseTemplates = mysqlTable("exercise_templates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  nameEn: varchar("nameEn", { length: 255 }),
  description: text("description"),
  category: mysqlEnum("category", ["armwrestling", "strength", "technique", "conditioning", "mobility"]).default("strength").notNull(),
  difficulty: mysqlEnum("difficulty", ["beginner", "intermediate", "advanced", "elite"]).default("beginner").notNull(),
  muscles: json("muscles").$type<string[]>().default([]),
  equipment: json("equipment").$type<string[]>().default([]),
  instructions: json("instructions").$type<string[]>().default([]),
  tips: json("tips").$type<string[]>().default([]),
  commonMistakes: json("commonMistakes").$type<string[]>().default([]),
  imageUrl: text("imageUrl"),
  videoUrl: text("videoUrl"),
  isPublic: boolean("isPublic").default(true).notNull(),
  /** FK → users.id  ON DELETE SET NULL (template survives if creator is deleted) */
  createdById: int("createdById").references(() => users.id, { onDelete: "set null", onUpdate: "cascade" }),
  usageCount: int("usageCount").default(0).notNull(),
  /** decimal(3,2): values 0.00 – 5.00 */
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ExerciseTemplate = typeof exerciseTemplates.$inferSelect;

// ─── ROUTINES ────────────────────────────────────────────
export const routines = mysqlTable("routines", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  difficulty: mysqlEnum("difficulty", ["beginner", "intermediate", "advanced", "elite"]).default("beginner").notNull(),
  duration: int("duration").default(45).notNull(),
  isPublic: boolean("isPublic").default(true).notNull(),
  isTemplate: boolean("isTemplate").default(false).notNull(),
  aiGenerated: boolean("aiGenerated").default(false).notNull(),
  tags: json("tags").$type<string[]>().default([]),
  /** FK → users.id  ON DELETE CASCADE */
  createdById: int("createdById").notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userPublicIdx: index("idx_routines_user_public").on(table.createdById, table.isPublic),
}));

export type Routine = typeof routines.$inferSelect;

// ─── ROUTINE EXERCISES ───────────────────────────────────
export const routineExercises = mysqlTable("routine_exercises", {
  id: int("id").autoincrement().primaryKey(),
  /** FK → routines.id  ON DELETE CASCADE */
  routineId: int("routineId").notNull().references(() => routines.id, { onDelete: "cascade", onUpdate: "cascade" }),
  /** FK → exercise_templates.id  ON DELETE CASCADE */
  templateId: int("templateId").notNull().references(() => exerciseTemplates.id, { onDelete: "cascade", onUpdate: "cascade" }),
  sets: int("sets").default(3).notNull(),
  reps: varchar("reps", { length: 50 }).default("10").notNull(),
  restSeconds: int("restSeconds").default(60).notNull(),
  /** decimal(10,2) replaces float for precise weight tracking */
  weight: decimal("weight", { precision: 10, scale: 2 }),
  notes: text("notes"),
  orderIndex: int("orderIndex").default(0).notNull(),
});

export type RoutineExercise = typeof routineExercises.$inferSelect;

// ─── WORKOUT SESSIONS ────────────────────────────────────
export const workoutSessions = mysqlTable("workout_sessions", {
  id: int("id").autoincrement().primaryKey(),
  /** FK → users.id  ON DELETE CASCADE */
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  /** FK → routines.id  ON DELETE CASCADE */
  routineId: int("routineId").notNull().references(() => routines.id, { onDelete: "cascade", onUpdate: "cascade" }),
  status: mysqlEnum("status", ["in_progress", "completed", "cancelled"]).default("in_progress").notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  duration: int("duration").default(0).notNull(),
  xpEarned: int("xpEarned").default(0).notNull(),
  /** decimal(10,2) replaces float */
  totalVolume: decimal("totalVolume", { precision: 10, scale: 2 }).default("0.00"),
  completionRate: decimal("completionRate", { precision: 5, scale: 2 }).default("0.00"),
  notes: text("notes"),
  mood: varchar("mood", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userStatusIdx:   index("idx_ws_user_status").on(table.userId, table.status),
  userCreatedIdx:  index("idx_ws_user_created").on(table.userId, table.createdAt),
  statusCreatedIdx: index("idx_ws_status_created").on(table.status, table.createdAt),
}));

export type WorkoutSession = typeof workoutSessions.$inferSelect;

// ─── WORKOUT EXERCISES ───────────────────────────────────
export const workoutExercises = mysqlTable("workout_exercises", {
  id: int("id").autoincrement().primaryKey(),
  /** FK → workout_sessions.id  ON DELETE CASCADE */
  sessionId: int("sessionId").notNull().references(() => workoutSessions.id, { onDelete: "cascade", onUpdate: "cascade" }),
  /** FK → exercise_templates.id  ON DELETE CASCADE */
  templateId: int("templateId").notNull().references(() => exerciseTemplates.id, { onDelete: "cascade", onUpdate: "cascade" }),
  exerciseName: varchar("exerciseName", { length: 255 }).notNull(),
  targetSets: int("targetSets").default(3).notNull(),
  completedSets: int("completedSets").default(0).notNull(),
  reps: varchar("reps", { length: 50 }).notNull(),
  /** decimal(10,2) replaces float */
  weight: decimal("weight", { precision: 10, scale: 2 }),
  isCompleted: boolean("isCompleted").default(false).notNull(),
  isPR: boolean("isPR").default(false).notNull(),
  setData: json("setData").$type<Array<{ reps: number; weight: number; completed: boolean }>>(),
  orderIndex: int("orderIndex").default(0).notNull(),
});

export type WorkoutExercise = typeof workoutExercises.$inferSelect;

// ─── PROGRESS ENTRIES ────────────────────────────────────
export const progressEntries = mysqlTable("progress_entries", {
  id: int("id").autoincrement().primaryKey(),
  /** FK → users.id  ON DELETE CASCADE */
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  date: timestamp("date").defaultNow().notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  metric: varchar("metric", { length: 100 }).notNull(),
  /** decimal(10,2) replaces float */
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  previousValue: decimal("previousValue", { precision: 10, scale: 2 }),
  unit: varchar("unit", { length: 20 }).default("kg"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userDateIdx:    index("idx_pe_user_date").on(table.userId, table.date),
  userCreatedIdx: index("idx_pe_user_created").on(table.userId, table.createdAt),
}));

export type ProgressEntry = typeof progressEntries.$inferSelect;

// ─── ACHIEVEMENTS ────────────────────────────────────────
export const achievements = mysqlTable("achievements", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: mysqlEnum("category", ["strength", "consistency", "technique", "special"]).default("special").notNull(),
  rarity: mysqlEnum("rarity", ["common", "rare", "epic", "legendary"]).default("common").notNull(),
  icon: varchar("icon", { length: 10 }).default("🏆").notNull(),
  xpReward: int("xpReward").default(100).notNull(),
  criteria: json("criteria").$type<Record<string, number>>().default({}),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Achievement = typeof achievements.$inferSelect;

// ─── USER ACHIEVEMENTS ───────────────────────────────────
export const userAchievements = mysqlTable("user_achievements", {
  id: int("id").autoincrement().primaryKey(),
  /** FK → users.id  ON DELETE CASCADE */
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  /** FK → achievements.id  ON DELETE CASCADE */
  achievementId: int("achievementId").notNull().references(() => achievements.id, { onDelete: "cascade", onUpdate: "cascade" }),
  unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
  /** decimal(5,2): percentage 0.00–100.00 */
  progress: decimal("progress", { precision: 5, scale: 2 }).default("100.00").notNull(),
}, (table) => ({
  userUnlockedIdx: index("idx_ua_user_unlocked").on(table.userId, table.unlockedAt),
}));

export type UserAchievement = typeof userAchievements.$inferSelect;

// ─── CHAT MESSAGES ───────────────────────────────────────
export const chatMessages = mysqlTable("chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  /** FK → users.id  ON DELETE CASCADE */
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  role: mysqlEnum("role", ["user", "assistant", "system"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userCreatedIdx: index("idx_chat_user_created").on(table.userId, table.createdAt),
}));

export type ChatMessage = typeof chatMessages.$inferSelect;

// ─── CALENDAR EVENTS ─────────────────────────────────────
export const calendarEvents = mysqlTable("calendar_events", {
  id: int("id").autoincrement().primaryKey(),
  /** FK → users.id  ON DELETE CASCADE */
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["workout", "rest", "competition", "custom"]).default("workout").notNull(),
  /** FK → routines.id  ON DELETE SET NULL (event stays even if routine is deleted) */
  routineId: int("routineId").references(() => routines.id, { onDelete: "set null", onUpdate: "cascade" }),
  scheduledAt: timestamp("scheduledAt").notNull(),
  duration: int("duration").default(60),
  isCompleted: boolean("isCompleted").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userScheduledIdx: index("idx_cal_user_scheduled").on(table.userId, table.scheduledAt),
}));

export type CalendarEvent = typeof calendarEvents.$inferSelect;

// ─── MARKETPLACE PROGRAMS ────────────────────────────────
export const programs = mysqlTable("programs", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  longDescription: text("longDescription"),
  /** FK → users.id  ON DELETE CASCADE */
  createdById: int("createdById").notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  /** decimal(10,2) replaces float */
  price: decimal("price", { precision: 10, scale: 2 }).default("0.00").notNull(),
  currency: varchar("currency", { length: 10 }).default("usd").notNull(),
  difficulty: mysqlEnum("difficulty", ["beginner", "intermediate", "advanced", "elite"]).default("beginner").notNull(),
  durationWeeks: int("durationWeeks").default(4).notNull(),
  category: varchar("category", { length: 100 }),
  imageUrl: text("imageUrl"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  reviewCount: int("reviewCount").default(0).notNull(),
  purchaseCount: int("purchaseCount").default(0).notNull(),
  isPublished: boolean("isPublished").default(false).notNull(),
  tags: json("tags").$type<string[]>().default([]),
  /**
   * @deprecated — mantenido por compatibilidad legacy.
   * Los datos ya fueron migrados a program_routines.
   * Eliminar en migración 0004 tras validar.
   */
  routineIds: json("routineIds").$type<number[]>().default([]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  publishedCreatedIdx: index("idx_prog_published_created").on(table.isPublished, table.createdAt),
}));

export type Program = typeof programs.$inferSelect;

// ─── PROGRAM ROUTINES (nueva tabla normalizada) ──────────
/** Reemplaza el campo JSON `programs.routineIds`. */
export const programRoutines = mysqlTable("program_routines", {
  id: int("id").autoincrement().primaryKey(),
  /** FK → programs.id  ON DELETE CASCADE */
  programId: int("programId").notNull().references(() => programs.id, { onDelete: "cascade", onUpdate: "cascade" }),
  /** FK → routines.id  ON DELETE CASCADE */
  routineId: int("routineId").notNull().references(() => routines.id, { onDelete: "cascade", onUpdate: "cascade" }),
  orderIndex: int("orderIndex").default(0).notNull(),
}, (table) => ({
  programOrderIdx:  index("idx_pr_program_order").on(table.programId, table.orderIndex),
  uniqueProgramRoutine: uniqueIndex("uq_program_routine").on(table.programId, table.routineId),
}));

export type ProgramRoutine = typeof programRoutines.$inferSelect;

// ─── PROGRAM PURCHASES ──────────────────────────────────
export const programPurchases = mysqlTable("program_purchases", {
  id: int("id").autoincrement().primaryKey(),
  /** FK → users.id  ON DELETE CASCADE */
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  /** FK → programs.id  ON DELETE CASCADE */
  programId: int("programId").notNull().references(() => programs.id, { onDelete: "cascade", onUpdate: "cascade" }),
  purchasedAt: timestamp("purchasedAt").defaultNow().notNull(),
  /** decimal(10,2) replaces float */
  amount: decimal("amount", { precision: 10, scale: 2 }).default("0.00").notNull(),
}, (table) => ({
  uniquePurchase: uniqueIndex("uq_purchase_user_program").on(table.userId, table.programId),
}));

export type ProgramPurchase = typeof programPurchases.$inferSelect;

// ─── PROGRAM REVIEWS ─────────────────────────────────────
export const programReviews = mysqlTable("program_reviews", {
  id: int("id").autoincrement().primaryKey(),
  /** FK → users.id  ON DELETE CASCADE */
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  /** FK → programs.id  ON DELETE CASCADE */
  programId: int("programId").notNull().references(() => programs.id, { onDelete: "cascade", onUpdate: "cascade" }),
  rating: int("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  uniqueReview: uniqueIndex("uq_review_user_program").on(table.userId, table.programId),
}));

export type ProgramReview = typeof programReviews.$inferSelect;

// ─── NOTIFICATIONS ───────────────────────────────────────
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  /** FK → users.id  ON DELETE CASCADE */
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  actionUrl: text("actionUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userReadIdx:    index("idx_notif_user_read").on(table.userId, table.isRead),
  userCreatedIdx: index("idx_notif_user_created").on(table.userId, table.createdAt),
}));

export type Notification = typeof notifications.$inferSelect;

// ═══════════════════════════════════════════════════════════
// DRIZZLE RELATIONS (para queries con .query API)
// ═══════════════════════════════════════════════════════════

export const usersRelations = relations(users, ({ one, many }) => ({
  coach:            one(users, { fields: [users.assignedCoachId], references: [users.id] }),
  athletes:         many(users),
  routines:         many(routines),
  workoutSessions:  many(workoutSessions),
  progressEntries:  many(progressEntries),
  userAchievements: many(userAchievements),
  chatMessages:     many(chatMessages),
  calendarEvents:   many(calendarEvents),
  programs:         many(programs),
  purchases:        many(programPurchases),
  reviews:          many(programReviews),
  notifications:    many(notifications),
  exerciseTemplates: many(exerciseTemplates),
}));

export const exerciseTemplatesRelations = relations(exerciseTemplates, ({ one, many }) => ({
  createdBy:       one(users, { fields: [exerciseTemplates.createdById], references: [users.id] }),
  routineExercises: many(routineExercises),
  workoutExercises: many(workoutExercises),
}));

export const routinesRelations = relations(routines, ({ one, many }) => ({
  createdBy:       one(users, { fields: [routines.createdById], references: [users.id] }),
  exercises:       many(routineExercises),
  workoutSessions: many(workoutSessions),
  calendarEvents:  many(calendarEvents),
  programRoutines: many(programRoutines),
}));

export const routineExercisesRelations = relations(routineExercises, ({ one }) => ({
  routine:  one(routines,          { fields: [routineExercises.routineId],  references: [routines.id] }),
  template: one(exerciseTemplates, { fields: [routineExercises.templateId], references: [exerciseTemplates.id] }),
}));

export const workoutSessionsRelations = relations(workoutSessions, ({ one, many }) => ({
  user:      one(users,    { fields: [workoutSessions.userId],    references: [users.id] }),
  routine:   one(routines, { fields: [workoutSessions.routineId], references: [routines.id] }),
  exercises: many(workoutExercises),
}));

export const workoutExercisesRelations = relations(workoutExercises, ({ one }) => ({
  session:  one(workoutSessions, { fields: [workoutExercises.sessionId],  references: [workoutSessions.id] }),
  template: one(exerciseTemplates, { fields: [workoutExercises.templateId], references: [exerciseTemplates.id] }),
}));

export const progressEntriesRelations = relations(progressEntries, ({ one }) => ({
  user: one(users, { fields: [progressEntries.userId], references: [users.id] }),
}));

export const achievementsRelations = relations(achievements, ({ many }) => ({
  userAchievements: many(userAchievements),
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user:        one(users,        { fields: [userAchievements.userId],        references: [users.id] }),
  achievement: one(achievements, { fields: [userAchievements.achievementId], references: [achievements.id] }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  user: one(users, { fields: [chatMessages.userId], references: [users.id] }),
}));

export const calendarEventsRelations = relations(calendarEvents, ({ one }) => ({
  user:    one(users,    { fields: [calendarEvents.userId],    references: [users.id] }),
  routine: one(routines, { fields: [calendarEvents.routineId], references: [routines.id] }),
}));

export const programsRelations = relations(programs, ({ one, many }) => ({
  createdBy:  one(users, { fields: [programs.createdById], references: [users.id] }),
  routines:   many(programRoutines),
  purchases:  many(programPurchases),
  reviews:    many(programReviews),
}));

export const programRoutinesRelations = relations(programRoutines, ({ one }) => ({
  program: one(programs, { fields: [programRoutines.programId], references: [programs.id] }),
  routine: one(routines,  { fields: [programRoutines.routineId], references: [routines.id] }),
}));

export const programPurchasesRelations = relations(programPurchases, ({ one }) => ({
  user:    one(users,    { fields: [programPurchases.userId],    references: [users.id] }),
  program: one(programs, { fields: [programPurchases.programId], references: [programs.id] }),
}));

export const programReviewsRelations = relations(programReviews, ({ one }) => ({
  user:    one(users,    { fields: [programReviews.userId],    references: [users.id] }),
  program: one(programs, { fields: [programReviews.programId], references: [programs.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));
