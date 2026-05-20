import z from "zod";
import { ChatGroq } from "@langchain/groq";
import { State } from "../types";

const PlanSchema = z.object({
    steps: z.array(z.string().min(3, "Keep each step a short sentence")).max(150, "Keep each step concise").min(1).max(10),
})

type Plan  = z.infer<typeof PlanSchema>

function makeModel(){
    return new ChatGroq({
        apiKey: process.env.GROQ_API_KEY!,
        model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
    })
}               
   
const SYSTEM = ["You are a helpful planner",
    "Return only JSON  that matches the schema",
    "Keep steps concrete, actionable and beginner friendly"
].join("\n")

function userPrompt(input: string){
    return [
        `User goal: ${input}`,
        'Draft a small plan with 3 -5 steps',
        '-Each step should be a short and clear sentence',
        
    ].join("\n")
}

function takeFirstN(arr: string[], n= 5):string[]{
return Array.isArray(arr)? arr.slice(0, Math.max(0,n)) : []
}

export async function PlanNode(state: State): Promise<Partial<State>>{
if(state.status === "cancelled")return {}

const model = makeModel();

//model.withStructuredOutput will ensure that the output from the model is parsed according to the PlanSchema, so we can safely work with the plan variable as a Plan type without worrying about parsing errors or invalid formats.
const structured = model.withStructuredOutput(PlanSchema)

const plan = await structured.invoke([{
    role: 'system', content: SYSTEM
},
{
    role: 'human', content: userPrompt(state.input)
}])

const steps = takeFirstN(plan.steps, 5)
return {steps, status: 'planned'}
}