// chunk the text using fixed chunk rules
// embed our chunks into vectors
// push our vectors in memory store
// return a summary so that UI can say this like
// added 1 documents with "this many chunks (20, 5, 6) from this file"

import { chunkText } from "./chunk";
import { addChunks } from "./store";

// 2 pipeline
// 1. path for ingestion/ indexing -> prepare knowledge
// 2. path for retrieving the answers

export type IngestTextInput = {
    text: string;
    source?: string;
}

export async function ingestText(input: IngestTextInput) {
    const raw = (input.text ?? "").trim();

    if (!raw) throw new Error("No file to ingest");

    const source = input.source ?? "pasted text";

    const docs = chunkText(raw, source);

    // embed each chunk and add to our created vector store

    const chunkCount = await addChunks(docs);

    return {
        docCount: 1,
        chunkCount,
        source
    }
}