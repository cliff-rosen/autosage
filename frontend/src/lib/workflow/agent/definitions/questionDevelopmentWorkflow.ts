import { v4 as uuidv4 } from 'uuid';
import { AgentWorkflow, AgentWorkflowType, WORKFLOW_VARIABLES } from '../../../../types/agent-workflows';
import { WorkflowStatus, WorkflowStepId, WorkflowStepType, WorkflowVariableName } from '../../../../types/workflows';
import { createBasicSchema, createWorkflowVariable } from '../../../../utils/workflowUtils';
import { ToolOutputName, ToolParameterName } from '../../../../types/tools';

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
                createBasicSchema('string', 'The improved and refined question'),
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
            ),
            createWorkflowVariable(
                uuidv4(),
                'question_analysis' as WorkflowVariableName,
                createBasicSchema('string', 'Analysis of the original question'),
                'output'
            )
        ],

        // Define workflow steps
        steps: [
            {
                step_id: uuidv4() as WorkflowStepId,
                workflow_id: workflowId,
                label: 'Analyze Question',
                description: 'Analyze the original question for clarity and specificity',
                step_type: WorkflowStepType.ACTION,
                tool_id: 'question_analyzer_tool',
                parameter_mappings: {
                    ['question' as ToolParameterName]: WORKFLOW_VARIABLES.ORIGINAL_QUESTION
                },
                output_mappings: {
                    ['analysis' as ToolOutputName]: 'question_analysis' as WorkflowVariableName
                },
                sequence_number: 1,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                step_id: uuidv4() as WorkflowStepId,
                workflow_id: workflowId,
                label: 'Improve Question',
                description: 'Generate an improved version of the question',
                step_type: WorkflowStepType.ACTION,
                tool_id: 'question_improver_tool',
                parameter_mappings: {
                    ['original_question' as ToolParameterName]: WORKFLOW_VARIABLES.ORIGINAL_QUESTION,
                    ['analysis' as ToolParameterName]: 'question_analysis' as WorkflowVariableName
                },
                output_mappings: {
                    ['improved_question' as ToolOutputName]: WORKFLOW_VARIABLES.IMPROVED_QUESTION,
                    ['confidence' as ToolOutputName]: WORKFLOW_VARIABLES.QUESTION_IMPROVEMENT_CONFIDENCE,
                    ['feedback' as ToolOutputName]: WORKFLOW_VARIABLES.QUESTION_IMPROVEMENT_FEEDBACK
                },
                sequence_number: 2,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                step_id: uuidv4() as WorkflowStepId,
                workflow_id: workflowId,
                label: 'Track Iterations',
                description: 'Track the number of iterations performed',
                step_type: WorkflowStepType.ACTION,
                tool_id: 'iteration_tracker_tool',
                parameter_mappings: {},
                output_mappings: {
                    ['iterations' as ToolOutputName]: WORKFLOW_VARIABLES.QUESTION_IMPROVEMENT_ITERATIONS
                },
                sequence_number: 3,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        ]
    };

    return workflow;
}; 