import { v4 as uuidv4 } from 'uuid';
import { AgentWorkflow, AgentWorkflowType, WORKFLOW_VARIABLES } from '../../../../types/agent-workflows';
import { WorkflowStatus, WorkflowStepId, WorkflowStepType, WorkflowVariableName, EvaluationCondition, EvaluationConfig } from '../../../../types/workflows';
import { createBasicSchema, createWorkflowVariable, createObjectSchema } from '../../../../utils/workflowUtils';
import { ToolOutputName, ToolParameterName, Tool } from '../../../../types/tools';

// Define custom workflow variables
const ORIGINAL_QUESTION = 'original_question' as WorkflowVariableName;
const IMPROVED_QUESTION = 'improved_question' as WorkflowVariableName;
const EVALUATION_RESULT = 'evaluation_result' as WorkflowVariableName;
const EVALUATION_FEEDBACK = 'evaluation_feedback' as WorkflowVariableName;
const NEEDS_IMPROVEMENT = 'needs_improvement' as WorkflowVariableName;
const CONFIDENCE_SCORE = 'confidence_score' as WorkflowVariableName;
const FIELD_LIST = 'field_list' as WorkflowVariableName;

// Define a constant for the prompt template IDs
const QUESTION_IMPROVER_TEMPLATE = 'question-improver' as WorkflowVariableName;
const QUESTION_EVALUATOR_TEMPLATE = 'question-improvement-evaluator' as WorkflowVariableName;

/**
 * Creates a Question Development workflow
 */
export const createQuestionDevelopmentWorkflow = (): AgentWorkflow => {
    const workflowId = uuidv4();

    // Define tool objects
    const llmTool: Tool = {
        tool_id: 'llm',
        name: 'Language Model',
        description: 'Executes prompts using a language model',
        tool_type: 'llm',
        signature: {
            parameters: [

                {
                    name: 'question' as ToolParameterName,
                    description: 'Value for {{question}} in the prompt',
                    schema: {
                        type: 'string',
                        is_array: false,
                        description: 'Question to improve'
                    },
                    required: true
                }
            ],
            outputs: [
                {
                    name: 'response' as ToolOutputName,
                    description: 'Improved question with explanation',
                    schema: {
                        type: 'object',
                        is_array: false,
                        description: 'Improved question with explanation',
                        fields: {
                            improvedQuestion: {
                                type: 'string',
                                is_array: false,
                                description: 'The improved version of the question'
                            },
                            explanation: {
                                type: 'string',
                                is_array: false,
                                description: 'Explanation of the improvements made'
                            }
                        }
                    }
                }
            ]
        }
    };

    const llmEvalTool: Tool = {
        tool_id: 'llm',
        name: 'Language Model',
        description: 'Executes prompts using a language model',
        tool_type: 'llm',
        signature: {
            parameters: [
                {
                    name: 'prompt_template_id' as ToolParameterName,
                    description: 'ID of the prompt template to use',
                    schema: {
                        type: 'string',
                        is_array: false,
                        description: 'Prompt template ID'
                    },
                    required: true,
                    default: 'question-improvement-evaluator'
                },
                {
                    name: 'originalQuestion' as ToolParameterName,
                    description: 'Value for {{originalQuestion}} in the prompt',
                    schema: {
                        type: 'string',
                        is_array: false,
                        description: 'Original question from user'
                    },
                    required: true
                },
                {
                    name: 'improvedQuestion' as ToolParameterName,
                    description: 'Value for {{improvedQuestion}} in the prompt',
                    schema: {
                        type: 'string',
                        is_array: false,
                        description: 'Improved version of the question'
                    },
                    required: true
                }
            ],
            outputs: [
                {
                    name: 'response' as ToolOutputName,
                    description: 'Evaluation of question improvement',
                    schema: {
                        type: 'object',
                        is_array: false,
                        description: 'Evaluation of question improvement',
                        fields: {
                            confidenceScore: {
                                type: 'number',
                                is_array: false,
                                description: 'Confidence score between 0 and 1'
                            },
                            evaluation: {
                                type: 'string',
                                is_array: false,
                                description: 'Detailed evaluation of the improvement'
                            }
                        }
                    }
                }
            ]
        }
    };

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
            // Input variable - original question from user
            createWorkflowVariable(
                uuidv4(),
                ORIGINAL_QUESTION,
                createBasicSchema('string', 'The original question from the user', false),
                'input',
                true
            ),

            // Output variable - improved question
            createWorkflowVariable(
                uuidv4(),
                IMPROVED_QUESTION,
                createBasicSchema('string', 'The improved version of the question', false),
                'output'
            ),

            // Output variable - evaluation feedback
            createWorkflowVariable(
                uuidv4(),
                EVALUATION_FEEDBACK,
                createBasicSchema('string', 'Feedback on the question improvement', false),
                'output'
            ),

            // Output variable - confidence score
            createWorkflowVariable(
                uuidv4(),
                CONFIDENCE_SCORE,
                createBasicSchema('number', 'Confidence score for the question improvement', false),
                'output'
            ),

            // Output variable - needs improvement flag
            createWorkflowVariable(
                uuidv4(),
                NEEDS_IMPROVEMENT,
                createBasicSchema('boolean', 'Whether the question needs further improvement', false),
                'output'
            ),

            // Field list for extraction
            createWorkflowVariable(
                uuidv4(),
                FIELD_LIST,
                createBasicSchema('string', 'List of fields to extract', false),
                'input',
                true
            ),

            // Output variable - evaluation result (JSON object)
            createWorkflowVariable(
                uuidv4(),
                EVALUATION_RESULT,
                createObjectSchema({
                    confidenceScore: createBasicSchema('number', 'Confidence score between 0 and 1'),
                    evaluation: createBasicSchema('string', 'Detailed evaluation of the improvement'),
                    needsMoreImprovement: createBasicSchema('boolean', 'Whether the question needs further improvement')
                }, 'Evaluation of the question improvement'),
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
                tool: llmTool, // Include the complete tool object
                prompt_template_id: 'question-improver', // Reference to the prompt template
                parameter_mappings: {
                    ['prompt_template_id' as ToolParameterName]: QUESTION_IMPROVER_TEMPLATE,
                    ['question' as ToolParameterName]: ORIGINAL_QUESTION
                },
                output_mappings: {
                    ['response.improvedQuestion' as ToolOutputName]: IMPROVED_QUESTION,
                    ['response.explanation' as ToolOutputName]: EVALUATION_FEEDBACK
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
                tool: llmEvalTool, // Include the complete tool object
                prompt_template_id: 'question-improvement-evaluator', // Reference to the evaluation prompt template
                parameter_mappings: {
                    ['prompt_template_id' as ToolParameterName]: QUESTION_EVALUATOR_TEMPLATE,
                    ['originalQuestion' as ToolParameterName]: ORIGINAL_QUESTION,
                    ['improvedQuestion' as ToolParameterName]: IMPROVED_QUESTION
                },
                output_mappings: {
                    ['response' as ToolOutputName]: EVALUATION_RESULT,
                    ['response.confidenceScore' as ToolOutputName]: CONFIDENCE_SCORE,
                    ['response.evaluation' as ToolOutputName]: EVALUATION_FEEDBACK
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
                description: 'Check if the confidence score meets the threshold or needs more improvement',
                step_type: WorkflowStepType.EVALUATION,
                parameter_mappings: {}, // Empty but required
                output_mappings: {}, // Empty but required
                evaluation_config: {
                    conditions: [
                        {
                            condition_id: uuidv4(),
                            variable: CONFIDENCE_SCORE as WorkflowVariableName,
                            operator: 'less_than',
                            value: 0.7,
                            target_step_index: 0, // Go back to the first step if more improvement is needed
                        }
                    ],
                    default_action: 'continue',
                    maximum_jumps: 3 // Maximum number of improvement iterations
                } as EvaluationConfig,
                sequence_number: 3,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }
        ]
    };

    return workflow;
}; 