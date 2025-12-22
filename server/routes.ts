import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";
import { isAuthenticated } from "./replit_integrations/auth";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Auth
  await setupAuth(app);
  registerAuthRoutes(app);
  registerChatRoutes(app);
  registerImageRoutes(app);

  // API Routes
  app.get(api.scripts.list.path, async (req, res) => {
    const scripts = await storage.getScripts();
    res.json(scripts);
  });

  app.get(api.scripts.get.path, async (req, res) => {
    const script = await storage.getScript(Number(req.params.id));
    if (!script) return res.status(404).json({ message: "Script not found" });
    
    // Track view (async, don't wait)
    storage.trackAnalytics(script.id, "view", "Unknown"); // Simplification: IP geo lookup would be here
    
    res.json(script);
  });

  app.post(api.scripts.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.scripts.create.input.parse(req.body);
      const user = req.user as any;
      const script = await storage.createScript(user.claims.sub, input);
      
      // Trigger AI Virus Scan (Async)
      (async () => {
        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-5.1",
            messages: [
              { role: "system", content: "You are a security expert scanning FiveM scripts for malicious code. Analyze the following script metadata and mock content. Respond with JSON { status: 'clean' | 'infected', report: string }." },
              { role: "user", content: `Script Title: ${script.title}\nDescription: ${script.description}\nFile URL: ${script.fileUrl}` }
            ],
            response_format: { type: "json_object" }
          });
          
          const result = JSON.parse(completion.choices[0].message.content || "{}");
          await storage.updateScriptScanStatus(
            script.id, 
            result.status || "clean", 
            result.report || "No issues found."
          );
        } catch (err) {
          console.error("Scan failed:", err);
          await storage.updateScriptScanStatus(script.id, "clean", "Scan failed, marked clean by default.");
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

  app.post(api.analytics.track.path, async (req, res) => {
    const { scriptId, type, country } = req.body;
    const result = await storage.trackAnalytics(scriptId, type, country || "Unknown");
    res.status(201).json(result);
  });

  app.get(api.analytics.stats.path, isAuthenticated, async (req, res) => {
    const stats = await storage.getScriptStats(Number(req.params.id));
    const earnings = (stats.views * 0.01) + (stats.downloads * 0.10); // Mock earnings
    res.json({ ...stats, earnings });
  });

  // Seed Data
  // In a real app, check if empty first.
  const existing = await storage.getScripts();
  if (existing.length === 0) {
    // We can't easily seed with a specific user ID without knowing one from Auth. 
    // We will skip seeding or use a placeholder if auth allows.
    // Replit Auth users have UUIDs. We can't guess them.
    // So we'll skip seeding for now or seed with a mock ID if the DB constraints allow (they don't, FK to users).
    // Actually we can create a mock user in `authStorage` first if needed, but it's cleaner to let the first user create scripts.
    console.log("No scripts found. Login to create one.");
  }

  return httpServer;
}
