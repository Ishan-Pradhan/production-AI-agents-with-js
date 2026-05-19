//embeddings + vector store
// kb brain -> knowledge base
// picks an embedding model -> openai | gemini
// store your embedding in RAM
// letting us insert chunks and later run search based on those chunks

import { TaskType } from "@google/generative-ai";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { Document } from "@langchain/core/documents";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { OpenAIEmbeddings } from "@langchain/openai";

// core concepts
//embedding model ->
// turns this text -> array of numbers (vector)
// mathematically represents meaning of text
// store chunks as vectors in vector store
// diff providers use diff vector spaces

// vector store
// searchable index
// 'this is my query" -> find me the closest chunks (task of vectore store)

type Provider = "openai" | "gemini";

function getProvider(): Provider {
    const getCurrentProvider = (process.env.RAG_MODEL_PROVIDER ?? 'gemini').toLowerCase().trim();

    return getCurrentProvider === "gemini" ? "gemini" : 'openai'
}

// create embeddings client (go to langchain docs, integration, embeddings, add gemini embeddings)

function makeOpenAIEmbeddings() {
    const key = process.env.OPENAI_API_KEY?.trim();
    if (!key) throw new Error("OPENAI_API_KEY missing");

    return new OpenAIEmbeddings({
        apiKey: key,
        model: "text-embedding-3-small"
    })
}

function makeGoogleEmbeddings() {
    const key = process.env.GOOGLE_API_KEY?.trim();
    if (!key) throw new Error("OPENAI_API_KEY missing");

    return new GoogleGenerativeAIEmbeddings({
        apiKey: key,
        model: "gemini-embedding-001",
        taskType: TaskType.RETRIEVAL_DOCUMENT
    })
}

function makeEmbeddings(provider: Provider) {
    return provider === 'gemini' ? makeGoogleEmbeddings() : makeOpenAIEmbeddings()
}

let store: MemoryVectorStore | null = null;
let currentSetProvider: Provider | null = null;

export function getVectorStore(): MemoryVectorStore {
    const provider = getProvider();

    // check if same provider is already used, return existing store (don't create new)

    if (store && currentSetProvider === provider) {
        return store;
    }


    // provider changed or first time call - build brand new provider
    const embed = makeEmbeddings(provider);
    store = new MemoryVectorStore(embed);
    currentSetProvider = provider;

    return store;
}

//process:
// get the singleton vector store
//add documents => docs
// stores in memory

//chunk count


export async function addChunks(docs: Document[]): Promise<number> {
    if (!Array.isArray(docs) || docs.length === 0) return 0;

    const store = getVectorStore();
    await store.addDocuments(docs);

    return docs.length;
}

export function resetStore() {
    store = null;
    currentSetProvider = null;
}