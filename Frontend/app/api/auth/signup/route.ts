import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { setAuthCookie, signAuthToken } from "@/lib/auth";

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

    await dbConnect();

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email is already registered." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      fullName: normalizedName,
      email: normalizedEmail,
      passwordHash,
    });

    const token = signAuthToken({
      sub: user._id.toString(),
      email: user.email,
    });

    const response = NextResponse.json({
      ok: true,
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
      },
    });

    setAuthCookie(response, token);

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Signup failed. Please try again." },
      { status: 500 }
    );
  }
}
