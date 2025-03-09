# Agent Workflow Sequence Diagrams

This document contains sequence diagrams illustrating the interactions between components in the agent workflow system.

## 1. Overall Workflow Execution Sequence

```mermaid
sequenceDiagram
    participant User
    participant UI as UI Component
    participant API as Workflow API
    participant Orchestrator as AgentWorkflowOrchestrator
    participant Engine as WorkflowEngine
    participant QD as Question Development Workflow
    participant KB as Knowledge Base Development Workflow
    participant AG as Answer Generation Workflow

    User->>UI: Enter question
    UI->>API: POST /agent-workflow
    API->>Orchestrator: executeFullWorkflow(question)
    
    Note over Orchestrator: Initialize orchestration
    Orchestrator->>Orchestrator: Create session ID
    Orchestrator->>API: Send initial status
    API->>UI: Return session ID & status URL
    
    Note over Orchestrator: Question Development Phase
    Orchestrator->>QD: Create Question Development workflow
    Orchestrator->>Engine: runJob(questionDevWorkflow)
    Engine->>Engine: Execute workflow steps
    Engine-->>Orchestrator: Return result (improved question)
    Orchestrator->>API: Send status update (33% complete)
    API-->>UI: Send status via WebSocket
    
    Note over Orchestrator: Knowledge Base Development Phase
    Orchestrator->>KB: Create Knowledge Base Development workflow
    Orchestrator->>Engine: runJob(kbDevWorkflow)
    Engine->>Engine: Execute workflow steps
    Engine-->>Orchestrator: Return result (knowledge base)
    Orchestrator->>API: Send status update (66% complete)
    API-->>UI: Send status via WebSocket
    
    Note over Orchestrator: Answer Generation Phase
    Orchestrator->>AG: Create Answer Generation workflow
    Orchestrator->>Engine: runJob(answerGenWorkflow)
    Engine->>Engine: Execute workflow steps
    Engine-->>Orchestrator: Return result (final answer)
    Orchestrator->>API: Send status update (100% complete)
    API-->>UI: Send status via WebSocket
    
    Orchestrator-->>API: Return final answer
    API-->>UI: Display final answer
    UI-->>User: Show final answer
```

## 2. Question Development Workflow Execution

```mermaid
sequenceDiagram
    participant Orchestrator as AgentWorkflowOrchestrator
    participant Engine as WorkflowEngine
    participant Context as WorkflowContext
    participant LLM1 as LLM (Improve Question)
    participant LLM2 as LLM (Evaluate Question)
    participant Eval as Evaluation Step

    Orchestrator->>Engine: runJob(questionDevWorkflow)
    Engine->>Context: Create new context
    Engine->>Context: Set input variable (original_question)
    
    Note over Engine: Step 1: Improve Question
    Engine->>LLM1: Execute LLM step
    LLM1->>LLM1: Process original question
    LLM1-->>Engine: Return improved question
    Engine->>Context: Store improved_question
    
    Note over Engine: Step 2: Evaluate Question
    Engine->>LLM2: Execute LLM evaluation step
    LLM2->>Context: Get original_question
    LLM2->>Context: Get improved_question
    LLM2->>LLM2: Evaluate improvement
    LLM2-->>Engine: Return evaluation score and feedback
    Engine->>Context: Store evaluation results
    
    Note over Engine: Step 3: Decision Evaluation
    Engine->>Eval: Execute evaluation step
    Eval->>Context: Get question_improvement_confidence
    Eval->>Context: Get question_improvement_iterations
    
    alt Confidence >= Threshold
        Eval-->>Engine: Continue to next step
    else Iterations >= Max Iterations
        Eval-->>Engine: Continue to next step
    else Needs Improvement
        Eval-->>Engine: Jump back to Step 1
        Engine->>Context: Increment iterations
        Engine->>LLM1: Execute LLM step again
        Note over Engine, LLM1: Repeat improvement cycle
    end
    
    Engine->>Context: Get final outputs
    Engine-->>Orchestrator: Return job result
```

## 3. Knowledge Base Development Workflow Execution

```mermaid
sequenceDiagram
    participant Orchestrator as AgentWorkflowOrchestrator
    participant Engine as WorkflowEngine
    participant Context as WorkflowContext
    participant LLM1 as LLM (Plan KB)
    participant LLM2 as LLM (Generate Queries)
    participant Search as Search Tool
    participant LLM3 as LLM (Extract Info)
    participant LLM4 as LLM (Update KB)
    participant LLM5 as LLM (Evaluate KB)
    participant Eval as Evaluation Step

    Orchestrator->>Engine: runJob(kbDevWorkflow)
    Engine->>Context: Create new context
    Engine->>Context: Set input variable (kb_input_question)
    
    Note over Engine: Step 1: Plan Knowledge Base
    Engine->>LLM1: Execute LLM step
    LLM1->>LLM1: Create KB plan
    LLM1-->>Engine: Return KB plan
    Engine->>Context: Store kb_plan
    
    Note over Engine: Step 2: Generate Search Queries
    Engine->>LLM2: Execute LLM step
    LLM2->>Context: Get kb_input_question
    LLM2->>Context: Get kb_plan
    LLM2->>Context: Get kb_gaps (if any)
    LLM2->>LLM2: Generate search queries
    LLM2-->>Engine: Return search queries
    Engine->>Context: Store search_queries
    
    Note over Engine: Step 3: Execute Search
    Engine->>Search: Execute search tool
    Search->>Context: Get search_queries
    Search->>Search: Perform searches
    Search-->>Engine: Return search results
    Engine->>Context: Store search_results
    
    Note over Engine: Step 4: Extract Information
    Engine->>LLM3: Execute LLM step
    LLM3->>Context: Get search_results
    LLM3->>Context: Get kb_plan
    LLM3->>LLM3: Extract relevant information
    LLM3-->>Engine: Return extracted info and sources
    Engine->>Context: Store extracted_info and kb_sources
    
    Note over Engine: Step 5: Update Knowledge Base
    Engine->>LLM4: Execute LLM step
    LLM4->>Context: Get current_kb (or empty if first iteration)
    LLM4->>Context: Get extracted_info
    LLM4->>Context: Get kb_plan
    LLM4->>LLM4: Integrate information into KB
    LLM4-->>Engine: Return updated KB and identified gaps
    Engine->>Context: Store knowledge_base and kb_gaps
    
    Note over Engine: Step 6: Evaluate Knowledge Base
    Engine->>LLM5: Execute LLM evaluation step
    LLM5->>Context: Get knowledge_base
    LLM5->>Context: Get kb_input_question
    LLM5->>Context: Get kb_plan
    LLM5->>LLM5: Evaluate KB completeness
    LLM5-->>Engine: Return evaluation score and gaps
    Engine->>Context: Store kb_completeness_score and kb_gaps
    
    Note over Engine: Step 7: Knowledge Base Decision
    Engine->>Eval: Execute evaluation step
    Eval->>Context: Get kb_completeness_score
    Eval->>Context: Get kb_development_iterations
    
    alt Completeness >= Threshold
        Eval-->>Engine: Continue to next step
    else Iterations >= Max Iterations
        Eval-->>Engine: Continue to next step
    else Needs More Information
        Eval-->>Engine: Jump back to Step 2
        Engine->>Context: Increment iterations
        Engine->>LLM2: Execute LLM step again
        Note over Engine, LLM2: Repeat KB development cycle
    end
    
    Engine->>Context: Get final outputs
    Engine-->>Orchestrator: Return job result
```

## 4. Answer Generation Workflow Execution

```mermaid
sequenceDiagram
    participant Orchestrator as AgentWorkflowOrchestrator
    participant Engine as WorkflowEngine
    participant Context as WorkflowContext
    participant LLM1 as LLM (Plan Answer)
    participant LLM2 as LLM (Generate Answer)
    participant LLM3 as LLM (Evaluate Answer)
    participant LLM4 as LLM (Refine Answer)
    participant Eval as Evaluation Step

    Orchestrator->>Engine: runJob(answerGenWorkflow)
    Engine->>Context: Create new context
    Engine->>Context: Set input variables (answer_input_question, answer_input_kb)
    
    Note over Engine: Step 1: Plan Answer
    Engine->>LLM1: Execute LLM step
    LLM1->>Context: Get answer_input_question
    LLM1->>Context: Get answer_input_kb
    LLM1->>LLM1: Create answer plan
    LLM1-->>Engine: Return answer plan
    Engine->>Context: Store answer_plan
    
    Note over Engine: Step 2: Generate Draft Answer
    Engine->>LLM2: Execute LLM step
    LLM2->>Context: Get answer_input_question
    LLM2->>Context: Get answer_input_kb
    LLM2->>Context: Get answer_plan
    LLM2->>LLM2: Generate draft answer
    LLM2-->>Engine: Return draft answer and sources
    Engine->>Context: Store draft_answer and answer_sources
    
    Note over Engine: Step 3: Evaluate Answer
    Engine->>LLM3: Execute LLM evaluation step
    LLM3->>Context: Get answer_input_question
    LLM3->>Context: Get answer_input_kb
    LLM3->>Context: Get draft_answer
    LLM3->>LLM3: Evaluate answer quality
    LLM3-->>Engine: Return evaluation score and feedback
    Engine->>Context: Store answer_confidence and answer_feedback
    
    Note over Engine: Step 4: Refine Answer
    Engine->>LLM4: Execute LLM step
    LLM4->>Context: Get draft_answer
    LLM4->>Context: Get answer_feedback
    LLM4->>Context: Get answer_input_kb
    LLM4->>LLM4: Refine answer based on feedback
    LLM4-->>Engine: Return refined answer and updated sources
    Engine->>Context: Store final_answer and answer_sources
    
    Note over Engine: Step 5: Answer Decision
    Engine->>Eval: Execute evaluation step
    Eval->>Context: Get answer_confidence
    Eval->>Context: Get answer_iterations
    
    alt Confidence >= Threshold
        Eval-->>Engine: Continue to next step
    else Iterations >= Max Iterations
        Eval-->>Engine: Continue to next step
    else Needs Refinement
        Eval-->>Engine: Jump back to Step 3
        Engine->>Context: Increment iterations
        Engine->>LLM3: Execute LLM step again
        Note over Engine, LLM3: Repeat answer refinement cycle
    end
    
    Engine->>Context: Get final outputs
    Engine-->>Orchestrator: Return job result
```

## 5. Frontend Component Interaction

```mermaid
sequenceDiagram
    participant User
    participant Component as AgentWorkflowContainer
    participant Service as AgentWorkflowService
    participant API as Backend API
    participant WebSocket as WebSocket Connection

    User->>Component: Enter question and submit
    Component->>Service: executeFullWorkflow(question)
    Service->>API: POST /agent-workflow
    API-->>Service: Return session ID and status URL
    
    Service->>WebSocket: Connect to WebSocket
    
    Note over WebSocket: Real-time status updates
    WebSocket-->>Service: Status update event
    Service-->>Component: Emit status change event
    Component-->>User: Update UI with progress
    
    WebSocket-->>Service: Phase complete event
    Service-->>Component: Emit phase complete event
    Component-->>User: Update UI with phase results
    
    WebSocket-->>Service: Workflow complete event
    Service-->>Component: Emit workflow complete event
    Component-->>User: Display final answer
    
    alt User cancels workflow
        User->>Component: Click cancel button
        Component->>Service: cancelExecution(sessionId)
        Service->>API: POST /agent-workflow/{sessionId}/cancel
        API-->>Service: Return success status
        Service->>WebSocket: Close WebSocket connection
        Service-->>Component: Return cancel result
        Component-->>User: Update UI to show canceled state
    end
```

## 6. Error Handling Sequence

```mermaid
sequenceDiagram
    participant User
    participant UI as UI Component
    participant Service as AgentWorkflowService
    participant API as Workflow API
    participant Orchestrator as AgentWorkflowOrchestrator
    participant Engine as WorkflowEngine

    User->>UI: Enter question
    UI->>Service: executeFullWorkflow(question)
    Service->>API: POST /agent-workflow
    API->>Orchestrator: executeFullWorkflow(question)
    
    Orchestrator->>Engine: runJob(workflow)
    
    alt Error in workflow execution
        Engine--xOrchestrator: Throw error
        Orchestrator->>Orchestrator: Update status to 'failed'
        Orchestrator->>API: Send error status
        API-->>Service: Send error via WebSocket
        Service-->>UI: Emit error event
        UI-->>User: Display error message
    else Error in orchestration
        Orchestrator--xAPI: Throw error
        API-->>Service: Return error response
        Service-->>UI: Throw error
        UI-->>User: Display error message
    else Network error
        Service--xUI: Throw error
        UI-->>User: Display network error message
    end
```

These sequence diagrams illustrate the detailed interactions between components in the agent workflow system, showing how data flows through the system and how the different phases of the workflow are executed. 