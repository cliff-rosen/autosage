import React from 'react';
import TestComponent from '../components/TestComponent';
import { PageLayout } from '../components/layout/PageLayout';

/**
 * A page for testing components
 */
const TestPage: React.FC = () => {
    return (
        <PageLayout>
            <TestComponent />
        </PageLayout>
    );
};

export default TestPage; 