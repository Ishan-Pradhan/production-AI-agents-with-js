// role -> pause the graph to ask the user/human to review the plan and approve before we execute the steps
// true or false -> approved or not
// write {approved} state

import { interrupt } from "@langchain/langgraph";
import { State } from "../types";

export async function approveNode(state: State, context: any): Promise<Partial<State>>{
    if(state.status === "cancelled") return {}

    const steps = state.steps ?? []

    if(steps.length === 0){
        return {
            approved: true, 
            message: "No steps to approve, skipping approval"
        }
    }

    const interupt = context?.interrupt as (payload: unknown) => Promise<unknown>

    const decision = await interrupt({
        type: 'approval_request',
        steps
    })

    let approved: boolean
    if(decision && typeof decision === "object" && "approved" in (  decision as any)){
        approved = !!(decision as any).approved
    }else{
        approved = !!decision
    }

    return {approved}
} 