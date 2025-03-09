import { v4 as uuidv4 } from 'uuid';
import { AgentWorkflow, AgentWorkflowType, WORKFLOW_VARIABLES } from '../../../../types/agent-workflows';
import { WorkflowStatus, WorkflowStepId, WorkflowStepType, WorkflowVariableName } from '../../../../types/workflows';
import { createArraySchema, createBasicSchema, createWorkflowVariable } from '../../../../utils/workflowUtils';

/**
 * Creates an Answer Generation workflow
 */
export const createAnswerGenerationWorkflow = (): AgentWorkflow => {
    const workflowId = uuidv4();

    const workflow: AgentWorkflow = {
        workflow_id: workflowId,
        agent_workflow_type: AgentWorkflowType.ANSWER_GENERATION,
        name: 'Answer Generation Agent',
        description: 'Generates comprehensive answers based on the knowledge base',
        status: WorkflowStatus.DRAFT,
        max_iterations: 3,
        confidence_threshold: 0.9,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),

        // Define workflow variables
        state: [
            createWorkflowVariable(
                uuidv4(),
                WORKFLOW_VARIABLES.ANSWER_INPUT_QUESTION,
                createBasicSchema('string', 'The question to answer'),
                'input',
                true
            ),
            createWorkflowVariable(
                uuidv4(),
                WORKFLOW_VARIABLES.ANSWER_INPUT_KB,
                createArraySchema('object', 'The knowledge base to use for answering'),
                'input',
                true
            ),
            createWorkflowVariable(
                uuidv4(),
                WORKFLOW_VARIABLES.FINAL_ANSWER,
                createBasicSchema('string', 'The final answer to the question'),
                'output'
            ),
            createWorkflowVariable(
                uuidv4(),
                WORKFLOW_VARIABLES.ANSWER_CONFIDENCE,
                createBasicSchema('number', 'Confidence score for the answer'),
                'output'
            ),
            createWorkflowVariable(
                uuidv4(),
                WORKFLOW_VARIABLES.ANSWER_SOURCES,
                createArraySchema('object', 'Sources cited in the answer'),
                'output'
            ),
            createWorkflowVariable(
                uuidv4(),
                'answer_iterations' as WorkflowVariableName,
                createBasicSchema('number', 'Number of iterations performed'),
                'output'
            )
        ],

        // Define workflow steps
        steps: [
            // Step 1: Create Answer Plan (LLM)
            {
                step_id: uuidv4() as WorkflowStepId,
                workflow_id: workflowId,
                label: 'Create Answer Plan',
                description: 'Create a plan for answering the question',
                step_type: WorkflowStepType.ACTION,
                tool_id: 'llm_tool_id',
                parameter_mappings: {
                    question: WORKFLOW_VARIABLES.ANSWER_INPUT_QUESTION,
                    knowledge_base: WORKFLOW_VARIABLES.ANSWER_INPUT_KB,
                } as any,
                output_mappings: {
                    answer_plan: 'answer_plan' as WorkflowVariableName,
                } as any,
                sequence_number: 1,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },

            // Step 2: Draft Answer (LLM)
            {
                step_id: uuidv4() as WorkflowStepId,
                workflow_id: workflowId,
                label: 'Draft Answer',
                description: 'Create a draft answer based on the knowledge base',
                step_type: WorkflowStepType.ACTION,
                tool_id: 'llm_tool_id',
                parameter_mappings: {
                    question: WORKFLOW_VARIABLES.ANSWER_INPUT_QUESTION,
                    knowledge_base: WORKFLOW_VARIABLES.ANSWER_INPUT_KB,
                    answer_plan: 'answer_plan' as WorkflowVariableName,
                } as any,
                output_mappings: {
                    draft_answer: 'draft_answer' as WorkflowVariableName,
                    cited_sources: WORKFLOW_VARIABLES.ANSWER_SOURCES,
                } as any,
                sequence_number: 2,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },

            // Step 3: Evaluate Answer (LLM)
            {
                step_id: uuidv4() as WorkflowStepId,
                workflow_id: workflowId,
                label: 'Evaluate Answer',
                description: 'Evaluate the quality of the draft answer',
                step_type: WorkflowStepType.ACTION,
                tool_id: 'llm_evaluation_tool_id',
                parameter_mappings: {
                    question: WORKFLOW_VARIABLES.ANSWER_INPUT_QUESTION,
                    knowledge_base: WORKFLOW_VARIABLES.ANSWER_INPUT_KB,
                    answer: 'draft_answer' as WorkflowVariableName,
                } as any,
                output_mappings: {
                    evaluation_score: WORKFLOW_VARIABLES.ANSWER_CONFIDENCE,
                    evaluation_feedback: 'answer_feedback' as WorkflowVariableName,
                } as any,
                sequence_number: 3,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },

            // Step 4: Refine Answer (LLM)
            {
                step_id: uuidv4() as WorkflowStepId,
                workflow_id: workflowId,
                label: 'Refine Answer',
                description: 'Refine the answer based on evaluation feedback',
                step_type: WorkflowStepType.ACTION,
                tool_id: 'llm_tool_id',
                parameter_mappings: {
                    draft_answer: 'draft_answer' as WorkflowVariableName,
                    feedback: 'answer_feedback' as WorkflowVariableName,
                    knowledge_base: WORKFLOW_VARIABLES.ANSWER_INPUT_KB,
                } as any,
                output_mappings: {
                    refined_answer: WORKFLOW_VARIABLES.FINAL_ANSWER,
                    updated_sources: WORKFLOW_VARIABLES.ANSWER_SOURCES,
                } as any,
                sequence_number: 4,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },

            // Step 5: Update Iteration Count
            {
                step_id: uuidv4() as WorkflowStepId,
                workflow_id: workflowId,
                label: 'Update Iteration Count',
                description: 'Increment the iteration counter',
                step_type: WorkflowStepType.ACTION,
                tool_id: 'counter_tool_id',
                parameter_mappings: {} as any,
                output_mappings: {
                    count: 'answer_iterations' as WorkflowVariableName,
                } as any,
                sequence_number: 5,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }
        ]
    };

    return workflow;
}; 