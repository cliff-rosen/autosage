import {
    Workflow,
    WorkflowStatus,
    WorkflowStepType,
    WorkflowStepId,
    WorkflowVariableName,
    VariableOperationType
} from './workflows';
import { ToolParameterName, ToolOutputName } from './tools';

// Helper function to create typed string literals for branded types
const asStepId = (id: string): WorkflowStepId => id as unknown as WorkflowStepId;
const asVarName = (name: string): WorkflowVariableName => name as unknown as WorkflowVariableName;
const asParamName = (name: string): ToolParameterName => name as unknown as ToolParameterName;
const asOutputName = (name: string): ToolOutputName => name as unknown as ToolOutputName;

// Define the Echo workflow template (previously oneStepWorkflow)
export const echoWorkflowTemplate: Workflow = {
    workflow_id: "template-echo",
    name: "Echo Workflow",
    description: "A simple workflow that echoes the input",
    status: WorkflowStatus.DRAFT,
    user_id: 1,
    error: undefined,
    created_at: "2025-03-12T01:04:58",
    updated_at: "2025-03-13T04:04:19",
    steps: [
        {
            label: "Echo",
            description: "Echoes back the input",
            step_type: WorkflowStepType.ACTION,
            tool_id: "echo",
            prompt_template_id: undefined,
            parameter_mappings: {
                [asParamName("input")]: asVarName("input")
            },
            output_mappings: {
                [asOutputName("output")]: asVarName("output")
            },
            evaluation_config: {
                conditions: [],
                default_action: "continue",
                maximum_jumps: 1
            },
            step_id: asStepId("5a531329-3aad-4dd5-9012-eaae18eeb7f8"),
            workflow_id: "template-echo",
            sequence_number: 0,
            created_at: "2025-03-13T04:04:19",
            updated_at: "2025-03-13T04:04:19",
            tool: {
                tool_id: "echo",
                name: "Echo Tool",
                description: "Echoes back the input with a prefix",
                tool_type: "utility",
                signature: {
                    parameters: [
                        {
                            name: asParamName("input"),
                            description: "The input to echo",
                            schema: {
                                type: "string",
                                is_array: false
                            }
                        },
                        {
                            name: asParamName("stringify"),
                            description: "Whether to convert objects to JSON strings",
                            schema: {
                                type: "boolean",
                                is_array: false
                            }
                        }
                    ],
                    outputs: [
                        {
                            name: asOutputName("output"),
                            description: "The echoed output",
                            schema: {
                                type: "string",
                                is_array: false
                            }
                        }
                    ]
                }
            }
        }
    ],
    state: [
        {
            name: asVarName("input"),
            schema: {
                type: "string",
                description: "Input text",
                is_array: false,
                fields: {},
                format: undefined,
                content_types: undefined
            },
            io_type: "input",
            variable_id: "var_1741741493436",
            workflow_id: "template-echo",
            created_at: "2025-03-13T04:04:19",
            updated_at: "2025-03-13T04:04:19",
            value: ""
        },
        {
            name: asVarName("output"),
            schema: {
                type: "string",
                description: "Output text",
                is_array: false,
                fields: {},
                format: undefined,
                content_types: undefined
            },
            io_type: "output",
            variable_id: "var_1741741495778",
            workflow_id: "template-echo",
            created_at: "2025-03-13T04:04:19",
            updated_at: "2025-03-13T04:04:19",
            value: ""
        }
    ]
};

// Define the Concatenate workflow template (previously twoStepWorkflow)
export const concatenateWorkflowTemplate: Workflow = {
    workflow_id: "template-concatenate",
    name: "Concatenate Workflow",
    description: "A workflow that echoes the input and then concatenates it with itself",
    status: WorkflowStatus.DRAFT,
    user_id: 1,
    error: undefined,
    created_at: "2025-03-12T01:04:58",
    updated_at: "2025-03-13T04:04:19",
    steps: [
        {
            label: "Echo",
            description: "First step - echo the input",
            step_type: WorkflowStepType.ACTION,
            tool_id: "echo",
            prompt_template_id: undefined,
            parameter_mappings: {
                [asParamName("input")]: asVarName("input")
            },
            output_mappings: {
                [asOutputName("output")]: asVarName("output")
            },
            evaluation_config: {
                conditions: [],
                default_action: "continue",
                maximum_jumps: 1
            },
            step_id: asStepId("5a531329-3aad-4dd5-9012-eaae18eeb7f8"),
            workflow_id: "template-concatenate",
            sequence_number: 0,
            created_at: "2025-03-13T04:04:19",
            updated_at: "2025-03-13T04:04:19",
            tool: {
                tool_id: "echo",
                name: "Echo Tool",
                description: "Echoes back the input with a prefix",
                tool_type: "utility",
                signature: {
                    parameters: [
                        {
                            name: asParamName("input"),
                            description: "The input to echo",
                            schema: {
                                type: "string",
                                is_array: false
                            }
                        },
                        {
                            name: asParamName("stringify"),
                            description: "Whether to convert objects to JSON strings",
                            schema: {
                                type: "boolean",
                                is_array: false
                            }
                        }
                    ],
                    outputs: [
                        {
                            name: asOutputName("output"),
                            description: "The echoed output",
                            schema: {
                                type: "string",
                                is_array: false
                            }
                        }
                    ]
                }
            }
        },
        {
            label: "Concatenate",
            description: "Second step - concatenate the input with the output from the first step",
            step_type: WorkflowStepType.ACTION,
            tool_id: "concatenate",
            prompt_template_id: undefined,
            parameter_mappings: {
                [asParamName("first")]: asVarName("input"),
                [asParamName("second")]: asVarName("output")
            },
            output_mappings: {
                [asOutputName("result")]: asVarName("result")
            },
            evaluation_config: {
                conditions: [],
                default_action: "continue",
                maximum_jumps: 1
            },
            step_id: asStepId("280caa38-af60-4da5-94e9-1b7aaa8e5d8f"),
            workflow_id: "template-concatenate",
            sequence_number: 1,
            created_at: "2025-03-13T04:04:19",
            updated_at: "2025-03-13T04:04:19",
            tool: {
                tool_id: "concatenate",
                name: "Concatenate Tool",
                description: "Concatenates two strings",
                tool_type: "utility",
                signature: {
                    parameters: [
                        {
                            name: asParamName("first"),
                            description: "First string",
                            schema: {
                                type: "string",
                                is_array: false
                            }
                        },
                        {
                            name: asParamName("second"),
                            description: "Second string",
                            schema: {
                                type: "string",
                                is_array: false
                            }
                        }
                    ],
                    outputs: [
                        {
                            name: asOutputName("result"),
                            description: "Concatenated result",
                            schema: {
                                type: "string",
                                is_array: false
                            }
                        }
                    ]
                }
            }
        }
    ],
    state: [
        {
            name: asVarName("input"),
            schema: {
                type: "string",
                description: "Input text",
                is_array: false,
                fields: {},
                format: undefined,
                content_types: undefined
            },
            io_type: "input",
            variable_id: "var_1741741493436",
            workflow_id: "template-concatenate",
            created_at: "2025-03-13T04:04:19",
            updated_at: "2025-03-13T04:04:19",
            value: ""
        },
        {
            name: asVarName("output"),
            schema: {
                type: "string",
                description: "Output from echo step",
                is_array: false,
                fields: {},
                format: undefined,
                content_types: undefined
            },
            io_type: "output",
            variable_id: "var_1741741495778",
            workflow_id: "template-concatenate",
            created_at: "2025-03-13T04:04:19",
            updated_at: "2025-03-13T04:04:19",
            value: ""
        },
        {
            name: asVarName("result"),
            schema: {
                type: "string",
                description: "Final concatenated result",
                is_array: false,
                fields: {},
                format: undefined,
                content_types: undefined
            },
            io_type: "output",
            variable_id: "var_1741838655485",
            workflow_id: "template-concatenate",
            created_at: "2025-03-13T04:04:19",
            updated_at: "2025-03-13T04:04:19",
            value: ""
        }
    ]
};

// Create an array of all workflow templates
export interface WorkflowTemplate {
    id: string;
    name: string;
    description: string;
    workflow: Workflow;
}

// Define a text processing workflow template (2 steps)
export const textProcessingWorkflowTemplate: Workflow = {
    workflow_id: "template-text-processing",
    name: "Search Workflow",
    description: "A workflow that searches for information and then echoes the result",
    status: WorkflowStatus.DRAFT,
    user_id: 1,
    error: undefined,
    created_at: "2025-03-12T01:04:58",
    updated_at: "2025-03-13T04:04:19",
    steps: [
        {
            label: "Search for Information",
            description: "First step - search for information based on the input",
            step_type: WorkflowStepType.ACTION,
            tool_id: "search",
            prompt_template_id: undefined,
            parameter_mappings: {
                [asParamName("query")]: asVarName("input")
            },
            output_mappings: {
                [asOutputName("results")]: asVarName("processed_text")
            },
            evaluation_config: {
                conditions: [],
                default_action: "continue",
                maximum_jumps: 1
            },
            step_id: asStepId("6b642430-af60-4da5-94e9-1b7aaa8e5d8f"),
            workflow_id: "template-text-processing",
            sequence_number: 0,
            created_at: "2025-03-13T04:04:19",
            updated_at: "2025-03-13T04:04:19",
            tool: {
                tool_id: "search",
                name: "Search Tool",
                description: "Search for information on the web",
                tool_type: "search",
                signature: {
                    parameters: [
                        {
                            name: asParamName("query"),
                            description: "The search query",
                            schema: {
                                type: "string",
                                is_array: false
                            }
                        }
                    ],
                    outputs: [
                        {
                            name: asOutputName("results"),
                            description: "The search results",
                            schema: {
                                type: "string",
                                is_array: false
                            }
                        }
                    ]
                }
            }
        },
        {
            label: "Echo Result",
            description: "Second step - echo the search results",
            step_type: WorkflowStepType.ACTION,
            tool_id: "echo",
            prompt_template_id: undefined,
            parameter_mappings: {
                [asParamName("input")]: asVarName("processed_text")
            },
            output_mappings: {
                [asOutputName("output")]: asVarName("final_output")
            },
            evaluation_config: {
                conditions: [],
                default_action: "continue",
                maximum_jumps: 1
            },
            step_id: asStepId("7c753541-bf71-5eb6-a5f0-2c8bbb9e6d9g"),
            workflow_id: "template-text-processing",
            sequence_number: 1,
            created_at: "2025-03-13T04:04:19",
            updated_at: "2025-03-13T04:04:19",
            tool: {
                tool_id: "echo",
                name: "Echo Tool",
                description: "Echoes back the input with a prefix",
                tool_type: "utility",
                signature: {
                    parameters: [
                        {
                            name: asParamName("input"),
                            description: "The input to echo",
                            schema: {
                                type: "string",
                                is_array: false
                            }
                        },
                        {
                            name: asParamName("stringify"),
                            description: "Whether to convert objects to JSON strings",
                            schema: {
                                type: "boolean",
                                is_array: false
                            }
                        }
                    ],
                    outputs: [
                        {
                            name: asOutputName("output"),
                            description: "The echoed output",
                            schema: {
                                type: "string",
                                is_array: false
                            }
                        }
                    ]
                }
            }
        }
    ],
    state: [
        {
            name: asVarName("input"),
            schema: {
                type: "string",
                description: "Search query",
                is_array: false,
                fields: {},
                format: undefined,
                content_types: undefined
            },
            io_type: "input",
            variable_id: "var_1741741493436",
            workflow_id: "template-text-processing",
            created_at: "2025-03-13T04:04:19",
            updated_at: "2025-03-13T04:04:19",
            value: ""
        },
        {
            name: asVarName("processed_text"),
            schema: {
                type: "string",
                description: "Search results",
                is_array: true,
                fields: {},
                format: undefined,
                content_types: undefined
            },
            io_type: "output",
            variable_id: "var_1741741495778",
            workflow_id: "template-text-processing",
            created_at: "2025-03-13T04:04:19",
            updated_at: "2025-03-13T04:04:19",
            value: ""
        },
        {
            name: asVarName("final_output"),
            schema: {
                type: "string",
                description: "Final output text",
                is_array: false,
                fields: {},
                format: undefined,
                content_types: undefined
            },
            io_type: "output",
            variable_id: "var_1741838655485",
            workflow_id: "template-text-processing",
            created_at: "2025-03-13T04:04:19",
            updated_at: "2025-03-13T04:04:19",
            value: ""
        }
    ]
};

// Define a data transformation workflow template (3 steps)
export const dataTransformationWorkflowTemplate: Workflow = {
    workflow_id: "template-data-transformation",
    name: "Data Transformation Workflow",
    description: "A 3-step workflow that processes, transforms, and formats data",
    status: WorkflowStatus.DRAFT,
    user_id: 1,
    error: undefined,
    created_at: "2025-03-12T01:04:58",
    updated_at: "2025-03-13T04:04:19",
    steps: [
        {
            label: "Process Input",
            description: "First step - process the input data",
            step_type: WorkflowStepType.ACTION,
            tool_id: "echo",
            prompt_template_id: undefined,
            parameter_mappings: {
                [asParamName("input")]: asVarName("input")
            },
            output_mappings: {
                [asOutputName("output")]: asVarName("processed_data")
            },
            evaluation_config: {
                conditions: [],
                default_action: "continue",
                maximum_jumps: 1
            },
            step_id: asStepId("8d864652-cf82-6fc7-b6g1-3d9ccc0f7e0h"),
            workflow_id: "template-data-transformation",
            sequence_number: 0,
            created_at: "2025-03-13T04:04:19",
            updated_at: "2025-03-13T04:04:19",
            tool: {
                tool_id: "echo",
                name: "Echo Tool",
                description: "Echoes back the input with a prefix",
                tool_type: "utility",
                signature: {
                    parameters: [
                        {
                            name: asParamName("input"),
                            description: "The input to echo",
                            schema: {
                                type: "string",
                                is_array: false
                            }
                        },
                        {
                            name: asParamName("stringify"),
                            description: "Whether to convert objects to JSON strings",
                            schema: {
                                type: "boolean",
                                is_array: false
                            }
                        }
                    ],
                    outputs: [
                        {
                            name: asOutputName("output"),
                            description: "The echoed output",
                            schema: {
                                type: "string",
                                is_array: false
                            }
                        }
                    ]
                }
            }
        },
        {
            label: "Search for Related Data",
            description: "Second step - search for related information",
            step_type: WorkflowStepType.ACTION,
            tool_id: "search",
            prompt_template_id: undefined,
            parameter_mappings: {
                [asParamName("query")]: asVarName("processed_data")
            },
            output_mappings: {
                [asOutputName("results")]: asVarName("transformed_data")
            },
            evaluation_config: {
                conditions: [],
                default_action: "continue",
                maximum_jumps: 1
            },
            step_id: asStepId("9e975763-dg93-7gd8-c7h2-4e0ddd1g8f1i"),
            workflow_id: "template-data-transformation",
            sequence_number: 1,
            created_at: "2025-03-13T04:04:19",
            updated_at: "2025-03-13T04:04:19",
            tool: {
                tool_id: "search",
                name: "Search Tool",
                description: "Search for information on the web",
                tool_type: "search",
                signature: {
                    parameters: [
                        {
                            name: asParamName("query"),
                            description: "The search query",
                            schema: {
                                type: "string",
                                is_array: false
                            }
                        }
                    ],
                    outputs: [
                        {
                            name: asOutputName("results"),
                            description: "The search results",
                            schema: {
                                type: "string",
                                is_array: false
                            }
                        }
                    ]
                }
            }
        },
        {
            label: "Format Result",
            description: "Third step - format the transformed data",
            step_type: WorkflowStepType.ACTION,
            tool_id: "concatenate",
            prompt_template_id: undefined,
            parameter_mappings: {
                [asParamName("first")]: asVarName("processed_data"),
                [asParamName("second")]: asVarName("transformed_data")
            },
            output_mappings: {
                [asOutputName("result")]: asVarName("final_result")
            },
            evaluation_config: {
                conditions: [],
                default_action: "continue",
                maximum_jumps: 1
            },
            step_id: asStepId("0f086874-eh04-8he9-d8i3-5f1eee2h9g2j"),
            workflow_id: "template-data-transformation",
            sequence_number: 2,
            created_at: "2025-03-13T04:04:19",
            updated_at: "2025-03-13T04:04:19",
            tool: {
                tool_id: "concatenate",
                name: "Concatenate Tool",
                description: "Concatenates two strings",
                tool_type: "utility",
                signature: {
                    parameters: [
                        {
                            name: asParamName("first"),
                            description: "First string",
                            schema: {
                                type: "string",
                                is_array: false
                            }
                        },
                        {
                            name: asParamName("second"),
                            description: "Second string",
                            schema: {
                                type: "string",
                                is_array: false
                            }
                        }
                    ],
                    outputs: [
                        {
                            name: asOutputName("result"),
                            description: "Concatenated result",
                            schema: {
                                type: "string",
                                is_array: false
                            }
                        }
                    ]
                }
            }
        }
    ],
    state: [
        {
            name: asVarName("input"),
            schema: {
                type: "string",
                description: "Input data",
                is_array: false,
                fields: {},
                format: undefined,
                content_types: undefined
            },
            io_type: "input",
            variable_id: "var_1741741493436",
            workflow_id: "template-data-transformation",
            created_at: "2025-03-13T04:04:19",
            updated_at: "2025-03-13T04:04:19",
            value: ""
        },
        {
            name: asVarName("processed_data"),
            schema: {
                type: "string",
                description: "Processed data from first step",
                is_array: false,
                fields: {},
                format: undefined,
                content_types: undefined
            },
            io_type: "output",
            variable_id: "var_1741741495778",
            workflow_id: "template-data-transformation",
            created_at: "2025-03-13T04:04:19",
            updated_at: "2025-03-13T04:04:19",
            value: ""
        },
        {
            name: asVarName("transformed_data"),
            schema: {
                type: "string",
                description: "Search results from second step",
                is_array: false,
                fields: {},
                format: undefined,
                content_types: undefined
            },
            io_type: "output",
            variable_id: "var_1741838655485",
            workflow_id: "template-data-transformation",
            created_at: "2025-03-13T04:04:19",
            updated_at: "2025-03-13T04:04:19",
            value: ""
        },
        {
            name: asVarName("final_result"),
            schema: {
                type: "string",
                description: "Final formatted result",
                is_array: false,
                fields: {},
                format: undefined,
                content_types: undefined
            },
            io_type: "output",
            variable_id: "var_1741838655486",
            workflow_id: "template-data-transformation",
            created_at: "2025-03-13T04:04:19",
            updated_at: "2025-03-13T04:04:19",
            value: ""
        }
    ]
};

export const workflowTemplates: WorkflowTemplate[] = [
    {
        id: "echo",
        name: "Echo Workflow",
        description: "A simple workflow that echoes the input",
        workflow: echoWorkflowTemplate
    },
    {
        id: "concatenate",
        name: "Concatenate Workflow",
        description: "A workflow that echoes the input and then concatenates it with itself",
        workflow: concatenateWorkflowTemplate
    },
    {
        id: "text-processing",
        name: "Search Workflow",
        description: "A 2-step workflow that processes text with LLM and then echoes the result",
        workflow: textProcessingWorkflowTemplate
    },
    {
        id: "data-transformation",
        name: "Data Transformation Workflow",
        description: "A 3-step workflow that processes, transforms, and formats data",
        workflow: dataTransformationWorkflowTemplate
    }
];

/**
 * Get a workflow template by ID
 * @param templateId The ID of the template to get
 * @returns The workflow template or undefined if not found
 */
export function getWorkflowTemplate(templateId: string): WorkflowTemplate | undefined {
    return workflowTemplates.find(template => template.id === templateId);
}

/**
 * Create a new workflow from a template
 * @param templateId The ID of the template to use
 * @returns A new workflow based on the template with a new ID
 */
export function createWorkflowFromTemplate(templateId: string): Workflow | null {
    const template = getWorkflowTemplate(templateId);
    if (!template) return null;

    // Create a deep copy of the template workflow
    const newWorkflow: Workflow = JSON.parse(JSON.stringify(template.workflow));

    // Update IDs to make it a new workflow
    newWorkflow.workflow_id = 'new';
    newWorkflow.name = `${template.name} (Copy)`;

    // Generate new step IDs
    newWorkflow.steps = newWorkflow.steps.map(step => {
        const newStepId = asStepId(`step-${crypto.randomUUID()}`);
        step.step_id = newStepId;
        step.workflow_id = 'new';
        return step;
    });

    // Reset state values
    if (newWorkflow.state) {
        newWorkflow.state = newWorkflow.state.map(variable => {
            return {
                ...variable,
                workflow_id: 'new',
                value: undefined
            };
        });
    }

    return newWorkflow;
}