import React, { useState } from 'react';
import VariableRenderer from './common/VariableRenderer';
import JsonRenderer from './common/JsonRenderer';
import JsonEditor from './common/JsonEditor';

// Interface to match ActionStepRunner's ValueObject
interface ValueObject {
    value: any;
    schema: any;
}

/**
 * A component for testing rendering of different data structures
 */
const TestComponent: React.FC = () => {
    // Sample data for testing
    const [testData, setTestData] = useState({
        simpleArray: [1, 2, 3, 4, 5],
        arrayOfObjects: [
            { id: 1, name: 'Item 1', description: 'This is item 1', tags: ['tag1', 'tag2'] },
            { id: 2, name: 'Item 2', description: 'This is item 2', tags: ['tag2', 'tag3'] },
            { id: 3, name: 'Item 3', description: 'This is item 3', tags: ['tag1', 'tag3'] }
        ],
        nestedObjects: {
            user: {
                id: 123,
                name: 'Test User',
                profile: {
                    avatar: 'https://example.com/avatar.jpg',
                    bio: 'This is a test user'
                }
            },
            settings: {
                theme: 'dark',
                notifications: true
            }
        },
        improvementHistory: [
            {
                improvedQuestion: "What is the capital of France?",
                explanation: "This question is clear and specific.",
                evaluation: "Good question, no improvement needed.",
                confidenceScore: 0.9
            },
            {
                improvedQuestion: "What are the major landmarks in Paris?",
                explanation: "Added specificity by asking about landmarks in Paris.",
                evaluation: "Improved clarity and focus.",
                confidenceScore: 0.85
            }
        ]
    });

    // State for ActionStepRunner simulation
    const [editingInput, setEditingInput] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<any>(null);

    const handleDataChange = (newData: any) => {
        setTestData(newData);
    };

    const handleStartEdit = (paramName: string, value: any) => {
        setEditingInput(paramName);

        // For complex objects and arrays, we'll keep the original value
        // The JsonEditor component will handle the string conversion
        if (typeof value === 'object' && value !== null) {
            setEditValue(value);
        } else {
            setEditValue(value === null || value === undefined ? '' : String(value));
        }
    };

    const handleSaveEdit = (paramName: string) => {
        // Update the test data with the edited value
        setTestData(prev => {
            const newData = { ...prev };
            // Use type assertion to fix the linter error
            (newData as any)[paramName] = editValue;
            return newData;
        });

        setEditingInput(null);
        setEditValue(null);
    };

    const handleCancelEdit = () => {
        setEditingInput(null);
        setEditValue(null);
    };

    // Create ValueObject wrappers for each value (simulating ActionStepRunner)
    const wrapValuesForUI = (data: Record<string, any>): Record<string, ValueObject> => {
        const result: Record<string, ValueObject> = {};

        Object.entries(data).forEach(([key, value]) => {
            // Create a simple schema based on the value type
            const schema = {
                type: typeof value === 'object' ? 'object' : typeof value,
                is_array: Array.isArray(value),
                description: `Schema for ${key}`
            };

            result[key] = {
                value,
                schema
            };
        });

        return result;
    };

    // Wrapped values for UI (simulating ActionStepRunner's inputValues/outputValues)
    const wrappedValues = wrapValuesForUI(testData);

    // Render an editable value (simulating ActionStepRunner)
    const renderEditableValue = (paramName: string, valueObj: ValueObject) => {
        if (editingInput === paramName) {
            // For complex objects and arrays, use the JsonEditor
            if (typeof editValue === 'object' && editValue !== null) {
                return (
                    <div className="space-y-3">
                        <JsonEditor
                            value={editValue}
                            onChange={(newValue) => setEditValue(newValue)}
                        />
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => handleSaveEdit(paramName)}
                                className="px-3 py-2 text-sm font-medium text-white bg-blue-600 
                                         hover:bg-blue-700 rounded-md"
                            >
                                Save
                            </button>
                            <button
                                onClick={handleCancelEdit}
                                className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                                         hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                );
            }

            // For simple values, use a text input
            return (
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={editValue as string}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 
                                 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        autoFocus
                    />
                    <button
                        onClick={() => handleSaveEdit(paramName)}
                        className="px-3 py-2 text-sm font-medium text-white bg-blue-600 
                                 hover:bg-blue-700 rounded-md"
                    >
                        Save
                    </button>
                    <button
                        onClick={handleCancelEdit}
                        className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                                 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                    >
                        Cancel
                    </button>
                </div>
            );
        }

        // For all other values, use the VariableRenderer component
        return (
            <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                    <VariableRenderer
                        value={valueObj.value}
                        schema={valueObj.schema}
                        useEnhancedJsonView={true}
                    />
                </div>
                <button
                    onClick={() => handleStartEdit(paramName, valueObj.value)}
                    className="ml-2 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 
                             dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 hover:bg-blue-100 
                             dark:bg-blue-900/20 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                >
                    Edit
                </button>
            </div>
        );
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
                Component Testing Environment
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Editor Section */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                        Test Data Editor
                    </h2>
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                        <JsonEditor
                            value={testData}
                            onChange={handleDataChange}
                        />
                    </div>
                </div>

                {/* Renderer Section */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                        Rendering Preview
                    </h2>

                    <div className="space-y-6">
                        {/* Array of Objects */}
                        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-medium mb-3 text-gray-800 dark:text-gray-200">
                                Array of Objects (Direct)
                            </h3>
                            <VariableRenderer
                                value={testData.arrayOfObjects}
                                useEnhancedJsonView={true}
                            />
                        </div>

                        {/* Direct JsonRenderer */}
                        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-medium mb-3 text-gray-800 dark:text-gray-200">
                                Direct JsonRenderer
                            </h3>
                            <JsonRenderer
                                data={testData.arrayOfObjects}
                                initialCollapsed={false}
                                maxInitialDepth={2}
                            />
                        </div>

                        {/* Improvement History */}
                        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-medium mb-3 text-gray-800 dark:text-gray-200">
                                Improvement History (Direct)
                            </h3>
                            <VariableRenderer
                                value={testData.improvementHistory}
                                useEnhancedJsonView={true}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ActionStepRunner Simulation */}
            <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                    ActionStepRunner Simulation (Editable)
                </h2>
                <div className="grid grid-cols-1 gap-4">
                    {Object.entries(wrappedValues).map(([key, valueObj]) => (
                        <div key={key} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                    {key}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {valueObj.schema.type}{valueObj.schema.is_array ? '[]' : ''}
                                </span>
                            </div>
                            <div className="mt-2">
                                {renderEditableValue(key, valueObj)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TestComponent; 