import OpenAI from "openai";

let openaiClient: OpenAI | null = null;

export function getOpenAI(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.startsWith("sk-your")) return null;

  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

export function isOpenAIConfigured(): boolean {
  return getOpenAI() !== null;
}
