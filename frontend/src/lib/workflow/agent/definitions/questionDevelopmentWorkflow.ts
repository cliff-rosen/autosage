import { v4 as uuidv4 } from 'uuid';
import { AgentWorkflow, AgentWorkflowType, WORKFLOW_VARIABLES } from '../../../../types/agent-workflows';
import { WorkflowStatus, WorkflowStepId, WorkflowStepType, WorkflowVariableName, EvaluationCondition, EvaluationConfig } from '../../../../types/workflows';
import { createBasicSchema, createWorkflowVariable } from '../../../../utils/workflowUtils';
import { ToolOutputName, ToolParameterName } from '../../../../types/tools';

// Add custom workflow variable for question evaluation
const QUESTION_EVALUATION = 'question_evaluation' as WorkflowVariableName;

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
        max_iterations: 1, // Start with just one iteration for simplicity
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
                WORKFLOW_VARIABLES.QUESTION_IMPROVEMENT_FEEDBACK,
                createBasicSchema('string', 'Feedback on the question improvement process'),
                'output'
            ),
            createWorkflowVariable(
                uuidv4(),
                QUESTION_EVALUATION,
                createBasicSchema('string', 'Detailed evaluation of the question improvement'),
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
                tool_id: 'llm', // Reference to LLM tool
                prompt_template_id: 'question-improver', // Reference to the prompt template
                parameter_mappings: {
                    ['question' as ToolParameterName]: WORKFLOW_VARIABLES.ORIGINAL_QUESTION,
                },
                output_mappings: {
                    ['improvedQuestion' as ToolOutputName]: WORKFLOW_VARIABLES.IMPROVED_QUESTION,
                    ['explanation' as ToolOutputName]: WORKFLOW_VARIABLES.QUESTION_IMPROVEMENT_FEEDBACK,
                },
                sequence_number: 1,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
            // Step 2: Evaluate Question Improvement (LLM)
            {
                step_id: uuidv4() as WorkflowStepId,
                workflow_id: workflowId,
                label: 'Evaluate Improvement',
                description: 'Calculate confidence score for the question improvement',
                step_type: WorkflowStepType.ACTION,
                tool_id: 'llm', // Reference to LLM tool
                prompt_template_id: 'question-improvement-evaluator', // Reference to the evaluation prompt template
                parameter_mappings: {
                    ['originalQuestion' as ToolParameterName]: WORKFLOW_VARIABLES.ORIGINAL_QUESTION,
                    ['improvedQuestion' as ToolParameterName]: WORKFLOW_VARIABLES.IMPROVED_QUESTION,
                },
                output_mappings: {
                    ['confidenceScore' as ToolOutputName]: WORKFLOW_VARIABLES.QUESTION_IMPROVEMENT_CONFIDENCE,
                    ['evaluation' as ToolOutputName]: QUESTION_EVALUATION,
                },
                sequence_number: 2,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
            // Step 3: Conditional Check for Confidence Threshold
            {
                step_id: uuidv4() as WorkflowStepId,
                workflow_id: workflowId,
                label: 'Check Confidence',
                description: 'Check if the confidence score meets the threshold',
                step_type: WorkflowStepType.EVALUATION,
                parameter_mappings: {}, // Empty but required
                output_mappings: {}, // Empty but required
                evaluation_config: {
                    conditions: [
                        {
                            condition_id: uuidv4(),
                            variable: WORKFLOW_VARIABLES.QUESTION_IMPROVEMENT_CONFIDENCE,
                            operator: 'greater_than',
                            value: 0.8, // Confidence threshold
                        }
                    ],
                    default_action: 'continue',
                    maximum_jumps: 3
                } as EvaluationConfig,
                sequence_number: 3,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                // If condition is true, continue to next step
                // If false, we could add logic to retry or provide feedback
            }
        ]
    };

    return workflow;
}; 