import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  throw new Error(
    "Falta ANTHROPIC_API_KEY. Copia .env.local.example a .env.local y llena el valor."
  );
}

export const claude = new Anthropic({ apiKey });

export const MODELS = {
  sonnet: "claude-sonnet-4-6",
  haiku: "claude-haiku-4-5-20251001",
  opus: "claude-opus-4-7",
} as const;
