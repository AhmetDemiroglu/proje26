import { Timestamp } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import {
  AdminAuthorizationError,
  verifyAdminRequest,
} from "@/lib/firebase/admin";

export async function requireAdmin(request: Request) {
  try {
    return await verifyAdminRequest(request);
  } catch (error) {
    if (error instanceof AdminAuthorizationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "Yönetici doğrulaması yapılamadı." },
      { status: 500 },
    );
  }
}

export function dateToIso(value: unknown) {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return null;
}

export function safeDocument(
  id: string,
  data: Record<string, unknown>,
): Record<string, unknown> & { id: string } {
  return {
    id,
    ...data,
    createdAt: dateToIso(data.createdAt),
    updatedAt: dateToIso(data.updatedAt),
    verifiedAt: dateToIso(data.verifiedAt),
    reviewedAt: dateToIso(data.reviewedAt),
  };
}
