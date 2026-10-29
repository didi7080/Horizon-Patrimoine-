import Anthropic from "@anthropic-ai/sdk";

let instance: Anthropic | null = null;

/** Renvoie le client Claude si l'assistant est configuré, sinon null. */
export function getAnthropic(): Anthropic | null {
  const cle = process.env.ANTHROPIC_API_KEY;
  if (!cle) return null;
  if (!instance) instance = new Anthropic({ apiKey: cle });
  return instance;
}

export function assistantConfigure(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export const MODELE_ASSISTANT = "claude-sonnet-5-5";
