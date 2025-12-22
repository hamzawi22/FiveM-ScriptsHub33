import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Import auth and chat models to re-export or use
import { users } from "./models/auth";
export * from "./models/auth";
export * from "./models/chat";

export const scripts = pgTable("scripts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name").notNull(),
  virusScanStatus: text("virus_scan_status", { enum: ["pending", "clean", "infected"] }).default("pending").notNull(),
  virusScanReport: text("virus_scan_report"),
  price: integer("price").default(0).notNull(),
  views: integer("views").default(0).notNull(),
  downloads: integer("downloads").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  scriptId: integer("script_id").notNull().references(() => scripts.id),
  type: text("type", { enum: ["view", "download"] }).notNull(),
  country: text("country"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const scriptsRelations = relations(scripts, ({ one, many }) => ({
  user: one(users, {
    fields: [scripts.userId],
    references: [users.id],
  }),
  analytics: many(analytics),
}));

export const analyticsRelations = relations(analytics, ({ one }) => ({
  script: one(scripts, {
    fields: [analytics.scriptId],
    references: [scripts.id],
  }),
}));

export const insertScriptSchema = createInsertSchema(scripts).omit({
  id: true,
  userId: true,
  views: true,
  downloads: true,
  virusScanStatus: true,
  virusScanReport: true,
  createdAt: true,
});

export type Script = typeof scripts.$inferSelect;
export type InsertScript = z.infer<typeof insertScriptSchema>;
export type Analytics = typeof analytics.$inferSelect;
