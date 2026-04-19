-- ============================================================
-- ARMPRO Migration 0003: Schema Improvements
-- Autor    : Antigravity / ARMPRO upgrade
-- Fecha    : 2026-04-16
-- SEGURO   : No elimina ni trunca datos existentes
-- Orden de ejecución:
--   1. Este archivo completo, statement por statement
--   2. Después actualizar drizzle/schema.ts
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- PASO 1 · Crear tabla program_routines
--         (normaliza programs.routineIds que era JSON array)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `program_routines` (
  `id`        int AUTO_INCREMENT NOT NULL,
  `programId` int NOT NULL,
  `routineId` int NOT NULL,
  `orderIndex` int NOT NULL DEFAULT 0,
  CONSTRAINT `program_routines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint

-- ────────────────────────────────────────────────────────────
-- PASO 2 · Migrar datos de programs.routineIds → program_routines
--         Usa un stored procedure temporal para recorrer el JSON
-- ────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS migrate_routine_ids;
--> statement-breakpoint

DELIMITER $$
CREATE PROCEDURE migrate_routine_ids()
BEGIN
  DECLARE done      INT DEFAULT FALSE;
  DECLARE prog_id   INT;
  DECLARE rid_json  JSON;
  DECLARE i         INT;
  DECLARE arr_len   INT;
  DECLARE rid_val   INT;

  DECLARE cur CURSOR FOR
    SELECT id, routineIds FROM programs WHERE routineIds IS NOT NULL AND JSON_LENGTH(routineIds) > 0;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

  OPEN cur;
  read_loop: LOOP
    FETCH cur INTO prog_id, rid_json;
    IF done THEN LEAVE read_loop; END IF;

    SET arr_len = JSON_LENGTH(rid_json);
    SET i = 0;
    WHILE i < arr_len DO
      SET rid_val = JSON_UNQUOTE(JSON_EXTRACT(rid_json, CONCAT('$[', i, ']')));
      INSERT IGNORE INTO program_routines (programId, routineId, orderIndex)
      VALUES (prog_id, rid_val, i);
      SET i = i + 1;
    END WHILE;
  END LOOP;
  CLOSE cur;
END$$
DELIMITER ;
--> statement-breakpoint

CALL migrate_routine_ids();
--> statement-breakpoint

DROP PROCEDURE IF EXISTS migrate_routine_ids;
--> statement-breakpoint

-- ────────────────────────────────────────────────────────────
-- PASO 3 · Convertir float → decimal(10,2) en columnas de precio/volumen
--         ALTER COLUMN es seguro: MySQL convierte los valores automáticamente
-- ────────────────────────────────────────────────────────────

-- programs.price
ALTER TABLE `programs`
  MODIFY COLUMN `price` decimal(10,2) NOT NULL DEFAULT 0.00;
--> statement-breakpoint

-- programs.rating
ALTER TABLE `programs`
  MODIFY COLUMN `rating` decimal(3,2) DEFAULT 0.00;
--> statement-breakpoint

-- program_purchases.amount
ALTER TABLE `program_purchases`
  MODIFY COLUMN `amount` decimal(10,2) NOT NULL DEFAULT 0.00;
--> statement-breakpoint

-- workout_sessions.totalVolume
ALTER TABLE `workout_sessions`
  MODIFY COLUMN `totalVolume` decimal(10,2) DEFAULT 0.00;
--> statement-breakpoint

-- workout_sessions.completionRate
ALTER TABLE `workout_sessions`
  MODIFY COLUMN `completionRate` decimal(5,2) DEFAULT 0.00;
--> statement-breakpoint

-- exercise_templates.rating
ALTER TABLE `exercise_templates`
  MODIFY COLUMN `rating` decimal(3,2) DEFAULT 0.00;
--> statement-breakpoint

-- routine_exercises.weight
ALTER TABLE `routine_exercises`
  MODIFY COLUMN `weight` decimal(10,2);
--> statement-breakpoint

-- workout_exercises.weight
ALTER TABLE `workout_exercises`
  MODIFY COLUMN `weight` decimal(10,2);
--> statement-breakpoint

-- progress_entries.value / previousValue
ALTER TABLE `progress_entries`
  MODIFY COLUMN `value` decimal(10,2) NOT NULL,
  MODIFY COLUMN `previousValue` decimal(10,2);
--> statement-breakpoint

-- user_achievements.progress
ALTER TABLE `user_achievements`
  MODIFY COLUMN `progress` decimal(5,2) NOT NULL DEFAULT 100.00;
--> statement-breakpoint

-- ────────────────────────────────────────────────────────────
-- PASO 4 · FOREIGN KEYS con ON DELETE CASCADE
--         Se agregan solo si no existen (nombre de constraint único)
-- ────────────────────────────────────────────────────────────

-- users.assignedCoachId → users.id (self-referential, SET NULL para no borrar el usuario)
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_coach`
  FOREIGN KEY (`assignedCoachId`) REFERENCES `users`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
--> statement-breakpoint

-- routines.createdById → users.id
ALTER TABLE `routines`
  ADD CONSTRAINT `fk_routines_user`
  FOREIGN KEY (`createdById`) REFERENCES `users`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
--> statement-breakpoint

-- routine_exercises.routineId → routines.id
ALTER TABLE `routine_exercises`
  ADD CONSTRAINT `fk_routine_exercises_routine`
  FOREIGN KEY (`routineId`) REFERENCES `routines`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
--> statement-breakpoint

-- routine_exercises.templateId → exercise_templates.id
ALTER TABLE `routine_exercises`
  ADD CONSTRAINT `fk_routine_exercises_template`
  FOREIGN KEY (`templateId`) REFERENCES `exercise_templates`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
--> statement-breakpoint

-- exercise_templates.createdById → users.id (nullable, SET NULL si se borra el usuario)
ALTER TABLE `exercise_templates`
  ADD CONSTRAINT `fk_exercise_templates_user`
  FOREIGN KEY (`createdById`) REFERENCES `users`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
--> statement-breakpoint

-- workout_sessions.userId → users.id
ALTER TABLE `workout_sessions`
  ADD CONSTRAINT `fk_workout_sessions_user`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
--> statement-breakpoint

-- workout_sessions.routineId → routines.id
ALTER TABLE `workout_sessions`
  ADD CONSTRAINT `fk_workout_sessions_routine`
  FOREIGN KEY (`routineId`) REFERENCES `routines`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
--> statement-breakpoint

-- workout_exercises.sessionId → workout_sessions.id
ALTER TABLE `workout_exercises`
  ADD CONSTRAINT `fk_workout_exercises_session`
  FOREIGN KEY (`sessionId`) REFERENCES `workout_sessions`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
--> statement-breakpoint

-- workout_exercises.templateId → exercise_templates.id
ALTER TABLE `workout_exercises`
  ADD CONSTRAINT `fk_workout_exercises_template`
  FOREIGN KEY (`templateId`) REFERENCES `exercise_templates`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
--> statement-breakpoint

-- progress_entries.userId → users.id
ALTER TABLE `progress_entries`
  ADD CONSTRAINT `fk_progress_entries_user`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
--> statement-breakpoint

-- user_achievements.userId → users.id
ALTER TABLE `user_achievements`
  ADD CONSTRAINT `fk_user_achievements_user`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
--> statement-breakpoint

-- user_achievements.achievementId → achievements.id
ALTER TABLE `user_achievements`
  ADD CONSTRAINT `fk_user_achievements_achievement`
  FOREIGN KEY (`achievementId`) REFERENCES `achievements`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
--> statement-breakpoint

-- chat_messages.userId → users.id
ALTER TABLE `chat_messages`
  ADD CONSTRAINT `fk_chat_messages_user`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
--> statement-breakpoint

-- calendar_events.userId → users.id
ALTER TABLE `calendar_events`
  ADD CONSTRAINT `fk_calendar_events_user`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
--> statement-breakpoint

-- calendar_events.routineId → routines.id (nullable, SET NULL)
ALTER TABLE `calendar_events`
  ADD CONSTRAINT `fk_calendar_events_routine`
  FOREIGN KEY (`routineId`) REFERENCES `routines`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
--> statement-breakpoint

-- programs.createdById → users.id
ALTER TABLE `programs`
  ADD CONSTRAINT `fk_programs_user`
  FOREIGN KEY (`createdById`) REFERENCES `users`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
--> statement-breakpoint

-- program_purchases.userId → users.id
ALTER TABLE `program_purchases`
  ADD CONSTRAINT `fk_program_purchases_user`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
--> statement-breakpoint

-- program_purchases.programId → programs.id
ALTER TABLE `program_purchases`
  ADD CONSTRAINT `fk_program_purchases_program`
  FOREIGN KEY (`programId`) REFERENCES `programs`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
--> statement-breakpoint

-- program_reviews.userId → users.id
ALTER TABLE `program_reviews`
  ADD CONSTRAINT `fk_program_reviews_user`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
--> statement-breakpoint

-- program_reviews.programId → programs.id
ALTER TABLE `program_reviews`
  ADD CONSTRAINT `fk_program_reviews_program`
  FOREIGN KEY (`programId`) REFERENCES `programs`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
--> statement-breakpoint

-- notifications.userId → users.id
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notifications_user`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
--> statement-breakpoint

-- program_routines.programId → programs.id
ALTER TABLE `program_routines`
  ADD CONSTRAINT `fk_program_routines_program`
  FOREIGN KEY (`programId`) REFERENCES `programs`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
--> statement-breakpoint

-- program_routines.routineId → routines.id
ALTER TABLE `program_routines`
  ADD CONSTRAINT `fk_program_routines_routine`
  FOREIGN KEY (`routineId`) REFERENCES `routines`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
--> statement-breakpoint

-- ────────────────────────────────────────────────────────────
-- PASO 5 · Índices compuestos para escalabilidad
-- ────────────────────────────────────────────────────────────

-- workout_sessions: filtrado por usuario + estado
CREATE INDEX `idx_ws_user_status`     ON `workout_sessions` (`userId`, `status`);
--> statement-breakpoint
CREATE INDEX `idx_ws_user_created`    ON `workout_sessions` (`userId`, `createdAt`);
--> statement-breakpoint
CREATE INDEX `idx_ws_status_created`  ON `workout_sessions` (`status`, `createdAt`);
--> statement-breakpoint

-- progress_entries: historial por usuario + fecha
CREATE INDEX `idx_pe_user_date`       ON `progress_entries` (`userId`, `date`);
--> statement-breakpoint
CREATE INDEX `idx_pe_user_created`    ON `progress_entries` (`userId`, `createdAt`);
--> statement-breakpoint

-- user_achievements: logros por usuario
CREATE INDEX `idx_ua_user_unlocked`   ON `user_achievements` (`userId`, `unlockedAt`);
--> statement-breakpoint

-- notifications: bandeja de entrada por usuario
CREATE INDEX `idx_notif_user_read`    ON `notifications` (`userId`, `isRead`);
--> statement-breakpoint
CREATE INDEX `idx_notif_user_created` ON `notifications` (`userId`, `createdAt`);
--> statement-breakpoint

-- chat_messages: historial de chat por usuario
CREATE INDEX `idx_chat_user_created`  ON `chat_messages` (`userId`, `createdAt`);
--> statement-breakpoint

-- calendar_events: agenda por usuario + fecha
CREATE INDEX `idx_cal_user_scheduled` ON `calendar_events` (`userId`, `scheduledAt`);
--> statement-breakpoint

-- programs: marketplace ordenado por fecha/publicación
CREATE INDEX `idx_prog_published_created` ON `programs` (`isPublished`, `createdAt`);
--> statement-breakpoint

-- routines: rutinas por creador + visibilidad
CREATE INDEX `idx_routines_user_public` ON `routines` (`createdById`, `isPublic`);
--> statement-breakpoint

-- program_routines: lookup ordenado
CREATE INDEX `idx_pr_program_order` ON `program_routines` (`programId`, `orderIndex`);
--> statement-breakpoint

-- ────────────────────────────────────────────────────────────
-- PASO 6 · UNIQUE constraint en program_purchases (evitar doble compra)
-- ────────────────────────────────────────────────────────────
ALTER TABLE `program_purchases`
  ADD CONSTRAINT `uq_purchase_user_program`
  UNIQUE (`userId`, `programId`);
--> statement-breakpoint

-- ────────────────────────────────────────────────────────────
-- PASO 7 · UNIQUE constraint en program_reviews (una reseña por usuario/programa)
-- ────────────────────────────────────────────────────────────
ALTER TABLE `program_reviews`
  ADD CONSTRAINT `uq_review_user_program`
  UNIQUE (`userId`, `programId`);
--> statement-breakpoint

-- ────────────────────────────────────────────────────────────
-- PASO 8 · UNIQUE constraint en program_routines (no duplicar el mismo routine en el mismo programa)
-- ────────────────────────────────────────────────────────────
ALTER TABLE `program_routines`
  ADD CONSTRAINT `uq_program_routine`
  UNIQUE (`programId`, `routineId`);
--> statement-breakpoint

-- ============================================================
-- FIN DE MIGRACIÓN 0003
-- Los datos existentes se conservan intactos.
-- routineIds en programs puede dejarse como columna legacy
-- o eliminarse en una migración futura (0004) tras validar.
-- ============================================================
