// Selenoid + AgentKit (Inngest) + Playwright
import { chromium } from "playwright-core";
import Browserbase from "@browserbasehq/sdk";
import { inngest } from "./client";
import {
  createAgent,
  createNetwork,
  createTool,
  openai,
  createState,
  type Message,
} from "@inngest/agent-kit";
import { prisma } from "@/lib/db";
import { z } from "zod";

interface BrowserAgentState {
  extractedText: string;
}

export const browserAgentFunction = inngest.createFunction(
  { id: "browser-agent" },
  { event: "browser-agent/run" },
  async ({ event, step }) => {
    const previousMessages = await step.run("get-messages", async () => {
      const formattedMessages: Message[] = [];
      const messages = await prisma.message.findMany({
        where: { projectId: event.data.projectId },
        orderBy: { createdAt: "asc" },
      });
      for (const msg of messages) {
        formattedMessages.push({
          type: "text",
          role: msg.role === "ASSISTANT" ? "assistant" : "user",
          content: msg.content,
        });
      }
      return formattedMessages;
    });

    const state = createState<BrowserAgentState>(
      { extractedText: "" },
      { messages: previousMessages }
    );

    const browseAndExtract = createTool({
      name: "browseAndExtract",
      description: "Visita uma URL e extrai texto de um seletor CSS",
      parameters: z.object({
        url: z.string().url(),
        selector: z.string(),
      }),
      handler: async ({ url, selector }, { step, network }) => {
        return await step?.run("browserbase-run", async () => {
          const bb = new Browserbase({
            apiKey: process.env.BROWSERBASE_API_KEY!,
          });

          const session = await bb.sessions.create({
            projectId: process.env.BROWSERBASE_PROJECT_ID!,
          });

          const browser = await chromium.connectOverCDP(session.connectUrl);
          const page = await browser.newPage();

          try {
            await page.goto(url, {
              waitUntil: "domcontentloaded",
              timeout: 30000,
            });
            await page.waitForSelector(selector, { timeout: 10000 });

            const text = await page.$eval(
              selector,
              (el) => el.textContent || ""
            );
            await browser.close();

            network.state.data.extractedText = text;
            return text;
          } catch (err) {
            await browser.close();
            return `Erro ao navegar: ${err}`;
          }
        });
      },
    });

    const browserAgent = createAgent<BrowserAgentState>({
      name: "browser-agent",
      description: "Navega em sites e extrai informações",
      system:
        "Você é um agente especializado em visitar sites e extrair informações.",
      model: openai({ model: "gpt-4o" }),
      tools: [browseAndExtract],
    });

    const network = createNetwork<BrowserAgentState>({
      name: "web-agent-network",
      agents: [browserAgent],
      maxIter: 5,
      defaultState: state,
      router: async () => browserAgent,
    });

    const result = await network.run(event.data.value, { state });

    const isError = !result.state.data.extractedText;

    await step.run("save-result", async () => {
      return await prisma.message.create({
        data: {
          projectId: event.data.projectId,
          role: "ASSISTANT",
          type: isError ? "ERROR" : "RESULT",
          content: isError
            ? "Não foi possível extrair o conteúdo. Tente novamente."
            : result.state.data.extractedText,
        },
      });
    });

    return {
      success: !isError,
      data: result.state.data,
    };
  }
);
