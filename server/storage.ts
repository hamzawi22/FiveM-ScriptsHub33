import { db } from "./db";
import { scripts, analytics, type InsertScript, type Script, type Analytics } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

export interface IStorage {
  createScript(userId: string, script: InsertScript): Promise<Script>;
  getScripts(): Promise<Script[]>;
  getScript(id: number): Promise<Script | undefined>;
  getUserScripts(userId: string): Promise<Script[]>;
  updateScriptScanStatus(id: number, status: string, report: string): Promise<Script>;
  deleteScript(id: number): Promise<void>;
  
  trackAnalytics(scriptId: number, type: "view" | "download", country?: string): Promise<Analytics>;
  getScriptStats(scriptId: number): Promise<{ views: number; downloads: number; byCountry: Record<string, number> }>;
}

export class DatabaseStorage implements IStorage {
  async createScript(userId: string, insertScript: InsertScript): Promise<Script> {
    const [script] = await db.insert(scripts).values({ ...insertScript, userId }).returning();
    return script;
  }

  async getScripts(): Promise<Script[]> {
    return await db.select().from(scripts).orderBy(sql`${scripts.createdAt} DESC`);
  }

  async getScript(id: number): Promise<Script | undefined> {
    const [script] = await db.select().from(scripts).where(eq(scripts.id, id));
    return script;
  }

  async getUserScripts(userId: string): Promise<Script[]> {
    return await db.select().from(scripts).where(eq(scripts.userId, userId));
  }

  async updateScriptScanStatus(id: number, status: string, report: string): Promise<Script> {
    const [updated] = await db.update(scripts)
      .set({ 
        virusScanStatus: status as "pending" | "clean" | "infected", 
        virusScanReport: report 
      })
      .where(eq(scripts.id, id))
      .returning();
    return updated;
  }

  async deleteScript(id: number): Promise<void> {
    await db.delete(scripts).where(eq(scripts.id, id));
  }

  async trackAnalytics(scriptId: number, type: "view" | "download", country?: string): Promise<Analytics> {
    const [entry] = await db.insert(analytics).values({ scriptId, type, country }).returning();
    
    // Update counters on script
    if (type === 'view') {
      await db.update(scripts).set({ views: sql`${scripts.views} + 1` }).where(eq(scripts.id, scriptId));
    } else {
      await db.update(scripts).set({ downloads: sql`${scripts.downloads} + 1` }).where(eq(scripts.id, scriptId));
    }
    
    return entry;
  }

  async getScriptStats(scriptId: number): Promise<{ views: number; downloads: number; byCountry: Record<string, number> }> {
    const script = await this.getScript(scriptId);
    if (!script) return { views: 0, downloads: 0, byCountry: {} };

    const stats = await db.select().from(analytics).where(eq(analytics.scriptId, scriptId));
    
    const byCountry: Record<string, number> = {};
    stats.forEach(s => {
      const country = s.country || 'Unknown';
      byCountry[country] = (byCountry[country] || 0) + 1;
    });

    return {
      views: script.views,
      downloads: script.downloads,
      byCountry
    };
  }
}

export const storage = new DatabaseStorage();
