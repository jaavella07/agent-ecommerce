import type { MessageContent } from "@langchain/core/messages";

export function normalizeContent(content: MessageContent): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((block) => (typeof block === "string" ? block : ((block as any)?.text ?? "")))
      .join("")
      .trim();
  }
  return "";
}
