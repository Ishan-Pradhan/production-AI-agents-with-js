import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatGroq } from "@langchain/groq";
import { env } from "./env.js";

//low temp -> crisp summary or answer
// model name

type ModelOpts = {
	temperature?: number;
	maxTokens?: number;
};

export function getChatModel(opts: ModelOpts = {}): BaseChatModel {
	const temp = opts?.temperature ?? 0.2;

	switch (env.MODEL_PROVIDER) {
		case "gemini":
			return new ChatGoogleGenerativeAI({
				apiKey: env.GEMINI_API_KEY,
				model: env.GEMINI_MODEL,
				temperature: temp,
			});

		case "groq":
		default:
			return new ChatGroq({
				apiKey: env.GROQ_API_KEY,
				model: env.GROQ_MODEL,
				temperature: temp,
			});
	}
}
