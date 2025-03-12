import {
    WorkflowStep,
    WorkflowVariable,
    WorkflowVariableName,
    EvaluationOperator,
    StepExecutionResult,
    WorkflowStepType,
    Workflow,
    EvaluationResult
} from '../../types/workflows';
import { SchemaValueType } from '../../types/schema';
import { resolveVariablePath } from '../utils/variablePathUtils';

export class EvaluationEngine {
    /**
     * Evaluates conditions for a workflow step and returns the execution result
     */
    static evaluateConditions(
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
    static manageJumpCount(
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
} 