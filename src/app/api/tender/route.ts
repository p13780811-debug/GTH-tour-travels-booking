import { NextResponse } from "next/server";
import { cleanString } from "@/lib/security/validators";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const tenderId = cleanString(body?.tenderId, {
      min: 1,
      max: 50,
      pattern: /^[A-Za-z0-9._/-]+$/,
    });

    if (!tenderId) {
      return NextResponse.json({ error: "Invalid tender ID" }, { status: 400 });
    }

    return NextResponse.json(
      {
        status: "In Development",
        tenderId,
        message: "Tender Intelligence is not live yet.",
      },
      { status: 501 },
    );
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
