import { ChatOpenAI } from "@langchain/openai";
import { loadEnv } from "./env";
import { ChatGroq } from "@langchain/groq";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";

export type Provider = "openai" | "gemini" | "groq"

export function createChatModel(): { provider: Provider; model: BaseChatModel } {
    loadEnv();
    const forced = (process.env.PROVIDER || "").toLowerCase();
    const hasOpenai = !!process.env.OPENAI_API_KEY;
    const hasGroq = !!process.env.GROQ_API_KEY;
    const hasGemini = !!process.env.GOOGLE_API_KEY;

    const base = { temperature: 0 as const }

    if (forced === "openai" || (!forced && hasOpenai)) {
        return { provider: "openai", model: new ChatOpenAI(base) }
    }
    if (forced === "groq" || (!forced && hasGroq)) {
        return { provider: "groq", model: new ChatGroq({ ...base, model: "llama-3.1-8b-instant" }) }
    }
    if (forced === "gemini" || (!forced && hasGemini)) {
        return { provider: "gemini", model: new ChatGoogleGenerativeAI({ ...base, model: "gemini-2.0-flash-lite" }) }
    }

    return { provider: "groq", model: new ChatGroq({ ...base, model: "llama-3.1-8b-instant" }) }

}