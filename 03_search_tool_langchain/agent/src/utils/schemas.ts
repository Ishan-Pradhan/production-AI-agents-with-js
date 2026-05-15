//legal contract between backend => AI models => frontend
//zod schema for AI response

import z from "zod";

export const WebSearchResultSchema = z.object({
    title: z.string().min(1),
    url: z.url(),
    snippet: z.string().optional().default("")
})

export const WebSearchResultsSchema = z.array(WebSearchResultSchema).max(10)

export type WebSearchResult = z.infer<typeof WebSearchResultSchema>;


//open url tool schema
export const OpenUrlInputSchema = z.object({
    url: z.url(),

})
export const OpenUrlOutputSchema = z.object({
    url: z.url(),
    content: z.string().min(1)
})

//summarize tool schema

export const SummarizeInputSchema = z.object({
    text: z.string().min(50, 'Need a bit more text to summarize'),
    // wordLimit: z.number().int().positive().optional().default(200),
    // style: z.enum(["neutral", "friendly", "professional"]).optional().default("neutral")
})

//summary output schema

export const SummarizeOutputSchema = z.object({
    summary: z.string().min(1)
})

export const SearchInputSchema = z.object({
    q: z.string().min(5, "Please ask a specific query")
})

export type SearchInput = z.infer<typeof SearchInputSchema>;

export const searchAnswerSchema = z.object({
    answer: z.string().min(1, 'Answer is required'),
    sources: z.array(z.url()).optional().default([]),
})

export type SearchAnswer = z.infer<typeof searchAnswerSchema>;