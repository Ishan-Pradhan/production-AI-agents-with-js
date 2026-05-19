// why we actually chunk
// it searches "chunks" of the text, not the whole text at once
// small enough to fit in context window
// but big enough to contain meaningful information

import { Document } from "@langchain/core/documents";

//slice it 

export const CHUNK_SIZE = 1000;
export const CHUNK_OVERLAP = 150;

// text -> markdown, article, policy
// source -> what is his name? Ishan (source #0) chunk 0 
// return document object

//chunksize = 10, overlap=3, text = ABCDEFGHIJKL
// step -> chunksize - overlap = 7
// start = 0 -> slice [0: 10] -> ABCDEFGHIJ chunk#0
// start = 7 -> slice[7,17] -> HIJKL... chunk+1
//metadata -> what metadata do we need?
// what is his name? 
export function chunkText(text: string, source: string): Document[] {
    const clean = (text ?? "").replace(/\r\n/g, "\n").trim()

    const docs: Document[] = []

    if (!clean) return docs

    const step = Math.max(1, CHUNK_SIZE - CHUNK_OVERLAP)

    let start = 0;
    let chunkId = 0;

    while (start < clean.length) {
        const end = Math.min(clean.length, start + CHUNK_SIZE);

        // remove leading/trailing blank spaces/lines

        const slice = clean.slice(start, end).trim();
        if (slice.length > 0) {
            docs.push(
                // what each chunk contains:
                // pageContent → actual text
                // metadata:
                // source (where text came from)
                // chunkId (unique ID)
                new Document({
                    pageContent: slice,
                    metadata: {
                        source,
                        chunkId
                    }
                })
            )
        }

        // next chunk will get the next Id
        chunkId += 1;
        start += step;
    }
    return docs
}