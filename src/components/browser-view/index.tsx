// NOTE: Browserbase
// interface Props {
//   url: string;
// }

// export const BrowserView = ({ url }: Props) => {
//   return (
//     <div
//       style={{
//         border: "1px solid #ccc",
//         borderRadius: 8,
//         overflow: "hidden",
//         marginTop: 16,
//         background: "#f9f9f9",
//       }}
//     >
//       <div
//         style={{
//           background: "#eee",
//           padding: 8,
//           display: "flex",
//           alignItems: "center",
//         }}
//       >
//         <span
//           style={{
//             width: 10,
//             height: 10,
//             borderRadius: "50%",
//             background: "#f66",
//             marginRight: 4,
//           }}
//         />
//         <span
//           style={{
//             width: 10,
//             height: 10,
//             borderRadius: "50%",
//             background: "#fc3",
//             marginRight: 4,
//           }}
//         />
//         <span
//           style={{
//             width: 10,
//             height: 10,
//             borderRadius: "50%",
//             background: "#6c6",
//             marginRight: 8,
//           }}
//         />
//         <input
//           value={url}
//           readOnly
//           style={{
//             flex: 1,
//             border: "none",
//             background: "#eee",
//             padding: 4,
//             borderRadius: 4,
//           }}
//         />
//       </div>
//       <iframe
//         src={url}
//         style={{
//           width: "100%",
//           height: 500,
//           border: "none",
//           background: "#fff",
//         }}
//         title="Browser Preview"
//       />
//     </div>
//   );
// };

// NOTE: Selenoid
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BrowserSession {
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

interface BrowserViewerProps {
  projectId: string;
}

export const BrowserViewer = ({ projectId }: BrowserViewerProps) => {
  const [sessions, setSessions] = useState<BrowserSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<BrowserSession | null>(
    null
  );
  const [browserType, setBrowserType] = useState<"chrome" | "firefox">(
    "chrome"
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, [projectId]);

  const fetchSessions = async () => {
    try {
      const response = await fetch(
        `/api/browser-sessions?projectId=${projectId}`
      );
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      console.error("Erro ao buscar sessões:", error);
    }
  };

  const createSession = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/browser-sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          browserType,
        }),
      });

      if (response.ok) {
        const newSession = await response.json();
        setSessions((prev) => [...prev, newSession]);
        setSelectedSession(newSession);
      }
    } catch (error) {
      console.error("Erro ao criar sessão:", error);
    } finally {
      setLoading(false);
    }
  };

  const stopSession = async (sessionId: string) => {
    try {
      await fetch(`/api/browser-sessions/${sessionId}`, {
        method: "DELETE",
      });

      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (selectedSession?.id === sessionId) {
        setSelectedSession(null);
      }
    } catch (error) {
      console.error("Erro ao parar sessão:", error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Navegador do Usuário</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <Select
              value={browserType}
              onValueChange={(value: "chrome" | "firefox") =>
                setBrowserType(value)
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chrome">Chrome</SelectItem>
                <SelectItem value="firefox">Firefox</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={createSession}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? "Iniciando..." : "Iniciar Navegador"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {sessions.length > 0 && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Sessões Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <div>
                    <span className="font-medium">{session.browserType}</span>
                    <span
                      className={`ml-2 px-2 py-1 rounded text-xs ${
                        session.status === "running"
                          ? "bg-green-100 text-green-800"
                          : session.status === "error"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {session.status}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => setSelectedSession(session)}
                      disabled={session.status !== "running"}
                    >
                      Visualizar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => stopSession(session.id)}
                    >
                      Parar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedSession && selectedSession.status === "running" && (
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>
              Navegador {selectedSession.browserType} - Sessão{" "}
              {selectedSession.sessionId}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-full">
            <div className="w-full h-full border rounded bg-gray-100 flex items-center justify-center">
              <iframe
                src={`http://localhost:6080/vnc.html?host=localhost&port=6080&path=websockify`}
                className="w-full h-full border-0"
                title="Browser VNC Viewer"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
