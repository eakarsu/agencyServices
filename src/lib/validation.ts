import { z } from "zod";

// Password strength validation
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: "Weak", color: "bg-red-500" };
  if (score <= 3) return { score, label: "Fair", color: "bg-yellow-500" };
  if (score <= 4) return { score, label: "Good", color: "bg-blue-500" };
  return { score, label: "Strong", color: "bg-green-500" };
}

// Client form validation
export const clientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  company: z.string().optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  address: z.string().optional(),
  industry: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "PROSPECT", "CHURNED"]).optional(),
  notes: z.string().max(2000, "Notes too long").optional(),
});

// Project form validation
export const projectSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(200),
  description: z.string().max(5000).optional(),
  clientId: z.string().min(1, "Client is required"),
  status: z.enum(["PLANNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"]).optional(),
  budget: z.number().min(0, "Budget must be positive").optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// Lead form validation
export const leadSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  company: z.string().optional(),
  title: z.string().optional(),
  source: z.enum(["WEBSITE", "REFERRAL", "COLD_CALL", "EMAIL_CAMPAIGN", "SOCIAL_MEDIA", "AD_CAMPAIGN", "EVENT", "OTHER"]),
  notes: z.string().max(2000).optional(),
});

// Campaign form validation
export const campaignSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(200),
  description: z.string().max(5000).optional(),
  clientId: z.string().min(1, "Client is required"),
  type: z.enum(["EMAIL", "SOCIAL", "PPC", "CONTENT", "SEO", "MULTI_CHANNEL"]),
  budget: z.number().min(0).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// Candidate form validation
export const candidateSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  resumeUrl: z.string().url("Invalid URL").optional().or(z.literal("")).optional(),
  resumeText: z.string().max(50000).optional(),
  skills: z.array(z.string()).optional().default([]),
  experience: z.number().int().min(0).max(50).optional(),
  currentTitle: z.string().max(200).optional(),
  currentCompany: z.string().max(200).optional(),
  expectedSalary: z.number().min(0).optional(),
  location: z.string().max(200).optional(),
  status: z.enum(["NEW", "SCREENING", "INTERVIEWING", "OFFERED", "PLACED", "REJECTED", "WITHDRAWN"]).optional().default("NEW"),
  source: z.string().max(100).optional(),
  notes: z.string().max(5000).optional(),
});

// Task form validation
export const taskSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  description: z.string().max(5000).optional(),
  projectId: z.string().min(1, "Project is required"),
  assigneeId: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"]).optional().default("TODO"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional().default("MEDIUM"),
  dueDate: z.string().optional(),
  estimatedHours: z.number().min(0).max(1000).optional(),
});

// Registration form validation
export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: passwordSchema,
});

// Input sanitization
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .trim();
}

export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = { ...obj };
  for (const key in sanitized) {
    if (typeof sanitized[key] === "string") {
      (sanitized as Record<string, unknown>)[key] = sanitizeInput(sanitized[key] as string);
    }
  }
  return sanitized;
}
