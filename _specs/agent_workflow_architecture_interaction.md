# Agent Workflow System: Component Interaction Architecture

## Overview

This document outlines the ideal interaction between the various components in the agent workflow system. The architecture is designed to provide a clean separation of concerns while enabling seamless orchestration of the three-agent workflow process.

## Component Responsibilities

### 1. AgentWorkflowOrchestrator

**Primary Responsibility**: High-level orchestration of the three-agent workflow sequence.

**Key Functions**:
- Coordinating the execution of Question Development, Knowledge Base Development, and Answer Generation workflows
- Managing the flow of data between these workflows
- Tracking overall progress and status
- Providing error handling and recovery mechanisms
- Supporting advanced features like persistence and feedback loops

### 2. WorkflowEngine

**Primary Responsibility**: Execution of individual workflows.

**Key Functions**:
- Running individual workflow jobs (Question Development, KB Development, Answer Generation)
- Managing the execution of steps within each workflow
- Handling workflow-level state management
- Providing workflow-level error handling
- Executing evaluation conditions and managing workflow loops

### 3. WorkflowContext

**Primary Responsibility**: Maintaining state during workflow execution.

**Key Functions**:
- Storing and retrieving workflow variables
- Tracking execution history within a workflow
- Providing access to inputs and outputs for each step
- Supporting variable substitution in prompts and parameters

### 4. WorkflowAPI

**Primary Responsibility**: External interface for workflow operations.

**Key Functions**:
- Exposing REST endpoints for workflow operations
- Handling authentication and authorization
- Validating inputs and formatting outputs
- Providing status updates and progress information
- Supporting webhook callbacks for long-running operations

### 5. UI Components

**Primary Responsibility**: User interface for workflow interaction.

**Key Functions**:
- Displaying workflow status and progress
- Allowing user input and configuration
- Visualizing workflow results
- Supporting workflow monitoring and debugging

## Interaction Flow

### Ideal Component Interaction

```
┌─────────────┐     ┌─────────────────────────┐     ┌─────────────────┐
│             │     │                         │     │                 │
│  UI         │◄────┤  WorkflowAPI            │◄────┤  Orchestrator   │
│  Components │     │  (External Interface)   │     │  Status Updates │
│             │     │                         │     │                 │
└──────┬──────┘     └────────────┬────────────┘     └────────┬────────┘
       │                         │                           │
       │                         │                           │
       │                         ▼                           │
       │             ┌─────────────────────────┐             │
       │             │                         │             │
       └────────────►│  AgentWorkflowOrchestrator  │◄────────┘
                     │  (High-level Control)   │
                     │                         │
                     └────────────┬────────────┘
                                  │
                                  │ Creates & Executes
                                  │
                                  ▼
                     ┌─────────────────────────┐
                     │                         │
                     │  WorkflowEngine         │
                     │  (Workflow Execution)   │
                     │                         │
                     └────────────┬────────────┘
                                  │
                                  │ Uses
                                  │
                                  ▼
                     ┌─────────────────────────┐
                     │                         │
                     │  WorkflowContext        │
                     │  (State Management)     │
                     │                         │
                     └─────────────────────────┘
```

## Detailed Interaction Sequence

### 1. Initial Question Submission

1. **User** submits a question through the **UI Component**
2. **UI Component** sends the question to the **WorkflowAPI**
3. **WorkflowAPI** validates the input and creates a new workflow session
4. **WorkflowAPI** passes the question to the **AgentWorkflowOrchestrator**
5. **AgentWorkflowOrchestrator** initializes the orchestration process

### 2. Question Development Phase

1. **AgentWorkflowOrchestrator** creates a Question Development workflow
2. **AgentWorkflowOrchestrator** passes the workflow to the **WorkflowEngine** for execution
3. **WorkflowEngine** creates a **WorkflowContext** for the workflow
4. **WorkflowEngine** executes each step in the workflow:
   - LLM step to improve the question
   - LLM step to evaluate the improved question
   - Evaluation step to decide whether to iterate or proceed
5. **WorkflowEngine** returns the result to the **AgentWorkflowOrchestrator**
6. **AgentWorkflowOrchestrator** updates its status and notifies listeners

### 3. Knowledge Base Development Phase

1. **AgentWorkflowOrchestrator** creates a Knowledge Base Development workflow with the improved question
2. **AgentWorkflowOrchestrator** passes the workflow to the **WorkflowEngine** for execution
3. **WorkflowEngine** creates a new **WorkflowContext** for this workflow
4. **WorkflowEngine** executes each step in the workflow:
   - LLM step to plan the knowledge base
   - LLM step to generate search queries
   - Search tool step to execute queries
   - LLM step to extract information
   - LLM step to update the knowledge base
   - LLM step to evaluate the knowledge base
   - Evaluation step to decide whether to iterate or proceed
5. **WorkflowEngine** returns the result to the **AgentWorkflowOrchestrator**
6. **AgentWorkflowOrchestrator** updates its status and notifies listeners

### 4. Answer Generation Phase

1. **AgentWorkflowOrchestrator** creates an Answer Generation workflow with the improved question and knowledge base
2. **AgentWorkflowOrchestrator** passes the workflow to the **WorkflowEngine** for execution
3. **WorkflowEngine** creates a new **WorkflowContext** for this workflow
4. **WorkflowEngine** executes each step in the workflow:
   - LLM step to plan the answer
   - LLM step to generate a draft answer
   - LLM step to evaluate the answer
   - LLM step to refine the answer
   - Evaluation step to decide whether to iterate or finalize
5. **WorkflowEngine** returns the result to the **AgentWorkflowOrchestrator**
6. **AgentWorkflowOrchestrator** updates its status and notifies listeners

### 5. Result Delivery

1. **AgentWorkflowOrchestrator** finalizes the process and returns the final answer
2. **WorkflowAPI** formats the response and sends it to the **UI Component**
3. **UI Component** displays the result to the user

## Data Flow

### Between Components

```
┌─────────────┐     ┌─────────────────────────┐     ┌─────────────────────────┐
│  UI         │     │  WorkflowAPI            │     │  AgentWorkflowOrchestrator  │
│  Components │     │                         │     │                         │
└─────────────┘     └─────────────────────────┘     └─────────────────────────┘
      │                         │                              │
      │ Question                │ Question                     │ Question
      │ Config                  │ Session ID                   │ 
      ▼                         ▼                              ▼
      │                         │                              │
      │                         │                              │ Workflow Configs
      │                         │                              │ 
      │                         │                              ▼
      │                         │               ┌─────────────────────────┐
      │                         │               │  WorkflowEngine         │
      │                         │               │                         │
      │                         │               └─────────────────────────┘
      │                         │                           │
      │                         │                           │ Step Inputs/Outputs
      │                         │                           │ Variables
      │                         │                           ▼
      │                         │               ┌─────────────────────────┐
      │                         │               │  WorkflowContext        │
      │                         │               │                         │
      │                         │               └─────────────────────────┘
      │                         │                           │
      │                         │                           │
      │                         │                           │
      │ Status Updates          │ Status Updates            │ Status Updates
      │ Final Answer            │ Progress                  │ Intermediate Results
      │                         │                           │
      ▲                         ▲                           │
      │                         │                           │
      │                         │                           │
      │                         │                           │
```

### Between Workflows

```
┌─────────────────────────┐
│  Question Development   │
│  Workflow               │
└────────────┬────────────┘
             │
             │ Improved Question
             │
             ▼
┌─────────────────────────┐
│  Knowledge Base         │
│  Development Workflow   │
└────────────┬────────────┘
             │
             │ Knowledge Base
             │ Improved Question
             │
             ▼
┌─────────────────────────┐
│  Answer Generation      │
│  Workflow               │
└────────────┬────────────┘
             │
             │ Final Answer
             │
             ▼
```

## Implementation Considerations

### 1. Clean Interface Design

The interfaces between components should be clean and well-defined:

```typescript
// AgentWorkflowOrchestrator to WorkflowEngine
interface WorkflowEngineInterface {
    runJob(job: WorkflowJob): Promise<JobResult>;
    getJobStatus(jobId: string): Promise<JobStatus>;
    cancelJob(jobId: string): Promise<boolean>;
}

// WorkflowAPI to AgentWorkflowOrchestrator
interface OrchestratorInterface {
    executeFullWorkflow(question: string, config?: WorkflowConfig): Promise<string>;
    getStatus(sessionId: string): OrchestrationStatus;
    cancelExecution(sessionId: string): Promise<boolean>;
}

// WorkflowEngine to WorkflowContext
interface WorkflowContextInterface {
    getVariable(name: WorkflowVariableName): any;
    setVariable(name: WorkflowVariableName, value: any): void;
    getExecutionHistory(): ExecutionHistoryEntry[];
    getStepInputs(stepId: WorkflowStepId): Record<string, any>;
    getStepOutputs(stepId: WorkflowStepId): Record<string, any>;
}
```

### 2. Event-Based Communication

Use an event-based system for status updates and progress notifications:

```typescript
// In AgentWorkflowOrchestrator
class AgentWorkflowOrchestrator {
    private eventEmitter = new EventEmitter();
    
    // Subscribe to events
    onStatusChange(callback: (status: OrchestrationStatus) => void): void {
        this.eventEmitter.on('statusChange', callback);
    }
    
    onPhaseComplete(callback: (phase: string, result: any) => void): void {
        this.eventEmitter.on('phaseComplete', callback);
    }
    
    // Emit events
    private updateStatus(status: OrchestrationStatus): void {
        this.status = status;
        this.eventEmitter.emit('statusChange', status);
    }
    
    private completePhase(phase: string, result: any): void {
        this.eventEmitter.emit('phaseComplete', phase, result);
    }
}
```

### 3. Dependency Injection

Use dependency injection to make components more testable and configurable:

```typescript
class AgentWorkflowOrchestrator {
    constructor(
        private workflowEngine: WorkflowEngineInterface,
        private storageService?: StorageServiceInterface,
        private evaluationService?: EvaluationServiceInterface
    ) {}
    
    // Methods that use the injected dependencies
}
```

### 4. Asynchronous Communication

Use asynchronous communication patterns for long-running operations:

```typescript
// In WorkflowAPI
router.post('/agent-workflow', async (req, res) => {
    const { question } = req.body;
    const sessionId = uuidv4();
    
    // Start the workflow asynchronously
    orchestrator.executeFullWorkflow(question)
        .catch(error => {
            logger.error(`Workflow execution failed: ${error.message}`);
        });
    
    // Return immediately with the session ID
    return res.json({ 
        sessionId,
        status: 'processing',
        statusUrl: `/api/agent-workflow/${sessionId}/status`
    });
});

// Status endpoint
router.get('/agent-workflow/:sessionId/status', async (req, res) => {
    const { sessionId } = req.params;
    const status = orchestrator.getStatus(sessionId);
    
    return res.json(status);
});
```

## Conclusion

This architecture provides a clean separation of concerns while enabling seamless orchestration of the three-agent workflow process. The AgentWorkflowOrchestrator serves as the high-level coordinator, delegating the execution of individual workflows to the WorkflowEngine. The WorkflowContext maintains state during workflow execution, while the WorkflowAPI provides an external interface for workflow operations.

By following this architecture, we can create a system that is:

1. **Modular**: Each component has a clear responsibility
2. **Extensible**: New features can be added without disrupting existing functionality
3. **Maintainable**: Clean interfaces make the system easier to understand and modify
4. **Testable**: Components can be tested in isolation
5. **Scalable**: The system can handle increasing complexity and load

This architecture represents the ideal interaction between components in the agent workflow system, providing a blueprint for implementation. 