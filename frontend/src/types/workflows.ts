import { Tool, ToolParameterName, ToolOutputName } from './tools';
import { Schema, Variable, ValueType, SchemaValueType } from './schema';
import { EvaluationCondition, EvaluationConfig, EvaluationOperator, EvaluationResult, EvaluationOutputs } from './evaluation';

export enum WorkflowStatus {
    DRAFT = 'DRAFT',
    PUBLISHED = 'PUBLISHED',
    ARCHIVED = 'ARCHIVED'
}

export enum WorkflowStepType {
    ACTION = 'ACTION',
    INPUT = 'INPUT',
    EVALUATION = 'EVALUATION'
}

// Operation types for variable assignments
export enum VariableOperationType {
    ASSIGN = 'assign',
    APPEND = 'append'
}

// Type-safe workflow variable references
export type WorkflowVariableName = string & { readonly __brand: unique symbol };

// Enhanced output mapping with operation type
export interface EnhancedOutputMapping {
    variable: WorkflowVariableName;
    operation: VariableOperationType;
}

// Execution result for runtime steps
export interface StepExecutionResult {
    success: boolean;
    error?: string;
    outputs?: Record<WorkflowVariableName, SchemaValueType>;
    inputs?: Record<ToolParameterName, SchemaValueType>;
    updatedState?: WorkflowVariable[];  // Optional updated workflow state
}

// Workflow variable extends base Variable with I/O type and required flag
export interface WorkflowVariable extends Omit<Variable, 'name'> {
    name: WorkflowVariableName;  // Reference name in workflow context
    io_type: 'input' | 'output' | 'evaluation';
    // Required flag only applies to inputs and defaults to true
    required?: boolean;
}

// Branded type for workflow step IDs
export type WorkflowStepId = string & { readonly __brand: unique symbol };

// Workflow step definition
export interface WorkflowStep {
    step_id: WorkflowStepId;
    workflow_id: string;
    label: string;
    description: string;
    step_type: WorkflowStepType;
    tool?: Tool;
    tool_id?: string;
    parameter_mappings?: Record<ToolParameterName, WorkflowVariableName>;
    output_mappings?: Record<ToolOutputName, WorkflowVariableName | EnhancedOutputMapping>;
    evaluation_config?: EvaluationConfig;
    sequence_number: number;
    created_at: string;
    updated_at: string;
    prompt_template_id?: string;
}

// Helper functions to work with workflow state
export const getWorkflowInputs = (workflow: Workflow): WorkflowVariable[] => {
    return workflow.state?.filter(v => v.io_type === 'input') ?? [];
};

export const getWorkflowOutputs = (workflow: Workflow): WorkflowVariable[] => {
    return workflow.state?.filter(v => v.io_type === 'output') ?? [];
};

export const addWorkflowVariable = (
    workflow: Workflow,
    variable: WorkflowVariable
): Workflow => {
    return {
        ...workflow,
        state: [...(workflow.state ?? []), variable]
    };
};

// Complete workflow definition
export interface Workflow {
    workflow_id: string;
    name: string;
    description?: string;
    status: WorkflowStatus;
    error?: string;
    created_at?: string;
    updated_at?: string;
    // Combined state array containing both inputs and outputs
    state?: WorkflowVariable[];
    steps: WorkflowStep[];
    nextStepIndex?: number; // The index of the next step to execute (may not be sequential if jumps occur)
}

// Default workflow with empty arrays
export const DEFAULT_WORKFLOW: Workflow = {
    workflow_id: '',
    name: 'Untitled Workflow',
    description: 'A new custom workflow',
    status: WorkflowStatus.DRAFT,
    steps: [],
    state: []
};

// Helper function to create a workflow variable with type safety
export const createWorkflowVariable = (
    variable_id: string,
    name: string,
    schema: Schema,
    io_type: WorkflowVariable['io_type'],
    required: boolean = true
): WorkflowVariable => ({
    variable_id,
    name: name as WorkflowVariableName,
    schema,
    io_type,
    ...(io_type === 'input' ? { required } : {})
});

// Helper function to create an array schema
export const createArraySchema = (
    itemType: ValueType,
    description?: string
): Schema => ({
    type: itemType,
    description,
    is_array: true
});

// Helper function to create a basic schema
export const createBasicSchema = (
    type: ValueType,
    description?: string
): Schema => ({
    type,
    description,
    is_array: false
});

// Validation utilities
export const isWorkflowInput = (
    variable: WorkflowVariable
): variable is WorkflowVariable & { io_type: 'input'; required: boolean } => {
    return variable.io_type === 'input';
};

export const isWorkflowOutput = (
    variable: WorkflowVariable
): variable is WorkflowVariable & { io_type: 'output' } => {
    return variable.io_type === 'output';
};

// Type guard for LLM steps
export const isLLMStep = (step: WorkflowStep): step is WorkflowStep & { tool: Tool & { tool_type: 'llm' } } => {
    return step.tool?.tool_type === 'llm';
};

// Helper function to check if a mapping is an enhanced mapping
export const isEnhancedMapping = (mapping: WorkflowVariableName | EnhancedOutputMapping): mapping is EnhancedOutputMapping => {
    return typeof mapping === 'object' && 'variable' in mapping && 'operation' in mapping;
};

// Helper function to get the variable name from a mapping
export const getVariableNameFromMapping = (mapping: WorkflowVariableName | EnhancedOutputMapping): WorkflowVariableName => {
    if (isEnhancedMapping(mapping)) {
        return mapping.variable;
    }
    return mapping;
};

// Helper function to get the operation from a mapping
export const getOperationFromMapping = (mapping: WorkflowVariableName | EnhancedOutputMapping): VariableOperationType => {
    if (isEnhancedMapping(mapping)) {
        return mapping.operation;
    }
    return VariableOperationType.ASSIGN; // Default to assign
};

