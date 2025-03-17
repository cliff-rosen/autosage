import React, { useState } from 'react';
import TestComponent from '../components/TestComponent';
import AgentWorkflowOrchestratorTest from '../components/AgentWorkflowOrchestratorTest';
import InteractiveWorkflowTest from '../components/InteractiveWorkflowTest';
import { PageLayout } from '../components/layout/PageLayout';

/**
 * Enum for the different test components
 */
enum TestComponentType {
    WORKFLOW_ENGINE = 'workflow_engine',
    WORKFLOW_ORCHESTRATOR = 'workflow_orchestrator',
    INTERACTIVE_WORKFLOW = 'interactive_workflow'
}

/**
 * A page for testing components with a menu to select between different tests
 */
const TestPage: React.FC = () => {
    // State for the selected test component
    const [selectedComponent, setSelectedComponent] = useState<TestComponentType>(
        TestComponentType.INTERACTIVE_WORKFLOW
    );

    // Render the selected test component
    const renderComponent = () => {
        switch (selectedComponent) {
            case TestComponentType.WORKFLOW_ENGINE:
                return <TestComponent />;
            case TestComponentType.WORKFLOW_ORCHESTRATOR:
                return <AgentWorkflowOrchestratorTest />;
            case TestComponentType.INTERACTIVE_WORKFLOW:
                return <InteractiveWorkflowTest />;
            default:
                return null;
        }
    };

    return (
        <PageLayout>
            <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Test Components
                </h2>
                <div className="flex flex-wrap gap-3 mb-6">
                    <button
                        onClick={() => setSelectedComponent(TestComponentType.WORKFLOW_ENGINE)}
                        className={`px-4 py-2 rounded-md font-medium transition-colors ${selectedComponent === TestComponentType.WORKFLOW_ENGINE
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                    >
                        Workflow Engine Test
                    </button>
                    <button
                        onClick={() => setSelectedComponent(TestComponentType.WORKFLOW_ORCHESTRATOR)}
                        className={`px-4 py-2 rounded-md font-medium transition-colors ${selectedComponent === TestComponentType.WORKFLOW_ORCHESTRATOR
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                    >
                        Workflow Orchestrator Test
                    </button>
                    <button
                        onClick={() => setSelectedComponent(TestComponentType.INTERACTIVE_WORKFLOW)}
                        className={`px-4 py-2 rounded-md font-medium transition-colors ${selectedComponent === TestComponentType.INTERACTIVE_WORKFLOW
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                    >
                        Interactive Workflow Test
                    </button>
                </div>
            </div>
            {renderComponent()}
        </PageLayout>
    );
};

export default TestPage; 