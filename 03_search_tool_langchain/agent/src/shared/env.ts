import { z } from "zod";

const EnvSchema = z.object({
    PORT: z.string().default("5000"),
    ALLOWED_ORIGIN: z.url().default("http://localhost:3000"),
    MODEL_PROVIDER: z.enum(["openai", "gemini", "groq"]).default('groq'),
    OPENAI_API_KEY: z.string().optional(),
    GEMINI_API_KEY: z.string().optional(),
    GROQ_API_KEY: z.string().optional(),
    TAVILY_API_KEY: z.string().optional(),
    OPENAI_MODEL: z.string().default("gpt-4o-mini"),
    GEMINI_MODEL: z.string().default("gemini-2.0-flash-lite"),
    GROQ_MODEL: z.string().default("llama-3.1-8b-instant"),
    SEARCH_PROVIDER: z.string().default("tavily"),
    RAG_MODEL_PROVIDER: z.string().default("gemini")
})
// Validates environment variables and provides a safe, typed `env` object to use instead of process.env.
export const env = EnvSchema.parse(process.env)