import { v4 as uuidv4 } from 'uuid';
import { AgentWorkflow, AgentWorkflowType, WORKFLOW_VARIABLES } from '../../../../types/agent-workflows';
import { WorkflowStatus, WorkflowStepId, WorkflowStepType, WorkflowVariableName, EvaluationCondition, EvaluationConfig } from '../../../../types/workflows';
import { createBasicSchema, createWorkflowVariable, createObjectSchema } from '../../../../utils/workflowUtils';
import { ToolOutputName, ToolParameterName, Tool } from '../../../../types/tools';

// Define custom workflow variables
const ORIGINAL_QUESTION = 'original_question' as WorkflowVariableName;
const IMPROVED_QUESTION_OBJECT = 'improved_question_object' as WorkflowVariableName;
const IMPROVED_QUESTION_PROPERTY = 'improved_question_object.improvedQuestion' as WorkflowVariableName;
const QUESTION_EVAL_OBJECT = 'question_eval_object' as WorkflowVariableName;
const CONFIDENCE_SCORE = 'question_eval_object.confidenceScore' as WorkflowVariableName;

// Define a constant for the prompt template IDs
const QUESTION_IMPROVER_TEMPLATE_ID = 'question-improver';
const QUESTION_EVALUATOR_TEMPLATE_ID = 'question-improvement-evaluator';

/**
 * Creates a Question Development workflow
 */
export const createQuestionDevelopmentWorkflow = (): AgentWorkflow => {
    const workflowId = uuidv4();

    // Define tool objects
    const questionImproverTool: Tool = {
        tool_id: 'llm',
        name: 'Question Improver LLM',
        description: 'Improves a question using a language model',
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

    const questionEvaluatorTool: Tool = {
        tool_id: 'llm',
        name: 'Question Evaluator LLM',
        description: 'Evaluates question improvements using a language model',
        tool_type: 'llm',
        signature: {
            parameters: [
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

            // Output variable - improved question object (matches Question Improver template output)
            createWorkflowVariable(
                uuidv4(),
                IMPROVED_QUESTION_OBJECT,
                createObjectSchema({
                    improvedQuestion: createBasicSchema('string', 'The improved version of the question'),
                    explanation: createBasicSchema('string', 'Explanation of the improvements made')
                }, 'Improved question with explanation'),
                'output'
            ),

            // Output variable - question evaluation object (matches Question Improvement Eval template output)
            createWorkflowVariable(
                uuidv4(),
                QUESTION_EVAL_OBJECT,
                createObjectSchema({
                    confidenceScore: createBasicSchema('number', 'Confidence score between 0 and 1'),
                    evaluation: createBasicSchema('string', 'Detailed evaluation of the improvement')
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
                tool: questionImproverTool, // Include the complete tool object
                prompt_template_id: QUESTION_IMPROVER_TEMPLATE_ID, // Reference to the prompt template
                parameter_mappings: {
                    ['question' as ToolParameterName]: ORIGINAL_QUESTION
                },
                output_mappings: {
                    ['response' as ToolOutputName]: IMPROVED_QUESTION_OBJECT
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
                tool: questionEvaluatorTool, // Include the complete tool object
                prompt_template_id: QUESTION_EVALUATOR_TEMPLATE_ID, // Reference to the evaluation prompt template
                parameter_mappings: {
                    ['originalQuestion' as ToolParameterName]: ORIGINAL_QUESTION,
                    ['improvedQuestion' as ToolParameterName]: IMPROVED_QUESTION_PROPERTY
                },
                output_mappings: {
                    ['response' as ToolOutputName]: QUESTION_EVAL_OBJECT
                },
                sequence_number: 2,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },

            // Step 3: Check Confidence Score
            {
                step_id: uuidv4() as WorkflowStepId,
                workflow_id: workflowId,
                label: 'Check Confidence Score',
                description: 'Check if the confidence score meets the threshold or needs more improvement',
                step_type: WorkflowStepType.EVALUATION,
                parameter_mappings: {}, // Empty but required
                output_mappings: {}, // Empty but required
                evaluation_config: {
                    conditions: [
                        {
                            condition_id: uuidv4(),
                            variable: CONFIDENCE_SCORE,
                            operator: 'less_than',
                            value: 0.7, // Threshold for confidence score
                            target_step_index: 0, // Jump back to step 1 (index 0) if confidence is too low
                        }
                    ],
                    default_action: 'continue', // Continue to the next step if all conditions fail
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