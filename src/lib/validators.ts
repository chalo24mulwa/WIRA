import { z } from "zod";
import { normalizePhone } from "@/lib/phone";

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name is too short").max(100),
    email: z.string().email("Enter a valid email"),
    phone: z
      .string()
      .min(7, "Enter a valid Kenyan phone number")
      .max(20)
      .refine((value) => normalizePhone(value) !== null, {
        message: "Enter a valid Kenyan phone number (07xx xxx xxx or +254…)",
      }),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.enum(["CUSTOMER", "PROFESSIONAL"]),
    accountKind: z.enum(["INDIVIDUAL", "COMPANY"]),
    companyName: z.string().min(2).max(150).optional().or(z.literal("")),
    county: z.string().min(2).optional().or(z.literal("")),
  })
  .refine(
    (data) => data.accountKind !== "COMPANY" || (data.companyName && data.companyName.trim().length >= 2),
    { message: "Company name is required for a company account", path: ["companyName"] }
  );

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const verifyAccountSchema = z.object({
  userId: z.string().min(1),
  emailCode: z.string().length(6),
  phoneCode: z.string().length(6),
});

export const resendCodeSchema = z.object({
  userId: z.string().min(1),
  purpose: z.enum(["EMAIL_VERIFY", "PHONE_VERIFY"]),
});

export const requestContactChangeSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

export const confirmContactChangeSchema = z.object({
  purpose: z.enum(["EMAIL_CHANGE", "PHONE_CHANGE"]),
  code: z.string().length(6),
});

export const serviceRequestSchema = z.object({
  categoryId: z.string().min(1),
  description: z.string().min(10, "Please describe the job in more detail").max(2000),
  county: z.string().min(2),
  town: z.string().optional().or(z.literal("")),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  photoUrls: z.array(z.string()).max(6).optional(),
  budgetAmount: z.number().positive().optional(),
  budgetMethod: z.enum(["PER_HOUR", "PER_JOB"]).optional(),
});

export const quotationSchema = z.object({
  amount: z.number().positive("Enter a valid amount"),
  pricingMethod: z.enum(["PER_HOUR", "PER_JOB"]),
  estimatedCompletion: z.string().max(200).optional().or(z.literal("")),
  message: z.string().max(1000).optional().or(z.literal("")),
});

export const professionalProfileSchema = z.object({
  bio: z.string().max(2000).optional().or(z.literal("")),
  county: z.string().min(2),
  town: z.string().optional().or(z.literal("")),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  serviceRadiusKm: z.number().min(1).max(200).optional(),
  categoryIds: z.array(z.string()).min(1, "Select at least one category"),
  specializationIds: z.array(z.string()).optional(),
});

export const hiringRequestSchema = z.object({
  employmentType: z.enum(["CONTRACT", "PERMANENT"]),
  jobTitle: z.string().min(2, "Enter a job title").max(150),
  jobDescription: z.string().min(10, "Describe the job in more detail").max(3000),
  numberRequired: z.number().int().min(1).max(500),
  workLocationCounty: z.string().min(2),
  workLocationTown: z.string().max(100).optional().or(z.literal("")),
  salaryOrPayment: z.string().min(1, "Enter the salary or agreed payment").max(200),
  workingHours: z.string().max(100).optional().or(z.literal("")),
  startDate: z.string().optional().or(z.literal("")),
  contractDurationDays: z.number().int().min(1).max(3650).optional(),
  requiredQualifications: z.string().max(1000).optional().or(z.literal("")),
  additionalInstructions: z.string().max(1000).optional().or(z.literal("")),
  professionalIds: z.array(z.string()).min(1, "Select at least one professional"),
});

export const agencyWorkerCreateSchema = z.object({
  name: z.string().min(2, "Name is too short").max(100),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(7).max(20).optional().or(z.literal("")),
  county: z.string().min(2),
  town: z.string().optional().or(z.literal("")),
  bio: z.string().max(2000).optional().or(z.literal("")),
  categoryIds: z.array(z.string()).min(1, "Select at least one category"),
});

export const affiliateApplySchema = z.object({
  name: z.string().min(2, "Name is too short").max(100),
  businessName: z.string().max(150).optional().or(z.literal("")),
  accountKind: z.enum(["INDIVIDUAL", "COMPANY"]),
  email: z.string().email("Enter a valid email"),
  phone: z
    .string()
    .min(7, "Enter a valid Kenyan phone number")
    .refine((value) => normalizePhone(value) !== null, {
      message: "Enter a valid Kenyan phone number (07xx xxx xxx or +254…)",
    }),
  payoutPhone: z
    .string()
    .min(7, "Enter a valid Kenyan M-Pesa number")
    .refine((value) => normalizePhone(value) !== null, {
      message: "Enter a valid Kenyan M-Pesa number (07xx xxx xxx or +254…)",
    }),
  county: z.string().min(2, "Select your county"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const affiliateApplyExistingSchema = z.object({
  payoutPhone: z
    .string()
    .min(7, "Enter a valid Kenyan M-Pesa number")
    .refine((value) => normalizePhone(value) !== null, {
      message: "Enter a valid Kenyan M-Pesa number (07xx xxx xxx or +254…)",
    }),
});

export const affiliatePayoutSchema = z.object({
  method: z.enum(["MPESA", "MANUAL"]),
  commissionIds: z.array(z.string()).min(1, "Select at least one commission to pay out"),
  note: z.string().max(500).optional().or(z.literal("")),
  clientReference: z.string().min(1),
});

export const campaignSchema = z.object({
  name: z.string().min(2, "Enter a campaign name").max(100),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens only"),
  description: z.string().max(500).optional().or(z.literal("")),
  commissionOverride: z.number().int().min(0).optional(),
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional().or(z.literal("")),
});
