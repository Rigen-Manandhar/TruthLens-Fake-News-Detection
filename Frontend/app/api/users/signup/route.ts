import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import clientPromise from "@/lib/mongodb-client";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { fullName, email, password } = await req.json();

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { error: "Full name, email, and password are required." },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedName = String(fullName).trim();

    const client = await clientPromise;
    const db = client.db();

    const existingUser = await db
      .collection("users")
      .findOne({ email: normalizedEmail });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email is already registered." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await db.collection("users").insertOne({
      name: normalizedName,
      fullName: normalizedName,
      email: normalizedEmail,
      passwordHash,
      emailVerified: null,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: result.insertedId.toString(),
        name: normalizedName,
        email: normalizedEmail,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Signup failed. Please try again." },
      { status: 500 }
    );
  }
}
