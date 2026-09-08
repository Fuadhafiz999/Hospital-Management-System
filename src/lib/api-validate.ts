// ═══════════════════════════════════════════════════════════════════
//  API Validation Helpers
//  Shared validation utilities for all API routes.
// ═══════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";

// ─── Types ────────────────────────────────────────────────────────

export type ValidationRule = {
  field: string;
  label: string;
  type: "string" | "number" | "email" | "boolean";
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  pattern?: RegExp;
  message?: string;
};

export type ValidationResult = {
  valid: boolean;
  errors: Record<string, string>;
  data: Record<string, unknown>;
};

// ─── Validator ────────────────────────────────────────────────────

export function validateBody(
  body: Record<string, unknown>,
  rules: ValidationRule[]
): ValidationResult {
  const errors: Record<string, string> = {};
  const data: Record<string, unknown> = {};

  for (const rule of rules) {
    const value = body[rule.field];

    // Required check
    if (rule.required && (value === undefined || value === null || value === "")) {
      errors[rule.field] = rule.message || `${rule.label} is required`;
      continue;
    }

    // Skip further validation if not required and value is empty.
    // Empty string is treated as "not provided" so pattern/enum rules
    // cannot be bypassed by sending "" (previously stored invalid
    // empty statuses in the DB).
    if (value === undefined || value === null || value === "") {
      continue;
    }

    // Type-specific validation
    if (rule.type === "string") {
      const str = String(value);
      if (rule.minLength && str.length < rule.minLength) {
        errors[rule.field] = `${rule.label} must be at least ${rule.minLength} characters`;
        continue;
      }
      if (rule.maxLength && str.length > rule.maxLength) {
        errors[rule.field] = `${rule.label} must be at most ${rule.maxLength} characters`;
        continue;
      }
      if (rule.pattern && !rule.pattern.test(str)) {
        errors[rule.field] = rule.message || `${rule.label} is invalid`;
        continue;
      }
      data[rule.field] = str;
    } else if (rule.type === "number") {
      const num = Number(value);
      if (isNaN(num)) {
        errors[rule.field] = `${rule.label} must be a number`;
        continue;
      }
      if (rule.min !== undefined && num < rule.min) {
        errors[rule.field] = `${rule.label} must be at least ${rule.min}`;
        continue;
      }
      data[rule.field] = num;
    } else if (rule.type === "email") {
      const email = String(value).toLowerCase().trim();
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email)) {
        errors[rule.field] = rule.message || `${rule.label} must be a valid email address`;
        continue;
      }
      data[rule.field] = email;
    } else {
      data[rule.field] = value;
    }
  }

  return { valid: Object.keys(errors).length === 0, errors, data };
}

// ─── Response helpers ─────────────────────────────────────────────

export function validationErrorResponse(errors: Record<string, string>) {
  return NextResponse.json(
    { data: null, error: { message: "Validation failed", details: errors } },
    { status: 400 }
  );
}

export function serverErrorResponse(error: unknown) {
  console.error("API Error:", error);

  // Map known Prisma errors to friendly client messages instead of
  // leaking internal error text (schema, constraint names, etc.).
  const prismaError = error as { code?: string; meta?: { target?: string[]; cause?: string } };
  if (prismaError?.code === "P2002") {
    const target = prismaError.meta?.target?.join(", ") || "field";
    return NextResponse.json(
      { data: null, error: { message: `A record with this ${target} already exists` } },
      { status: 409 }
    );
  }
  if (prismaError?.code === "P2025") {
    return NextResponse.json(
      { data: null, error: { message: "The requested record does not exist" } },
      { status: 404 }
    );
  }
  if (prismaError?.code === "P2003") {
    return NextResponse.json(
      { data: null, error: { message: "The referenced record does not exist" } },
      { status: 400 }
    );
  }

  const message =
    error instanceof Error && !isPrismaRawError(error.message)
      ? error.message
      : "An unexpected error occurred. Please try again.";
  return NextResponse.json(
    { data: null, error: { message } },
    { status: 500 }
  );
}

function isPrismaRawError(message: string): boolean {
  return (
    message.includes("prisma.") ||
    message.includes("Invalid") ||
    message.includes("Foreign key") ||
    message.includes("Unique constraint") ||
    message.includes("error:")
  );
}

// ─── Pagination helpers ───────────────────────────────────────────

export interface PaginationParams {
  page: number;
  pageSize: number;
  skip: number;
}

export function getPaginationParams(
  searchParams: URLSearchParams,
  defaultPageSize = 20,
  maxPageSize = 100
): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.min(
    maxPageSize,
    Math.max(1, parseInt(searchParams.get("pageSize") || String(defaultPageSize), 10) || defaultPageSize)
  );
  const skip = (page - 1) * pageSize;
  return { page, pageSize, skip };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  error: null;
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResponse<T> {
  return {
    data,
    pagination: {
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages: Math.ceil(total / params.pageSize),
      hasMore: params.page * params.pageSize < total,
    },
    error: null,
  };
}
