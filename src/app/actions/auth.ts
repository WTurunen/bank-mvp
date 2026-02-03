"use server";

import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";

type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

type RegisterResult = {
  success: boolean;
  error?: string;
};

export async function registerUser(data: RegisterInput): Promise<RegisterResult> {
  const { name, email, password } = data;

  if (!name || name.length < 2) {
    return { success: false, error: "Name must be at least 2 characters" };
  }

  if (!email || !email.includes("@")) {
    return { success: false, error: "Invalid email address" };
  }

  if (!password || password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters" };
  }

  const existingUser = await db.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { success: false, error: "An account with this email already exists" };
  }

  const passwordHash = await hashPassword(password);

  await db.user.create({
    data: {
      name,
      email,
      passwordHash,
    },
  });

  return { success: true };
}
