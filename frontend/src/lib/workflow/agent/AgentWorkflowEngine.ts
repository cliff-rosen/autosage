import { AgentWorkflow } from '../../../types/agent-workflows';
import { WorkflowVariableName } from '../../../types/workflows';
import { v4 as uuidv4 } from 'uuid';
import { WorkflowEngine } from '../workflowEngine';

/**
 * Interface for a workflow job
 */
export interface WorkflowJob {
    jobId?: string;
    workflow: AgentWorkflow;
    inputs: Record<WorkflowVariableName | string, any>;
}

/**
 * Interface for a job result
 */
export interface JobResult {
    jobId: string;
    success: boolean;
    outputs?: Record<WorkflowVariableName | string, any>;
    error?: string;
}

/**
 * A simple WorkflowEngine implementation for agent workflows
 * This is a simplified version that only implements the methods needed by AgentWorkflowOrchestrator
 */
export class AgentWorkflowEngine {
    private activeJobs: Map<string, {
        job: WorkflowJob;
        status: 'running' | 'completed' | 'failed';
    }> = new Map();

    /**
     * Run a workflow job
     * @param job The job to run
     * @returns A promise that resolves to the job result
     */
    async runJob(job: WorkflowJob): Promise<JobResult> {
        const jobId = job.jobId || uuidv4();

        // Store the job
        this.activeJobs.set(jobId, {
            job,
            status: 'running'
        });

        try {
            console.log(`🚀 [JOB ${jobId}] Starting workflow job: ${job.workflow.name}`);
            console.time(`⏱️ Job ${jobId} Execution Time`);

            // Initialize workflow with inputs
            const workflow = { ...job.workflow };
            console.log(`📋 [JOB ${jobId}] Workflow has ${workflow.steps.length} steps`);

            // Initialize workflow state with input variables
            if (!workflow.state) {
                workflow.state = [];
            }

            // Add input values to workflow state
            console.log(`📥 [JOB ${jobId}] Setting up workflow inputs`);
            for (const [inputName, inputValue] of Object.entries(job.inputs)) {
                // Find the variable in the workflow state
                const existingVarIndex = workflow.state.findIndex(v => v.name === inputName);

                if (existingVarIndex >= 0) {
                    // Update existing variable
                    workflow.state[existingVarIndex] = {
                        ...workflow.state[existingVarIndex],
                        value: inputValue
                    };
                    console.log(`📥 [JOB ${jobId}] Updated input: ${inputName}`);
                } else {
                    // This is a fallback for inputs that aren't defined in the workflow
                    // In a production system, you might want to validate inputs against the workflow definition
                    console.warn(`⚠️ [JOB ${jobId}] Input ${inputName} not found in workflow state, adding it dynamically`);
                    workflow.state.push({
                        variable_id: uuidv4(),
                        name: inputName as WorkflowVariableName,
                        io_type: 'input',
                        required: true,
                        schema: {
                            type: typeof inputValue as any,
                            description: `Dynamically added input ${inputName}`,
                            is_array: Array.isArray(inputValue)
                        },
                        value: inputValue
                    });
                }
            }

            // Execute each step in the workflow sequentially
            let currentStepIndex = 0;
            let updatedState = [...workflow.state];
            let success = true;
            let error: string | undefined;

            console.log(`🔄 [JOB ${jobId}] Starting workflow execution`);

            while (currentStepIndex < workflow.steps.length) {
                const step = workflow.steps[currentStepIndex];
                console.log(`▶️ [JOB ${jobId}] Executing step ${currentStepIndex + 1}/${workflow.steps.length}: ${step.label}`);
                console.time(`⏱️ [JOB ${jobId}] Step ${currentStepIndex + 1} Execution Time`);

                // Execute the current step
                const stepResult = await WorkflowEngine.executeStepSimple(
                    { ...workflow, state: updatedState },
                    currentStepIndex
                );

                // Update the workflow state
                updatedState = stepResult.updatedState;

                // Check if the step execution was successful
                if (!stepResult.result.success) {
                    success = false;
                    error = stepResult.result.error;
                    console.error(`❌ [JOB ${jobId}] Step ${currentStepIndex + 1} failed: ${error}`);
                    console.timeEnd(`⏱️ [JOB ${jobId}] Step ${currentStepIndex + 1} Execution Time`);
                    break;
                }

                console.timeEnd(`⏱️ [JOB ${jobId}] Step ${currentStepIndex + 1} Execution Time`);
                console.log(`✅ [JOB ${jobId}] Step ${currentStepIndex + 1} completed successfully`);

                // Move to the next step
                const previousStepIndex = currentStepIndex;
                currentStepIndex = stepResult.nextStepIndex;

                // Log if we're jumping to a different step
                if (currentStepIndex !== previousStepIndex + 1) {
                    if (currentStepIndex >= workflow.steps.length) {
                        console.log(`🏁 [JOB ${jobId}] Workflow execution completed (end of workflow)`);
                    } else {
                        console.log(`↪️ [JOB ${jobId}] Jumping from step ${previousStepIndex + 1} to step ${currentStepIndex + 1}`);
                    }
                }

                // Check if we've reached the end of the workflow
                if (currentStepIndex >= workflow.steps.length) {
                    console.log(`🏁 [JOB ${jobId}] Workflow execution completed successfully`);
                    break;
                }
            }

            // Extract outputs from the final workflow state
            console.log(`📤 [JOB ${jobId}] Collecting workflow outputs`);
            const outputs: Record<string, any> = {};
            for (const variable of updatedState) {
                if (variable.io_type === 'output' && variable.value !== undefined) {
                    outputs[variable.name] = variable.value;
                    console.log(`📤 [JOB ${jobId}] Output: ${variable.name}`);
                }
            }

            // Update job status
            this.activeJobs.set(jobId, {
                job,
                status: success ? 'completed' : 'failed'
            });

            console.timeEnd(`⏱️ Job ${jobId} Execution Time`);
            console.log(`${success ? '🎉' : '❌'} [JOB ${jobId}] Workflow job ${success ? 'completed successfully' : 'failed'}`);

            // Return result
            return {
                jobId,
                success,
                outputs: success ? outputs : undefined,
                error: success ? undefined : error
            };
        } catch (error) {
            console.error(`❌ [JOB ${jobId}] Error executing workflow:`, error);

            // Update job status
            this.activeJobs.set(jobId, {
                job,
                status: 'failed'
            });

            console.timeEnd(`⏱️ Job ${jobId} Execution Time`);

            // Return error result
            return {
                jobId,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Cancel a job
     * @param jobId The ID of the job to cancel
     * @returns A promise that resolves to true if the job was cancelled
     */
    async cancelJob(jobId: string): Promise<boolean> {
        if (this.activeJobs.has(jobId)) {
            const jobData = this.activeJobs.get(jobId);
            if (jobData && jobData.status === 'running') {
                this.activeJobs.set(jobId, {
                    ...jobData,
                    status: 'failed'
                });
                return true;
            }
        }
        return false;
    }
} 