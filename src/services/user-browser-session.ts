import { auth } from "@clerk/nextjs";

export interface BrowserSession {
  id: string;
  userId: string;
  projectId: string;
  sessionId: string;
  browserType: "chrome" | "firefox";
  status: "running" | "stopped" | "error";
  vncPort?: number;
  createdAt: Date;
  updatedAt: Date;
}

export class UserBrowserSessionService {
  private static sessions = new Map<string, BrowserSession>();

  static async createSession(
    userId: string,
    projectId: string,
    browserType: "chrome" | "firefox" = "chrome"
  ): Promise<BrowserSession> {
    const sessionId = `session_${userId}_${projectId}_${Date.now()}`;

    const session: BrowserSession = {
      id: sessionId,
      userId,
      projectId,
      sessionId,
      browserType,
      status: "running",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.sessions.set(sessionId, session);

    // Iniciar sessão no Selenoid
    await this.startSelenoidSession(session);

    return session;
  }

  static async getSession(sessionId: string): Promise<BrowserSession | null> {
    return this.sessions.get(sessionId) || null;
  }

  static async getUserSessions(
    userId: string,
    projectId: string
  ): Promise<BrowserSession[]> {
    return Array.from(this.sessions.values()).filter(
      (session) => session.userId === userId && session.projectId === projectId
    );
  }

  static async stopSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = "stopped";
      session.updatedAt = new Date();
      await this.stopSelenoidSession(session);
    }
  }

  private static async startSelenoidSession(
    session: BrowserSession
  ): Promise<void> {
    try {
      const response = await fetch("http://localhost:4444/wd/hub/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          capabilities: {
            browserName: session.browserType,
            "selenoid:options": {
              enableVNC: true,
              enableVideo: true,
              enableLog: true,
              sessionTimeout: "5m",
              idleTimeout: "1m",
            },
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        session.sessionId = data.sessionId;
        session.vncPort = 5900; // Porta padrão do VNC
        session.status = "running";
      } else {
        session.status = "error";
      }
    } catch (error) {
      console.error("Erro ao iniciar sessão Selenoid:", error);
      session.status = "error";
    }
  }

  private static async stopSelenoidSession(
    session: BrowserSession
  ): Promise<void> {
    try {
      await fetch(`http://localhost:4444/wd/hub/session/${session.sessionId}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Erro ao parar sessão Selenoid:", error);
    }
  }
}
