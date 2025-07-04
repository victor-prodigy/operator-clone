// Inngest em produção faz com que rode em background, ou seja, não bloqueia o front-end mesmo se o usuário fechar a página
import { chromium } from "playwright-core";
import Browserbase from "@browserbasehq/sdk";
import {
  openai,
  // anthropic,
  createAgent,
  createTool,
  createNetwork,
  type Tool,
  // type Message,
  // createState,
} from "@inngest/agent-kit";
import { inngest } from "./client";
import { getSandbox, lastAssistantTextMessageContent } from "./utils";
import { z } from "zod";
import { PROMPT } from "@/prompt";
import { prisma } from "@/lib/db";

// NOTE: define o type para summary e files para ser mais restrito na validação desses dados
interface AgentState {
  summary: string;
  files: { [path: string]: string };
}

const bb = new Browserbase({
  apiKey: process.env.BROWSERBASE_API_KEY as string,
});

export const scrapeTitle = inngest.createFunction(
  { id: "web-scrape-title" },
  { event: "web.scrape.title" },
  async ({ event, step }) => {
    // Create a new session
    const session = await bb.sessions.create({
      projectId: process.env.BROWSERBASE_PROJECT_ID as string,
    });

    // Connect to the session
    const browser = await chromium.connectOverCDP(session.connectUrl);
    try {
      const page = await browser.newPage();

      // Construct the search URL
      // O value de @procedures.ts refere-se ao valor do prompt enviado pelo usuário, ou seja, input.value.
      // Portanto, você pode acessar assim:
      const searchUrl = `https://search-new.pullpush.io/?type=submission&q=${event.data.value}`;

      console.log(searchUrl);

      await page.goto(searchUrl);

      // Wait for results to load
      await page.waitForSelector("div.results", { timeout: 10000 });

      // Extract search results
      const results = await page.evaluate(() => {
        const posts = document.querySelectorAll("div.results div:has(h1)");
        return Array.from(posts).map((post) => ({
          title: post.querySelector("h1")?.textContent?.trim(),
          content: post.querySelector("div")?.textContent?.trim(),
        }));
      });

      console.log("results", JSON.stringify(results, null, 2));

      return results.slice(0, 5); // Return top 5 results
    } finally {
      await browser.close();
    }
  }
);

// export const scrapeTitle = inngest.createFunction(
//   { id: "web-scrape-title" },
//   { event: "web.scrape.title" },
//   async ({ event, step }) => {
//     const { prompt, projectId } = event.data;

//     // 1. Inicialize Stagehand (Browserbase)
//     const stagehand = new Stagehand({
//       env: "BROWSERBASE",
//       apiKey: process.env.BROWSERBASE_API_KEY,
//       projectId: process.env.BROWSERBASE_PROJECT_ID!,
//       modelName: "gpt-4o",
//       modelClientOptions: {
//         apiKey: process.env.OPENAI_API_KEY,
//       },
//     });
//     await stagehand.init();
//     const page = stagehand.page;

//     // 2. Crie o agente do Inngest Agent Kit
//     const agent = createAgent({
//       name: "browser-agent",
//       model: openai({ model: "gpt-4o", apiKey: process.env.OPENAI_API_KEY! }),
//       tools: [
//         createTool({
//           name: "goto",
//           description:
//             "Navega para uma URL no navegador controlado pelo Stagehand",
//           parameters: z.object({ url: z.string().url() }),
//           handler: async (input) => {
//             await page.goto(input.url);
//             return { result: `Navegado para ${input.url}` };
//           },
//         }),
//         createTool({
//           name: "getTitle",
//           description: "Extrai o título da página atual",
//           parameters: z.object({}),
//           handler: async () => {
//             const { title } = await page.extract({
//               instruction: "O título da página",
//               schema: z.object({ title: z.string() }),
//             });
//             return { title };
//           },
//         }),
//       ],
//       system: PROMPT,
//     });

//     // 3. O agente interpreta o prompt do usuário e executa as ferramentas
//     const agentResult = await agent.run(prompt);

//     // 4. Feche o navegador
//     await stagehand.close();

//     // 5. Obtenha o título extraído do resultado do agente
//     let title = undefined;
//     for (const toolCall of agentResult.toolCalls) {
//       if (
//         toolCall.tool.name === "getTitle" &&
//         toolCall.content &&
//         typeof toolCall.content === "object" &&
//         "title" in toolCall.content
//       ) {
//         title = toolCall.content.title;
//         break;
//       }
//     }

//     // 6. Obtenha o sessionId do Stagehand para replay
//     const sessionId = (stagehand as any).session?.id || null;

//     // 7. Salve ou retorne o resultado
//     return { title, sessionId };
//   }
// );
