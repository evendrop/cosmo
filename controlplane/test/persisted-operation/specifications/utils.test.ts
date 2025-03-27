import { describe, expect, test } from 'vitest';
import { extractVariablesFromGraphQL } from '../../../src/core/bufservices/persisted-operation/specifications/utils.js';

describe('extractVariablesFromGraphQL', () => {
  test('extracts Int variables with correct type', () => {
    const query = `
      query TestQuery($intVar: Int = 42) {
        someField(id: $intVar)
      }
    `;

    const result = extractVariablesFromGraphQL(query);
    expect(result.variables).toEqual({
      intVar: 42,
    });
    expect(result.schemas.intVar.type).toBe('number');
  });

  test('extracts Float variables with correct type', () => {
    const query = `
      query TestQuery($floatVar: Float = 42.5) {
        someField(value: $floatVar)
      }
    `;

    const result = extractVariablesFromGraphQL(query);
    expect(result.variables).toEqual({
      floatVar: 42.5,
    });
    expect(result.schemas.floatVar.type).toBe('number');
  });

  test('extracts Boolean variables with correct type', () => {
    const query = `
      query TestQuery($boolVar: Boolean = true) {
        someField(flag: $boolVar)
      }
    `;

    const result = extractVariablesFromGraphQL(query);
    expect(result.variables).toEqual({
      boolVar: true,
    });
    expect(result.schemas.boolVar.type).toBe('boolean');
  });

  test('extracts String variables with correct type', () => {
    const query = `
      query TestQuery($stringVar: String = "test") {
        someField(text: $stringVar)
      }
    `;

    const result = extractVariablesFromGraphQL(query);
    expect(result.variables).toEqual({
      stringVar: 'test',
    });
    expect(result.schemas.stringVar.type).toBe('string');
  });

  test('handles variables without default values', () => {
    const query = `
      query TestQuery($intVar: Int, $stringVar: String) {
        someField(id: $intVar, name: $stringVar)
      }
    `;

    const result = extractVariablesFromGraphQL(query);
    expect(result.variables).toEqual({
      intVar: null,
      stringVar: null,
    });
  });

  test('handles multiple variables of different types', () => {
    const query = `
      query TestQuery(
        $intVar: Int = 42,
        $floatVar: Float = 42.5,
        $boolVar: Boolean = true,
        $stringVar: String = "test"
      ) {
        someField(
          id: $intVar
          value: $floatVar
          flag: $boolVar
          text: $stringVar
        )
      }
    `;

    const result = extractVariablesFromGraphQL(query);
    expect(result.variables).toEqual({
      intVar: 42,
      floatVar: 42.5,
      boolVar: true,
      stringVar: 'test',
    });
  });

  test('handles enum types', () => {
    const query = `
      query TestQuery($enumVar: STATUS = ACTIVE) {
        someField(status: $enumVar)
      }
    `;

    const result = extractVariablesFromGraphQL(query);
    expect(result.variables).toEqual({
      enumVar: 'ACTIVE',
    });
    expect(result.schemas.enumVar.type).toBe('string');
    expect(result.schemas.enumVar.description).toBe('STATUS enum type');
  });

  test('handles invalid GraphQL query gracefully', () => {
    const query = `
      invalid query {
        someField
      }
    `;

    const result = extractVariablesFromGraphQL(query);
    expect(result).toEqual({
      variables: {},
      schemas: {},
    });
  });
});
