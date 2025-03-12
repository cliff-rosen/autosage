import {
    WorkflowStep,
    WorkflowVariable,
    WorkflowVariableName,
    StepExecutionResult,
    Workflow,
    EvaluationCondition
} from '../../types/workflows';
import { resolveVariablePath } from '../utils/variablePathUtils';

// Define the missing interface
interface EvaluationConditionResult {
    condition: EvaluationCondition;
    result: boolean;
    value: any;
}

export class EvaluationEngine {
    /**
     * Evaluates conditions for a workflow step
     * This returns a simple object with result and conditions, not the EvaluationResult type
     */
    static evaluateConditions(
        step: WorkflowStep,
        state: WorkflowVariable[]
    ): {
        result: boolean;
        conditions: EvaluationConditionResult[];
    } {
        if (!step.evaluation_config || !step.evaluation_config.conditions) {
            return { result: true, conditions: [] };
        }

        const allVariables = state || [];
        const conditionResults: EvaluationConditionResult[] = [];

        // Evaluate each condition
        for (const condition of step.evaluation_config.conditions) {
            if (!condition.variable) continue;

            // Resolve the variable value
            const { value, validPath } = resolveVariablePath(allVariables, condition.variable.toString());

            let result = false;

            if (validPath) {
                // Evaluate the condition based on the operator
                switch (condition.operator) {
                    case 'equals':
                        result = value === condition.value;
                        break;
                    case 'not_equals':
                        result = value !== condition.value;
                        break;
                    case 'greater_than':
                        result = typeof value === 'number' && typeof condition.value === 'number' && value > condition.value;
                        break;
                    case 'less_than':
                        result = typeof value === 'number' && typeof condition.value === 'number' && value < condition.value;
                        break;
                    case 'contains':
                        if (typeof value === 'string' && typeof condition.value === 'string') {
                            result = value.includes(condition.value);
                        } else if (Array.isArray(value)) {
                            result = value.includes(condition.value);
                        }
                        break;
                    case 'not_contains':
                        if (typeof value === 'string' && typeof condition.value === 'string') {
                            result = !value.includes(condition.value);
                        } else if (Array.isArray(value)) {
                            result = !value.includes(condition.value);
                        }
                        break;
                    default:
                        console.warn(`Unknown operator: ${condition.operator}`);
                        result = false;
                }
            } else {
                console.warn(`Invalid variable path: ${condition.variable}`);
                result = false;
            }

            conditionResults.push({
                condition,
                result,
                value
            });
        }

        // Combine results based on the logical operator (default to AND)
        const finalResult = conditionResults.every(cr => cr.result);

        return {
            result: finalResult,
            conditions: conditionResults
        };
    }

    /**
     * Evaluates conditions with provided inputs instead of resolving from workflow state
     * This is a more focused version of evaluateConditions that works with pre-extracted inputs
     */
    static executeEvaluationStep(
        step: WorkflowStep,
        currentStepIndex: number,
        state: WorkflowVariable[],
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

        // Evaluate conditions
        const evaluationResult = this.evaluateConditions(step, state);

        // Default values
        let nextStepIndex = currentStepIndex + 1;
        let nextAction = 'continue';
        let targetStepIndex = -1;
        let jumpCount = 0;
        let maxJumpsReached = false;

        // Find the first condition that was met
        const metCondition = evaluationResult.result
            ? evaluationResult.conditions.find(c => c.result)
            : null;

        // If a condition was met and it has a target step, prepare for jump
        if (metCondition && metCondition.condition.target_step_index !== undefined) {
            // Check jump counter to prevent infinite loops
            const jumpCounterName = `jump_count_${step.step_id}`;
            const jumpCountVar = state?.find(v => v.name === jumpCounterName);

            if (jumpCountVar?.value !== undefined) {
                jumpCount = Number(jumpCountVar.value);
            }

            const maxJumps = step.evaluation_config?.maximum_jumps || 3;
            maxJumpsReached = jumpCount >= maxJumps;

            if (!maxJumpsReached) {
                nextAction = 'jump';
                targetStepIndex = metCondition.condition.target_step_index;
                nextStepIndex = targetStepIndex;
                jumpCount++; // Increment for the output
            } else {
                console.warn(`Maximum jumps (${maxJumps}) reached for step ${step.step_id}, continuing to next step`);
            }
        }

        // Create evaluation outputs in the original format
        const outputs: Record<string, any> = {
            condition_met: metCondition ? metCondition.condition.variable : 'none',
            variable_name: metCondition ? metCondition.condition.variable.toString() : '',
            variable_value: metCondition ? JSON.stringify(metCondition.value) : '',
            operator: metCondition ? metCondition.condition.operator : '',
            comparison_value: metCondition ? JSON.stringify(metCondition.condition.value) : '',
            next_action: nextAction,
            target_step_index: targetStepIndex !== -1 ? targetStepIndex.toString() : '',
            reason: metCondition
                ? `Condition met: ${metCondition.condition.variable} ${metCondition.condition.operator} ${metCondition.condition.value}`
                : 'No conditions met',
            jump_count: jumpCount.toString(),
            max_jumps: (step.evaluation_config?.maximum_jumps || 3).toString(),
            max_jumps_reached: maxJumpsReached ? 'true' : 'false'
        };

        if (statusCallback) {
            statusCallback({
                stepId: step.step_id,
                stepIndex: currentStepIndex,
                status: 'completed',
                message: `Evaluation ${evaluationResult.result ? 'passed' : 'failed'}, ${nextAction}`,
                progress: 100,
                result: {
                    success: true,
                    outputs
                }
            });
        }

        return {
            result: {
                success: true,
                outputs
            },
            updatedState: state,
            nextStepIndex
        };
    }


    /**
     * Manages jump count for an evaluation step
     */
    static manageJumpCount(
        step: WorkflowStep,
        currentState: WorkflowVariable[],
        fromStepIndex: number,
        toStepIndex: number | undefined,
        reason?: string
    ): {
        jumpCount: number,
        canJump: boolean,
        updatedState: WorkflowVariable[],
        jumpInfo: any
    } {
        // Default to next step if toStepIndex is undefined
        const targetStepIndex = toStepIndex !== undefined ? toStepIndex : fromStepIndex + 1;

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
            toStep: targetStepIndex,
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
            to_step: canJump ? targetStepIndex : fromStepIndex + 1,
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
     * Determines the next step to execute based on evaluation results
     */
    static determineNextStep(
        evaluationResult: {
            result: boolean;
            conditions: EvaluationConditionResult[];
        },
        currentStepIndex: number,
        totalSteps: number
    ): number {
        let nextStepIndex = currentStepIndex + 1;

        // If the evaluation passed and there's a condition with a target step index
        if (evaluationResult.result) {
            // Find the first condition with a target step that was met
            const targetCondition = evaluationResult.conditions.find(c =>
                c.result && c.condition.target_step_index !== undefined
            );

            if (targetCondition && targetCondition.condition.target_step_index !== undefined) {
                nextStepIndex = targetCondition.condition.target_step_index;
                console.log('Jump will occur to step:', nextStepIndex);
            } else {
                console.log('Continuing to next step:', nextStepIndex);
            }
        } else {
            console.log('Evaluation failed, continuing to next step:', nextStepIndex);
        }

        return nextStepIndex;
    }
} 