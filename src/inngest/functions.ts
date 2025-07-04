// Inngest em produção roda em background, ou seja, não bloqueia o front-end mesmo se o usuário fechar a página
import { chromium } from "playwright-core";
import Browserbase from "@browserbasehq/sdk";
import {
  openai,
  // anthropic,
  createAgent,
  createTool,
  createNetwork,
  type Tool,
  type Message,
  createState,
} from "@inngest/agent-kit";
import { inngest } from "./client";
import { FRAGMENT_TITLE_PROMPT, RESPONSE_PROMPT } from "@/prompt";
import { prisma } from "@/lib/db";

const bb = new Browserbase({
  apiKey: process.env.BROWSERBASE_API_KEY as string,
});

export const browserAgentFunction = inngest.createFunction(
  { id: "browser-agent" },
  { event: "browser-agent/run" },
  async ({ event, step }) => {
    const query = event.data.query as string;

    // Cria uma nova sessão no Browserbase
    const session = await step.run("create-session", async () => {
      return await bb.sessions.create({
        projectId: process.env.BROWSERBASE_PROJECT_ID as string,
      });
    });

    const sessionId = session.id;
    const sandboxUrl = `https://browserbase.com/sessions/${sessionId}`;

    // Conecta ao navegador remoto
    const browser = await step.run("connect-browser", async () => {
      return await chromium.connectOverCDP(session.connectUrl);
    });

    let results: { title?: string; content?: string }[] = [];
    let summary = "";

    try {
      const page = await step.run("create-browser-page", async () => {
        return await browser.newPage();
      });

      // Acessa o mecanismo de busca customizado do Reddit
      await step.run("goto-search-url", async () => {
        const searchUrl = `https://search-new.pullpush.io/?type=submission&q=${encodeURIComponent(
          query
        )}`;
        await page.goto(searchUrl, { waitUntil: "domcontentloaded" });
      });

      // Aguarda os resultados aparecerem
      await step.run("wait-results", async () => {
        await page.waitForSelector("div.results", { timeout: 10000 });
      });

      // Extrai os resultados da busca
      results = await step.run("extract-results", async () => {
        return await page.evaluate(() => {
          const posts = document.querySelectorAll("div.results div:has(h1)");
          return Array.from(posts).map((post) => ({
            title: post.querySelector("h1")?.textContent?.trim(),
            content: post.querySelector("div")?.textContent?.trim(),
          }));
        });
      });

      summary = `Top resultados do Reddit para "${query}":\n\n${results
        .slice(0, 5)
        .map((r, i) => `#${i + 1}: ${r.title}\n${r.content}\n`)
        .join("\n")}`;

      await step.run("close-page", async () => {
        if (typeof page.close === "function") {
          await page.close();
        }
      });
    } catch (error) {
      console.error("Erro durante a busca Reddit:", error);
      summary = "Não foi possível extrair resultados da busca no Reddit.";
    } finally {
      await step.run("close-browser", async () => {
        if (browser && typeof browser.close === "function") {
          try {
            await browser.close();
          } catch (err) {
            console.warn("Erro ao fechar navegador:", err);
          }
        }
      });
    }

    // Salvar no banco de dados opcionalmente
    await step.run("save-to-db", async () => {
      return await prisma.message.create({
        data: {
          projectId: event.data.projectId,
          role: "ASSISTANT",
          type: "RESULT",
          content: summary,
          fragment: {
            create: {
              sandboxUrl,
              sessionId,
              title: `Resultados para: ${query}`,
            },
          },
        },
      });
    });

    return {
      sandboxUrl,
      sessionId,
      query,
      summary,
      results: results.slice(0, 5),
    };
  }
);
