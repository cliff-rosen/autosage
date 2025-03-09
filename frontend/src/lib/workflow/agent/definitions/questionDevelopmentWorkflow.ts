import { v4 as uuidv4 } from 'uuid';
import { AgentWorkflow, AgentWorkflowType, WORKFLOW_VARIABLES } from '../../../../types/agent-workflows';
import { WorkflowStatus, WorkflowStepId, WorkflowStepType, WorkflowVariableName } from '../../../../types/workflows';
import { createBasicSchema, createWorkflowVariable } from '../../../../utils/workflowUtils';

/**
 * Creates a Question Development workflow
 */
export const createQuestionDevelopmentWorkflow = (): AgentWorkflow => {
    const workflowId = uuidv4();

    const workflow: AgentWorkflow = {
        workflow_id: workflowId,
        agent_workflow_type: AgentWorkflowType.QUESTION_DEVELOPMENT,
        name: 'Question Development Agent',
        description: 'Improves and refines user questions for better answering',
        status: WorkflowStatus.DRAFT,
        max_iterations: 3,
        confidence_threshold: 0.8,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),

        // Define workflow variables
        state: [
            createWorkflowVariable(
                uuidv4(),
                WORKFLOW_VARIABLES.ORIGINAL_QUESTION,
                createBasicSchema('string', 'The original question from the user'),
                'input',
                true
            ),
            createWorkflowVariable(
                uuidv4(),
                WORKFLOW_VARIABLES.IMPROVED_QUESTION,
                createBasicSchema('string', 'The improved version of the question'),
                'output'
            ),
            createWorkflowVariable(
                uuidv4(),
                WORKFLOW_VARIABLES.QUESTION_IMPROVEMENT_CONFIDENCE,
                createBasicSchema('number', 'Confidence score for the question improvement'),
                'output'
            ),
            createWorkflowVariable(
                uuidv4(),
                WORKFLOW_VARIABLES.QUESTION_IMPROVEMENT_ITERATIONS,
                createBasicSchema('number', 'Number of iterations performed'),
                'output'
            ),
            createWorkflowVariable(
                uuidv4(),
                WORKFLOW_VARIABLES.QUESTION_IMPROVEMENT_FEEDBACK,
                createBasicSchema('string', 'Feedback on the question improvement process'),
                'output'
            )
        ],

        // Define workflow steps
        steps: [
            // Step 1: Improve Question (LLM)
            {
                step_id: uuidv4() as WorkflowStepId,
                workflow_id: workflowId,
                label: 'Improve Question',
                description: 'Use LLM to analyze and improve the original question',
                step_type: WorkflowStepType.ACTION,
                tool_id: 'llm_tool_id', // Reference to appropriate LLM tool
                parameter_mappings: {
                    prompt: WORKFLOW_VARIABLES.ORIGINAL_QUESTION,
                } as any,
                output_mappings: {
                    improved_question: WORKFLOW_VARIABLES.IMPROVED_QUESTION,
                } as any,
                sequence_number: 1,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },

            // Step 2: Evaluate Improvement (LLM)
            {
                step_id: uuidv4() as WorkflowStepId,
                workflow_id: workflowId,
                label: 'Evaluate Question Improvement',
                description: 'Evaluate the quality of the improved question',
                step_type: WorkflowStepType.ACTION,
                tool_id: 'llm_evaluation_tool_id', // Reference to evaluation LLM tool
                parameter_mappings: {
                    original_question: WORKFLOW_VARIABLES.ORIGINAL_QUESTION,
                    improved_question: WORKFLOW_VARIABLES.IMPROVED_QUESTION,
                } as any,
                output_mappings: {
                    evaluation_score: WORKFLOW_VARIABLES.QUESTION_IMPROVEMENT_CONFIDENCE,
                    evaluation_feedback: WORKFLOW_VARIABLES.QUESTION_IMPROVEMENT_FEEDBACK,
                } as any,
                sequence_number: 2,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },

            // Step 3: Update Iteration Count
            {
                step_id: uuidv4() as WorkflowStepId,
                workflow_id: workflowId,
                label: 'Update Iteration Count',
                description: 'Increment the iteration counter',
                step_type: WorkflowStepType.COUNTER as any,
                counter_variable: WORKFLOW_VARIABLES.QUESTION_IMPROVEMENT_ITERATIONS as any,
                sequence_number: 3,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            } as any
        ]
    };

    return workflow;
}; 