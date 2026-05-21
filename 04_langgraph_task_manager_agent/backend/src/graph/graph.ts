// define and compile the langGraph workflow
// start Agent run
// resume Agent run

import { Annotation, Command, END, MemorySaver, START, StateGraph } from "@langchain/langgraph";
import { validateNode } from "./nodes/01_validate";
import { PlanNode } from "./nodes/02_plan";
import { approveNode } from "./nodes/03_approve";
import { executeNode } from "./nodes/04_execute";
import { finalizeNode } from "./nodes/05_finalize";
import { makeInitialState, State } from "./types";

// Define the structure of the graph state using langgraph annotations to enable type safety and validation within the graph execution.
const StateAnn = Annotation.Root({
        input: Annotation<string>,
        steps:Annotation<string[] | undefined>,
        approved: Annotation<boolean | undefined>,
        results: Annotation<Array<{step: string, note: string}> | undefined>,
        status:Annotation<"planned" | "done" | "cancelled" | undefined>,
        message: Annotation<string | undefined>,
})

// Build the graph by adding nodes and edges to define the workflow of the task manager agent. Each node corresponds to a specific function that processes the state, and edges define the flow of execution between these nodes.
const builder = new StateGraph(StateAnn).addNode('validate', validateNode).addNode("plan", PlanNode).addNode("approve", approveNode).addNode("execute", executeNode).addNode("finalize", finalizeNode)

// Define the edges between nodes to establish the execution flow of the graph. The START node transitions to 'validate', which then transitions to 'plan', followed by 'approve', and finally to 'execute' and 'finalize'. This structure allows for a clear and organized flow of data through the various stages of the task management process.
builder.addEdge(START, 'validate');
builder.addEdge('validate', 'plan');
builder.addEdge('plan', 'approve');

// conditional edge based on approval status from 'approve' node, if approved go to execute, else skip to finalize
builder.addConditionalEdges('approve', (s: typeof StateAnn.State) => {
    return s.approved ? 'execute': 'finalize'
})

builder.addEdge('execute', 'finalize');
builder.addEdge('finalize', END);

// Compile the graph with a memory saver to enable state persistence across executions. This allows the agent to maintain context and state information as it processes through the nodes, enabling features like resuming execution or analyzing past runs.
const checkPointer = new MemorySaver()
// Generate a unique thread ID for each execution of the graph, which can be used to track and manage individual runs of the agent. This is particularly useful for debugging, logging, and resuming specific executions.
const graph = builder.compile({checkpointer: checkPointer})

// Export the graph and the thread ID generator function for use in other parts of the application, such as starting or resuming agent runs. This allows for modularity and separation of concerns, enabling other components to interact with the graph without needing to know its internal structure.
function createThreadId(){
    return `t_${Date.now().toString(36)}_${Math.random().toString(36).substring(2,8)}`
}

// Function to start a new agent run by invoking the graph with an initial state created from the input string. The function returns either an interrupt object containing the thread ID and steps if the execution is interrupted, or the final state if the execution completes without interruption.
export async function startAgentRun(input: string):Promise<{interrupt: {threadId: string; steps: string[]}} | {final: State}>{
    const threadId = createThreadId()
    const config = { configurable: { thread_id: threadId } }

    const result: any = await graph.invoke(makeInitialState(input), config)

    if(result && result.__interrupt__){
const first = Array.isArray(result.__interrupt__) ? result.__interrupt__[0] : result.__interrupt__

const steps = (first?.value?.steps as string[]) ?? []

return{
    interrupt: {
        threadId, 
        steps
    }
}


    }

    return {
        final: result as State
    }
}

// Function to resume an existing agent run by invoking the graph with a command containing the approval status. The function takes a thread ID and an approval boolean as arguments, and returns the final state of the graph after resuming execution. This allows for handling cases where the agent run was interrupted and needs to be continued based on user input or other conditions.
export async function resumeAgentRun(args: {threadId: string; approve: boolean}): Promise<State>{
    const {threadId, approve} = args
    const config = { configurable: { thread_id: threadId } }

    // Resume the graph execution by invoking it with a command that includes the approval status. The graph will continue from the point of interruption, processing the state based on the provided approval value, and ultimately returning the final state after execution.
    const finalState = (await graph.invoke(new Command({ resume: { approve } }), config)) as State

    return finalState
}