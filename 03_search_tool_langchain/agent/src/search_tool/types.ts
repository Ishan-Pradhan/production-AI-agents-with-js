// 2 paths
// web path -> browse, summarize, source urls / cite urls
// direct path -> LLM, now browsing web
// shared shape -> candidate

export type Candidate = {
	answer: string;
	sources: string[];
	mode: "web" | "direct";
};
