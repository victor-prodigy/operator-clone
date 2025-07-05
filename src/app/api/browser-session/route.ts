import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { UserBrowserSessionService } from "@/services/user-browser-session";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, browserType } = await request.json();

    const session = await UserBrowserSessionService.createSession(
      userId,
      projectId,
      browserType
    );

    return NextResponse.json(session);
  } catch (error) {
    console.error("Erro ao criar sessão:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    const sessions = await UserBrowserSessionService.getUserSessions(
      userId,
      projectId
    );
    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Erro ao buscar sessões:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
