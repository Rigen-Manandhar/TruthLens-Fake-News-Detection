import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  createSmtpTransport,
  EMAIL_REGEX,
  escapeHtml,
  formatFromAddress,
} from "@/lib/server/email";

export const runtime = "nodejs";

const CONTACT_RECIPIENT = "rigenmanandharrm@gmail.com";

type ContactBody = {
  name?: unknown;
  email?: unknown;
  message?: unknown;
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const body = (await request.json().catch(() => null)) as ContactBody | null;

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const sessionEmail =
    typeof session?.user?.email === "string" ? session.user.email.trim() : "";
  const email =
    sessionEmail || (typeof body?.email === "string" ? body.email.trim() : "");
  const message = typeof body?.message === "string" ? body.message.trim() : "";

  if (!name || !email || !message) {
    return NextResponse.json(
      {
        error: "Name, email, and message are required.",
      },
      { status: 400 }
    );
  }

  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json(
      {
        error: "Enter a valid email address.",
      },
      { status: 400 }
    );
  }

  if (name.length > 80 || email.length > 120 || message.length > 3000) {
    return NextResponse.json(
      {
        error: "Your submission exceeds the allowed length.",
      },
      { status: 400 }
    );
  }

  try {
    const transporter = createSmtpTransport();

    await transporter.sendMail({
      from: formatFromAddress("TruthLens Contact"),
      to: CONTACT_RECIPIENT,
      replyTo: email,
      subject: `TruthLens contact from ${name}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        "",
        "Message:",
        message,
      ].join("\n"),
      html: `
        <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.6;color:#17130f">
          <h2 style="margin:0 0 16px;">New TruthLens contact message</h2>
          <p style="margin:0 0 8px;"><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p style="margin:0 0 8px;"><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p style="margin:16px 0 8px;"><strong>Message:</strong></p>
          <div style="white-space:pre-wrap;border:1px solid #e1d8c8;border-radius:16px;padding:16px;background:#fffdf8;">
            ${escapeHtml(message)}
          </div>
        </div>
      `,
    });

    return NextResponse.json({
      message: "Your message has been sent.",
    });
  } catch (error) {
    console.error("Failed to send contact email.", error);
    return NextResponse.json(
      {
        error: "Failed to send your message. Please try again later.",
      },
      { status: 500 }
    );
  }
}
