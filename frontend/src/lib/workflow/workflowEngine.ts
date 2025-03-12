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
    VariableOperationType,
    WorkflowStatus
} from '../../types/workflows';
import { ToolParameterName, ToolOutputName, Tool } from '../../types/tools';
import { SchemaValueType, Schema } from '../../types/schema';
import { ToolEngine } from '../tool/toolEngine';
import { EvaluationEngine } from './evaluationEngine';
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
     * Creates a new workflow with default values and a single step
     */
    static createNewWorkflow(): Workflow {
        const newWorkflow: Workflow = {
            workflow_id: 'new',
            name: 'Untitled Workflow',
            description: 'A new custom workflow',
            status: WorkflowStatus.DRAFT,
            state: [],
            steps: []
        };

        // Add a single step to the workflow
        const firstStep = this.createNewStep(newWorkflow);
        newWorkflow.steps = [firstStep];

        return newWorkflow;
    }

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
            if (validPath && value == undefined) {
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
        // Add debugging
        console.log('Applying output to variable:', {
            variableName: variable.name,
            variableSchema: variable.schema,
            outputValue
        });

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
                    console.warn(`Output ${outputName} not found in outputs`);
                    continue;
                }

                const outputValue = outputs[outputName];

                // Get the variable name from the mapping
                const variableName = typeof mapping === 'object' && 'variable' in mapping
                    ? mapping.variable
                    : mapping as WorkflowVariableName;

                // Find the variable in the state
                console.log('Finding variable:', variableName); // TODO: remove
                console.log('typeof mapping:', typeof mapping); // TODO: remove

                const variableIndex = updatedState.findIndex(v => v.name === variableName);
                if (variableIndex === -1) {
                    console.warn(`Variable ${variableName} not found in state`);
                    continue;
                }

                // Apply the output value to the variable based on the mapping
                const variable = updatedState[variableIndex];
                console.log('Applying output to variable:', {
                    variableName: variable.name,
                    variableSchema: variable.schema,
                    outputValue
                });
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
                const workflowCopy = { ...workflow, state: clearedState };
                const evaluationResult = await this.executeStepAsEvaluation(
                    step,
                    workflowCopy,
                    stepIndex,
                    statusCallback
                );

                result = evaluationResult.result;
                updatedState = evaluationResult.updatedState;
                nextStepIndex = evaluationResult.nextStepIndex;
            } else {
                // Execute tool step
                const workflowCopy = { ...workflow, state: clearedState };
                const { result: toolResult, updatedState: toolUpdatedState } = await this.executeStepAsTool(
                    step,
                    workflowCopy,
                    statusCallback
                );

                result = toolResult;
                updatedState = toolUpdatedState;
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
     * Executes a workflow step as an evaluation and returns the result, updated state, and next step index
     */
    private static async executeStepAsEvaluation(
        step: WorkflowStep,
        workflow: Workflow,
        currentStepIndex: number,
        statusCallback?: (status: {
            stepId: string;
            stepIndex: number;
            status: 'running' | 'completed' | 'failed';
            message?: string;
            progress?: number;
            result?: Partial<StepExecutionResult>;
        }) => void
    ): Promise<{
        result: StepExecutionResult,
        updatedState: WorkflowVariable[],
        nextStepIndex: number
    }> {
        console.log(`⚖️ [STEP ${step.step_id}] Evaluating conditions`);
        let nextStepIndex = currentStepIndex + 1;

        // Notify status: running with progress
        if (statusCallback) {
            statusCallback({
                stepId: step.step_id,
                stepIndex: currentStepIndex,
                status: 'running',
                message: `Evaluating conditions`,
                progress: 30
            });
        }

        // Use EvaluationEngine to evaluate conditions
        const result = EvaluationEngine.evaluateConditions(step, workflow);

        // Update workflow state with evaluation results
        let updatedState = workflow.state || [];
        if (result.success && result.outputs) {
            console.log(`✅ [STEP ${step.step_id}] Evaluation successful, updating state`);
            updatedState = this.getUpdatedWorkflowStateFromResults(
                step,
                result.outputs,
                workflow
            );

            // Notify status: running with progress
            if (statusCallback) {
                statusCallback({
                    stepId: step.step_id,
                    stepIndex: currentStepIndex,
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
                    stepIndex: currentStepIndex,
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
                    stepIndex: currentStepIndex,
                    status: 'running',
                    message: `Jump condition met, target step: ${targetStepIndex}, reason: ${jumpReason}`,
                    progress: 80
                });
            }

            // Use EvaluationEngine to manage jump count
            const jumpResult = EvaluationEngine.manageJumpCount(
                step,
                updatedState,
                currentStepIndex,
                targetStepIndex,
                jumpReason
            );

            // Update state and determine next step
            updatedState = jumpResult.updatedState;
            nextStepIndex = jumpResult.canJump ? targetStepIndex : currentStepIndex + 1;

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
                    stepIndex: currentStepIndex,
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
                    stepIndex: currentStepIndex,
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
                    stepIndex: currentStepIndex,
                    status: 'running',
                    message: `Continuing to next step: ${nextStepIndex}`,
                    progress: 90
                });
            }
        }

        return {
            result,
            updatedState,
            nextStepIndex
        };
    }

    /**
     * Executes a workflow step as a tool and returns the result and updated state
     */
    private static async executeStepAsTool(
        step: WorkflowStep,
        workflow: Workflow,
        statusCallback?: (status: {
            stepId: string;
            stepIndex: number;
            status: 'running' | 'completed' | 'failed';
            message?: string;
            progress?: number;
            result?: Partial<StepExecutionResult>;
        }) => void
    ): Promise<{
        result: StepExecutionResult,
        updatedState: WorkflowVariable[]
    }> {
        if (!step.tool) {
            console.error(`❌ [STEP ${step.step_id}] No tool configured for this step`);
            console.timeEnd(`⏱️ Step ${step.step_id} Execution Time`);

            // Notify status: failed
            if (statusCallback) {
                statusCallback({
                    stepId: step.step_id,
                    stepIndex: step.sequence_number,
                    status: 'failed',
                    message: `No tool configured for this step`,
                    result: { success: false, error: 'No tool configured for this step' }
                });
            }

            return {
                result: {
                    success: false,
                    error: 'No tool configured for this step'
                },
                updatedState: workflow.state || []
            };
        }

        // For tool execution, we need the workflow context to resolve parameters
        const parameters = this.getResolvedParameters(step, workflow);

        console.log(`🔧 [STEP ${step.step_id}] Executing tool: ${step.tool.name} (${step.tool.tool_type})`);
        console.log(`📥 [STEP ${step.step_id}] Tool parameters:`, Object.keys(parameters).length);

        // Notify status: running with progress
        if (statusCallback) {
            statusCallback({
                stepId: step.step_id,
                stepIndex: step.sequence_number,
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
                    stepIndex: step.sequence_number,
                    status: 'running',
                    message: `Tool execution in progress`,
                    progress: 50
                });
            }

            const toolResult = await ToolEngine.executeTool(step.tool, parameters);
            console.timeEnd(`⏱️ Tool ${step.tool.tool_id} Execution Time`);

            // Update workflow state with tool results
            let updatedState = workflow.state || [];
            if (toolResult) {
                console.log(`📤 [STEP ${step.step_id}] Tool execution successful, updating state with outputs:`, Object.keys(toolResult).length);
                updatedState = this.getUpdatedWorkflowStateFromResults(
                    step,
                    toolResult,
                    workflow
                );
                console.log('Updated state:', updatedState); // TODO: remove

                // Notify status: running with progress
                if (statusCallback) {
                    statusCallback({
                        stepId: step.step_id,
                        stepIndex: step.sequence_number,
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
                        stepIndex: step.sequence_number,
                        status: 'running',
                        message: `Tool execution returned no results`,
                        progress: 80
                    });
                }
            }

            return {
                result: {
                    success: true,
                    outputs: toolResult
                },
                updatedState
            };
        } catch (toolError) {
            console.error(`❌ [STEP ${step.step_id}] Tool execution error:`, toolError);
            console.timeEnd(`⏱️ Tool ${step.tool.tool_id} Execution Time`);

            // Notify status: failed
            if (statusCallback) {
                statusCallback({
                    stepId: step.step_id,
                    stepIndex: step.sequence_number,
                    status: 'failed',
                    message: `Tool execution error: ${toolError instanceof Error ? toolError.message : String(toolError)}`,
                    result: {
                        success: false,
                        error: toolError instanceof Error ? toolError.message : String(toolError)
                    }
                });
            }

            // Create a proper error result
            return {
                result: {
                    success: false,
                    error: toolError instanceof Error ? toolError.message : String(toolError),
                    outputs: {}
                },
                updatedState: workflow.state || []
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

        if (currentStep.step_type != WorkflowStepType.EVALUATION) {
            return { nextStepIndex, updatedState };
        }

        // Create a copy of the workflow state to avoid mutating the original
        const workflowStateCopy = [...(workflow.state || [])];

        // Clear any existing outputs for this step
        const clearedState = this.clearStepOutputs(currentStep, { ...workflow, state: workflowStateCopy });

        // For evaluation, we need the workflow context to evaluate conditions
        const workflowCopy = { ...workflow, state: clearedState };

        // Evaluate conditions - this already handles jump count management internally
        const result = EvaluationEngine.evaluateConditions(currentStep, workflowCopy);
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
                                        output_mappings: action.payload.mappings as Record<ToolOutputName, WorkflowVariableName | EnhancedOutputMapping>
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

    /**
     * Formats a value for display in the UI
     * Handles truncation and special formatting for different types
     */
    static zz_formatValueForDisplay(
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
                        const fieldValue = this.zz_formatValueForDisplay(
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
     * Converts a value to match the type of the target variable
     * @param variable The target variable
     * @param value The value to convert
     * @returns The converted value
     */
    private static convertValueToMatchVariableType(
        variable: WorkflowVariable,
        value: any
    ): any {
        // Add debugging
        console.log('Converting value to match variable type:', {
            variableName: variable.name,
            variableSchema: variable.schema,
            value
        });

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

}