type Provider = 'openai' | 'gemini' | 'groq';

type HelloOutput = {
    ok: true;
    provider: Provider;
    model: string;
    message: string;
}

type GeminiGenerateContent = {
    candidate?: Array<{content?: {parts?: Array<{text?: string}>}}>
}

async function helloGemini(): Promise<HelloOutput>{
    const apiKey = process.env.GOOGLE_API_KEY;

    if(!apiKey) throw new Error("Google api key is not present!");

    const model = 'gemini-2.0-flash-lite';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

   const response = await fetch(url , {
    method: 'POST', 
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        contents: [{
            parts: [{
                text: 'say a short hello'
            }]
        }]
    })

    
   })
if(!response.ok) throw new Error(`Gemini ${response.status}: ${await response.text()}`)

    const json = await response.json() as GeminiGenerateContent;
    const text = json.candidate?.[0]?.content?.parts?.[0]?.text ?? 'Hello as default';
 
    return {
        ok: true,
        provider: 'gemini',
        model,
        message: String(text).trim()
    }

}

type OpenAIChatCompletion = {
    choices?: Array<{message?: {content: string}}>
}

async function helloGroq(): Promise<HelloOutput>{
    const apiKey = process.env.GROQ_API_KEY;

    if(!apiKey) throw new Error("Groq api key is not present!");

    const model = 'llama-3.1-8b-instant';
    const url = 'https://api.groq.com/openai/v1/chat/completions';

    const response = await fetch(url, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model,
            messages: [
                {
                    role: 'user',
                    content: 'Say a short hello'
                }
            ],
            temperature: 0
        })
    })

    if(!response.ok) throw new Error(`Groq ${response.status}: ${await response.text()}`)
    const json = (await response.json()) as OpenAIChatCompletion
    const content = json?.choices?.[0]?.message?.content ?? 'Hello as default';

    return {
        ok: true,
        provider: 'groq',
        model,
        message: String(content).trim()
    }
    
}

export async function selectAndHello(): Promise<HelloOutput>{
    const forced = (process.env.PROVIDER || "").toLowerCase()

    if(forced === 'gemini') return helloGemini();

    if(forced === 'groq') return helloGroq();

    if(forced) throw new Error(`Unsupported Provider=${forced}. use gemini | groq`);

    if(process.env.GOOGLE_API_KEY){
        try{
            return await helloGemini();
        }catch (error){
            if(error instanceof Error && error.message.toLowerCase().includes('gemini')){
                console.log('Gemini failed: Retrying with groq');
            }
        }
    }
    if(process.env.GROQ_API_KEY){
        try{
            return await helloGroq();
        }catch (error){
            if(error instanceof Error && error.message.toLowerCase().includes('groq')){
                console.log('Groq failed: Retrying with gemini');
            }
        }
    }

    throw new Error("No provider configured.")

    
}