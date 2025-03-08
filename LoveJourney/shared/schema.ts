import { pgTable, text, serial, integer, boolean, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const relationships = pgTable("relationships", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  partnerUserId: integer("partner_user_id"),
  partnerName: text("partner_name").notNull(),
  partnerCode: text("partner_code").notNull().unique(),
  anniversary: date("anniversary").notNull(),
  description: text("description"),
});

export const dailyQuestions = pgTable("daily_questions", {
  id: serial("id").primaryKey(),
  relationshipId: integer("relationship_id").notNull(),
  question: text("question").notNull(),
  userAnswer: text("user_answer"),
  partnerAnswer: text("partner_answer"),
  date: date("date").notNull(),
  isAnswered: boolean("is_answered").default(false),
});

export const memories = pgTable("memories", {
  id: serial("id").primaryKey(),
  relationshipId: integer("relationship_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url").notNull(),
  date: timestamp("date").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertRelationshipSchema = createInsertSchema(relationships).pick({
  partnerName: true,
  anniversary: true,
  description: true,
});

export const linkPartnerSchema = z.object({
  partnerCode: z.string().min(1, "Partner code is required"),
});

export const insertDailyQuestionSchema = createInsertSchema(dailyQuestions).pick({
  question: true,
  userAnswer: true,
  partnerAnswer: true,
  date: true,
});

export const insertMemorySchema = createInsertSchema(memories).pick({
  title: true,
  description: true,
  imageUrl: true,
  date: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Relationship = typeof relationships.$inferSelect;
export type InsertRelationship = z.infer<typeof insertRelationshipSchema>;
export type LinkPartner = z.infer<typeof linkPartnerSchema>;
export type DailyQuestion = typeof dailyQuestions.$inferSelect;
export type InsertDailyQuestion = z.infer<typeof insertDailyQuestionSchema>;
export type Memory = typeof memories.$inferSelect;
export type InsertMemory = z.infer<typeof insertMemorySchema>;