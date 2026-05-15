// cheap mode
// ask the model
// get a short helpful ans

import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { RunnableLambda } from "@langchain/core/runnables";
import { getChatModel } from "../shared/models.js";
import type { Candidate } from "./types.js";

export const directPath = RunnableLambda.from(
	async (input: { q: string; mode: "web" | "direct" }): Promise<Candidate> => {
		const model = getChatModel({ temperature: 0.2 });

		const res = await model.invoke([
			new SystemMessage(
				[
					"You answer briefly and clearly for beginners",
					"If unsure, say so",
				].join("\n"),
			),
			new HumanMessage(input.q),
		]);

		const directAns = (
			typeof res.content === "string" ? res.content : String(res.content)
		).trim();

		return {
			answer: directAns,
			sources: [],
			mode: "direct",
		};
	},
);
