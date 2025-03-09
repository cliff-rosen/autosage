# WorkflowContext Interaction in Agent Workflow System

This document illustrates how WorkflowContext fits into the agent workflow system architecture, focusing on its interactions with other components.

## WorkflowContext in the Overall Architecture

```mermaid
sequenceDiagram
    participant UI as AgentWorkflowContainer
    participant Service as AgentWorkflowService
    participant Orchestrator as AgentWorkflowOrchestrator
    participant Engine as WorkflowEngine
    participant Context as WorkflowContext
    participant Tools as Workflow Tools (LLM, Search, etc.)

    UI->>Service: executeFullWorkflow(question, config)
    Service->>Orchestrator: Create orchestrator instance
    
    Note over Orchestrator: Question Development Phase
    Orchestrator->>Engine: runJob(questionDevWorkflow, inputs)
    
    Note over Engine, Context: Context Creation & Initialization
    Engine->>Context: Create new context instance
    Engine->>Context: Initialize with workflow definition
    Engine->>Context: Set input variables
    
    Note over Engine, Context: Step Execution with Context
    Engine->>Context: Get inputs for step 1
    Engine->>Tools: Execute step 1 with inputs
    Tools-->>Engine: Return step 1 outputs
    Engine->>Context: Store step 1 outputs
    
    Engine->>Context: Get inputs for step 2
    Engine->>Tools: Execute step 2 with inputs
    Tools-->>Engine: Return step 2 outputs
    Engine->>Context: Store step 2 outputs
    
    Note over Engine, Context: Evaluation with Context
    Engine->>Context: Get variables for evaluation
    Engine->>Engine: Evaluate conditions
    Engine->>Context: Update execution history
    
    Note over Engine, Context: Context for Iteration
    alt Needs Iteration
        Engine->>Context: Get updated inputs for repeated step
        Engine->>Tools: Re-execute step with new inputs
        Tools-->>Engine: Return new outputs
        Engine->>Context: Store new outputs
        Engine->>Context: Increment iteration counter
    end
    
    Note over Engine, Context: Final Output Collection
    Engine->>Context: Get final output variables
    Engine-->>Orchestrator: Return job result with outputs
    
    Note over Orchestrator: Repeat for KB Development & Answer Generation
    Orchestrator-->>Service: Return final result
    Service-->>UI: Update UI with result
```

## Detailed WorkflowContext Interaction

```mermaid
sequenceDiagram
    participant Engine as WorkflowEngine
    participant Context as WorkflowContext
    participant Step as Workflow Step
    participant Tool as Tool (LLM, Search, etc.)
    
    Engine->>Context: new WorkflowContext(workflow)
    
    Note over Context: Context Initialization
    Context->>Context: Initialize variable store
    Context->>Context: Initialize execution history
    Context->>Context: Set workflow definition
    
    Engine->>Context: setVariable(ORIGINAL_QUESTION, "user question")
    
    Note over Engine, Context: Step Execution
    Engine->>Context: getStepInputs(step_id)
    Context->>Context: Resolve variable references
    Context->>Context: Apply parameter mappings
    Context-->>Engine: Return resolved inputs
    
    Engine->>Step: execute(inputs)
    Step->>Tool: Call tool with inputs
    Tool-->>Step: Return tool outputs
    Step-->>Engine: Return step outputs
    
    Engine->>Context: setStepOutputs(step_id, outputs)
    Context->>Context: Apply output mappings
    Context->>Context: Store variables
    Context->>Context: Update execution history
    
    Note over Engine, Context: Variable Access
    Engine->>Context: getVariable(IMPROVED_QUESTION)
    Context-->>Engine: Return variable value
    
    Note over Engine, Context: Evaluation
    Engine->>Context: getVariable(QUESTION_IMPROVEMENT_CONFIDENCE)
    Context-->>Engine: Return confidence score
    Engine->>Context: getVariable(QUESTION_IMPROVEMENT_ITERATIONS)
    Context-->>Engine: Return iteration count
    
    Note over Engine, Context: Final Output Collection
    Engine->>Context: getOutputs()
    Context->>Context: Collect all output variables
    Context-->>Engine: Return output variables map
```

## WorkflowContext State Management

```mermaid
sequenceDiagram
    participant Engine as WorkflowEngine
    participant Context as WorkflowContext
    
    Note over Context: WorkflowContext Internal State
    
    Engine->>Context: new WorkflowContext(workflow)
    
    Note over Context: Internal State:
    Note over Context: - variableStore: {}
    Note over Context: - executionHistory: []
    Note over Context: - workflow: {...}
    Note over Context: - currentStepId: null
    
    Engine->>Context: setVariable("original_question", "How do I make pizza?")
    
    Note over Context: Internal State:
    Note over Context: - variableStore: { "original_question": "How do I make pizza?" }
    
    Engine->>Context: beginStepExecution("improve_question")
    
    Note over Context: Internal State:
    Note over Context: - currentStepId: "improve_question"
    Note over Context: - executionHistory: [{ stepId: "improve_question", status: "running" }]
    
    Engine->>Context: setStepOutputs("improve_question", { "improved_question": "What is the best way to make homemade pizza?" })
    
    Note over Context: Internal State:
    Note over Context: - variableStore: { 
    Note over Context:     "original_question": "How do I make pizza?",
    Note over Context:     "improved_question": "What is the best way to make homemade pizza?"
    Note over Context:   }
    Note over Context: - executionHistory: [{ 
    Note over Context:     stepId: "improve_question", 
    Note over Context:     status: "completed",
    Note over Context:     outputs: { "improved_question": "What is the best way to make homemade pizza?" }
    Note over Context:   }]
    
    Engine->>Context: getVariable("improved_question")
    Context-->>Engine: "What is the best way to make homemade pizza?"
    
    Engine->>Context: getExecutionHistory()
    Context-->>Engine: [{ stepId: "improve_question", status: "completed", ... }]
```

## WorkflowContext in Evaluation Steps

```mermaid
sequenceDiagram
    participant Engine as WorkflowEngine
    participant Context as WorkflowContext
    participant Eval as Evaluation Step
    
    Engine->>Context: getVariable("question_improvement_confidence")
    Context-->>Engine: 0.7
    
    Engine->>Context: getVariable("question_improvement_iterations")
    Context-->>Engine: 1
    
    Engine->>Eval: evaluate(conditions)
    
    Eval->>Eval: Check condition "confidence >= 0.8"
    Eval->>Eval: Result: false
    
    Eval->>Eval: Check condition "iterations >= 3"
    Eval->>Eval: Result: false
    
    Eval->>Eval: Check condition "confidence < 0.8"
    Eval->>Eval: Result: true
    
    Eval-->>Engine: Jump to step 1
    
    Engine->>Context: setVariable("question_improvement_iterations", 2)
    
    Note over Context: Internal State:
    Note over Context: - variableStore: { 
    Note over Context:     "original_question": "How do I make pizza?",
    Note over Context:     "improved_question": "What is the best way to make homemade pizza?",
    Note over Context:     "question_improvement_confidence": 0.7,
    Note over Context:     "question_improvement_iterations": 2
    Note over Context:   }
```

## Key Responsibilities of WorkflowContext

1. **Variable Storage and Retrieval**
   - Stores all workflow variables (inputs, outputs, intermediate values)
   - Provides methods to get and set variables by name
   - Handles type conversion and validation

2. **Execution History Tracking**
   - Records which steps have executed and their results
   - Tracks iteration counts for loops
   - Maintains a log of the workflow execution path

3. **Step Input/Output Management**
   - Resolves input parameters for each step based on parameter mappings
   - Stores step outputs and applies output mappings to workflow variables
   - Handles variable substitution in templates (e.g., for LLM prompts)

4. **State Persistence**
   - Can serialize its state for persistence (if needed)
   - Can be restored from a serialized state to resume execution

5. **Workflow Definition Access**
   - Provides access to the workflow definition
   - Allows steps to reference workflow metadata

The WorkflowContext is essentially the "memory" of the workflow execution, ensuring that data flows correctly between steps and that the workflow state is maintained throughout the execution process. 