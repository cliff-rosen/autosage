import { Workflow, WorkflowVariableName, } from './workflows';
import { createWorkflowFromTemplate, workflowTemplates as templates, workflowTemplates } from './workflow-templates';

/**
 * Enum defining the types of agent workflows
 */
export enum AgentWorkflowType {
    QUESTION_DEVELOPMENT = 'QUESTION_DEVELOPMENT',
    KNOWLEDGE_BASE_DEVELOPMENT = 'KNOWLEDGE_BASE_DEVELOPMENT',
    ANSWER_GENERATION = 'ANSWER_GENERATION',
    COMPLETE_AGENT_WORKFLOW = 'COMPLETE_AGENT_WORKFLOW'
}

/**
 * Interface extending the base Workflow with agent-specific properties
 */
export interface AgentWorkflow extends Workflow {
    agent_workflow_type: string;
    max_iterations?: number;
    confidence_threshold?: number;
}



/**
 * Interface for a workflow phase in a chain
 */
export interface WorkflowPhase {
    id: string;
    type: AgentWorkflowType;
    label: string;
    description: string;
    workflow: () => Promise<AgentWorkflow> | AgentWorkflow;
    inputs_mappings: Record<WorkflowVariableName, WorkflowVariableName>;
    outputs_mappings: Record<WorkflowVariableName, WorkflowVariableName>;
}

/**
 * Interface for a collection of workflows to be executed in sequence
 */
export interface AgentWorkflowChain {
    id: string;
    name: string;
    description: string;
    phases: WorkflowPhase[];
    state?: Record<string, any>; // For now, keeping as Record for backward compatibility
}


/**
 * Simplified agent workflow chain using sample workflow templates
 */
export const SAMPLE_WORKFLOW_CHAIN: AgentWorkflowChain = {
    id: 'sample_workflow_chain',
    name: 'Sample Workflow Chain',
    description: 'Simple workflow chain using our sample workflow templates',
    phases: [
        {
            id: 'echo_phase',
            type: AgentWorkflowType.QUESTION_DEVELOPMENT,
            label: 'Echo Input',
            description: 'Simple echo of the input',
            workflow: () => createWorkflowFromTemplate('echo') as AgentWorkflow,
            inputs_mappings: {
            },
            outputs_mappings: {
            }
        },
        {
            id: 'search_phase',
            type: AgentWorkflowType.KNOWLEDGE_BASE_DEVELOPMENT,
            label: 'Search Information',
            description: 'Search for information based on the input',
            workflow: () => createWorkflowFromTemplate('search') as AgentWorkflow,
            inputs_mappings: {
            },
            outputs_mappings: {
            }
        },
        {
            id: 'transform_phase',
            type: AgentWorkflowType.ANSWER_GENERATION,
            label: 'Transform Data',
            description: 'Process and transform the data from previous phases',
            workflow: () => createWorkflowFromTemplate('data-transformation') as AgentWorkflow,
            inputs_mappings: {
            },
            outputs_mappings: {
            }
        }
    ],
    state: [
        // Input variable - question from user
        {
            variable_id: 'input1',
            name: 'input1',
            schema: {
                type: 'string',
                is_array: false,
                description: 'The input question from the user'
            },
            value: '',
            io_type: 'input',
            required: true
        },
        // Echo output
        {
            variable_id: 'output1',
            name: 'output1',
            schema: {
                type: 'string',
                is_array: false,
                description: 'The echoed output from the first phase'
            },
            value: '',
            io_type: 'output'
        },
        // Search results
        {
            variable_id: 'output2',
            name: 'output2',
            schema: {
                type: 'string',
                is_array: false,
                description: 'The search results from the second phase'
            },
            value: '',
            io_type: 'output'
        },
        // Final output
        {
            variable_id: 'output3',
            name: 'output3',
            schema: {
                type: 'string',
                is_array: false,
                description: 'The final processed result from the third phase'
            },
            value: '',
            io_type: 'output'
        }
    ]
}; 