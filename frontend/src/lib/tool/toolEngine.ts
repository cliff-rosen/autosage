import {
    Tool,
    ToolOutputs,
    ToolOutputName,
    ResolvedParameters,
    ToolParameterName
} from '../../types/tools';
import { SchemaValueType, SchemaObjectType } from '../../types/schema';
import { executeTool } from './toolRegistry';
import { WorkflowStep, StepExecutionResult } from '../../types/workflows';

export class ToolEngine {
    /**
     * Executes a tool step with provided parameters
     * This method focuses solely on tool execution and doesn't handle parameter resolution or state updates
     */
    static async executeToolStep(
        step: WorkflowStep,
        parameters: Record<ToolParameterName, SchemaValueType>,
        statusCallback?: (status: {
            stepId: string;
            stepIndex: number;
            status: 'running' | 'completed' | 'failed';
            message?: string;
            progress?: number;
            result?: Partial<StepExecutionResult>;
        }) => void
    ): Promise<Record<string, any>> {
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

            throw new Error('No tool configured for this step');
        }

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

            const toolResult = await this.executeTool(step.tool, parameters);
            console.timeEnd(`⏱️ Tool ${step.tool.tool_id} Execution Time`);

            if (toolResult) {
                console.log(`📤 [STEP ${step.step_id}] Tool execution successful, outputs:`, Object.keys(toolResult).length);

                // Notify status: running with progress
                if (statusCallback) {
                    statusCallback({
                        stepId: step.step_id,
                        stepIndex: step.sequence_number,
                        status: 'running',
                        message: `Tool execution successful`,
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

            return toolResult || {};
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

            // Re-throw the error to be handled by the caller
            throw toolError;
        }
    }

    /**
     * Executes a tool with the given parameters
     */
    static async executeTool(
        tool: Tool,
        parameters: ResolvedParameters
    ): Promise<ToolOutputs> {
        try {
            // Execute the tool using the registry
            return await executeTool(tool.tool_id, parameters);
        } catch (error) {
            console.error(`Error executing tool ${tool.tool_id}:`, error);
            throw error;
        }
    }

    /**
     * Formats tool outputs according to the tool's signature
     */
    static formatToolOutputs(
        outputs: Record<string, any>,
        tool: Tool
    ): ToolOutputs {
        const formattedOutputs: Record<ToolOutputName, SchemaValueType> = {};

        // Map each output to its defined schema type
        tool.signature.outputs.forEach(output => {
            if (output.name in outputs) {
                formattedOutputs[output.name] = this.coerceToSchemaType(
                    outputs[output.name],
                    output.schema.type
                );
            }
        });

        return formattedOutputs;
    }

    /**
     * Coerces a value to the specified schema type
     */
    private static coerceToSchemaType(
        value: any,
        type: string
    ): SchemaValueType {
        switch (type) {
            case 'string':
                return String(value);
            case 'number':
                return Number(value);
            case 'boolean':
                return Boolean(value);
            case 'array':
                // Arrays are not directly part of SchemaValueType
                // We need to convert the array to a SchemaObjectType with indexed keys
                if (Array.isArray(value)) {
                    const result: Record<string, SchemaValueType> = {};
                    value.forEach((item, index) => {
                        result[index.toString()] = typeof item === 'object' && item !== null
                            ? item as SchemaValueType
                            : item as SchemaValueType;
                    });
                    return result;
                }
                // If not an array, wrap in an object with a single item
                return { '0': value } as SchemaObjectType;
            case 'object':
                return typeof value === 'object' && value !== null
                    ? value as SchemaObjectType
                    : { value } as SchemaObjectType;
            default:
                return String(value);
        }
    }
} 