// // Inngest em produção roda em background, ou seja, não bloqueia o front-end mesmo se o usuário fechar a página
// import { chromium } from "playwright-core";
// import Browserbase from "@browserbasehq/sdk";
// import {
//   openai,
//   // anthropic,
//   createAgent,
//   createTool,
//   createNetwork,
//   type Tool,
//   type Message,
//   createState,
// } from "@inngest/agent-kit";
// import { inngest } from "./client";
// import { FRAGMENT_TITLE_PROMPT, RESPONSE_PROMPT } from "@/prompt";
// import { prisma } from "@/lib/db";

// const bb = new Browserbase({
//   apiKey: process.env.BROWSERBASE_API_KEY as string,
// });

// export const browserAgentFunction = inngest.createFunction(
//   { id: "browser-agent" },
//   { event: "browser-agent/run" },
//   async ({ event, step }) => {
//     const query = event.data.query as string;

//     // Cria uma nova sessão no Browserbase
//     const session = await step.run("create-session", async () => {
//       return await bb.sessions.create({
//         projectId: process.env.BROWSERBASE_PROJECT_ID as string,
//       });
//     });

//     const sessionId = session.id;
//     const sandboxUrl = `https://browserbase.com/sessions/${sessionId}`;

//     // Conecta ao navegador remoto
//     const browser = await step.run("connect-browser", async () => {
//       return await chromium.connectOverCDP(session.connectUrl);
//     });

//     let results: { title?: string; content?: string }[] = [];
//     let summary = "";

//     try {
//       const page = await step.run("create-browser-page", async () => {
//         return await browser.newPage();
//       });

//       // Acessa o mecanismo de busca customizado do Reddit
//       await step.run("goto-search-url", async () => {
//         const searchUrl = `https://search-new.pullpush.io/?type=submission&q=${encodeURIComponent(
//           query
//         )}`;
//         await page.goto(searchUrl, { waitUntil: "domcontentloaded" });
//       });

//       // Aguarda os resultados aparecerem
//       await step.run("wait-results", async () => {
//         await page.waitForSelector("div.results", { timeout: 10000 });
//       });

//       // Extrai os resultados da busca
//       results = await step.run("extract-results", async () => {
//         return await page.evaluate(() => {
//           const posts = document.querySelectorAll("div.results div:has(h1)");
//           return Array.from(posts).map((post) => ({
//             title: post.querySelector("h1")?.textContent?.trim(),
//             content: post.querySelector("div")?.textContent?.trim(),
//           }));
//         });
//       });

//       summary = `Top resultados do Reddit para "${query}":\n\n${results
//         .slice(0, 5)
//         .map((r, i) => `#${i + 1}: ${r.title}\n${r.content}\n`)
//         .join("\n")}`;

//       await step.run("close-page", async () => {
//         if (typeof page.close === "function") {
//           await page.close();
//         }
//       });
//     } catch (error) {
//       console.error("Erro durante a busca Reddit:", error);
//       summary = "Não foi possível extrair resultados da busca no Reddit.";
//     } finally {
//       await step.run("close-browser", async () => {
//         if (browser && typeof browser.close === "function") {
//           try {
//             await browser.close();
//           } catch (err) {
//             console.warn("Erro ao fechar navegador:", err);
//           }
//         }
//       });
//     }

//     // Salvar no banco de dados opcionalmente
//     await step.run("save-to-db", async () => {
//       return await prisma.message.create({
//         data: {
//           projectId: event.data.projectId,
//           role: "ASSISTANT",
//           type: "RESULT",
//           content: summary,
//           fragment: {
//             create: {
//               sandboxUrl,
//               sessionId,
//               title: `Resultados para: ${query}`,
//             },
//           },
//         },
//       });
//     });

//     return {
//       url: sandboxUrl,
//       title: "Fragment",
//       sessionId,
//     };
//   }
// );

import { inngest } from "./client";
import {
  createAgent,
  createNetwork,
  createTool,
  openai,
  createState,
  type Message,
} from "@inngest/agent-kit";
import { chromium } from "playwright-core";
import Browserbase from "@browserbasehq/sdk";
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
