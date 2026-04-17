const DEFAULT_OPENAI_MODEL = "gpt-5.4-mini";

export function getOpenAIConfig() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  return {
    apiKey,
    model: process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL,
  };
}

export function isOpenAIConfigured() {
  return Boolean(getOpenAIConfig());
}
