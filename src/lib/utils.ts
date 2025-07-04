import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { TreeItem } from "@/types";
import { Message } from "@inngest/agent-kit";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const parseAgentOutput = (value: Message[]) => {
  const output = value[0]; // fragmentTitleOutput[0];

  if (output.type !== "text") {
    return "Fragment";
  }

  if (Array.isArray(output.content)) {
    return output.content.map((txt) => txt).join("");
  } else {
    return output.content;
  }
};

