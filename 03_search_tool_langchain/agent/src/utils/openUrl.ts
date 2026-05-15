// fetch each and every page
// the LLM itself can't browse the web
// its just a text predictor
// we need to give it tools to access the web
// our code => act as a browser tool, decide exactly what content is safe and what we want the model to show

//we fetch the url , strip all the unnecessary info, keep exact article like content that we need
import { convert } from "html-to-text"
import { OpenUrlOutputSchema } from "./schemas";

export async function openUrl(url: string) {
    // add https:// if its missing
    //step 1: check and normalize the url

    const normalized = validateUrl(url);

    //step 2: fetch the page by ourself
    //LLM can't browse
    // 'User-Agent': 'agent-core/1.0 (+course-demo)' avoid instant 403 on strict websites


    const res = await fetch(normalized, {
        headers: {
            'User-Agent': 'agent-core/1.0 (+course-demo)'
        }
    })

    if (!res.ok) {
        const body = await safeText(res)
        throw new Error(`OpenURL failed ${res.status} - ${body.slice(0, 300)}`)
    }

    //step3: skip non-text / binary content 
    const contentType = res.headers.get("content-type") ?? "";
    const raw = await res.text();

    // step 4: html -> plain text
    const text = contentType.includes('text/html')
        ? convert(raw, {
            wordwrap: false,
            selectors: [
                {
                    selector: 'nav',
                    format: 'skip'
                },
                {
                    selector: 'header',
                    format: 'skip'
                },
                {
                    selector: 'footer',
                    format: 'skip'
                },
                {
                    selector: 'script',
                    format: 'skip'
                },
                {
                    selector: 'style',
                    format: 'skip'
                }
            ]
        })
        : raw;

    //step 5: 8000 chars max

    const cleaned = collapseWhitespace(text)
    const capped = cleaned.slice(0, 8000)

    //step 6
    return OpenUrlOutputSchema.parse({
        url: normalized,
        content: capped
    })

}

async function safeText(res: Response) {
    try {
        return await res.json();
    } catch (error) {
        return "<no body>"
    }
}

function validateUrl(url: string) {
    try {
        const parsed = new URL(url);
        //https:
        if (!/^https?:$/.test(parsed.protocol)) throw new Error("Only HTTP/HTTPS URLs are allowed")
        return parsed.toString()
    } catch (error) {
        throw new Error("Invalid URL")
    }
}

function collapseWhitespace(s: string) {
    // Replace all whitespace with single spaces
    return s.replace(/[\s]+/g, " ").trim();


}
