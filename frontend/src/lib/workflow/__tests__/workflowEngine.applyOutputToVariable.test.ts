import { describe, test, expect } from 'vitest';
import { WorkflowEngine } from '../workflowEngine';
import { WorkflowVariable, VariableOperationType, WorkflowVariableName } from '../../../types/workflows';
import { Schema } from '../../../types/schema';

// Make the private method accessible for testing
// @ts-ignore - Accessing private method for testing
const applyOutputToVariable = WorkflowEngine['applyOutputToVariable'];

// Constants used in tests
const APPEND_DELIMITER = '\n'; // This should match the delimiter used in the actual implementation

// Helper to create a WorkflowVariableName from a string
const createVarName = (name: string): WorkflowVariableName => {
    return name as unknown as WorkflowVariableName;
};

describe('WorkflowEngine.applyOutputToVariable', () => {
    // Helper function to create a workflow variable
    const createVariable = (
        value: any,
        type: string = 'string',
        isArray: boolean = false
    ): WorkflowVariable => ({
        variable_id: 'test-var-id',
        name: createVarName('testVar'),
        value,
        schema: { type, is_array: isArray } as Schema,
        io_type: 'output'
    });

    // String Variable Tests
    describe('String Variable', () => {
        // String to String
        test('ASSIGN: string to string - direct assignment', () => {
            const variable = createVariable('original');
            const mapping = createVarName('simple-mapping'); // Simple string mapping
            const result = applyOutputToVariable(variable, mapping, 'new value');
            expect(result).toBe('new value');
        });

        test('APPEND: string to string - concatenate with delimiter', () => {
            const variable = createVariable('original');
            const mapping = {
                variable: createVarName('testVar'),
                operation: VariableOperationType.APPEND
            };
            const result = applyOutputToVariable(variable, mapping, 'appended');
            expect(result).toBe(`original${APPEND_DELIMITER}appended`);
        });

        // String Array to String
        test('ASSIGN: string[] to string - join array elements with delimiter', () => {
            const variable = createVariable('original');
            const mapping = {
                variable: createVarName('testVar'),
                operation: VariableOperationType.ASSIGN
            };
            const result = applyOutputToVariable(variable, mapping, ['one', 'two', 'three']);
            // Assuming the implementation joins array elements with delimiter
            expect(result).toBe(['one', 'two', 'three'].join(APPEND_DELIMITER));
        });

        test('APPEND: string[] to string - append joined array to string', () => {
            const variable = createVariable('original');
            const mapping = {
                variable: createVarName('testVar'),
                operation: VariableOperationType.APPEND
            };
            const result = applyOutputToVariable(variable, mapping, ['one', 'two']);
            // Assuming the implementation joins array elements with delimiter
            expect(result).toBe(`original${APPEND_DELIMITER}${['one', 'two'].join(APPEND_DELIMITER)}`);
        });

        // Object to String
        test('ASSIGN: object to string - convert object to JSON string', () => {
            const variable = createVariable('original');
            const mapping = {
                variable: createVarName('testVar'),
                operation: VariableOperationType.ASSIGN
            };
            const obj = { key: 'value', num: 42 };
            const result = applyOutputToVariable(variable, mapping, obj);
            // Assuming the implementation converts objects to JSON strings
            expect(result).toBe(JSON.stringify(obj));
        });

        test('APPEND: object to string - append JSON string to string', () => {
            const variable = createVariable('original');
            const mapping = {
                variable: createVarName('testVar'),
                operation: VariableOperationType.APPEND
            };
            const obj = { key: 'value', num: 42 };
            const result = applyOutputToVariable(variable, mapping, obj);
            // Assuming the implementation converts objects to JSON strings
            expect(result).toBe(`original${APPEND_DELIMITER}${JSON.stringify(obj)}`);
        });

        // Object Array to String
        test('ASSIGN: object[] to string - convert each object to JSON and join', () => {
            const variable = createVariable('original');
            const mapping = {
                variable: createVarName('testVar'),
                operation: VariableOperationType.ASSIGN
            };
            const objArray = [{ id: 1 }, { id: 2 }];
            const result = applyOutputToVariable(variable, mapping, objArray);
            // Assuming the implementation converts each object to JSON and joins
            const expected = objArray.map(obj => JSON.stringify(obj)).join(APPEND_DELIMITER);
            expect(result).toBe(expected);
        });

        test('APPEND: object[] to string - append joined JSON strings to string', () => {
            const variable = createVariable('original');
            const mapping = {
                variable: createVarName('testVar'),
                operation: VariableOperationType.APPEND
            };
            const objArray = [{ id: 1 }, { id: 2 }];
            const result = applyOutputToVariable(variable, mapping, objArray);
            // Assuming the implementation converts each object to JSON and joins
            const jsonStrings = objArray.map(obj => JSON.stringify(obj)).join(APPEND_DELIMITER);
            expect(result).toBe(`original${APPEND_DELIMITER}${jsonStrings}`);
        });
    });

    // String Array Variable Tests
    describe('String Array Variable', () => {
        // String to String Array
        test('ASSIGN: string to string[] - create single-element array', () => {
            const variable = createVariable([], 'string', true);
            const mapping = {
                variable: createVarName('testVar'),
                operation: VariableOperationType.ASSIGN
            };
            const result = applyOutputToVariable(variable, mapping, 'new value');
            expect(result).toEqual(['new value']);
        });

        test('APPEND: string to string[] - append string as new element', () => {
            const variable = createVariable(['existing'], 'string', true);
            const mapping = {
                variable: createVarName('testVar'),
                operation: VariableOperationType.APPEND
            };
            const result = applyOutputToVariable(variable, mapping, 'appended');
            expect(result).toEqual(['existing', 'appended']);
        });

        // String Array to String Array
        test('ASSIGN: string[] to string[] - direct assignment', () => {
            const variable = createVariable(['original'], 'string', true);
            const mapping = {
                variable: createVarName('testVar'),
                operation: VariableOperationType.ASSIGN
            };
            const result = applyOutputToVariable(variable, mapping, ['new', 'values']);
            expect(result).toEqual(['new', 'values']);
        });

        test('APPEND: string[] to string[] - append all elements', () => {
            const variable = createVariable(['original'], 'string', true);
            const mapping = {
                variable: createVarName('testVar'),
                operation: VariableOperationType.APPEND
            };
            const result = applyOutputToVariable(variable, mapping, ['appended', 'values']);
            expect(result).toEqual(['original', 'appended', 'values']);
        });

        // Object to String Array
        test('ASSIGN: object to string[] - create single-element array with object', () => {
            const variable = createVariable([], 'string', true);
            const mapping = {
                variable: createVarName('testVar'),
                operation: VariableOperationType.ASSIGN
            };
            const obj = { key: 'value' };
            const result = applyOutputToVariable(variable, mapping, obj);
            expect(result).toEqual([obj]);
        });

        test('APPEND: object to string[] - append object as new element', () => {
            const variable = createVariable(['existing'], 'string', true);
            const mapping = {
                variable: createVarName('testVar'),
                operation: VariableOperationType.APPEND
            };
            const obj = { key: 'value' };
            const result = applyOutputToVariable(variable, mapping, obj);
            expect(result).toEqual(['existing', obj]);
        });

        // Object Array to String Array
        test('ASSIGN: object[] to string[] - direct assignment', () => {
            const variable = createVariable(['original'], 'string', true);
            const mapping = {
                variable: createVarName('testVar'),
                operation: VariableOperationType.ASSIGN
            };
            const objArray = [{ id: 1 }, { id: 2 }];
            const result = applyOutputToVariable(variable, mapping, objArray);
            expect(result).toEqual(objArray);
        });

        test('APPEND: object[] to string[] - append all objects as elements', () => {
            const variable = createVariable(['original'], 'string', true);
            const mapping = {
                variable: createVarName('testVar'),
                operation: VariableOperationType.APPEND
            };
            const objArray = [{ id: 1 }, { id: 2 }];
            const result = applyOutputToVariable(variable, mapping, objArray);
            expect(result).toEqual(['original', { id: 1 }, { id: 2 }]);
        });
    });

    // Edge Cases
    describe('Edge Cases', () => {
        // Simple string mapping (non-object)
        test('Simple string mapping returns output value unchanged', () => {
            const variable = createVariable('original');
            const mapping = createVarName('simple-mapping'); // Simple string mapping
            const result = applyOutputToVariable(variable, mapping, 'new value');
            expect(result).toBe('new value');
        });

        // Invalid enhanced mapping
        test('Invalid enhanced mapping (missing operation) returns output unchanged', () => {
            const variable = createVariable('original');
            // We need to cast this to any since it's intentionally invalid for testing
            const mapping = { variable: createVarName('testVar') } as any;
            const result = applyOutputToVariable(variable, mapping, 'new value');
            expect(result).toBe('new value');
        });

        test('Invalid enhanced mapping (missing variable) returns output unchanged', () => {
            const variable = createVariable('original');
            // We need to cast this to any since it's intentionally invalid for testing
            const mapping = { operation: VariableOperationType.ASSIGN } as any;
            const result = applyOutputToVariable(variable, mapping, 'new value');
            expect(result).toBe('new value');
        });

        // Null/undefined values
        test('Null variable value with APPEND to array creates new array', () => {
            const variable = createVariable(null, 'string', true);
            const mapping = {
                variable: createVarName('testVar'),
                operation: VariableOperationType.APPEND
            };
            const result = applyOutputToVariable(variable, mapping, 'new value');
            expect(result).toEqual(['new value']);
        });

        test('Undefined variable value with APPEND to array creates new array', () => {
            const variable = createVariable(undefined, 'string', true);
            const mapping = {
                variable: createVarName('testVar'),
                operation: VariableOperationType.APPEND
            };
            const result = applyOutputToVariable(variable, mapping, 'new value');
            expect(result).toEqual(['new value']);
        });

        // Unknown operation type
        test('Unknown operation type returns undefined or falls back to default', () => {
            const variable = createVariable('original');
            const mapping = {
                variable: createVarName('testVar'),
                operation: 'UNKNOWN_OPERATION' as any
            };
            const result = applyOutputToVariable(variable, mapping, 'new value');
            // Depending on implementation, this might return undefined or fall back to a default
            expect(result).toBe(undefined);
        });
    });
}); 