import { Schema, ValueType, Variable } from '../types/schemas';
import { WorkflowVariableName } from '../types/workflows';

/**
 * Create a workflow variable
 */
export const createWorkflowVariable = (
    variable_id: string,
    name: WorkflowVariableName | string,
    schema: Schema,
    io_type: 'input' | 'output' | 'evaluation',
    required: boolean = true
): Variable & { name: WorkflowVariableName; io_type: 'input' | 'output' | 'evaluation'; required?: boolean } => {
    return {
        variable_id,
        name: name as WorkflowVariableName,
        schema,
        io_type,
        required
    };
};

/**
 * Create a basic schema for a workflow variable
 */
export const createBasicSchema = (
    type: ValueType,
    description?: string
): Schema => {
    return {
        type,
        description: description || `A ${type} value`
    };
};

/**
 * Create an array schema for a workflow variable
 */
export const createArraySchema = (
    itemType: ValueType,
    description?: string
): Schema => {
    return {
        type: 'array',
        items: {
            type: itemType
        },
        description: description || `An array of ${itemType} values`
    };
};

/**
 * Create an object schema for a workflow variable
 */
export const createObjectSchema = (
    properties: Record<string, Schema>,
    description?: string,
    required?: string[]
): Schema => {
    return {
        type: 'object',
        properties,
        required,
        description: description || 'An object value'
    };
}; 