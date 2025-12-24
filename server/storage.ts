import { db } from "./db";
import { scripts, analytics, profiles, follows, subscriptions, verificationRequests, type InsertScript, type Script, type Analytics, type Profile, type Follow, type Subscription, type VerificationRequest, users } from "@shared/schema";
import { eq, sql, and, like, desc, inArray, gte } from "drizzle-orm";

export interface IStorage {
  // Scripts
  createScript(userId: string, script: InsertScript): Promise<Script>;
  getScripts(filter?: { search?: string; duration?: string; sortBy?: string }): Promise<Script[]>;
  getScript(id: number): Promise<Script | undefined>;
  getUserScripts(userId: string): Promise<Script[]>;
  updateScriptScanStatus(id: number, status: string, hasFxManifest: boolean, report: string): Promise<Script>;
  deleteScript(id: number): Promise<void>;
  
  // Analytics
  trackAnalytics(scriptId: number, userId: string | null, type: "view" | "download", country?: string): Promise<Analytics | null>;
  getScriptStats(scriptId: number): Promise<{ views: number; downloads: number; earnings: number; byCountry: Record<string, number> }>;
  
  // Profiles
  getProfile(userId: string): Promise<(Profile & { user: typeof users.$inferSelect }) | undefined>;
  updateProfile(userId: string, bio: string): Promise<Profile>;
  addCoins(userId: string, amount: number): Promise<void>;
  
  // Follows
  followUser(followerId: string, followingId: string): Promise<boolean>;
  unfollowUser(followerId: string, followingId: string): Promise<boolean>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
  
  // Subscriptions
  getPremiumStatus(userId: string): Promise<Subscription | undefined>;
  createSubscription(userId: string, tier: string, daysValid: number): Promise<Subscription>;
  
  // Search & Verification
  searchProfiles(query: string): Promise<any[]>;
  getEarningsData(userId: string): Promise<any>;
  createVerificationRequest(userId: string, followers: number, downloads: number, views: number): Promise<VerificationRequest>;
  getPendingVerificationRequest(userId: string): Promise<VerificationRequest | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Scripts
  async createScript(userId: string, insertScript: InsertScript): Promise<Script> {
    const now = new Date();
    let expiresAt = null;
    
    if (insertScript.duration === "day") {
      expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    } else if (insertScript.duration === "week") {
      expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
    // month requires premium - no auto-expiry set here, handled via subscription
    
    const [script] = await db.insert(scripts).values({
      ...insertScript,
      userId,
      expiresAt,
      isPremium: insertScript.duration === "month",
    }).returning();
    return script;
  }

  async getScripts(filter?: { search?: string; duration?: string; sortBy?: string }): Promise<Script[]> {
    let query = db.select().from(scripts);
    
    const conditions = [];
    if (filter?.search) {
      conditions.push(like(scripts.title, `%${filter.search}%`));
    }
    if (filter?.duration) {
      conditions.push(eq(scripts.duration, filter.duration as any));
    }
    
    // Filter out expired scripts
    conditions.push(
      sql`${scripts.expiresAt} IS NULL OR ${scripts.expiresAt} > NOW()`
    );
    
    let q = query.where(conditions.length > 0 ? and(...conditions) : undefined);
    
    if (filter?.sortBy === "trending") {
      q = q.orderBy(sql`${scripts.downloads} + ${scripts.views} DESC`);
    } else if (filter?.sortBy === "topViews") {
      q = q.orderBy(desc(scripts.views));
    } else {
      q = q.orderBy(desc(scripts.createdAt));
    }
    
    return await q;
  }

  async getScript(id: number): Promise<Script | undefined> {
    const [script] = await db.select().from(scripts).where(eq(scripts.id, id));
    return script;
  }

  async getUserScripts(userId: string): Promise<Script[]> {
    return await db.select().from(scripts).where(eq(scripts.userId, userId));
  }

  async updateScriptScanStatus(id: number, status: string, hasFxManifest: boolean, report: string): Promise<Script> {
    if (!hasFxManifest && status !== "clean") {
      // Auto-reject if no fxmanifest
      status = "infected";
      report = "Missing fxmanifest.lua file - rejected automatically.";
    }
    
    const [updated] = await db.update(scripts)
      .set({
        virusScanStatus: status as any,
        virusScanReport: report,
        hasFxManifest,
      })
      .where(eq(scripts.id, id))
      .returning();
    return updated;
  }

  async deleteScript(id: number): Promise<void> {
    // Delete analytics first due to foreign key constraint
    await db.delete(analytics).where(eq(analytics.scriptId, id));
    await db.delete(scripts).where(eq(scripts.id, id));
  }

  // Analytics
  async trackAnalytics(scriptId: number, userId: string | null, type: "view" | "download", country?: string): Promise<Analytics | null> {
    try {
      const [entry] = await db.insert(analytics).values({
        scriptId,
        userId,
        type,
        country: country || "Unknown",
      }).returning();
      
      // Update counters on script
      if (type === 'view') {
        await db.update(scripts).set({ views: sql`${scripts.views} + 1` }).where(eq(scripts.id, scriptId));
      } else {
        await db.update(scripts).set({ downloads: sql`${scripts.downloads} + 1` }).where(eq(scripts.id, scriptId));
      }
      
      return entry;
    } catch (err) {
      // Unique constraint violation - user already tracked for this script
      return null;
    }
  }

  async getScriptStats(scriptId: number): Promise<{ views: number; downloads: number; earnings: number; byCountry: Record<string, number> }> {
    const script = await this.getScript(scriptId);
    if (!script) return { views: 0, downloads: 0, earnings: 0, byCountry: {} };

    const stats = await db.select().from(analytics).where(eq(analytics.scriptId, scriptId));
    
    const byCountry: Record<string, number> = {};
    stats.forEach(s => {
      const country = s.country || 'Unknown';
      byCountry[country] = (byCountry[country] || 0) + 1;
    });

    // Only count downloads for coins (not views)
    const earnings = script.downloads * 5;

    return { views: script.views, downloads: script.downloads, earnings, byCountry };
  }

  // Profiles
  async getProfile(userId: string) {
    const [profile] = await db.query.profiles.findMany({
      where: eq(profiles.userId, userId),
      with: { user: true },
      limit: 1,
    });
    return profile;
  }

  async updateProfile(userId: string, bio: string): Promise<Profile> {
    const [updated] = await db.insert(profiles)
      .values({ userId, bio })
      .onConflictDoUpdate({
        target: profiles.userId,
        set: { bio },
      })
      .returning();
    return updated;
  }

  async addCoins(userId: string, amount: number): Promise<void> {
    await db.update(profiles)
      .set({ coins: sql`${profiles.coins} + ${amount}` })
      .where(eq(profiles.userId, userId));
  }

  // Follows
  async followUser(followerId: string, followingId: string): Promise<boolean> {
    try {
      await db.insert(follows).values({ followerId, followingId });
      await db.update(profiles).set({ followers: sql`${profiles.followers} + 1` }).where(eq(profiles.userId, followingId));
      await db.update(profiles).set({ following: sql`${profiles.following} + 1` }).where(eq(profiles.userId, followerId));
      return true;
    } catch {
      return false;
    }
  }

  async unfollowUser(followerId: string, followingId: string): Promise<boolean> {
    const result = await db.delete(follows).where(
      and(eq(follows.followerId, followerId), eq(follows.followingId, followingId))
    );
    if (result.rowCount > 0) {
      await db.update(profiles).set({ followers: sql`${profiles.followers} - 1` }).where(eq(profiles.userId, followingId));
      await db.update(profiles).set({ following: sql`${profiles.following} - 1` }).where(eq(profiles.userId, followerId));
      return true;
    }
    return false;
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const [result] = await db.select().from(follows).where(
      and(eq(follows.followerId, followerId), eq(follows.followingId, followingId))
    );
    return !!result;
  }

  // Subscriptions
  async getPremiumStatus(userId: string): Promise<Subscription | undefined> {
    const [sub] = await db.select().from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
    return sub;
  }

  async createSubscription(userId: string, tier: string, daysValid: number): Promise<Subscription> {
    const expiresAt = new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000);
    const [sub] = await db.insert(subscriptions)
      .values({ userId, tier: tier as any, expiresAt })
      .returning();
    return sub;
  }

  // Search & Verification
  async searchProfiles(query: string): Promise<any[]> {
    const userResults = await db.select().from(users).where(
      like(sql`${users.firstName} || ' ' || ${users.lastName}`, `%${query}%`)
    ).limit(20);

    const results = await Promise.all(
      userResults.map(async (user) => {
        const profile = await this.getProfile(user.id);
        const userScripts = await this.getUserScripts(user.id);
        return {
          id: user.id,
          firstName: user.firstName || "Unknown",
          email: user.email,
          followers: profile?.followers || 0,
          scriptsCount: userScripts.length,
          isVerified: profile?.isVerified || false,
          trustScore: profile?.trustScore || 0,
        };
      })
    );
    return results;
  }

  async getEarningsData(userId: string): Promise<any> {
    const profile = await this.getProfile(userId);
    const userScripts = await this.getUserScripts(userId);
    
    // Get last 3 months date
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // Calculate 3-month downloads and views
    const analyticsData = await db.select().from(analytics).where(
      and(
        inArray(analytics.scriptId, userScripts.map(s => s.id)),
        gte(analytics.createdAt, threeMonthsAgo)
      )
    );

    const downloads = analyticsData.filter(a => a.type === 'download').length;
    const views = analyticsData.filter(a => a.type === 'view').length;

    const eligibility = {
      meetsFollowers: (profile?.followers || 0) >= 500,
      meetsDownloads: downloads >= 5000,
      meetsViews: views >= 10000,
    };

    const lastVerification = await this.getPendingVerificationRequest(userId);

    return {
      coins: profile?.coins || 0,
      totalEarnings: profile?.totalEarnings || 0,
      followers: profile?.followers || 0,
      last3MonthsDownloads: downloads,
      last3MonthsViews: views,
      scriptsCount: userScripts.length,
      isVerified: profile?.isVerified || false,
      verificationEligibility: {
        ...eligibility,
        canApply: eligibility.meetsFollowers && eligibility.meetsDownloads && eligibility.meetsViews,
      },
      lastVerificationRequest: lastVerification ? {
        id: lastVerification.id,
        status: lastVerification.status,
        createdAt: lastVerification.createdAt.toISOString(),
      } : null,
    };
  }

  async createVerificationRequest(userId: string, followers: number, downloads: number, views: number): Promise<VerificationRequest> {
    const [req] = await db.insert(verificationRequests)
      .values({ userId, followersCount: followers, downloadsCount: downloads, viewsCount: views })
      .returning();
    return req;
  }

  async getPendingVerificationRequest(userId: string): Promise<VerificationRequest | undefined> {
    const [req] = await db.select().from(verificationRequests)
      .where(and(eq(verificationRequests.userId, userId), eq(verificationRequests.status, "pending")))
      .orderBy(desc(verificationRequests.createdAt))
      .limit(1);
    return req;
  }
}

export const storage = new DatabaseStorage();
