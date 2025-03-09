import { v4 as uuidv4 } from 'uuid';
import { AgentWorkflow, AgentWorkflowType, WORKFLOW_VARIABLES } from '../../../../types/agent-workflows';
import { WorkflowStatus, WorkflowStepId, WorkflowStepType, WorkflowVariableName } from '../../../../types/workflows';
import { createArraySchema, createBasicSchema, createWorkflowVariable } from '../../../../utils/workflowUtils';

/**
 * Creates a Knowledge Base Development workflow
 */
export const createKnowledgeBaseDevelopmentWorkflow = (): AgentWorkflow => {
    const workflowId = uuidv4();

    const workflow: AgentWorkflow = {
        workflow_id: workflowId,
        agent_workflow_type: AgentWorkflowType.KNOWLEDGE_BASE_DEVELOPMENT,
        name: 'Knowledge Base Development Agent',
        description: 'Creates a comprehensive knowledge base for answering the question',
        status: WorkflowStatus.DRAFT,
        max_iterations: 5,
        confidence_threshold: 0.8,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),

        // Define workflow variables
        state: [
            createWorkflowVariable(
                uuidv4(),
                WORKFLOW_VARIABLES.KB_INPUT_QUESTION,
                createBasicSchema('string', 'The question to build a knowledge base for'),
                'input',
                true
            ),
            createWorkflowVariable(
                uuidv4(),
                WORKFLOW_VARIABLES.KNOWLEDGE_BASE,
                createArraySchema('object', 'The knowledge base containing information to answer the question'),
                'output'
            ),
            createWorkflowVariable(
                uuidv4(),
                WORKFLOW_VARIABLES.KB_COMPLETENESS_SCORE,
                createBasicSchema('number', 'Score indicating how complete the knowledge base is'),
                'output'
            ),
            createWorkflowVariable(
                uuidv4(),
                WORKFLOW_VARIABLES.KB_GAPS,
                createArraySchema('string', 'Identified gaps in the knowledge base'),
                'output'
            ),
            createWorkflowVariable(
                uuidv4(),
                WORKFLOW_VARIABLES.KB_SOURCES,
                createArraySchema('object', 'Sources of information in the knowledge base'),
                'output'
            ),
            createWorkflowVariable(
                uuidv4(),
                WORKFLOW_VARIABLES.KB_ITERATIONS,
                createBasicSchema('number', 'Number of iterations performed'),
                'output'
            )
        ],

        // Define workflow steps
        steps: [
            // Step 1: Create KB Plan (LLM)
            {
                step_id: uuidv4() as WorkflowStepId,
                workflow_id: workflowId,
                label: 'Create Knowledge Base Plan',
                description: 'Create a plan for building the knowledge base',
                step_type: WorkflowStepType.ACTION,
                tool_id: 'llm_tool_id',
                parameter_mappings: {
                    'prompt': WORKFLOW_VARIABLES.KB_INPUT_QUESTION,
                },
                output_mappings: {
                    'kb_plan': 'kb_plan' as WorkflowVariableName,
                },
                sequence_number: 1,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },

            // Step 2: Generate Search Queries (LLM)
            {
                step_id: uuidv4() as WorkflowStepId,
                workflow_id: workflowId,
                label: 'Generate Search Queries',
                description: 'Generate search queries based on the KB plan and identified gaps',
                step_type: WorkflowStepType.ACTION,
                tool_id: 'llm_tool_id',
                parameter_mappings: {
                    'question': WORKFLOW_VARIABLES.KB_INPUT_QUESTION,
                    'kb_plan': 'kb_plan' as WorkflowVariableName,
                    'kb_gaps': WORKFLOW_VARIABLES.KB_GAPS,
                },
                output_mappings: {
                    'search_queries': 'search_queries' as WorkflowVariableName,
                },
                sequence_number: 2,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },

            // Step 3: Execute Search (Search Tool)
            {
                step_id: uuidv4() as WorkflowStepId,
                workflow_id: workflowId,
                label: 'Execute Search',
                description: 'Search for information using the generated queries',
                step_type: WorkflowStepType.ACTION,
                tool_id: 'search_tool_id',
                parameter_mappings: {
                    'queries': 'search_queries' as WorkflowVariableName,
                },
                output_mappings: {
                    'search_results': 'search_results' as WorkflowVariableName,
                },
                sequence_number: 3,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },

            // Step 4: Extract Information (LLM)
            {
                step_id: uuidv4() as WorkflowStepId,
                workflow_id: workflowId,
                label: 'Extract Information',
                description: 'Extract relevant information from search results',
                step_type: WorkflowStepType.ACTION,
                tool_id: 'llm_tool_id',
                parameter_mappings: {
                    'search_results': 'search_results' as WorkflowVariableName,
                    'kb_plan': 'kb_plan' as WorkflowVariableName,
                },
                output_mappings: {
                    'extracted_info': 'extracted_info' as WorkflowVariableName,
                    'sources': WORKFLOW_VARIABLES.KB_SOURCES,
                },
                sequence_number: 4,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },

            // Step 5: Update Knowledge Base (LLM)
            {
                step_id: uuidv4() as WorkflowStepId,
                workflow_id: workflowId,
                label: 'Update Knowledge Base',
                description: 'Update the knowledge base with extracted information',
                step_type: WorkflowStepType.ACTION,
                tool_id: 'llm_tool_id',
                parameter_mappings: {
                    'current_kb': WORKFLOW_VARIABLES.KNOWLEDGE_BASE,
                    'extracted_info': 'extracted_info' as WorkflowVariableName,
                    'kb_plan': 'kb_plan' as WorkflowVariableName,
                },
                output_mappings: {
                    'updated_kb': WORKFLOW_VARIABLES.KNOWLEDGE_BASE,
                    'identified_gaps': WORKFLOW_VARIABLES.KB_GAPS,
                },
                sequence_number: 5,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },

            // Step 6: Evaluate Knowledge Base (LLM)
            {
                step_id: uuidv4() as WorkflowStepId,
                workflow_id: workflowId,
                label: 'Evaluate Knowledge Base',
                description: 'Evaluate the completeness of the knowledge base',
                step_type: WorkflowStepType.ACTION,
                tool_id: 'llm_evaluation_tool_id',
                parameter_mappings: {
                    'knowledge_base': WORKFLOW_VARIABLES.KNOWLEDGE_BASE,
                    'question': WORKFLOW_VARIABLES.KB_INPUT_QUESTION,
                    'kb_plan': 'kb_plan' as WorkflowVariableName,
                },
                output_mappings: {
                    'kb_completeness': WORKFLOW_VARIABLES.KB_COMPLETENESS_SCORE,
                    'kb_gaps': WORKFLOW_VARIABLES.KB_GAPS,
                },
                sequence_number: 6,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },

            // Step 7: Update Iteration Count
            {
                step_id: uuidv4() as WorkflowStepId,
                workflow_id: workflowId,
                label: 'Update Iteration Count',
                description: 'Increment the iteration counter',
                step_type: WorkflowStepType.COUNTER,
                counter_variable: WORKFLOW_VARIABLES.KB_ITERATIONS,
                sequence_number: 7,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }
        ]
    };

    return workflow;
}; 