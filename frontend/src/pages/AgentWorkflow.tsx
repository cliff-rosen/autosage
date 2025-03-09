import React from 'react';
import AgentWorkflowDemo from '../components/AgentWorkflowDemo';

const AgentWorkflowPage: React.FC = () => {
    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Agent Workflow</h1>
                <p>Interact with the agent workflow system to answer complex questions</p>
            </div>

            <div className="page-content">
                <AgentWorkflowDemo />
            </div>
        </div>
    );
};

export default AgentWorkflowPage; 