import { inngest } from "@/inngest/client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { prompt, projectId } = await req.json();

  // Dispara o evento para o Inngest
  await inngest.send({
    name: "web.scrape.title",
    data: { prompt, projectId },
  });

  return NextResponse.json({ ok: true });
}
