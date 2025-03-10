import React, { useState, useEffect } from 'react';
import { Schema, SchemaValueType, isObjectValue } from '../../types/schema';

interface SchemaValueEditorProps {
    schema: Schema;
    value: SchemaValueType | undefined;
    onChange: (value: SchemaValueType) => void;
    onCancel?: () => void;
}

const SchemaValueEditor: React.FC<SchemaValueEditorProps> = ({ schema, value, onChange, onCancel }) => {
    // Initialize the value based on the schema type
    const getInitialValue = (): SchemaValueType => {
        if (value !== undefined) return value;

        if (schema.is_array) return [];

        switch (schema.type) {
            case 'string': return '';
            case 'number': return 0;
            case 'boolean': return false;
            case 'object': return {};
            case 'file': return { file_id: '', name: '', content: new Uint8Array(), mime_type: '', size: 0, created_at: '', updated_at: '' };
            default: return '';
        }
    };

    const [currentValue, setCurrentValue] = useState<SchemaValueType>(getInitialValue());

    useEffect(() => {
        setCurrentValue(value !== undefined ? value : getInitialValue());
    }, [value, schema]);

    const handleStringChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setCurrentValue(e.target.value);
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCurrentValue(parseFloat(e.target.value));
    };

    const handleBooleanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCurrentValue(e.target.checked);
    };

    const handleObjectFieldChange = (fieldName: string, fieldValue: any) => {
        if (isObjectValue(schema, currentValue)) {
            setCurrentValue({
                ...currentValue,
                [fieldName]: fieldValue
            });
        }
    };

    const handleArrayItemChange = (index: number, itemValue: any) => {
        if (Array.isArray(currentValue)) {
            const newArray = [...currentValue];
            newArray[index] = itemValue;
            setCurrentValue(newArray);
        }
    };

    const handleAddArrayItem = () => {
        if (Array.isArray(currentValue)) {
            // Create a default value based on the schema type
            let defaultValue: any;
            switch (schema.type) {
                case 'string': defaultValue = ''; break;
                case 'number': defaultValue = 0; break;
                case 'boolean': defaultValue = false; break;
                case 'object': defaultValue = {}; break;
                case 'file': defaultValue = null; break;
                default: defaultValue = '';
            }

            setCurrentValue([...currentValue, defaultValue]);
        }
    };

    const handleRemoveArrayItem = (index: number) => {
        if (Array.isArray(currentValue)) {
            const newArray = [...currentValue];
            newArray.splice(index, 1);
            setCurrentValue(newArray);
        }
    };

    const handleSave = () => {
        onChange(currentValue);
        if (onCancel) onCancel();
    };

    const renderStringEditor = () => (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                String Value
            </label>
            {(currentValue as string).length > 100 ? (
                <textarea
                    value={currentValue as string}
                    onChange={handleStringChange}
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-md text-gray-900 dark:text-gray-100"
                />
            ) : (
                <input
                    type="text"
                    value={currentValue as string}
                    onChange={handleStringChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-md text-gray-900 dark:text-gray-100"
                />
            )}
        </div>
    );

    const renderNumberEditor = () => (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Number Value
            </label>
            <input
                type="number"
                value={currentValue as number}
                onChange={handleNumberChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-md text-gray-900 dark:text-gray-100"
            />
        </div>
    );

    const renderBooleanEditor = () => (
        <div className="space-y-2">
            <label className="flex items-center space-x-2">
                <input
                    type="checkbox"
                    checked={currentValue as boolean}
                    onChange={handleBooleanChange}
                    className="rounded border-gray-300 dark:border-gray-700 text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Boolean Value
                </span>
            </label>
        </div>
    );

    const renderObjectEditor = () => {
        if (!schema.fields || !isObjectValue(schema, currentValue)) return null;

        return (
            <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Object Fields
                </h3>
                <div className="space-y-3">
                    {Object.entries(schema.fields).map(([fieldName, fieldSchema]) => (
                        <div key={fieldName} className="border border-gray-200 dark:border-gray-700 rounded-md p-3">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {fieldName}
                                {fieldSchema.description && (
                                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                        ({fieldSchema.description})
                                    </span>
                                )}
                            </h4>
                            <SchemaValueEditor
                                schema={fieldSchema}
                                value={currentValue[fieldName]}
                                onChange={(newValue) => handleObjectFieldChange(fieldName, newValue)}
                            />
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderArrayEditor = () => {
        if (!Array.isArray(currentValue)) return null;

        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Array Items ({currentValue.length})
                    </h3>
                    <button
                        type="button"
                        onClick={handleAddArrayItem}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Add Item
                    </button>
                </div>
                <div className="space-y-3">
                    {currentValue.map((item, index) => (
                        <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-md p-3">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Item {index + 1}
                                </h4>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveArrayItem(index)}
                                    className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                >
                                    Remove
                                </button>
                            </div>
                            <SchemaValueEditor
                                schema={{ ...schema, is_array: false }}
                                value={item}
                                onChange={(newValue) => handleArrayItemChange(index, newValue)}
                            />
                        </div>
                    ))}
                    {currentValue.length === 0 && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                            No items in array. Click "Add Item" to add one.
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderFileEditor = () => (
        <div className="space-y-2">
            <div className="text-sm text-gray-700 dark:text-gray-300">
                File values can only be set by selecting a file from the file library.
            </div>
        </div>
    );

    const renderEditor = () => {
        if (schema.is_array) {
            return renderArrayEditor();
        }

        switch (schema.type) {
            case 'string': return renderStringEditor();
            case 'number': return renderNumberEditor();
            case 'boolean': return renderBooleanEditor();
            case 'object': return renderObjectEditor();
            case 'file': return renderFileEditor();
            default: return null;
        }
    };

    return (
        <div className="space-y-4">
            {renderEditor()}

            <div className="flex justify-end space-x-2 mt-4">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="button"
                    onClick={handleSave}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                    Save
                </button>
            </div>
        </div>
    );
};

export default SchemaValueEditor; 