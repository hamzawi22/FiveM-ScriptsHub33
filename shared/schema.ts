import { pgTable, text, serial, integer, boolean, timestamp, varchar, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations, sql } from "drizzle-orm";

// Import auth and chat models to re-export or use
import { users as authUsers } from "./models/auth";
export * from "./models/auth";
export * from "./models/chat";

// Extend users table with profile info
export const users = authUsers;

export const profiles = pgTable("profiles", {
  userId: varchar("user_id").primaryKey().references(() => users.id),
  bio: text("bio"),
  followers: integer("followers").default(0),
  following: integer("following").default(0),
  totalEarnings: integer("total_earnings").default(0),
  coins: integer("coins").default(0),
  isVerified: boolean("is_verified").default(false),
  trustScore: integer("trust_score").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const verificationRequests = pgTable("verification_requests", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).default("pending"),
  followersCount: integer("followers_count").notNull(),
  downloadsCount: integer("downloads_count").notNull(),
  viewsCount: integer("views_count").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
});

export const follows = pgTable("follows", {
  id: serial("id").primaryKey(),
  followerId: varchar("follower_id").notNull().references(() => users.id),
  followingId: varchar("following_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("follows_unique").on(table.followerId, table.followingId)
]);

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  tier: text("tier", { enum: ["free", "monthly", "quarterly", "yearly"] }).default("free"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ratings = pgTable("ratings", {
  id: serial("id").primaryKey(),
  scriptId: integer("script_id").notNull().references(() => scripts.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(), // 1-5
  review: text("review"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("ratings_unique").on(table.scriptId, table.userId)
]);

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  scriptId: integer("script_id").notNull().references(() => scripts.id),
  reportedById: varchar("reported_by_id").notNull().references(() => users.id),
  reason: text("reason").notNull(), // "malware", "spam", "stolen", "broken", etc
  description: text("description"),
  status: text("status", { enum: ["pending", "reviewed", "valid", "invalid"] }).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by_id"),
});

export const strikes = pgTable("strikes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  reason: text("reason").notNull(), // "multiple_reports", "malware", "policy_violation", etc
  severity: text("severity", { enum: ["warning", "suspension", "ban"] }).default("warning"),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"), // null = permanent
});

export const scripts = pgTable("scripts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name").notNull(),
  hasFxManifest: boolean("has_fx_manifest").default(false).notNull(),
  virusScanStatus: text("virus_scan_status", { enum: ["pending", "clean", "infected"] }).default("pending").notNull(),
  virusScanReport: text("virus_scan_report"),
  duration: text("duration", { enum: ["day", "week", "month"] }).default("week").notNull(),
  isPremium: boolean("is_premium").default(false),
  expiresAt: timestamp("expires_at"),
  coinsRequired: integer("coins_required").default(0).notNull(),
  price: integer("price").default(0), // Kept for backward compatibility
  views: integer("views").default(0).notNull(),
  downloads: integer("downloads").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  scriptId: integer("script_id").notNull().references(() => scripts.id),
  userId: varchar("user_id"),
  type: text("type", { enum: ["view", "download"] }).notNull(),
  country: text("country"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("analytics_unique_view").on(table.scriptId, table.userId, table.type)
]);

// Relations
export const profilesRelations = relations(profiles, ({ one, many }) => ({
  user: one(users, { fields: [profiles.userId], references: [users.id] }),
  followers: many(follows, { relationName: "followers" }),
  following: many(follows, { relationName: "following" }),
}));

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, { fields: [follows.followerId], references: [users.id] }),
  following: one(users, { fields: [follows.followingId], references: [users.id] }),
}));

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

export const ratingsRelations = relations(ratings, ({ one }) => ({
  script: one(scripts, { fields: [ratings.scriptId], references: [scripts.id] }),
  user: one(users, { fields: [ratings.userId], references: [users.id] }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  script: one(scripts, { fields: [reports.scriptId], references: [scripts.id] }),
  reportedBy: one(users, { fields: [reports.reportedById], references: [users.id] }),
}));

export const strikesRelations = relations(strikes, ({ one }) => ({
  user: one(users, { fields: [strikes.userId], references: [users.id] }),
}));

export const insertScriptSchema = createInsertSchema(scripts).omit({
  id: true,
  userId: true,
  views: true,
  downloads: true,
  virusScanStatus: true,
  virusScanReport: true,
  hasFxManifest: true,
  isPremium: true,
  expiresAt: true,
  createdAt: true,
  imageUrl: true,
}).extend({
  coinsRequired: z.coerce.number().min(0),
});

export type User = typeof users.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Follow = typeof follows.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Script = typeof scripts.$inferSelect;
export type InsertScript = z.infer<typeof insertScriptSchema>;
export type Analytics = typeof analytics.$inferSelect;
export type VerificationRequest = typeof verificationRequests.$inferSelect;
export type Rating = typeof ratings.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type Strike = typeof strikes.$inferSelect;
