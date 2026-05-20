// first node after start
// checks if the input is valid and can be processed by the graph
// if not valid, we can stop the execution and return an error message to the user

import { State } from "../types";

export async function validateNode(state: State): Promise<Partial<State>>{
    const raw = state.input ?? "";
    const trimInput = raw.trim();

    if(trimInput.length === 0){
        return {
            status: "cancelled",
            message: "Input is empty, please provide a valid input"
        }
    }

    const MAX = 300
    const safeINput = trimInput.length > MAX  ? trimInput.slice(0, MAX) + "..." : trimInput;

    return {
        input: safeINput
    }
}
