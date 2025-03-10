import {
    WorkflowStep,
    WorkflowVariable,
    WorkflowVariableName,
    EvaluationOperator,
    StepExecutionResult,
    WorkflowStepType,
    Workflow,
    WorkflowStepId,
    EvaluationResult,
    EnhancedOutputMapping,
    VariableOperationType
} from '../../types/workflows';
import { ToolParameterName, ToolOutputName, Tool } from '../../types/tools';
import { SchemaValueType, Schema } from '../../types/schema';
import { ToolEngine } from '../tool/toolEngine';
import { resolveVariablePath, parseVariablePath, setValueAtPath, resolvePropertyPath, findVariableByRootName, validatePropertyPathAgainstSchema } from '../utils/variablePathUtils';

export type StepReorderPayload = {
    reorderedSteps: WorkflowStep[];
};

/**
 * Represents an action that can be performed on the workflow state.
 * This is used to standardize all workflow state updates and ensure consistency.
 * 
 * Action types:
 * - UPDATE_PARAMETER_MAPPINGS: Updates the parameter mappings for a step
 * - UPDATE_OUTPUT_MAPPINGS: Updates the output mappings for a step
 * - UPDATE_STEP_TOOL: Updates the tool for a step
 * - UPDATE_STEP_TYPE: Updates the type of a step
 * - ADD_STEP: Adds a new step to the workflow
 * - REORDER_STEPS: Reorders the steps in the workflow
 * - DELETE_STEP: Deletes a step from the workflow
 * - UPDATE_STATE: Updates the workflow state variables
 * - RESET_EXECUTION: Resets the execution state of the workflow
 * - UPDATE_WORKFLOW: Updates the workflow properties
 * - UPDATE_STEP: Updates a step in the workflow
 * - RESET_WORKFLOW_STATE: Resets the workflow state, optionally keeping jump counters
 */
export type WorkflowStateAction = {
    type: 'UPDATE_PARAMETER_MAPPINGS' | 'UPDATE_OUTPUT_MAPPINGS' | 'UPDATE_STEP_TOOL' | 'UPDATE_STEP_TYPE' | 'ADD_STEP' | 'REORDER_STEPS' | 'DELETE_STEP' | 'UPDATE_STATE' | 'RESET_EXECUTION' | 'UPDATE_WORKFLOW' | 'UPDATE_STEP' | 'RESET_WORKFLOW_STATE',
    payload: {
        stepId?: string,
        mappings?: Record<ToolParameterName, WorkflowVariableName> | Record<ToolOutputName, WorkflowVariableName | EnhancedOutputMapping>,
        tool?: Tool,
        newStep?: WorkflowStep,
        reorder?: StepReorderPayload,
        state?: WorkflowVariable[],
        workflowUpdates?: Partial<Workflow>,
        step?: WorkflowStep,
        keepJumpCounters?: boolean
    }
};

const APPEND_DELIMITER = '\n\n';

export class WorkflowEngine {
    /**
     * Creates a new workflow step with proper defaults and business logic
     */
    static createNewStep(workflow: Workflow): WorkflowStep {
        const stepId = `step-${crypto.randomUUID()}` as WorkflowStepId;
        return {
            step_id: stepId,
            label: `Step ${workflow.steps.length + 1}`,
            description: 'Configure this step by selecting a tool and setting up its parameters',
            step_type: WorkflowStepType.ACTION,
            workflow_id: workflow.workflow_id,
            sequence_number: workflow.steps.length,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            parameter_mappings: {},
            output_mappings: {},
            tool: undefined,
            tool_id: undefined,
            prompt_template_id: undefined
        };
    }

    /**
     * Gets input values for a step formatted for UI display
     * This is a public wrapper around the private getResolvedParameters method
     * that formats the data for UI components
     */
    static getStepInputValuesForUI(
        step: WorkflowStep,
        workflow: Workflow | null
    ): Record<string, { value: any, schema: any }> {
        if (!step.parameter_mappings || !workflow?.state) return {};

        const result: Record<string, { value: any, schema: any }> = {};

        Object.entries(step.parameter_mappings).forEach(([paramName, varPath]) => {
            // Use the resolveVariablePath utility to handle variable paths
            const { value, validPath } = resolveVariablePath(workflow.state || [], varPath.toString());

            // Get the variable and schema information
            const { rootName, propPath } = parseVariablePath(varPath.toString());
            const variable = findVariableByRootName(workflow.state || [], rootName);

            if (!variable || !validPath) {
                result[paramName] = {
                    value: null,
                    schema: null
                };
                return;
            }

            // Get the schema for the path
            let schema: Schema | null = variable.schema;
            if (propPath.length > 0 && schema) {
                const schemaValidation = validatePropertyPathAgainstSchema(schema, propPath);
                schema = schemaValidation.schema || null;
            }

            result[paramName] = {
                value: value,
                schema: schema
            };
        });

        return result;
    }

    /**
     * Gets the required input variable names for a workflow step
     * Used to determine which inputs need to be collected from the user
     * before executing a step
     */
    static getRequiredInputsForStep(
        step: WorkflowStep
    ): WorkflowVariableName[] {
        let requiredInputNames: WorkflowVariableName[] = [];

        // For action steps, get inputs from parameter mappings
        if (step.step_type === WorkflowStepType.ACTION && step.parameter_mappings) {
            requiredInputNames = Object.values(step.parameter_mappings)
                .filter(mapping => typeof mapping === 'string')
                .map(mapping => mapping as WorkflowVariableName);
        }
        // For evaluation steps, get inputs from evaluation conditions
        else if (step.step_type === WorkflowStepType.EVALUATION && step.evaluation_config) {
            // Extract variable names from all conditions
            requiredInputNames = step.evaluation_config.conditions
                .map(condition => condition.variable as WorkflowVariableName)
                .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates
        }

        return requiredInputNames;
    }

    /**
     * Gets default value for a schema type
     * Used to initialize form values and create default variables
     */
    static getDefaultValueForSchema(schema: Schema): SchemaValueType {
        if (schema.type === 'string') return '';
        if (schema.type === 'number') return 0;
        if (schema.type === 'boolean') return false;
        if (schema.type === 'file') return {
            file_id: '',
            name: '',
            content: new Uint8Array(),
            mime_type: '',
            size: 0,
            created_at: '',
            updated_at: ''
        };
        if (schema.type === 'object') {
            const result: Record<string, SchemaValueType> = {};
            if (schema.fields) {
                for (const [key, fieldSchema] of Object.entries(schema.fields)) {
                    result[key] = this.getDefaultValueForSchema(fieldSchema);
                }
            }
            return result;
        }
        return '';
    }

    /**
     * Formats a value for display in the UI
     * Handles truncation and special formatting for different types
     */
    static formatValueForDisplay(
        value: any,
        schema: Schema | undefined,
        options: {
            maxTextLength?: number,
            maxArrayLength?: number,
            maxArrayItemLength?: number
        } = {}
    ): string {
        // Default options
        const {
            maxTextLength = 200,
            maxArrayLength = 3,
            maxArrayItemLength = 100
        } = options;

        // Handle undefined/null
        if (value === undefined || value === null) {
            return 'No value';
        }

        // Handle arrays
        if (Array.isArray(value)) {
            if (value.length === 0) return '[]';

            const items = value.slice(0, maxArrayLength).map(item => {
                const itemStr = typeof item === 'object'
                    ? JSON.stringify(item)
                    : String(item);

                return itemStr.length > maxArrayItemLength
                    ? `${itemStr.substring(0, maxArrayItemLength)}...`
                    : itemStr;
            });

            const hasMore = value.length > maxArrayLength;
            return `[${items.join(', ')}${hasMore ? `, ... (${value.length - maxArrayLength} more)` : ''}]`;
        }

        // Handle objects
        if (typeof value === 'object') {
            // Handle file objects
            if (schema?.type === 'file' && value.file_id) {
                return `File: ${value.name || value.file_id}`;
            }

            // Handle schema objects with improved field name display
            if (schema?.type === 'object' && schema.fields) {
                // Format object with field names clearly visible
                const formattedEntries = Object.entries(value)
                    .filter(([key]) => schema.fields && key in schema.fields)
                    .map(([key, val]) => {
                        const fieldSchema = schema.fields?.[key];
                        const fieldValue = this.formatValueForDisplay(
                            val,
                            fieldSchema,
                            {
                                maxTextLength: Math.min(50, maxTextLength / 2),
                                maxArrayLength: 2,
                                maxArrayItemLength: 30
                            }
                        );
                        return `"${key}": ${fieldValue}`;
                    });

                const formatted = `{ ${formattedEntries.join(', ')} }`;
                if (formatted.length > maxTextLength) {
                    return `${formatted.substring(0, maxTextLength)}...`;
                }
                return formatted;
            }

            // Handle other objects
            const json = JSON.stringify(value, null, 2);
            if (json.length > maxTextLength) {
                return `${json.substring(0, maxTextLength)}...`;
            }
            return json;
        }

        // Handle strings
        if (typeof value === 'string') {
            if (value.length > maxTextLength) {
                return `${value.substring(0, maxTextLength)}...`;
            }
            return value;
        }

        // Handle other primitives
        return String(value);
    }

    /**
     * Gets the output values for a workflow step for UI display
     */
    static getStepOutputValuesForUI(
        step: WorkflowStep,
        workflow: Workflow | null
    ): Record<string, { value: any, schema: any }> {
        if (!step.output_mappings || !workflow?.state) return {};

        const result: Record<string, { value: any, schema: any }> = {};

        Object.entries(step.output_mappings).forEach(([outputName, mapping]) => {
            // Handle enhanced output mappings
            const varPath = typeof mapping === 'object' && 'variable' in mapping
                ? mapping.variable.toString()
                : mapping.toString();

            // Use the resolveVariablePath utility to handle variable paths
            const { value, validPath } = resolveVariablePath(workflow.state || [], varPath);

            // Get the variable and schema information
            const { rootName, propPath } = parseVariablePath(varPath);
            const variable = findVariableByRootName(workflow.state || [], rootName);

            // Try to get the schema from the variable
            let schema: Schema | null = null;
            if (variable && validPath) {
                schema = variable.schema;
                if (propPath.length > 0 && schema) {
                    const schemaValidation = validatePropertyPathAgainstSchema(schema, propPath);
                    schema = schemaValidation.schema || null;
                }
            }

            // If schema is still null, try to get it from the tool's signature
            if (!schema && step.tool?.signature.outputs) {
                const outputDef = step.tool.signature.outputs.find(o => o.name === outputName);
                if (outputDef) {
                    schema = { ...outputDef.schema }; // Clone to avoid modifying the original
                }
            }

            // Ensure the schema's is_array property matches the actual value
            if (schema && Array.isArray(value)) {
                schema.is_array = true;
            }

            result[outputName] = {
                value: value,
                schema: schema
            };
        });

        return result;
    }

    /**
     * Resolves parameter mappings for a workflow step
     */
    private static getResolvedParameters(
        step: WorkflowStep,
        workflow: Workflow
    ): Record<ToolParameterName, SchemaValueType> {
        const parameters: Record<ToolParameterName, SchemaValueType> = {};

        if (!step.parameter_mappings) return parameters;

        const allVariables = workflow.state || [];
        for (const [paramName, varNamePath] of Object.entries(step.parameter_mappings)) {
            // Use the utility library to resolve variable paths
            const { value, validPath, errorMessage } = resolveVariablePath(allVariables, varNamePath.toString());

            parameters[paramName as ToolParameterName] = value || (null as unknown as SchemaValueType);
            if (validPath && value !== undefined) {
                console.warn(`Invalid or undefined variable path: ${varNamePath}`, errorMessage ? `Error: ${errorMessage}` : '');
            }
        }

        return parameters;
    }

    /**
     * Applies the output value to a variable based on the mapping operation
     * @param variable The workflow variable to update
     * @param mapping The output mapping (simple variable name or enhanced mapping with operation)
     * @param outputValue The output value to apply
     * @returns The updated value for the variable
     */
    private static applyOutputToVariable(
        variable: WorkflowVariable,
        mapping: WorkflowVariableName | EnhancedOutputMapping,
        outputValue: any
    ): any {
        // Handle enhanced output mappings; first handle the case where the mapping is a simple variable name   
        if (typeof mapping !== 'object' || !('variable' in mapping) || !('operation' in mapping)) {
            // For simple mapping, convert the output value to match the variable type
            return WorkflowEngine.convertValueToMatchVariableType(variable, outputValue);
        }

        // handle case of simple assignment
        if (mapping.operation === VariableOperationType.ASSIGN) {
            // Simple assignment - replace the current value, but convert to match the variable type
            return WorkflowEngine.convertValueToMatchVariableType(variable, outputValue);
        }

        // handle case of append operation
        if (mapping.operation === VariableOperationType.APPEND) {
            if (variable.schema.is_array) {
                // For arrays, handle append based on current value
                if (!variable.value) {
                    // No current value, initialize with output
                    if (Array.isArray(outputValue)) {
                        // Convert each item in the array to match the variable's element type
                        return outputValue.map(item =>
                            WorkflowEngine.convertValueToMatchArrayElementType(variable.schema, item)
                        );
                    } else {
                        // Convert the single item to match the variable's element type
                        return [WorkflowEngine.convertValueToMatchArrayElementType(variable.schema, outputValue)];
                    }
                }
                else if (Array.isArray(variable.value)) {
                    // Append to existing array
                    if (Array.isArray(outputValue)) {
                        // Convert each new item to match the variable's element type
                        const convertedItems = outputValue.map(item =>
                            WorkflowEngine.convertValueToMatchArrayElementType(variable.schema, item)
                        );
                        return [...variable.value, ...convertedItems];
                    } else {
                        // Convert the single item to match the variable's element type
                        const convertedItem = WorkflowEngine.convertValueToMatchArrayElementType(
                            variable.schema, outputValue
                        );
                        return [...variable.value, convertedItem];
                    }
                } else {
                    // Current value is not an array, convert both to array elements
                    const convertedCurrentValue = WorkflowEngine.convertValueToMatchArrayElementType(
                        variable.schema, variable.value
                    );
                    const convertedNewValue = WorkflowEngine.convertValueToMatchArrayElementType(
                        variable.schema, outputValue
                    );
                    return [convertedCurrentValue, convertedNewValue];
                }
            }
            else if (variable.schema.type === 'string' && typeof variable.value === 'string') {
                // For strings, ensure objects are properly stringified
                let stringValue;
                if (typeof outputValue === 'object' && outputValue !== null) {
                    stringValue = JSON.stringify(outputValue);
                } else {
                    stringValue = String(outputValue);
                }
                return variable.value + APPEND_DELIMITER + stringValue;
            }
            else {
                // For other types, just assign (fallback)
                return WorkflowEngine.convertValueToMatchVariableType(variable, outputValue);
            }
        }
    }

    /**
     * Converts a value to match the type of the target variable
     * @param variable The target variable
     * @param value The value to convert
     * @returns The converted value
     */
    private static convertValueToMatchVariableType(
        variable: WorkflowVariable,
        value: any
    ): any {
        // If the value is already the correct type, return it as is
        if (variable.schema.is_array && Array.isArray(value)) {
            return value;
        }

        // Handle array conversions
        if (variable.schema.is_array) {
            // Convert non-array value to an array with a single element
            return [value];
        }

        // Handle string conversions
        if (variable.schema.type === 'string') {
            if (typeof value === 'string') {
                return value;
            } else if (Array.isArray(value)) {
                // Convert array to string by joining elements
                return value.join(',');
            } else if (typeof value === 'object' && value !== null) {
                // Convert object to JSON string
                return JSON.stringify(value);
            } else {
                // Convert other types to string
                return String(value);
            }
        }

        // Handle number conversions
        if (variable.schema.type === 'number') {
            if (typeof value === 'number') {
                return value;
            } else if (typeof value === 'string') {
                // Try to convert string to number
                const num = Number(value);
                return isNaN(num) ? 0 : num;
            } else if (Array.isArray(value) && value.length > 0) {
                // Use the first element if it's a number
                const num = Number(value[0]);
                return isNaN(num) ? 0 : num;
            } else {
                return 0;
            }
        }

        // Handle boolean conversions
        if (variable.schema.type === 'boolean') {
            if (typeof value === 'boolean') {
                return value;
            } else if (typeof value === 'string') {
                return value.toLowerCase() === 'true';
            } else if (Array.isArray(value)) {
                // Array is true if it has elements
                return value.length > 0;
            } else if (typeof value === 'number') {
                return value !== 0;
            } else {
                return Boolean(value);
            }
        }

        // Handle object conversions
        if (variable.schema.type === 'object') {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                return value;
            } else if (typeof value === 'string') {
                try {
                    // Try to parse string as JSON
                    return JSON.parse(value);
                } catch (e) {
                    return {};
                }
            } else {
                return {};
            }
        }

        // Default: return the value as is
        return value;
    }

    /**
     * Converts a value to match the element type of an array schema
     * @param schema The schema of the array variable
     * @param value The value to convert
     * @returns The converted value
     */
    private static convertValueToMatchArrayElementType(
        schema: Schema,
        value: any
    ): any {
        // If schema is not for an array or doesn't specify element type, return as is
        if (!schema.is_array) {
            return value;
        }

        // Handle conversion based on the element type
        const elementType = schema.type;

        // Handle object type
        if (elementType === 'object') {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                return value; // Already an object
            } else if (typeof value === 'string') {
                try {
                    // Try to parse string as JSON
                    return JSON.parse(value);
                } catch (e) {
                    console.warn('Failed to parse string as object:', e);
                    return {}; // Return empty object if parsing fails
                }
            } else {
                return {}; // Default empty object
            }
        }

        // Handle string type
        if (elementType === 'string') {
            if (typeof value === 'string') {
                return value; // Already a string
            } else if (typeof value === 'object' && value !== null) {
                return JSON.stringify(value); // Convert object to JSON string
            } else {
                return String(value); // Convert other types to string
            }
        }

        // Handle number type
        if (elementType === 'number') {
            if (typeof value === 'number') {
                return value; // Already a number
            } else {
                const num = Number(value);
                return isNaN(num) ? 0 : num; // Convert to number or default to 0
            }
        }

        // Handle boolean type
        if (elementType === 'boolean') {
            if (typeof value === 'boolean') {
                return value; // Already a boolean
            } else if (typeof value === 'string') {
                return value.toLowerCase() === 'true'; // Convert string to boolean
            } else {
                return Boolean(value); // Convert other types to boolean
            }
        }

        // Default: return the value as is
        return value;
    }

    /**
     * Updates workflow state with tool outputs based on output mappings
     */
    private static getUpdatedWorkflowStateFromResults(
        step: WorkflowStep,
        outputs: Record<string, any>,
        workflow: Workflow
    ): WorkflowVariable[] {
        const updatedState = [...(workflow.state || [])];

        // If step is type ACTION, handle tool outputs with mappings
        if (step.step_type === WorkflowStepType.ACTION) {
            if (!step.output_mappings || Object.keys(outputs).length === 0) {
                return updatedState;
            }

            for (const [outputName, mapping] of Object.entries(step.output_mappings)) {
                if (!(outputName in outputs)) {
                    continue;
                }

                const outputValue = outputs[outputName];

                // Get the variable name from the mapping
                const variableName = typeof mapping === 'object' && 'variable' in mapping
                    ? mapping.variable
                    : mapping as WorkflowVariableName;

                // Find the variable in the state
                const variableIndex = updatedState.findIndex(v => v.name === variableName);
                if (variableIndex === -1) {
                    continue;
                }

                // Apply the output value to the variable based on the mapping
                const variable = updatedState[variableIndex];
                variable.value = this.applyOutputToVariable(variable, mapping, outputValue);
            }
        }
        // If step is type EVALUATION, handle evaluation outputs
        else if (step.step_type === WorkflowStepType.EVALUATION) {
            // Generate a shorter variable ID using first 8 chars of step ID plus _eval
            const shortStepId = step.step_id.slice(0, 8);
            const outputVarName = `eval_${shortStepId}` as WorkflowVariableName;

            // Check if the output variable already exists
            const outputVarIndex = updatedState.findIndex(v => v.name === outputVarName);
            if (outputVarIndex !== -1) {
                updatedState[outputVarIndex] = {
                    ...updatedState[outputVarIndex],
                    // NOTE: We're only storing the outputs object here, not the full EvaluationResult.
                    // This is why in EvaluationStepRunner we cast the value to EvaluationOutputs.
                    value: outputs
                };
            } else {
                updatedState.push({
                    name: outputVarName,
                    variable_id: outputVarName,
                    description: 'Evaluation step result',
                    schema: {
                        type: 'object',
                        is_array: false
                    },
                    // NOTE: We're only storing the outputs object here, not the full EvaluationResult.
                    // This is why in EvaluationStepRunner we cast the value to EvaluationOutputs.
                    value: outputs,
                    io_type: 'evaluation'
                });
            }
        }

        return updatedState;
    }

    /**
     * Evaluates conditions for a workflow step
     */
    private static evaluateConditions(
        step: WorkflowStep,
        workflow: Workflow
    ): StepExecutionResult {
        if (!step.evaluation_config) {
            return {
                success: true,
                outputs: {
                    ['condition_met' as WorkflowVariableName]: 'none' as SchemaValueType,
                    ['next_action' as WorkflowVariableName]: 'continue' as SchemaValueType,
                    ['reason' as WorkflowVariableName]: 'No evaluation configuration' as SchemaValueType
                }
            };
        }

        const { conditions, default_action } = step.evaluation_config;
        const allVariables = workflow.state || [];

        // If no conditions, use default action
        if (!conditions || conditions.length === 0) {
            return {
                success: true,
                outputs: {
                    ['condition_met' as WorkflowVariableName]: 'none' as SchemaValueType,
                    ['next_action' as WorkflowVariableName]: default_action as SchemaValueType,
                    ['reason' as WorkflowVariableName]: 'No conditions defined' as SchemaValueType
                }
            };
        }

        // Evaluate each condition
        for (const condition of conditions) {
            // Get the variable value using the variable path
            const { value, validPath } = resolveVariablePath(allVariables, condition.variable.toString());

            // Skip if variable not found or path is invalid
            if (!validPath || value === undefined) {
                console.warn(`Variable ${condition.variable} not found or has no value`);
                continue;
            }

            // Evaluate the condition
            const conditionMet = this.evaluateCondition(
                condition.operator,
                value,
                condition.value
            );

            if (conditionMet) {
                // Determine next action
                const nextAction = condition.target_step_index !== undefined ? 'jump' : 'continue';
                const targetStepIndex = condition.target_step_index;

                // If we need to jump, check if we can
                if (nextAction === 'jump' && targetStepIndex !== undefined) {
                    // Check if we can jump (max jumps not reached)
                    const { canJump, jumpCount, updatedState, jumpInfo } = this.manageJumpCount(
                        step,
                        allVariables,
                        step.sequence_number,
                        targetStepIndex,
                        `Condition met: ${condition.variable} ${condition.operator} ${condition.value}`
                    );

                    if (canJump) {
                        // Convert jumpInfo to proper output format
                        const outputs: Record<WorkflowVariableName, SchemaValueType> = {
                            ['condition_met' as WorkflowVariableName]: condition.condition_id as SchemaValueType,
                            ['variable_name' as WorkflowVariableName]: condition.variable.toString() as SchemaValueType,
                            ['variable_value' as WorkflowVariableName]: JSON.stringify(value) as SchemaValueType,
                            ['operator' as WorkflowVariableName]: condition.operator as SchemaValueType,
                            ['comparison_value' as WorkflowVariableName]: JSON.stringify(condition.value) as SchemaValueType,
                            ['next_action' as WorkflowVariableName]: nextAction as SchemaValueType,
                            ['target_step_index' as WorkflowVariableName]: targetStepIndex.toString() as SchemaValueType,
                            ['reason' as WorkflowVariableName]: `Condition met: ${condition.variable} ${condition.operator} ${condition.value}` as SchemaValueType,
                            ['jump_count' as WorkflowVariableName]: jumpCount.toString() as SchemaValueType,
                            ['max_jumps' as WorkflowVariableName]: step.evaluation_config.maximum_jumps.toString() as SchemaValueType,
                            ['max_jumps_reached' as WorkflowVariableName]: 'false' as SchemaValueType
                        };

                        // Add any additional jump info
                        for (const [key, value] of Object.entries(jumpInfo)) {
                            outputs[key as WorkflowVariableName] = value as SchemaValueType;
                        }

                        return {
                            success: true,
                            outputs,
                            updatedState
                        };
                    } else {
                        // Max jumps reached, continue to next step
                        const outputs: Record<WorkflowVariableName, SchemaValueType> = {
                            ['condition_met' as WorkflowVariableName]: condition.condition_id as SchemaValueType,
                            ['variable_name' as WorkflowVariableName]: condition.variable.toString() as SchemaValueType,
                            ['variable_value' as WorkflowVariableName]: JSON.stringify(value) as SchemaValueType,
                            ['operator' as WorkflowVariableName]: condition.operator as SchemaValueType,
                            ['comparison_value' as WorkflowVariableName]: JSON.stringify(condition.value) as SchemaValueType,
                            ['next_action' as WorkflowVariableName]: 'continue' as SchemaValueType,
                            ['reason' as WorkflowVariableName]: `Condition met but maximum jumps (${step.evaluation_config.maximum_jumps}) reached` as SchemaValueType,
                            ['jump_count' as WorkflowVariableName]: jumpCount.toString() as SchemaValueType,
                            ['max_jumps' as WorkflowVariableName]: step.evaluation_config.maximum_jumps.toString() as SchemaValueType,
                            ['max_jumps_reached' as WorkflowVariableName]: 'true' as SchemaValueType
                        };

                        // Add any additional jump info
                        for (const [key, value] of Object.entries(jumpInfo)) {
                            outputs[key as WorkflowVariableName] = value as SchemaValueType;
                        }

                        return {
                            success: true,
                            outputs,
                            updatedState
                        };
                    }
                }

                // No jump needed, just continue
                return {
                    success: true,
                    outputs: {
                        ['condition_met' as WorkflowVariableName]: condition.condition_id as SchemaValueType,
                        ['variable_name' as WorkflowVariableName]: condition.variable.toString() as SchemaValueType,
                        ['variable_value' as WorkflowVariableName]: JSON.stringify(value) as SchemaValueType,
                        ['operator' as WorkflowVariableName]: condition.operator as SchemaValueType,
                        ['comparison_value' as WorkflowVariableName]: JSON.stringify(condition.value) as SchemaValueType,
                        ['next_action' as WorkflowVariableName]: nextAction as SchemaValueType,
                        ['target_step_index' as WorkflowVariableName]: targetStepIndex?.toString() as SchemaValueType,
                        ['reason' as WorkflowVariableName]: `Condition met: ${condition.variable} ${condition.operator} ${condition.value}` as SchemaValueType
                    }
                };
            }
        }

        // No conditions met, use default action
        return {
            success: true,
            outputs: {
                ['condition_met' as WorkflowVariableName]: 'none' as SchemaValueType,
                ['next_action' as WorkflowVariableName]: default_action as SchemaValueType,
                ['reason' as WorkflowVariableName]: 'No conditions met' as SchemaValueType
            }
        };
    }

    /**
     * Evaluates a single condition with proper type handling
     */
    private static evaluateCondition(
        operator: EvaluationOperator,
        value: SchemaValueType,
        compareValue: SchemaValueType
    ): boolean {

        // Handle null/undefined values
        if (value === null || value === undefined || compareValue === null || compareValue === undefined) {
            return false;
        }

        try {
            switch (operator) {
                case 'equals':
                    // Handle boolean comparisons
                    if (typeof value === 'boolean' || typeof compareValue === 'boolean') {
                        // Convert string representations of booleans to actual booleans
                        const boolValue = typeof value === 'string' && (value.toLowerCase() === 'true' || value.toLowerCase() === 'false')
                            ? value.toLowerCase() === 'true'
                            : value;

                        const boolCompare = typeof compareValue === 'string' && (compareValue.toLowerCase() === 'true' || compareValue.toLowerCase() === 'false')
                            ? compareValue.toLowerCase() === 'true'
                            : compareValue;

                        return boolValue === boolCompare;
                    }

                    // Handle numeric comparisons
                    if (typeof value === 'number' && typeof compareValue === 'string') {
                        return value === Number(compareValue);
                    }
                    if (typeof value === 'string' && typeof compareValue === 'number') {
                        return Number(value) === compareValue;
                    }

                    return value === compareValue;

                case 'not_equals':
                    // Reuse equals logic
                    return !this.evaluateCondition('equals', value, compareValue);

                case 'greater_than':
                    // Ensure numeric comparison
                    const numValue = typeof value === 'string' ? Number(value) : value;
                    const numCompare = typeof compareValue === 'string' ? Number(compareValue) : compareValue;
                    if (typeof numValue !== 'number' || typeof numCompare !== 'number' || isNaN(numValue) || isNaN(numCompare)) {
                        return false;
                    }
                    return numValue > numCompare;

                case 'less_than':
                    // Reuse greater_than logic
                    return this.evaluateCondition('greater_than', compareValue, value);

                case 'contains':
                    // Only allow string contains operations
                    if (typeof value !== 'string' || typeof compareValue !== 'string') {
                        return false;
                    }
                    return value.includes(compareValue);

                case 'not_contains':
                    // Reuse contains logic
                    return !this.evaluateCondition('contains', value, compareValue);

                default:
                    console.warn(`Unknown operator: ${operator}`);
                    return false;
            }
        } catch (error) {
            console.error('Error in condition evaluation:', error);
            return false;
        }
    }

    /**
     * Manages jump count for an evaluation step
     */
    private static manageJumpCount(
        step: WorkflowStep,
        currentState: WorkflowVariable[],
        fromStepIndex: number,
        toStepIndex: number,
        reason?: string
    ): {
        jumpCount: number,
        canJump: boolean,
        updatedState: WorkflowVariable[],
        jumpInfo: any
    } {
        const shortStepId = step.step_id.slice(0, 8);
        const jumpCounterName = `jump_count_${shortStepId}` as WorkflowVariableName;
        let jumpCount = 0;

        // Look for existing jump counter
        const jumpCountVar = currentState.find(v => v.name === jumpCounterName);
        if (jumpCountVar?.value !== undefined) {
            jumpCount = Number(jumpCountVar.value);
        }

        // Get maximum allowed jumps
        const maxJumps = step.evaluation_config?.maximum_jumps || 3;

        // Check if we can jump (jumpCount is less than maxJumps)
        const canJump = jumpCount < maxJumps;

        console.log('Jump Count Management:', {
            stepId: step.step_id,
            jumpCounterName,
            jumpCountVar: jumpCountVar ? JSON.stringify(jumpCountVar) : 'not found',
            currentJumpCount: jumpCount,
            maxJumps,
            canJump,
            fromStep: fromStepIndex,
            toStep: toStepIndex,
            stateVarCount: currentState.length,
            allJumpCounters: currentState.filter(v => v.name.startsWith('jump_count_')).map(v => `${v.name}=${v.value}`)
        });

        // Create updated state with new jump count
        const updatedState = [...currentState];
        const jumpCountVarIndex = updatedState.findIndex(v => v.name === jumpCounterName);

        // Always increment counter if we can jump
        if (canJump) {
            if (jumpCountVarIndex !== -1) {
                updatedState[jumpCountVarIndex] = {
                    ...updatedState[jumpCountVarIndex],
                    value: jumpCount + 1
                };
            } else {
                updatedState.push({
                    name: jumpCounterName,
                    variable_id: jumpCounterName,
                    description: 'Jump counter for evaluation step',
                    schema: {
                        type: 'number',
                        is_array: false
                    },
                    value: 1,
                    io_type: 'evaluation'
                });
            }
        }

        // Create jump info object
        const jumpInfo = {
            is_jump: canJump,
            from_step: fromStepIndex,
            to_step: canJump ? toStepIndex : fromStepIndex + 1,
            reason: canJump
                ? (reason || 'Jump condition met')
                : `Maximum jumps (${maxJumps}) reached. Continuing to next step.`
        };

        console.log('Jump Decision:', {
            canJump,
            newJumpCount: canJump ? jumpCount + 1 : jumpCount,
            nextStep: jumpInfo.to_step,
            reason: jumpInfo.reason
        });

        return {
            jumpCount,
            canJump,
            updatedState,
            jumpInfo
        };
    }

    /**
     * Executes a workflow step and returns the updated workflow and execution result
     * This is a simplified API that returns the updated workflow instead of using callbacks
     */
    static async executeStepSimple(
        workflow: Workflow,
        stepIndex: number,
        statusCallback?: (status: {
            stepId: string;
            stepIndex: number;
            status: 'running' | 'completed' | 'failed';
            message?: string;
            progress?: number;
            result?: Partial<StepExecutionResult>;
        }) => void
    ): Promise<{
        updatedState: WorkflowVariable[],
        result: StepExecutionResult,
        nextStepIndex: number
    }> {
        try {
            // Get the step from workflow
            const step = workflow.steps[stepIndex];
            console.log(`🔍 [STEP ${step.step_id}] Executing step: ${step.label} (${step.step_type})`);
            console.time(`⏱️ Step ${step.step_id} Execution Time`);

            // Notify status: running
            if (statusCallback) {
                statusCallback({
                    stepId: step.step_id,
                    stepIndex,
                    status: 'running',
                    message: `Executing step: ${step.label}`,
                    progress: 0
                });
            }

            if (!step) {
                console.error('❌ [STEP] Invalid step index:', stepIndex);

                // Notify status: failed
                if (statusCallback) {
                    statusCallback({
                        stepId: 'unknown',
                        stepIndex,
                        status: 'failed',
                        message: 'Invalid step index',
                    });
                }

                return {
                    updatedState: workflow.state || [],
                    result: {
                        success: false,
                        error: 'Invalid step index'
                    },
                    nextStepIndex: stepIndex + 1
                };
            }

            // Create a copy of the workflow state to avoid mutating the original
            const workflowStateCopy = [...(workflow.state || [])];

            // Clear any existing outputs for this step
            console.log(`🧹 [STEP ${step.step_id}] Clearing previous outputs`);
            const clearedState = this.clearStepOutputs(step, { ...workflow, state: workflowStateCopy });

            // Notify status: running with progress
            if (statusCallback) {
                statusCallback({
                    stepId: step.step_id,
                    stepIndex,
                    status: 'running',
                    message: `Preparing step execution`,
                    progress: 10
                });
            }

            // Execute based on step type
            let result: StepExecutionResult;
            let updatedState = clearedState;
            let nextStepIndex = stepIndex + 1;

            if (step.step_type === WorkflowStepType.EVALUATION) {
                console.log(`⚖️ [STEP ${step.step_id}] Evaluating conditions`);

                // Notify status: running with progress
                if (statusCallback) {
                    statusCallback({
                        stepId: step.step_id,
                        stepIndex,
                        status: 'running',
                        message: `Evaluating conditions`,
                        progress: 30
                    });
                }

                // For evaluation, we need the workflow context to evaluate conditions
                const workflowCopy = { ...workflow, state: clearedState };
                result = this.evaluateConditions(step, workflowCopy);

                // Update workflow state with evaluation results
                if (result.success && result.outputs) {
                    console.log(`✅ [STEP ${step.step_id}] Evaluation successful, updating state`);
                    updatedState = this.getUpdatedWorkflowStateFromResults(
                        step,
                        result.outputs,
                        workflowCopy
                    );

                    // Notify status: running with progress
                    if (statusCallback) {
                        statusCallback({
                            stepId: step.step_id,
                            stepIndex,
                            status: 'running',
                            message: `Evaluation successful, updating state`,
                            progress: 70,
                            result: { success: true }
                        });
                    }
                } else {
                    console.error(`❌ [STEP ${step.step_id}] Evaluation failed:`, result.error);

                    // Notify status: failed
                    if (statusCallback) {
                        statusCallback({
                            stepId: step.step_id,
                            stepIndex,
                            status: 'failed',
                            message: `Evaluation failed: ${result.error}`,
                            result: { success: false, error: result.error }
                        });
                    }
                }

                // Handle jump logic
                if (result.outputs &&
                    result.outputs['next_action' as WorkflowVariableName] === 'jump' &&
                    result.outputs['target_step_index' as WorkflowVariableName] !== undefined) {

                    const targetStepIndex = Number(result.outputs['target_step_index' as WorkflowVariableName]);
                    const jumpReason = result.outputs['reason' as WorkflowVariableName] as string;

                    console.log(`↪️ [STEP ${step.step_id}] Jump condition met, target step: ${targetStepIndex}, reason: ${jumpReason}`);

                    // Notify status: running with progress
                    if (statusCallback) {
                        statusCallback({
                            stepId: step.step_id,
                            stepIndex,
                            status: 'running',
                            message: `Jump condition met, target step: ${targetStepIndex}, reason: ${jumpReason}`,
                            progress: 80
                        });
                    }

                    // Use shared jump count management and increment counter if we can jump
                    const jumpResult = this.manageJumpCount(
                        step,
                        updatedState,
                        stepIndex,
                        targetStepIndex,
                        jumpReason
                    );

                    // Update state and determine next step
                    updatedState = jumpResult.updatedState;
                    nextStepIndex = jumpResult.canJump ? targetStepIndex : stepIndex + 1;

                    // Update result outputs with jump info
                    result.outputs = {
                        ...result.outputs,
                        ['next_action' as WorkflowVariableName]: (jumpResult.canJump ? 'jump' : 'continue') as SchemaValueType,
                        ['max_jumps_reached' as WorkflowVariableName]: (!jumpResult.canJump).toString() as SchemaValueType,
                        ['_jump_info' as WorkflowVariableName]: JSON.stringify(jumpResult.jumpInfo) as SchemaValueType
                    };

                    console.log(`${jumpResult.canJump ? '↪️' : '⛔'} [STEP ${step.step_id}] Jump ${jumpResult.canJump ? 'allowed' : 'blocked'}, next step: ${nextStepIndex}`);

                    // Notify status: running with progress
                    if (statusCallback) {
                        statusCallback({
                            stepId: step.step_id,
                            stepIndex,
                            status: 'running',
                            message: `Jump ${jumpResult.canJump ? 'allowed' : 'blocked'}, next step: ${nextStepIndex}`,
                            progress: 90
                        });
                    }
                } else if (result.outputs && result.outputs['next_action' as WorkflowVariableName] === 'end') {
                    nextStepIndex = workflow.steps.length; // End workflow
                    console.log(`🏁 [STEP ${step.step_id}] End workflow condition met`);

                    // Notify status: running with progress
                    if (statusCallback) {
                        statusCallback({
                            stepId: step.step_id,
                            stepIndex,
                            status: 'running',
                            message: `End workflow condition met`,
                            progress: 90
                        });
                    }
                } else {
                    console.log(`➡️ [STEP ${step.step_id}] Continuing to next step: ${nextStepIndex}`);

                    // Notify status: running with progress
                    if (statusCallback) {
                        statusCallback({
                            stepId: step.step_id,
                            stepIndex,
                            status: 'running',
                            message: `Continuing to next step: ${nextStepIndex}`,
                            progress: 90
                        });
                    }
                }
            } else {
                // Execute tool step
                if (!step.tool) {
                    console.error(`❌ [STEP ${step.step_id}] No tool configured for this step`);
                    console.timeEnd(`⏱️ Step ${step.step_id} Execution Time`);

                    // Notify status: failed
                    if (statusCallback) {
                        statusCallback({
                            stepId: step.step_id,
                            stepIndex,
                            status: 'failed',
                            message: `No tool configured for this step`,
                            result: { success: false, error: 'No tool configured for this step' }
                        });
                    }

                    return {
                        updatedState: clearedState,
                        result: {
                            success: false,
                            error: 'No tool configured for this step'
                        },
                        nextStepIndex: stepIndex + 1
                    };
                }

                // For tool execution, we need the workflow context to resolve parameters
                const workflowCopy = { ...workflow, state: clearedState };
                const parameters = this.getResolvedParameters(step, workflowCopy);

                console.log(`🔧 [STEP ${step.step_id}] Executing tool: ${step.tool.name} (${step.tool.tool_type})`);
                console.log(`📥 [STEP ${step.step_id}] Tool parameters:`, Object.keys(parameters).length);

                // Notify status: running with progress
                if (statusCallback) {
                    statusCallback({
                        stepId: step.step_id,
                        stepIndex,
                        status: 'running',
                        message: `Executing tool: ${step.tool.name}`,
                        progress: 30
                    });
                }

                // Add prompt template ID for LLM tools
                if (step.tool.tool_type === 'llm' && step.prompt_template_id) {
                    parameters['prompt_template_id' as ToolParameterName] = step.prompt_template_id as SchemaValueType;
                    console.log(`🔄 [STEP ${step.step_id}] Using prompt template: ${step.prompt_template_id}`);
                }

                // Execute the tool
                try {
                    console.time(`⏱️ Tool ${step.tool.tool_id} Execution Time`);

                    // Notify status: running with progress
                    if (statusCallback) {
                        statusCallback({
                            stepId: step.step_id,
                            stepIndex,
                            status: 'running',
                            message: `Tool execution in progress`,
                            progress: 50
                        });
                    }

                    const toolResult = await ToolEngine.executeTool(step.tool, parameters);
                    console.timeEnd(`⏱️ Tool ${step.tool.tool_id} Execution Time`);

                    // Update workflow state with tool results
                    if (toolResult) {
                        console.log(`📤 [STEP ${step.step_id}] Tool execution successful, updating state with outputs:`, Object.keys(toolResult).length);
                        updatedState = this.getUpdatedWorkflowStateFromResults(
                            step,
                            toolResult,
                            workflowCopy
                        );

                        // Notify status: running with progress
                        if (statusCallback) {
                            statusCallback({
                                stepId: step.step_id,
                                stepIndex,
                                status: 'running',
                                message: `Tool execution successful, updating state`,
                                progress: 80,
                                result: { success: true, outputs: toolResult }
                            });
                        }
                    } else {
                        console.warn(`⚠️ [STEP ${step.step_id}] Tool execution returned no results`);

                        // Notify status: running with progress
                        if (statusCallback) {
                            statusCallback({
                                stepId: step.step_id,
                                stepIndex,
                                status: 'running',
                                message: `Tool execution returned no results`,
                                progress: 80
                            });
                        }
                    }

                    result = {
                        success: true,
                        outputs: toolResult
                    };
                } catch (toolError) {
                    console.error(`❌ [STEP ${step.step_id}] Tool execution error:`, toolError);
                    console.timeEnd(`⏱️ Tool ${step.tool.tool_id} Execution Time`);

                    // Notify status: failed
                    if (statusCallback) {
                        statusCallback({
                            stepId: step.step_id,
                            stepIndex,
                            status: 'failed',
                            message: `Tool execution error: ${toolError instanceof Error ? toolError.message : String(toolError)}`,
                            result: {
                                success: false,
                                error: toolError instanceof Error ? toolError.message : String(toolError)
                            }
                        });
                    }

                    // Create a proper error result
                    result = {
                        success: false,
                        error: toolError instanceof Error ? toolError.message : String(toolError),
                        outputs: {}
                    };
                }
            }

            console.timeEnd(`⏱️ Step ${step.step_id} Execution Time`);
            console.log(`${result.success ? '✅' : '❌'} [STEP ${step.step_id}] Step execution ${result.success ? 'successful' : 'failed'}`);

            // Notify status: completed or failed
            if (statusCallback) {
                statusCallback({
                    stepId: step.step_id,
                    stepIndex,
                    status: result.success ? 'completed' : 'failed',
                    message: `Step execution ${result.success ? 'successful' : 'failed'}`,
                    progress: 100,
                    result
                });
            }

            return {
                updatedState,
                result,
                nextStepIndex
            };
        } catch (error) {
            console.error('❌ [STEP] Unexpected error during step execution:', error);

            // Notify status: failed
            if (statusCallback) {
                statusCallback({
                    stepId: 'unknown',
                    stepIndex,
                    status: 'failed',
                    message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
                    result: {
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error occurred'
                    }
                });
            }

            return {
                updatedState: workflow.state || [],
                result: {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error occurred'
                },
                nextStepIndex: stepIndex + 1
            };
        }
    }

    /**
     * Clears outputs for a step before execution
     * Returns the updated state array
     */
    static clearStepOutputs(
        step: WorkflowStep,
        workflow: Workflow
    ): WorkflowVariable[] {
        if (!workflow.state) return [];

        return workflow.state.map(variable => {
            // Clear mapped outputs
            if (step.output_mappings && Object.values(step.output_mappings).includes(variable.name)) {
                return { ...variable, value: undefined };
            }

            // Clear evaluation-specific outputs
            if (step.step_type === WorkflowStepType.EVALUATION &&
                variable.name === `eval_${step.step_id.slice(0, 8)}`) {
                return { ...variable, value: undefined };
            }

            return variable;
        });
    }

    /**
     * Determines the next step to execute based on the current step's result
     */
    static getNextStepIndex(
        workflow: Workflow,
        currentStepIndex: number
    ): { nextStepIndex: number, updatedState: WorkflowVariable[] } {
        const currentStep = workflow.steps[currentStepIndex];
        let nextStepIndex = currentStepIndex + 1;
        let updatedState = [...(workflow.state || [])];

        // For evaluation steps, check conditions to determine next step
        if (currentStep.step_type === WorkflowStepType.EVALUATION) {
            // Create a copy of the workflow state to avoid mutating the original
            const workflowStateCopy = [...(workflow.state || [])];

            // Clear any existing outputs for this step
            const clearedState = this.clearStepOutputs(currentStep, { ...workflow, state: workflowStateCopy });

            // For evaluation, we need the workflow context to evaluate conditions
            const workflowCopy = { ...workflow, state: clearedState };

            // Evaluate conditions - this already handles jump count management internally
            const result = this.evaluateConditions(currentStep, workflowCopy);
            console.log('getNextStepIndex evaluation result:', result);

            // If we have updated state from the result, use it
            if ('updatedState' in result && result.updatedState) {
                updatedState = result.updatedState;
            }

            // Determine next step based on evaluation result
            const nextAction = result.outputs?.['next_action' as WorkflowVariableName] as string;
            const targetStepIndex = result.outputs?.['target_step_index' as WorkflowVariableName] as string | undefined;
            const maxJumpsReached = result.outputs?.['max_jumps_reached' as WorkflowVariableName] === 'true';

            if (nextAction === 'jump' && targetStepIndex !== undefined && !maxJumpsReached) {
                nextStepIndex = parseInt(targetStepIndex, 10);
                console.log('Jump will occur in getNextStepIndex to step:', nextStepIndex);
            } else if (nextAction === 'end') {
                nextStepIndex = workflow.steps.length; // End workflow
            }
        }

        return { nextStepIndex, updatedState };
    }

    /**
     * Resets all jump counters in the workflow state
     * This should be called when starting a new workflow execution
     * 
     * @deprecated This method is deprecated. Use the RESET_WORKFLOW_STATE action type instead.
     */
    static resetJumpCounters(
        workflow: Workflow,
        updateWorkflowByAction: (action: WorkflowStateAction) => void
    ): void {
        console.warn('resetJumpCounters is deprecated. Use the RESET_WORKFLOW_STATE action type with keepJumpCounters set to false instead.');

        if (!workflow.state) return;

        updateWorkflowByAction({
            type: 'RESET_WORKFLOW_STATE',
            payload: {
                keepJumpCounters: false
            }
        });

        console.log('Reset all jump counters for workflow execution');
    }

    /**
     * Updates workflow state based on an action
     */
    static updateWorkflowByAction(workflow: Workflow, action: WorkflowStateAction): Workflow {
        switch (action.type) {
            case 'UPDATE_WORKFLOW':
                if (!action.payload.workflowUpdates) return workflow;

                // Handle state updates specially to ensure we don't lose data
                if (action.payload.workflowUpdates.state) {
                    // Validate variable name uniqueness
                    const names = new Set<string>();
                    for (const variable of action.payload.workflowUpdates.state) {
                        if (names.has(variable.name)) {
                            console.error(`Duplicate variable name found: ${variable.name}`);
                            return workflow;
                        }
                        names.add(variable.name);
                    }

                    // Ensure variable_id is set for all variables
                    const processedState = action.payload.workflowUpdates.state.map(variable => ({
                        ...variable,
                        variable_id: variable.variable_id || `var-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                    }));

                    return {
                        ...workflow,
                        ...action.payload.workflowUpdates,
                        state: processedState
                    };
                }

                // For updates without state changes
                return {
                    ...workflow,
                    ...action.payload.workflowUpdates
                };

            case 'UPDATE_STEP':
                if (!action.payload.stepId || !action.payload.step) return workflow;
                return {
                    ...workflow,
                    steps: workflow.steps.map(step =>
                        step.step_id === action.payload.stepId ? action.payload.step! : step
                    )
                };

            case 'ADD_STEP':
                const newStep = WorkflowEngine.createNewStep(workflow);
                return {
                    ...workflow,
                    steps: [...workflow.steps, newStep]
                };

            case 'DELETE_STEP':
                if (!action.payload.stepId) return workflow;
                return {
                    ...workflow,
                    steps: workflow.steps.filter(step => step.step_id !== action.payload.stepId)
                };

            case 'REORDER_STEPS':
                if (!action.payload.reorder) return workflow;
                // Update sequence numbers for the reordered steps
                const updatedSteps = action.payload.reorder.reorderedSteps.map((step, index) => ({
                    ...step,
                    sequence_number: index
                }));
                return {
                    ...workflow,
                    steps: updatedSteps
                };

            case 'UPDATE_STATE':
                if (!action.payload.state) return workflow;
                // Validate variable name uniqueness
                const names = new Set<string>();
                for (const variable of action.payload.state) {
                    if (names.has(variable.name)) {
                        console.error(`Duplicate variable name found: ${variable.name}`);
                        return workflow;
                    }
                    names.add(variable.name);
                }
                return {
                    ...workflow,
                    state: action.payload.state
                };

            case 'RESET_EXECUTION':
                // This action resets all variable values while preserving the variables themselves
                // It's used as part of the workflow reset process
                return {
                    ...workflow,
                    state: workflow.state?.map(variable => {
                        // Reset all variable values to undefined
                        return { ...variable, value: undefined };
                    }) || []
                };

            case 'RESET_WORKFLOW_STATE':
                if (!workflow.state) return workflow;

                // First, handle the basic reset execution which clears values but keeps variables
                let updatedState = workflow.state.map(variable => ({
                    ...variable,
                    value: undefined
                }));

                // Then, if we're not keeping jump counters, filter them out
                if (!action.payload.keepJumpCounters) {
                    updatedState = updatedState.filter(variable =>
                        // Remove all evaluation variables including jump counters
                        variable.io_type !== 'evaluation' &&
                        !variable.name.startsWith('jump_count_') &&
                        !variable.name.startsWith('eval_')
                    );
                }

                return {
                    ...workflow,
                    state: updatedState
                };

            default:
                // Handle existing step update cases
                return {
                    ...workflow,
                    steps: workflow.steps.map(step => {
                        if (step.step_id === action.payload.stepId) {
                            switch (action.type) {
                                case 'UPDATE_PARAMETER_MAPPINGS':
                                    return {
                                        ...step,
                                        parameter_mappings: action.payload.mappings as Record<ToolParameterName, WorkflowVariableName>
                                    };
                                case 'UPDATE_OUTPUT_MAPPINGS':
                                    return {
                                        ...step,
                                        output_mappings: action.payload.mappings as Record<ToolOutputName, WorkflowVariableName>
                                    };
                                case 'UPDATE_STEP_TOOL':
                                    return {
                                        ...step,
                                        tool: action.payload.tool,
                                        tool_id: action.payload.tool?.tool_id,
                                        // Clear mappings when tool changes
                                        parameter_mappings: {},
                                        output_mappings: {},
                                        // Clear prompt template when tool changes
                                        prompt_template_id: undefined
                                    };
                                case 'UPDATE_STEP_TYPE':
                                    const newType = step.step_type === WorkflowStepType.ACTION
                                        ? WorkflowStepType.EVALUATION
                                        : WorkflowStepType.ACTION;

                                    return {
                                        ...step,
                                        step_type: newType,
                                        // Clear tool-specific data when switching to evaluation
                                        ...(step.step_type === WorkflowStepType.ACTION ? {
                                            tool: undefined,
                                            tool_id: undefined,
                                            parameter_mappings: {},
                                            output_mappings: {},
                                            prompt_template_id: undefined,
                                            evaluation_config: {
                                                conditions: [],
                                                default_action: 'continue',
                                                maximum_jumps: 3
                                            }
                                        } : {})
                                    };
                                default:
                                    return step;
                            }
                        }
                        return step;
                    })
                };
        }
    }

    /**
     * Executes a workflow step and manages workflow state
     * @deprecated Use executeStepSimple instead for a more straightforward API
     */
    static async executeStep(
        workflow: Workflow,
        stepIndex: number,
        updateWorkflowByAction: (action: WorkflowStateAction) => void,
        statusCallback?: (status: {
            stepId: string;
            stepIndex: number;
            status: 'running' | 'completed' | 'failed';
            message?: string;
            progress?: number;
            result?: Partial<StepExecutionResult>;
        }) => void
    ): Promise<StepExecutionResult> {
        try {
            console.log(`🔄 [EXECUTE STEP] Executing step ${stepIndex + 1} of workflow ${workflow.workflow_id}`);
            console.time(`⏱️ Execute Step ${stepIndex + 1} Time`);

            // Use the new simplified implementation
            const { updatedState, result, nextStepIndex } = await this.executeStepSimple(
                workflow,
                stepIndex,
                statusCallback
            );

            // Update the workflow using the provided action handler
            if (updatedState !== workflow.state) {
                console.log(`📤 [EXECUTE STEP] Updating workflow state after step ${stepIndex + 1}`);
                updateWorkflowByAction({
                    type: 'UPDATE_WORKFLOW',
                    payload: {
                        workflowUpdates: {
                            state: updatedState,
                            steps: workflow.steps
                        }
                    }
                });
            }

            console.timeEnd(`⏱️ Execute Step ${stepIndex + 1} Time`);
            console.log(`${result.success ? '✅' : '❌'} [EXECUTE STEP] Step ${stepIndex + 1} ${result.success ? 'succeeded' : 'failed'}, next step: ${nextStepIndex}`);

            return result;
        } catch (error) {
            console.error(`❌ [EXECUTE STEP] Error executing step ${stepIndex + 1}:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
}