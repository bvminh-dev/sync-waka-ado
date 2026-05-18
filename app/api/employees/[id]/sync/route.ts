import { NextResponse } from "next/server";
import { syncEmployeeRange } from "@/lib/sync";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const body = await req.json().catch(() => ({}));
  const { start, end } = body ?? {};
  if (!start || !end)
    return NextResponse.json(
      { error: "start & end (YYYY-MM-DD) bắt buộc" },
      { status: 400 },
    );
  try {
    const docs = await syncEmployeeRange(params.id, start, end);
    return NextResponse.json({ days: docs.length });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Sync failed" },
      { status: 502 },
    );
  }
}
