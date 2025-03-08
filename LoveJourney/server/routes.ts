import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertRelationshipSchema, insertMemorySchema, insertDailyQuestionSchema, linkPartnerSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Relationship routes
  app.get("/api/relationship", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const relationship = await storage.getRelationship(req.user.id);
    res.json(relationship || null);
  });

  app.post("/api/relationship", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const existingRelationship = await storage.getRelationship(req.user.id);
    if (existingRelationship) return res.status(400).send("User already has a relationship");

    const data = insertRelationshipSchema.parse(req.body);
    const relationship = await storage.createRelationship(req.user.id, data);
    res.status(201).json(relationship);
  });

  app.post("/api/relationship/link", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { partnerCode } = linkPartnerSchema.parse(req.body);

    const relationship = await storage.getRelationshipByPartnerCode(partnerCode);
    if (!relationship) return res.status(404).send("Invalid partner code");
    if (relationship.partnerUserId) return res.status(400).send("This relationship already has a partner");
    if (relationship.userId === req.user.id) return res.status(400).send("Cannot link with your own relationship");

    const existingRelationship = await storage.getRelationship(req.user.id);
    if (existingRelationship) return res.status(400).send("You are already in a relationship");

    const updated = await storage.linkPartner(relationship.id, req.user.id);
    res.json(updated);
  });

  // Daily questions routes
  app.get("/api/questions/:date", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const relationship = await storage.getRelationship(req.user.id);
    if (!relationship) return res.sendStatus(404);
    if (!relationship.partnerUserId) return res.status(400).send("Need a partner to start daily questions");

    const date = new Date(req.params.date);
    const questions = await storage.getDailyQuestions(relationship.id, date);
    res.json(questions);
  });

  app.post("/api/questions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const relationship = await storage.getRelationship(req.user.id);
    if (!relationship) return res.sendStatus(404);
    if (!relationship.partnerUserId) return res.status(400).send("Need a partner to start daily questions");

    const data = insertDailyQuestionSchema.parse(req.body);
    const question = await storage.createDailyQuestion(relationship.id, data);
    res.status(201).json(question);
  });

  app.patch("/api/questions/:id/answer", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const relationship = await storage.getRelationship(req.user.id);
    if (!relationship) return res.sendStatus(404);

    const { answer, isUser } = req.body;
    // Make sure users can only answer their own side
    if ((isUser && relationship.userId !== req.user.id) || 
        (!isUser && relationship.partnerUserId !== req.user.id)) {
      return res.sendStatus(403);
    }

    const question = await storage.updateDailyQuestion(parseInt(req.params.id), answer, isUser);
    res.json(question);
  });

  // Memories routes
  app.get("/api/memories", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const relationship = await storage.getRelationship(req.user.id);
    if (!relationship) return res.sendStatus(404);
    if (!relationship.partnerUserId) return res.status(400).send("Need a partner to share memories");

    const memories = await storage.getMemories(relationship.id);
    res.json(memories);
  });

  app.post("/api/memories", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const relationship = await storage.getRelationship(req.user.id);
    if (!relationship) return res.sendStatus(404);
    if (!relationship.partnerUserId) return res.status(400).send("Need a partner to create memories");

    const data = insertMemorySchema.parse(req.body);
    const memory = await storage.createMemory(relationship.id, data);
    res.status(201).json(memory);
  });

  app.delete("/api/memories/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.deleteMemory(parseInt(req.params.id));
    res.sendStatus(204);
  });

  const httpServer = createServer(app);
  return httpServer;
}