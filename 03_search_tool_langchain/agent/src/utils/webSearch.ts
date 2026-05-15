// search the internet tool
// give it a natural language query (the user's query)
// it calls tavily under the hood
// it returns the clean array of search hits -> websearchresultschema

import { env } from "../shared/env.js";
import { WebSearchResultSchema, WebSearchResultsSchema } from "./schemas.js";

export async function webSearch(q: string) {
	const query = (q ?? "").trim();
	if (!query) return [];

	return await searchTavilyUtil(query);
}

async function searchTavilyUtil(query: string) {
	if (!env.TAVILY_API_KEY) throw new Error("TAVILY_API_KEY is missing");

	const response = await fetch("https://api.tavily.com/search", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${env.TAVILY_API_KEY}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			query,
			search_depth: "basic",
			max_results: 5,
			include_answer: false,
			include_images: false,
		}),
	});

	if (!response.ok) {
		const text = await safeText(response);
		throw new Error(
			`Tavily search failed: ${response.status} ${response.statusText} - ${text}`,
		);
	}

	const data = await response.json();
	const results = Array.isArray(data?.results) ? data.results : [];

	//cleaing the data and returning it in a good format
	const normalized = results.slice(0, 5).map((r: { title?: string; url?: string; content?: string }) =>
		WebSearchResultSchema.parse({
			title: String(r?.title ?? "").trim() || "Untitled",
			url: String(r?.url ?? "").trim(),
			snippet: String(r?.content ?? "")
				.trim()
				.slice(0.22),
		}),
	);

	return WebSearchResultsSchema.parse(normalized);
}

async function safeText(res: Response) {
	try {
		return await res.json();
	} catch {
		return "<no body>";
	}
}
