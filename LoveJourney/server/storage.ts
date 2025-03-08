import type { User, InsertUser, Relationship, InsertRelationship, DailyQuestion, InsertDailyQuestion, Memory, InsertMemory } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { randomBytes } from "crypto";

const MemoryStore = createMemoryStore(session);

function generatePartnerCode(): string {
  return randomBytes(4).toString('hex').toUpperCase();
}

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Relationship operations
  getRelationship(userId: number): Promise<Relationship | undefined>;
  getRelationshipByPartnerCode(code: string): Promise<Relationship | undefined>;
  createRelationship(userId: number, relationship: InsertRelationship): Promise<Relationship>;
  updateRelationship(id: number, relationship: Partial<InsertRelationship>): Promise<Relationship>;
  linkPartner(relationshipId: number, partnerUserId: number): Promise<Relationship>;

  // Daily questions operations
  getDailyQuestions(relationshipId: number, date: Date): Promise<DailyQuestion[]>;
  createDailyQuestion(relationshipId: number, question: InsertDailyQuestion): Promise<DailyQuestion>;
  updateDailyQuestion(id: number, answer: string, isUser: boolean): Promise<DailyQuestion>;

  // Memories operations
  getMemories(relationshipId: number): Promise<Memory[]>;
  createMemory(relationshipId: number, memory: InsertMemory): Promise<Memory>;
  deleteMemory(id: number): Promise<void>;

  // Session store
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private relationships: Map<number, Relationship>;
  private dailyQuestions: Map<number, DailyQuestion>;
  private memories: Map<number, Memory>;
  private currentId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.relationships = new Map();
    this.dailyQuestions = new Map();
    this.memories = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user = { id, ...insertUser };
    this.users.set(id, user);
    return user;
  }

  async getRelationship(userId: number): Promise<Relationship | undefined> {
    return Array.from(this.relationships.values()).find(
      (rel) => rel.userId === userId || rel.partnerUserId === userId,
    );
  }

  async getRelationshipByPartnerCode(code: string): Promise<Relationship | undefined> {
    return Array.from(this.relationships.values()).find(
      (rel) => rel.partnerCode === code,
    );
  }

  async createRelationship(userId: number, relationship: InsertRelationship): Promise<Relationship> {
    const id = this.currentId++;
    const newRelationship = { 
      id, 
      userId, 
      partnerUserId: null,
      partnerCode: generatePartnerCode(),
      ...relationship,
      description: relationship.description || null 
    };
    this.relationships.set(id, newRelationship);
    return newRelationship;
  }

  async updateRelationship(id: number, relationship: Partial<InsertRelationship>): Promise<Relationship> {
    const existing = this.relationships.get(id);
    if (!existing) throw new Error("Relationship not found");
    const updated = { ...existing, ...relationship };
    this.relationships.set(id, updated);
    return updated;
  }

  async linkPartner(relationshipId: number, partnerUserId: number): Promise<Relationship> {
    const relationship = this.relationships.get(relationshipId);
    if (!relationship) throw new Error("Relationship not found");
    if (relationship.partnerUserId) throw new Error("Relationship already has a partner");

    const updated = { ...relationship, partnerUserId };
    this.relationships.set(relationshipId, updated);
    return updated;
  }

  async getDailyQuestions(relationshipId: number, date: Date): Promise<DailyQuestion[]> {
    return Array.from(this.dailyQuestions.values()).filter(
      (q) => q.relationshipId === relationshipId && 
      new Date(q.date).toISOString().split('T')[0] === date.toISOString().split('T')[0]
    );
  }

  async createDailyQuestion(relationshipId: number, question: InsertDailyQuestion): Promise<DailyQuestion> {
    const id = this.currentId++;
    const newQuestion = { 
      id, 
      relationshipId, 
      ...question,
      userAnswer: question.userAnswer || null,
      partnerAnswer: question.partnerAnswer || null,
      isAnswered: false
    };
    this.dailyQuestions.set(id, newQuestion);
    return newQuestion;
  }

  async updateDailyQuestion(id: number, answer: string, isUser: boolean): Promise<DailyQuestion> {
    const existing = this.dailyQuestions.get(id);
    if (!existing) throw new Error("Question not found");
    const updated = {
      ...existing,
      [isUser ? "userAnswer" : "partnerAnswer"]: answer,
      isAnswered: isUser ? existing.partnerAnswer !== null : existing.userAnswer !== null,
    };
    this.dailyQuestions.set(id, updated);
    return updated;
  }

  async getMemories(relationshipId: number): Promise<Memory[]> {
    return Array.from(this.memories.values())
      .filter((m) => m.relationshipId === relationshipId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async createMemory(relationshipId: number, memory: InsertMemory): Promise<Memory> {
    const id = this.currentId++;
    const newMemory = { 
      id, 
      relationshipId, 
      ...memory,
      description: memory.description || null 
    };
    this.memories.set(id, newMemory);
    return newMemory;
  }

  async deleteMemory(id: number): Promise<void> {
    this.memories.delete(id);
  }
}

export const storage = new MemStorage();