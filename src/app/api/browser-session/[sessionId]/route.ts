import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { UserBrowserSessionService } from "@/services/user-browser-session";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await UserBrowserSessionService.stopSession(params.sessionId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao parar sessão:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
