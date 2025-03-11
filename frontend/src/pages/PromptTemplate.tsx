import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePromptTemplates } from '../context/PromptTemplateContext';
import SchemaEditor from '../components/common/SchemaEditor';
import { extractTokens } from '../lib/utils';
import PromptMenuBar from '../components/PromptMenuBar';
import { PromptTemplateToken, PromptTemplateCreate, PromptTemplateUpdate, PromptTemplateTest } from '../types/prompts';
import { Schema, SchemaValueType } from '../types/schema';
import FileLibrary from '../components/FileLibrary';
import Dialog from '../components/common/Dialog';
import { fileApi } from '../lib/api/fileApi';

const defaultOutputSchema: Schema = {
    type: 'string',
    is_array: false,
    description: 'Default output'
};

const PromptTemplate: React.FC = () => {
    const { templateId } = useParams();
    const navigate = useNavigate();
    const {
        templates,
        selectedTemplate: template,
        setSelectedTemplate,
        createTemplate,
        updateTemplate,
        testTemplate,
        refreshTemplates
    } = usePromptTemplates();

    // State
    const [name, setName] = useState(template?.name || '');
    const [description, setDescription] = useState(template?.description || '');
    const [userMessageTemplate, setUserMessageTemplate] = useState(template?.user_message_template || '');
    const [systemMessageTemplate, setSystemMessageTemplate] = useState(template?.system_message_template || '');
    const [tokens, setTokens] = useState<PromptTemplateToken[]>(template?.tokens || []);
    const [outputSchema, setOutputSchema] = useState<Schema>(template?.output_schema || defaultOutputSchema);
    const [testParameters, setTestParameters] = useState<Record<string, string>>({});
    const [testResult, setTestResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showFileSelector, setShowFileSelector] = useState(false);
    const [selectedTokenName, setSelectedTokenName] = useState<string | null>(null);
    const [fileNames, setFileNames] = useState<Record<string, string>>({});

    // Initialize template based on URL parameter
    useEffect(() => {
        if (!templateId) {
            navigate('/prompts');
            return;
        }

        // Only load if we don't have this template or it's a different one
        if (!template || (template?.template_id !== templateId)) {
            const loadTemplate = async () => {
                try {
                    if (templateId === 'new') {
                        // Initialize new template with default values
                        setSelectedTemplate(null);
                        setName('');
                        setDescription('');
                        setUserMessageTemplate('');
                        setSystemMessageTemplate('');
                        setTokens([]);
                        setOutputSchema(defaultOutputSchema);
                        setTestParameters({});
                    } else {
                        const foundTemplate = templates.find(t => t.template_id === templateId);
                        if (foundTemplate) {
                            setSelectedTemplate(foundTemplate);
                            setName(foundTemplate.name);
                            setDescription(foundTemplate.description || '');
                            setUserMessageTemplate(foundTemplate.user_message_template);
                            setSystemMessageTemplate(foundTemplate.system_message_template || '');
                            setTokens(foundTemplate.tokens);
                            setOutputSchema(foundTemplate.output_schema);
                            const newParams: Record<string, string> = {};
                            foundTemplate.tokens.forEach(token => {
                                newParams[token.name] = '';
                            });
                            setTestParameters(newParams);
                        } else {
                            setError('Template not found');
                            navigate('/prompts');
                        }
                    }
                } catch (err) {
                    console.error('Error loading template:', err);
                    setError('Failed to load template');
                    navigate('/prompts');
                }
            };
            loadTemplate();
        }
    }, [templateId, navigate, templates, template, setSelectedTemplate]);

    // Update test parameters when template text changes
    useEffect(() => {
        const userTokens = extractTokens(userMessageTemplate);
        const systemTokens = extractTokens(systemMessageTemplate || '');

        // Merge tokens, keeping only unique ones by name
        const allTokens = [...userTokens, ...systemTokens].reduce((acc, token) => {
            if (!acc.find(t => t.name === token.name)) {
                acc.push(token);
            }
            return acc;
        }, [] as PromptTemplateToken[]);

        const newParams: Record<string, string> = {};
        allTokens.forEach(token => {
            // Preserve existing values if they exist
            newParams[token.name] = testParameters[token.name] || '';
        });
        setTestParameters(newParams);
        setTokens(allTokens);
    }, [userMessageTemplate, systemMessageTemplate]);

    // Update hasUnsavedChanges when form values change
    useEffect(() => {
        if (!template) {
            setHasUnsavedChanges(
                name !== '' ||
                description !== '' ||
                userMessageTemplate !== '' ||
                systemMessageTemplate !== ''
            );
            return;
        }

        setHasUnsavedChanges(
            name !== template.name ||
            description !== template.description ||
            userMessageTemplate !== template.user_message_template ||
            systemMessageTemplate !== (template.system_message_template || '') ||
            JSON.stringify(outputSchema) !== JSON.stringify(template.output_schema)
        );
    }, [template, name, description, userMessageTemplate, systemMessageTemplate, outputSchema]);

    // Prompt user before leaving if there are unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    // Load file names for file values
    useEffect(() => {
        const loadFileNames = async () => {
            const newFileNames: Record<string, string> = {};
            for (const [tokenName, value] of Object.entries(testParameters)) {
                if (tokens.find(t => t.name === tokenName)?.type === 'file' && value) {
                    try {
                        const fileInfo = await fileApi.getFile(value);
                        newFileNames[value] = fileInfo.name;
                    } catch (err) {
                        console.error('Error loading file name:', err);
                    }
                }
            }
            setFileNames(newFileNames);
        };
        loadFileNames();
    }, [testParameters, tokens]);

    const handleBack = async () => {
        if (hasUnsavedChanges) {
            const shouldSave = window.confirm('You have unsaved changes. Do you want to save before leaving?');
            if (shouldSave) {
                try {
                    await handleSave();
                    setSelectedTemplate(null);
                    navigate('/prompts');
                } catch (err) {
                    console.error('Error saving template:', err);
                    if (window.confirm('Failed to save changes. Leave anyway?')) {
                        setSelectedTemplate(null);
                        navigate('/prompts');
                    }
                }
            } else {
                setSelectedTemplate(null);
                navigate('/prompts');
            }
        } else {
            setSelectedTemplate(null);
            navigate('/prompts');
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);

            const templateData: PromptTemplateCreate | PromptTemplateUpdate = {
                name,
                description,
                user_message_template: userMessageTemplate,
                system_message_template: systemMessageTemplate,
                tokens,
                output_schema: outputSchema,
                ...(template?.template_id ? { template_id: template.template_id } : {})
            };

            if (template?.template_id && template.template_id !== 'new') {
                const updatedTemplate = await updateTemplate(template.template_id, templateData as PromptTemplateUpdate);
                setSelectedTemplate(updatedTemplate);
            } else {
                const newTemplate = await createTemplate(templateData as PromptTemplateCreate);
                setSelectedTemplate(newTemplate);
                navigate(`/prompt/${newTemplate.template_id}`);
            }
            await refreshTemplates();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save template');
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async () => {
        setTesting(true);
        setTestResult(null);
        try {
            setError(null);
            const testData: PromptTemplateTest = {
                user_message_template: userMessageTemplate,
                system_message_template: systemMessageTemplate,
                tokens,
                parameters: testParameters,
                output_schema: outputSchema
            };
            const result = await testTemplate(template?.template_id || '', testData);
            setTestResult(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to test template');
        } finally {
            setTesting(false);
        }
    };

    if (!templateId) return null;

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            <PromptMenuBar
                name={name}
                isSaving={saving}
                isTesting={testing}
                hasUnsavedChanges={hasUnsavedChanges}
                onSave={handleSave}
                onTest={handleTest}
                onBack={handleBack}
            />
            <div className="flex-1">
                <div className="h-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4 pb-4">
                    <div className="h-full bg-white dark:bg-gray-800 rounded-md shadow-sm overflow-y-auto">
                        <div className="p-6">
                            {/* Basic Info */}
                            <div className="mb-8">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Basic Information</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Template Name
                                        </label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 
                                                    shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 
                                                    focus:border-blue-500 sm:text-sm dark:bg-gray-800
                                                    text-gray-900 dark:text-gray-100"
                                            placeholder="Enter template name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Description
                                        </label>
                                        <input
                                            type="text"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 
                                                    shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 
                                                    focus:border-blue-500 sm:text-sm dark:bg-gray-800
                                                    text-gray-900 dark:text-gray-100"
                                            placeholder="Enter template description"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Template Content */}
                            <div className="mb-8">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Template Content</h2>

                                {/* System Message Template */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        System Message Template (Optional)
                                    </label>
                                    <textarea
                                        value={systemMessageTemplate}
                                        onChange={(e) => setSystemMessageTemplate(e.target.value)}
                                        rows={3}
                                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 
                                                shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 
                                                focus:border-blue-500 sm:text-sm dark:bg-gray-800
                                                text-gray-900 dark:text-gray-100"
                                        placeholder="Enter system message template. Use {{token}} for string tokens and <<file:token>> for file tokens."
                                    />
                                </div>

                                {/* User Message Template */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        User Message Template
                                    </label>
                                    <textarea
                                        value={userMessageTemplate}
                                        onChange={(e) => setUserMessageTemplate(e.target.value)}
                                        rows={10}
                                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 
                                                shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 
                                                focus:border-blue-500 sm:text-sm dark:bg-gray-800
                                                text-gray-900 dark:text-gray-100 font-mono"
                                        placeholder="Enter user message template. Use {{token}} for string tokens and <<file:token>> for file tokens."
                                    />
                                </div>

                                {/* Tokens */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Template Tokens
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {tokens.map(token => (
                                            <span
                                                key={token.name}
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                        ${token.type === 'string'
                                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                                                        : 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'}`}
                                            >
                                                {token.name} ({token.type})
                                            </span>
                                        ))}
                                        {tokens.length === 0 && (
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                No tokens detected. Add tokens using &#123;&#123;token_name&#125;&#125; or &lt;&lt;file:token_name&gt;&gt; syntax in your templates.
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Output Schema */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Output Schema
                                    </label>
                                    <SchemaEditor
                                        schema={outputSchema}
                                        onChange={setOutputSchema}
                                    />
                                </div>
                            </div>

                            {/* Test Section */}
                            {tokens.length > 0 && (
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Test Template</h2>
                                    <div className="space-y-4">
                                        {tokens.map(token => (
                                            <div key={token.name}>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    {token.name} ({token.type})
                                                </label>
                                                {token.type === 'file' ? (
                                                    <div className="mt-1">
                                                        {testParameters[token.name] ? (
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex-1 p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                                                                    <div className="flex items-center gap-2">
                                                                        <svg className="h-4 w-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                                        </svg>
                                                                        <span className="text-sm text-gray-900 dark:text-gray-100">
                                                                            {fileNames[testParameters[token.name]] || 'Loading...'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedTokenName(token.name);
                                                                        setShowFileSelector(true);
                                                                    }}
                                                                    className="px-3 py-1.5 text-sm font-medium rounded-md text-blue-600 dark:text-blue-400 
                                                                            border border-blue-600 dark:border-blue-400 
                                                                            hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                                                >
                                                                    Change
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedTokenName(token.name);
                                                                    setShowFileSelector(true);
                                                                }}
                                                                className="mt-1 px-3 py-1.5 text-sm font-medium rounded-md text-blue-600 dark:text-blue-400 
                                                                        border border-blue-600 dark:border-blue-400 
                                                                        hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                                            >
                                                                Select File
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        value={testParameters[token.name] || ''}
                                                        onChange={(e) => setTestParameters({
                                                            ...testParameters,
                                                            [token.name]: e.target.value
                                                        })}
                                                        className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 
                                                                shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 
                                                                focus:border-blue-500 sm:text-sm dark:bg-gray-800
                                                                text-gray-900 dark:text-gray-100"
                                                        placeholder={`Enter value for ${token.name}`}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Test Results */}
                                    {testResult && (
                                        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-md border border-gray-200 dark:border-gray-600">
                                            <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-2">Test Results</h3>
                                            <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-700">
                                                {JSON.stringify(testResult, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* File Selector Dialog */}
            <Dialog
                isOpen={showFileSelector}
                onClose={() => setShowFileSelector(false)}
                title="Select File"
            >
                <FileLibrary
                    onFileSelect={(fileId) => {
                        if (selectedTokenName) {
                            // Get file name from the API
                            fileApi.getFile(fileId).then(file => {
                                setTestParameters({
                                    ...testParameters,
                                    [selectedTokenName]: fileId
                                });
                                setFileNames({
                                    ...fileNames,
                                    [fileId]: file.name
                                });
                                setShowFileSelector(false);
                            }).catch(err => {
                                console.error('Error selecting file:', err);
                            });
                        }
                    }}
                />
            </Dialog>
        </div>
    );
};

export default PromptTemplate; 