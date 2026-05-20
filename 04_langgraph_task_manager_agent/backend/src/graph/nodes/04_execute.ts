import { ChatGroq } from "@langchain/groq";
import z from "zod";
import { env } from "../../utils/env";
import { State } from "../types";

const NotesSchema = z.object({
    notes: z.array(z.string().min(1).max(500)).min(1).max(20)
})

type Notes = z.infer<typeof NotesSchema>;

function makeModel(){
    return new ChatGroq({
        apiKey: env.GROQ_API_KEY!,
        model: env.GROQ_MODEL || "llama-3.1-8b-instant",
    })
}               
   
function createHumanPromptContent(steps: string[]){
const list  = JSON.stringify(steps,null, 0)

return[
    "You are a concise assistant.",
    'Given a list of steps, return a JSON object {"notes" : string[]}',
    "Rules:",
    "notes.length must be equal to steps.length",
    "Each note <=300 characters",
    "Plain text, no markdown, no code blocks, no lists, no emojis, no special characters.",
    "",
    `Steps: ${list}`,
].join("\n")
}


export async function executeNode(state: State): Promise<Partial<State>> {
    if(!state.approved) return {}

    const steps = state.steps ?? []

    if(steps.length ===0) return {}

    const model = makeModel()
    const structure = model.withStructuredOutput(NotesSchema)

    const out: Notes = await structure.invoke([{
role: "system",content: "Return only valid JSON that matches the schema. Do not include any text outside of the JSON."},{
role: "human",content: createHumanPromptContent(steps)
    }])

    const count = Math.min(steps.length, out.notes.length);

    const results = Array.from({length: count}, (_,i) =>({
        step: steps[i],
        note: out.notes[i]
    }))
    return{
        results, 
        status: 'done',
        message: `Executed ${results.length} steps.`
    }
}
