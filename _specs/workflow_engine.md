Workflow ToolEngine


PUBLIC

executeStep(workflow, stepIdx)
    state = workflow.state
    step = workflow.steps[idx]    
    state = clearStateOutputsForStep(state, step)


PRIVATE

executeStepAsWorkflow(step, state)
    params = getWorkflowInputsFromState(step.workflowId, state)
    res = ToolEngine.execute(step.tool, params)
    state = updateStateWithStepResults(step, res)

executeStepAsTool(step, state)
    params = getToolInputsFromState(step.tool, state)
    res = ToolEngine.execute(step.tool, params)
    state = updateStateWithStepResults(step, res)

executeStepAsEvaluation(step, state)
    params = getToolInputsFromState(step.tool, state)
    res = EvaluationEngine.execute(step.tool, params)
    state = updateStateWithStepResults(step, res)



create evaluation.ts
create EvaluationEngine

