// Inngest em produção faz com que rode em background, ou seja, não bloqueia o front-end mesmo se o usuário fechar a página
import { Sandbox } from "@e2b/code-interpreter";
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

export const codeAgentFunction = inngest.createFunction(
  { id: "code-agent" },
  { event: "code-agent/run" }, // function name
  async ({ event, step }) => {
    // NOTE: create sandboxId
    const sandboxId = await step.run("get-sandbox-id", async () => {
      // Create a new sandbox for the user
      const sandbox = await Sandbox.create("lovable-nextjs-clone-test-2");
      return sandbox.sandboxId;
    });

    // Create a new agent with a system prompt (you can add optional tools, too)
    const codeAgent = createAgent<AgentState>({
      name: "code-agent",
      description:
        "An expert coding agent that writes code based on user input",
      system: PROMPT,
      model: openai({
        model: "gpt-4.1",
        // https://youtu.be/xs8mWnbMcmc?t=11965
        defaultParameters: { temperature: 0.1 },
      }),
      // model: openai({ model: "gpt-4o", apiKey: process.env.TOGETHER_API_KEY }),
      tools: [
        // NOTE: this tool will run commands in the sandbox terminal
        createTool({
          name: "terminal",
          description: "Use the terminal to run commands",
          parameters: z.object({
            command: z.string(),
          }),
          handler: async ({ command }, { step }) => {
            return await step?.run("terminal", async () => {
              const buffers = { stdout: "", stderr: "" };

              try {
                // NOTE: get sandbox by sandboxId
                const sandbox = await getSandbox(sandboxId);
                // https://e2b.dev/docs/commands
                const result = await sandbox.commands.run(command, {
                  onStdout: (data: string) => {
                    buffers.stdout += data;
                  },
                  onStderr: (data: string) => {
                    buffers.stderr += data;
                  },
                });
                return result.stdout;
              } catch (error) {
                console.error(
                  `Command failed: ${error} \nstdout: ${buffers.stdout} \nstderr: ${buffers.stderr}`
                );
                // --legady-peer-deps error
                return `Command failed: ${error} \nstdout: ${buffers.stdout} \nstderr: ${buffers.stderr}`;
              }
            });
          },
        }),

        // NOTE: this tool will create or update files in the sandbox
        createTool({
          name: "createOrUpdateFiles",
          description: "Create or update files in the sandbox",
          parameters: z.object({
            files: z.array(
              z.object({
                path: z.string(),
                content: z.string(),
              })
            ),
          }),
          handler: async (
            { files },
            { step, network }: Tool.Options<AgentState>
          ) => {
            const newFiles = await step?.run(
              "create-or-update-files",
              async () => {
                try {
                  const updatedFiles = network.state.data.files || {};
                  const sandbox = await getSandbox(sandboxId);
                  for (const file of files) {
                    await sandbox.files.write(file.path, file.content);
                    updatedFiles[file.path] = file.content;
                  }

                  return updatedFiles;
                } catch (error) {
                  return "Error: " + error;
                }
              }
            );

            if (typeof newFiles === "object") {
              network.state.data.files = newFiles;
            }
          },
        }),

        // NOTE: this tool will read files from the sandbox
        createTool({
          name: "readFiles",
          description: "Read files from the sandbox",
          parameters: z.object({
            files: z.array(z.string()),
          }),
          handler: async ({ files }, { step }) => {
            return await step?.run("readFiles", async () => {
              try {
                const sandbox = await getSandbox(sandboxId);
                const contents = []; // array to hold file contents (qualquer formato de arquivo, por exemplo, JSON, YAML, etc.)
                for (const file of files) {
                  const content = await sandbox.files.read(file);
                  contents.push({ path: file, content });
                }

                // NOTE: return contents as JSON string for the AI agent to read
                return JSON.stringify(contents);
              } catch (error) {
                return "Error: " + error;
              }
            });
          },
        }),
      ],

      // NOTE: extract the last message from the assistant and verify if it contains <task_summary></task_summary>
      lifecycle: {
        onResponse: async ({ result, network }) => {
          const lastAssistantMessageText =
            lastAssistantTextMessageContent(result);

          if (lastAssistantMessageText && network) {
            if (lastAssistantMessageText.includes("<task_summary>")) {
              network.state.data.summary = lastAssistantMessageText;
            }
          }

          return result;
        },
      },
    });

    // Networks are Systems of Agents. Use Networks to create powerful AI workflows by combining multiple Agents.
    const network = createNetwork<AgentState>({
      name: "coding-agent-network",
      agents: [codeAgent],
      maxIter: 15, // Maximum number of iterations for the network to run (credits usage)
      // https://youtu.be/xs8mWnbMcmc?t=12547
      router: async ({ network }) => {
        const summary = network.state.data.summary;

        if (summary) {
          return;
        }

        return codeAgent;
      },
    });

    const result = await network.run(event.data.value);

    // NOTE: check if the result is an error
    const isError =
      !result.state.data.summary ||
      Object.keys(result.state.data.files || {}).length === 0;

    // NOTE: generate sandbox url com base no sandboxId hospedado no E2B
    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId);
      const host = sandbox.getHost(3000);
      return `https://${host}`;
    });

    // NOTE: salving the result in the database when the background job is done
    await step.run("save-result", async () => {
      if (isError) {
        return await prisma.message.create({
          data: {
            projectId: event.data.projectId,
            content: "Something went wrong. Please try again.",
            role: "ASSISTANT", // Assuming role is ASSISTANT for the AI agent
            type: "ERROR", // Assuming type is ERROR for the AI agent
          },
        });
      }

      return await prisma.message.create({
        data: {
          projectId: event.data.projectId,
          content: result.state.data.summary,
          role: "ASSISTANT", // Assuming role is ASSISTANT for the AI agent
          type: "RESULT", // Assuming type is RESULT for the AI agent
          fragment: {
            create: {
              sandboxUrl: sandboxUrl,
              title: "Fragment",
              files: result.state.data.files,
            },
          },
        },
      });
    });

    return {
      url: sandboxUrl,
      title: "Fragment",
      files: result.state.data.files,
      summary: result.state.data.summary,
    };
  }
);
