import { NextResponse } from "next/server";

type TenderRequest = {
  tenderId?: unknown;
};

function normalizeTenderId(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }

  const tenderId = String(value).trim();

  if (!/^[a-zA-Z0-9._/-]{1,50}$/.test(tenderId)) {
    return null;
  }

  return tenderId;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as TenderRequest;
    const tenderId = normalizeTenderId(body.tenderId);

    if (!tenderId) {
      return NextResponse.json(
        { error: "Invalid tenderId" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        tenderId,
        status: "IN_DEVELOPMENT",
        available: false,
        message: "GTH PRO Tender Intelligence is currently in development.",
      },
      {
        status: 501,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
