import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { NextRequest } from "next/server";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "COORDINATOR" | "MEMBER";
}

/**
 * Wraps next-auth v4 getServerSession for use in App Router API routes.
 * Returns typed session or null.
 */
export async function getAuth(_req?: NextRequest): Promise<{ user: SessionUser } | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u = session.user as any;
  return {
    user: {
      id: u.id as string,
      email: u.email as string,
      name: u.name as string,
      role: u.role as "ADMIN" | "COORDINATOR" | "MEMBER",
    },
  };
}
