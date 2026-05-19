// ask the kb -> retrieval + answer
// what is our refund policy for late payments ? => query

import { StringSchema } from "@google/generative-ai";
import { getVectorStore } from "./store";
import { getChatModel } from "../shared/models";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

// step 1. embed the query (query to vector) use the same embedding model that we used to embed the kb
// step 2. retrieve top similar chunks from memory/vector store
// step 3. feed them to LLM (build a prompt using retrieved chunks + original query and generate answer)

export type KBSource = {
    source: string;
    chunkId: number;
}

export type KBAskResult = {
    answer: string;
    sources: KBSource[];
    confidence: number;
}

function buildContext(chunks: {
    text: string,
    meta: any
}[]) {
    return chunks.map(({ text, meta }, i) => [
        `[#${i + 1}] ${String(meta?.source ?? 'unknown')} #${String(meta?.chunkId ?? "?")}`, text ?? "Empty text"].join(`\n`)
    ).join("\n\n---\n\n")
}

async function buildFinalAnswerFromLLM(query: string, context: string) {
    const model = getChatModel({ temperature: 0.2 })

    const res = await model.invoke([
        new SystemMessage([
            "You are a helpful assistant that answers only using the provided context. ",
            "If the answer is not found in the current context, say so briefly",
            "Be concise (4-5 sentences), neutral , and avoid any marketting info. ",
            "Do not fabricate sources or cite anything that is not in the context"
        ].join("\n")),

        new HumanMessage([
            `Question: \n${query}`,
            "",
            "Context: (quoted chunks) -> ",
            context || "no relevant context"
        ].join("\n"))
    ])

    const finalRes = typeof res.content === "string" ? res.content : String(res.content);

    return finalRes.trim().slice(0, 1500)
}

function buildConfidence(scores: number[]): number {
    if (!scores.length) return 0;
    const clamped = scores.map(score => Math.max(0, Math.min(1, score)))

    const avg = clamped.reduce((a, b) => a + b, 0)
    return Math.round(avg * 100) / 100 // 2 decimal place
}

export async function askKB(query: string, k = 2): Promise<KBAskResult> {
    const validateCurrentQuery = (query ?? "").trim();

    if (!validateCurrentQuery) throw new Error("Query is empty. Please try again.");

    const store = getVectorStore();

    //embed the query
    const embedQuery = await store.embeddings.embedQuery(validateCurrentQuery);

    const pairs = await store.similaritySearchVectorWithScore(embedQuery, k)

    const chunks = pairs.map(([doc]) => ({
        text: doc.pageContent || "",
        meta: doc.metadata || {}
    }))

    const scores = pairs.map(([_, score]) => Number(score) || 0)

    // prompt context
    const context = buildContext(chunks)

    const answer = await buildFinalAnswerFromLLM(validateCurrentQuery, context)

    const sources: KBSource[] = chunks.map((c) => ({
        source: String(c.meta?.source ?? 'unknown'),
        chunkId: Number(c.meta?.chunkId ?? 0),
    }))

    const confidence = buildConfidence(scores)

    return {
        answer,
        sources,
        confidence
    }
}