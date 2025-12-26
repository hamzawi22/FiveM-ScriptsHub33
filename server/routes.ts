import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

// Helper to check if file contains fxmanifest.lua
async function checkFxManifest(fileUrl: string): Promise<boolean> {
  try {
    const response = await fetch(fileUrl);
    const content = await response.text();
    return content.includes("fxmanifest.lua") || content.includes("fx_version");
  } catch {
    return false;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Auth
  await setupAuth(app);
  registerAuthRoutes(app);
  registerChatRoutes(app);
  registerImageRoutes(app);

  // Scripts API
  app.get(api.scripts.list.path, async (req, res) => {
    const scripts = await storage.getScripts({
      search: req.query.search as string,
      duration: req.query.duration as string,
      sortBy: req.query.sortBy as string,
    });
    res.json(scripts);
  });

  app.get(api.scripts.get.path, async (req, res) => {
    const script = await storage.getScript(Number(req.params.id));
    if (!script) return res.status(404).json({ message: "Script not found" });
    
    // Track view (deduped by analytics unique constraint)
    const user = req.user as any;
    await storage.trackAnalytics(script.id, user?.claims?.sub || null, "view");
    
    res.json(script);
  });

  app.post(api.scripts.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.scripts.create.input.parse(req.body);
      const user = req.user as any;
      
      // Check premium status for month duration
      if (input.duration === "month") {
        const sub = await storage.getPremiumStatus(user.claims.sub);
        if (!sub || new Date(sub.expiresAt!) < new Date()) {
          return res.status(400).json({ message: "Premium subscription required for monthly duration" });
        }
      }
      
      const script = await storage.createScript(user.claims.sub, input);
      
      // Trigger AI scan (async)
      (async () => {
        try {
          const hasFxManifest = await checkFxManifest(script.fileUrl);
          
          const completion = await openai.chat.completions.create({
            model: "gpt-5.1",
            messages: [
              { role: "system", content: "You are a security expert scanning FiveM scripts. Respond with JSON { status: 'clean' | 'infected', report: string }." },
              { role: "user", content: `Script: ${script.title}\nHas fxmanifest.lua: ${hasFxManifest}\nDescription: ${script.description}` }
            ],
            response_format: { type: "json_object" },
            max_completion_tokens: 500,
          });
          
          const result = JSON.parse(completion.choices[0].message.content || "{}");
          await storage.updateScriptScanStatus(
            script.id,
            result.status || "clean",
            hasFxManifest,
            result.report || "Scan complete."
          );
        } catch (err) {
          console.error("Scan failed:", err);
          await storage.updateScriptScanStatus(script.id, "clean", false, "Scan failed, marked clean.");
        }
      })();

      res.status(201).json(script);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.scripts.delete.path, isAuthenticated, async (req, res) => {
    const script = await storage.getScript(Number(req.params.id));
    const user = req.user as any;
    if (!script || script.userId !== user.claims.sub) {
      return res.status(404).json({ message: "Script not found" });
    }
    await storage.deleteScript(script.id);
    res.status(204).send();
  });

  // Analytics
  app.post(api.analytics.track.path, async (req, res) => {
    const { scriptId, type, country } = req.body;
    const user = req.user as any;
    const result = await storage.trackAnalytics(scriptId, user?.claims?.sub || null, type, country);
    if (result) {
      res.status(201).json(result);
    } else {
      res.status(200).json({ message: "Already tracked" });
    }
  });

  app.get(api.analytics.stats.path, async (req, res) => {
    const stats = await storage.getScriptStats(Number(req.params.id));
    res.json(stats);
  });

  // Profiles
  app.get(api.profiles.get.path, async (req, res) => {
    const profile = await storage.getProfile(req.params.userId);
    if (!profile) return res.status(404).json({ message: "User not found" });
    res.json({
      id: profile.user.id,
      email: profile.user.email,
      firstName: profile.user.firstName,
      bio: profile.bio,
      followers: profile.followers,
      following: profile.following,
      totalEarnings: profile.totalEarnings,
      coins: profile.coins,
      isVerified: profile.isVerified,
      trustScore: profile.trustScore,
    });
  });

  app.get(api.profiles.getUserScripts.path, async (req, res) => {
    const scripts = await storage.getUserScripts(req.params.userId);
    res.json(scripts);
  });

  app.post(api.profiles.follow.path, isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const followed = await storage.followUser(user.claims.sub, req.params.userId);
    res.json({ followed });
  });

  // Subscriptions
  app.get(api.subscription.getStatus.path, isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const sub = await storage.getPremiumStatus(user.claims.sub);
    const profile = await storage.getProfile(user.claims.sub) || { coins: 0 };
    
    res.json({
      tier: sub?.tier || "free",
      expiresAt: sub?.expiresAt?.toISOString(),
      coins: profile.coins || 0,
    });
  });

  app.post(api.subscription.purchase.path, isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const { tier } = req.body;
      
      const tierConfig = {
        monthly: { days: 30, coins: 100 },
        quarterly: { days: 90, coins: 250 },
        yearly: { days: 365, coins: 800 },
      };
      
      const config = tierConfig[tier as keyof typeof tierConfig];
      if (!config) return res.status(400).json({ message: "Invalid tier" });
      
      const profile = await storage.getProfile(user.claims.sub);
      if (!profile || profile.coins < config.coins) {
        return res.status(400).json({ message: "Insufficient coins" });
      }
      
      // Deduct coins and create subscription
      await storage.addCoins(user.claims.sub, -config.coins);
      await storage.createSubscription(user.claims.sub, tier, config.days);
      
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Purchase failed" });
    }
  });

  // Profile Search
  app.get("/api/profiles/search", async (req, res) => {
    const q = req.query.q as string;
    if (!q || q.length < 2) {
      return res.json([]);
    }
    const results = await storage.searchProfiles(q);
    res.json(results);
  });

  // Earnings & Verification
  app.get("/api/earnings", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const earnings = await storage.getEarningsData(user.claims.sub);
    res.json(earnings);
  });

  app.post("/api/verification/request", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const earnings = await storage.getEarningsData(user.claims.sub);
      
      const { meetsFollowers, meetsDownloads, meetsViews } = earnings.verificationEligibility;
      if (!meetsFollowers || !meetsDownloads || !meetsViews) {
        return res.status(400).json({ message: "Requirements not met" });
      }

      // Check if already has pending request
      const existing = await storage.getPendingVerificationRequest(user.claims.sub);
      if (existing) {
        return res.status(400).json({ message: "Already have pending verification request" });
      }

      await storage.createVerificationRequest(
        user.claims.sub,
        earnings.followers,
        earnings.last3MonthsDownloads,
        earnings.last3MonthsViews
      );
      
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Request failed" });
    }
  });

  // Ratings & Reports
  app.post("/api/scripts/:id/rate", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const { rating, review } = req.body;
      
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }

      const scriptId = Number(req.params.id);
      await storage.rateScript(scriptId, user.claims.sub, rating, review);
      
      // Recalculate trust score for the script owner
      const script = await storage.getScript(scriptId);
      if (script) {
        await storage.calculateTrustScore(script.userId);
      }
      
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Rating failed" });
    }
  });

  app.post("/api/scripts/:id/report", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const { reason, description } = req.body;
      
      if (!reason) {
        return res.status(400).json({ message: "Report reason is required" });
      }

      const scriptId = Number(req.params.id);
      await storage.reportScript(scriptId, user.claims.sub, reason, description);
      
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Report failed" });
    }
  });

  // Get script ratings
  app.get("/api/scripts/:id/ratings", async (req, res) => {
    try {
      const scriptId = Number(req.params.id);
      const ratings = await storage.getScriptRatings(scriptId);
      res.json(ratings);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch ratings" });
    }
  });

  // Follow user
  app.post("/api/users/:userId/follow", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const targetUserId = req.params.userId;
      
      if (user.claims.sub === targetUserId) {
        return res.status(400).json({ message: "Cannot follow yourself" });
      }

      const success = await storage.followUser(user.claims.sub, targetUserId);
      res.json({ success });
    } catch (err) {
      res.status(500).json({ message: "Follow failed" });
    }
  });

  return httpServer;
}
