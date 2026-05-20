import { Router } from "express";
import z from "zod";
import { resumeAgentRun, startAgentRun } from "../graph/graph";

const router = Router();
const startSchema = z.object({
    input: z.string().min(1, "Input is needed")
})

const ApproveSchema = z.object({
    threadId: z.string().min(1, "threadId is required"),
    approve: z.boolean()
})

router.post("/", async(req,res) =>{
    const parsed = startSchema.safeParse(req.body)
    if(!parsed.success){
        return res.status(400).json({status: 'error', error: 'Error while parsing input'})
    }

    try {
        const result = await startAgentRun(parsed.data.input)

        if('final' in result){

            return res.json({status: 'ok', data: {
                kind: 'final',
                final:result.final}})
        }

        if('interrupt' in result){
            return res.json({status: 'ok', data: {
                kind: 'needs_approval',
                interrupt: {
                    threadId: result.interrupt.threadId,
                    steps: result.interrupt.steps,
                    prompt: "Approve the generated plan to allow the agent to execute the steps, or reject it to cancel the execution."
                }
            }})
        }

        return res.status(500).json({status: 'error', error: 'Unexpected result from agent run'})
    } catch (error) {
        console.error("Error starting agent run:", error)
        return res.status(500).json({status: 'error', error: 'Failed to start agent run'})
    }
});

router.post("/approve", async(req,res) =>{
    const parsed = ApproveSchema.safeParse(req.body)
    if(!parsed.success){
        return res.status(400).json({status: 'error', error: 'Error while parsing input'})
    }   

    try {
        const {threadId, approve} = parsed.data;

        const final = await resumeAgentRun({threadId, approve})
        return res.json({status: 'ok', data: { kind: 'final', final }})
    } catch (error) {
        console.error("Error approving agent run:", error)
        return res.status(500).json({status: 'error', error: 'Failed to approve agent run'})
    }
})

export default router;