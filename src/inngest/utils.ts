import { AgentResult, TextMessage } from "@inngest/agent-kit";

// Função utilitária para montar a URL de visualização do sandbox do Browserbase
export function getSandbox(sessionId: string) {
  // Retorna a URL de replay/inspeção da sessão do Browserbase
  return `https://browserbase.com/sessions/${sessionId}`;
}

// Esta função recupera o último conteúdo de mensagem de texto do assistente no resultado do agente
export function lastAssistantTextMessageContent(result: AgentResult) {
  const lastAssistantMessageIndex = result.output.findLastIndex(
    (message) => message.role === "assistant"
  );

  const message = result.output[lastAssistantMessageIndex] as
    | TextMessage
    | undefined;

  return message?.content
    ? typeof message.content === "string"
      ? message.content
      : message.content.map((c) => c.text).join("")
    : undefined;
}
