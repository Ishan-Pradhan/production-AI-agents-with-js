// routerstrategy -> q
// {q, mode -> web | direct}

import { RunnableBranch, RunnableSequence } from "@langchain/core/runnables";
import type { SearchInput } from "../utils/schemas.js";
import { directPath } from "./directPipeline.js";
import { finalValidateAndPolish } from "./finalValidate.js";
import { routerStep } from "./routeStrategy.js";
import { webPath } from "./webPipeline.js";

// web -> webPath
//directPath

// final validation
// JSON

const branch = RunnableBranch.from<{ q: string; mode: "web" | "direct" }, unknown>([
	[(input) => input.mode === "web", webPath],
	directPath,
]);

export const searchChain = RunnableSequence.from([
	routerStep,
	branch,
	finalValidateAndPolish,
]);

export async function runSearch(input: SearchInput) {
	return await searchChain.invoke(input);
}
