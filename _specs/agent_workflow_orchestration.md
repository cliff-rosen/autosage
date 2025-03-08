# Agent Workflow Orchestration

## Overview

This document outlines the orchestration mechanism for the three-agent workflow architecture (Question Development, Knowledge Base Development, and Answer Generation). While each individual agent is orchestrated by the existing `WorkflowEngine.runJob` mechanism, we need a higher-level orchestration layer to manage the sequence of these three workflows and handle the data flow between them.

## Orchestration Options

There are several approaches to implementing the orchestration layer:

### 1. Meta-Workflow Approach

In this approach, we create a "meta-workflow" that contains steps to execute each of the three agent workflows in sequence. This is the approach outlined in the `createCompleteAgentWorkflow()` function in the implementation specification.

**Pros:**
- Leverages the existing workflow system
- Provides a consistent interface for execution
- Can be visualized and monitored using existing workflow UI

**Cons:**
- Requires a special "workflow executor" tool that can run sub-workflows
- May add complexity to the workflow engine

### 2. Dedicated Orchestrator Service

In this approach, we create a dedicated orchestrator service that manages the execution of the three workflows.

```typescript
export class AgentWorkflowOrchestrator {
    private workflowEngine: WorkflowEngine;
    private questionDevWorkflow: AgentWorkflow;
    private kbDevWorkflow: AgentWorkflow;
    private answerGenWorkflow: AgentWorkflow;
    
    constructor(workflowEngine: WorkflowEngine) {
        this.workflowEngine = workflowEngine;
        this.questionDevWorkflow = createQuestionDevelopmentWorkflow();
        this.kbDevWorkflow = createKnowledgeBaseDevelopmentWorkflow();
        this.answerGenWorkflow = createAnswerGenerationWorkflow();
    }
    
    async executeFullWorkflow(originalQuestion: string): Promise<string> {
        // Step 1: Execute Question Development
        const questionDevResult = await this.workflowEngine.runJob({
            workflow: this.questionDevWorkflow,
            inputs: {
                [ORIGINAL_QUESTION]: originalQuestion
            }
        });
        
        if (!questionDevResult.success) {
            throw new Error(`Question Development failed: ${questionDevResult.error}`);
        }
        
        const improvedQuestion = questionDevResult.outputs?.[IMPROVED_QUESTION] as string;
        
        // Step 2: Execute Knowledge Base Development
        const kbDevResult = await this.workflowEngine.runJob({
            workflow: this.kbDevWorkflow,
            inputs: {
                [KB_INPUT_QUESTION]: improvedQuestion
            }
        });
        
        if (!kbDevResult.success) {
            throw new Error(`Knowledge Base Development failed: ${kbDevResult.error}`);
        }
        
        const knowledgeBase = kbDevResult.outputs?.[KNOWLEDGE_BASE];
        
        // Step 3: Execute Answer Generation
        const answerGenResult = await this.workflowEngine.runJob({
            workflow: this.answerGenWorkflow,
            inputs: {
                [ANSWER_INPUT_QUESTION]: improvedQuestion,
                [ANSWER_INPUT_KB]: knowledgeBase
            }
        });
        
        if (!answerGenResult.success) {
            throw new Error(`Answer Generation failed: ${answerGenResult.error}`);
        }
        
        return answerGenResult.outputs?.[FINAL_ANSWER] as string;
    }
    
    // Additional methods for monitoring, pausing, resuming, etc.
}
```

**Pros:**
- Clear separation of concerns
- More flexible control over the execution flow
- Easier to implement advanced features like pausing/resuming, error handling, etc.

**Cons:**
- Requires a new service outside the workflow system
- May duplicate some functionality of the workflow engine

### 3. Workflow Engine Extension

In this approach, we extend the existing workflow engine to support the concept of "composite workflows" that can execute other workflows.

```typescript
export class ExtendedWorkflowEngine extends WorkflowEngine {
    async runCompositeJob(compositeJob: CompositeWorkflowJob): Promise<CompositeJobResult> {
        const { workflows, initialInputs } = compositeJob;
        let currentInputs = initialInputs;
        const results: JobResult[] = [];
        
        for (const workflow of workflows) {
            const jobResult = await this.runJob({
                workflow,
                inputs: currentInputs
            });
            
            results.push(jobResult);
            
            if (!jobResult.success) {
                return {
                    success: false,
                    error: `Workflow ${workflow.name} failed: ${jobResult.error}`,
                    results
                };
            }
            
            // Update inputs for the next workflow
            currentInputs = {
                ...currentInputs,
                ...jobResult.outputs
            };
        }
        
        return {
            success: true,
            results,
            finalOutputs: currentInputs
        };
    }
}

// Usage
const compositeJob: CompositeWorkflowJob = {
    workflows: [
        createQuestionDevelopmentWorkflow(),
        createKnowledgeBaseDevelopmentWorkflow(),
        createAnswerGenerationWorkflow()
    ],
    initialInputs: {
        [ORIGINAL_QUESTION]: "What is the capital of France?"
    },
    outputMapping: {
        [FINAL_ANSWER]: "final_answer"
    }
};

const result = await extendedWorkflowEngine.runCompositeJob(compositeJob);
```

**Pros:**
- Integrates seamlessly with the existing workflow engine
- Maintains the workflow abstraction throughout
- Provides a clean interface for executing composite workflows

**Cons:**
- Requires modifications to the core workflow engine
- May complicate the workflow engine's architecture

## Recommended Approach

Based on the evaluation of the options, we recommend implementing the **Dedicated Orchestrator Service** approach (Option 2) for the following reasons:

1. It provides a clear separation of concerns
2. It doesn't require modifying the core workflow engine
3. It offers flexibility for implementing advanced orchestration features
4. It can be implemented as a higher-level service that uses the existing workflow engine

## Implementation Details

### AgentWorkflowOrchestrator

The `AgentWorkflowOrchestrator` class will be responsible for:

1. Creating and configuring the three agent workflows
2. Executing them in sequence
3. Handling data flow between workflows
4. Providing monitoring and control capabilities
5. Implementing error handling and recovery mechanisms

```typescript
export interface OrchestrationStatus {
    currentPhase: 'question_development' | 'kb_development' | 'answer_generation' | 'completed' | 'failed';
    progress: number; // 0-100
    currentWorkflowStatus?: JobStatus;
    error?: string;
    results?: {
        improvedQuestion?: string;
        knowledgeBase?: any;
        finalAnswer?: string;
    };
}

export class AgentWorkflowOrchestrator {
    private workflowEngine: WorkflowEngine;
    private status: OrchestrationStatus;
    private statusListeners: ((status: OrchestrationStatus) => void)[] = [];
    
    constructor(workflowEngine: WorkflowEngine) {
        this.workflowEngine = workflowEngine;
        this.status = {
            currentPhase: 'question_development',
            progress: 0
        };
    }
    
    addStatusListener(listener: (status: OrchestrationStatus) => void): void {
        this.statusListeners.push(listener);
    }
    
    private updateStatus(updates: Partial<OrchestrationStatus>): void {
        this.status = { ...this.status, ...updates };
        this.statusListeners.forEach(listener => listener(this.status));
    }
    
    async executeFullWorkflow(originalQuestion: string): Promise<string> {
        try {
            // Reset status
            this.updateStatus({
                currentPhase: 'question_development',
                progress: 0,
                error: undefined,
                results: {}
            });
            
            // Step 1: Execute Question Development
            const questionDevWorkflow = createQuestionDevelopmentWorkflow();
            const questionDevResult = await this.workflowEngine.runJob({
                workflow: questionDevWorkflow,
                inputs: {
                    [ORIGINAL_QUESTION]: originalQuestion
                }
            });
            
            if (!questionDevResult.success) {
                throw new Error(`Question Development failed: ${questionDevResult.error}`);
            }
            
            const improvedQuestion = questionDevResult.outputs?.[IMPROVED_QUESTION] as string;
            this.updateStatus({
                currentPhase: 'kb_development',
                progress: 33,
                results: {
                    improvedQuestion
                }
            });
            
            // Step 2: Execute Knowledge Base Development
            const kbDevWorkflow = createKnowledgeBaseDevelopmentWorkflow();
            const kbDevResult = await this.workflowEngine.runJob({
                workflow: kbDevWorkflow,
                inputs: {
                    [KB_INPUT_QUESTION]: improvedQuestion
                }
            });
            
            if (!kbDevResult.success) {
                throw new Error(`Knowledge Base Development failed: ${kbDevResult.error}`);
            }
            
            const knowledgeBase = kbDevResult.outputs?.[KNOWLEDGE_BASE];
            this.updateStatus({
                currentPhase: 'answer_generation',
                progress: 66,
                results: {
                    ...this.status.results,
                    knowledgeBase
                }
            });
            
            // Step 3: Execute Answer Generation
            const answerGenWorkflow = createAnswerGenerationWorkflow();
            const answerGenResult = await this.workflowEngine.runJob({
                workflow: answerGenWorkflow,
                inputs: {
                    [ANSWER_INPUT_QUESTION]: improvedQuestion,
                    [ANSWER_INPUT_KB]: knowledgeBase
                }
            });
            
            if (!answerGenResult.success) {
                throw new Error(`Answer Generation failed: ${answerGenResult.error}`);
            }
            
            const finalAnswer = answerGenResult.outputs?.[FINAL_ANSWER] as string;
            this.updateStatus({
                currentPhase: 'completed',
                progress: 100,
                results: {
                    ...this.status.results,
                    finalAnswer
                }
            });
            
            return finalAnswer;
        } catch (error) {
            this.updateStatus({
                currentPhase: 'failed',
                error: error.message
            });
            throw error;
        }
    }
    
    getCurrentStatus(): OrchestrationStatus {
        return this.status;
    }
}
```

### API Integration

The orchestrator can be exposed through an API endpoint:

```typescript
// In API controller
router.post('/agent-workflow', async (req, res) => {
    const { question } = req.body;
    
    if (!question) {
        return res.status(400).json({ error: 'Question is required' });
    }
    
    const orchestrator = new AgentWorkflowOrchestrator(workflowEngine);
    
    try {
        const answer = await orchestrator.executeFullWorkflow(question);
        return res.json({ answer });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
```

### UI Integration

The orchestrator can be integrated with the UI to provide real-time status updates:

```typescript
// In UI component
const [status, setStatus] = useState<OrchestrationStatus>({
    currentPhase: 'question_development',
    progress: 0
});

useEffect(() => {
    // Set up WebSocket or polling to receive status updates
    const socket = new WebSocket('ws://api/agent-workflow-status');
    
    socket.onmessage = (event) => {
        const newStatus = JSON.parse(event.data);
        setStatus(newStatus);
    };
    
    return () => socket.close();
}, []);

// Render status
return (
    <div>
        <ProgressBar value={status.progress} />
        <div>Current Phase: {status.currentPhase}</div>
        {status.error && <div className="error">{status.error}</div>}
        {status.results?.improvedQuestion && (
            <div>
                <h3>Improved Question:</h3>
                <p>{status.results.improvedQuestion}</p>
            </div>
        )}
        {status.results?.finalAnswer && (
            <div>
                <h3>Final Answer:</h3>
                <p>{status.results.finalAnswer}</p>
            </div>
        )}
    </div>
);
```

## Advanced Features

The orchestrator can be extended with additional features:

### 1. Persistence

Store the state of the orchestration to allow for resuming interrupted workflows:

```typescript
export class PersistentAgentWorkflowOrchestrator extends AgentWorkflowOrchestrator {
    private storageService: StorageService;
    
    constructor(workflowEngine: WorkflowEngine, storageService: StorageService) {
        super(workflowEngine);
        this.storageService = storageService;
    }
    
    async saveState(sessionId: string): Promise<void> {
        await this.storageService.saveOrchestrationState(sessionId, this.getCurrentStatus());
    }
    
    async loadState(sessionId: string): Promise<boolean> {
        const savedState = await this.storageService.getOrchestrationState(sessionId);
        if (savedState) {
            this.updateStatus(savedState);
            return true;
        }
        return false;
    }
    
    async resumeWorkflow(sessionId: string, originalQuestion: string): Promise<string> {
        const loaded = await this.loadState(sessionId);
        if (!loaded) {
            return this.executeFullWorkflow(originalQuestion);
        }
        
        // Resume from the current phase
        switch (this.getCurrentStatus().currentPhase) {
            case 'question_development':
                return this.executeFullWorkflow(originalQuestion);
            
            case 'kb_development':
                return this.executeFromKnowledgeBase(
                    originalQuestion,
                    this.getCurrentStatus().results?.improvedQuestion
                );
            
            case 'answer_generation':
                return this.executeFromAnswerGeneration(
                    originalQuestion,
                    this.getCurrentStatus().results?.improvedQuestion,
                    this.getCurrentStatus().results?.knowledgeBase
                );
            
            case 'completed':
                return this.getCurrentStatus().results?.finalAnswer;
            
            default:
                return this.executeFullWorkflow(originalQuestion);
        }
    }
    
    // Methods to execute from specific phases
    private async executeFromKnowledgeBase(originalQuestion: string, improvedQuestion: string): Promise<string> {
        // Implementation to start from KB development phase
    }
    
    private async executeFromAnswerGeneration(
        originalQuestion: string,
        improvedQuestion: string,
        knowledgeBase: any
    ): Promise<string> {
        // Implementation to start from answer generation phase
    }
}
```

### 2. Parallel Execution

For certain scenarios, parts of the knowledge base development could be parallelized:

```typescript
async executeParallelKnowledgeBaseQueries(queries: string[]): Promise<SearchResult[]> {
    return Promise.all(
        queries.map(query => this.searchService.executeQuery(query))
    );
}
```

### 3. Feedback Loop

Implement a feedback loop where the final answer quality can trigger refinements in earlier phases:

```typescript
async executeWithFeedbackLoop(originalQuestion: string): Promise<string> {
    let finalAnswer = await this.executeFullWorkflow(originalQuestion);
    let answerQuality = await this.evaluateAnswerQuality(finalAnswer);
    
    if (answerQuality < 0.7) {
        // Identify which phase needs improvement
        const phaseToImprove = await this.identifyPhaseForImprovement(
            originalQuestion,
            this.getCurrentStatus().results?.improvedQuestion,
            this.getCurrentStatus().results?.knowledgeBase,
            finalAnswer
        );
        
        if (phaseToImprove === 'question_development') {
            // Refine the question with feedback
            return this.executeWithQuestionRefinement(originalQuestion, finalAnswer);
        } else if (phaseToImprove === 'kb_development') {
            // Enhance the knowledge base with feedback
            return this.executeWithKnowledgeBaseEnhancement(
                originalQuestion,
                this.getCurrentStatus().results?.improvedQuestion,
                finalAnswer
            );
        }
    }
    
    return finalAnswer;
}
```

## Conclusion

The dedicated `AgentWorkflowOrchestrator` provides a flexible and powerful mechanism for orchestrating the three-agent workflow architecture. It leverages the existing workflow engine while adding the higher-level coordination needed to manage the sequence of workflows and the data flow between them.

This approach allows for:

1. Clear separation of concerns
2. Flexible control over the execution flow
3. Advanced features like persistence, parallel execution, and feedback loops
4. Real-time monitoring and status updates
5. Graceful error handling and recovery

By implementing this orchestration layer, we can provide a seamless end-to-end experience for users while maintaining the modularity and flexibility of the three-agent architecture. 