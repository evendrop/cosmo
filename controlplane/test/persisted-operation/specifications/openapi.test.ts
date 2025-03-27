import { describe, expect, test } from 'vitest';
import { createOpenAPISpec } from '../../../src/core/bufservices/persisted-operation/specifications/openapi.js';
import { SchemaResult } from '../../../src/core/bufservices/persisted-operation/specifications/types.js';
import { PersistedOperationWithClientDTO } from '../../../src/types/index.js';

describe('createOpenAPISpec', () => {
  const mockExtractVariables = (query: string): SchemaResult => ({
    variables: {
      id: 123,
      name: 'test',
      isActive: true,
    },
    schemas: {
      id: {
        type: 'number',
        description: 'GraphQL type: Int',
      },
      name: {
        type: 'string',
        description: 'GraphQL type: String',
      },
      isActive: {
        type: 'boolean',
        description: 'GraphQL type: Boolean',
      },
    },
  });

  const createMockOperation = (
    operationId: string,
    operationNames: string[],
    contents: string,
    filePath: string,
  ): PersistedOperationWithClientDTO => ({
    id: '1',
    operationId,
    hash: 'mock-hash',
    operationNames,
    contents,
    filePath,
    createdAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    lastUpdatedBy: 'test-user',
    clientName: 'test-client',
  });

  test('creates basic OpenAPI specification structure', () => {
    const result = createOpenAPISpec('TestGraph', [], mockExtractVariables);
    
    expect(result.openapi).toBe('3.0.0');
    expect(result.info).toEqual({
      title: 'TestGraph Operations',
      version: '1.0.0',
    });
    expect(result.paths).toEqual({});
  });

  test('generates path from operation name', () => {
    const operations = [
      createMockOperation(
        'op1',
        ['GetUser'],
        'query GetUser($id: ID!) { user(id: $id) { name } }',
        'queries/user.graphql',
      ),
    ];

    const result = createOpenAPISpec('TestGraph', operations, mockExtractVariables);
    
    expect(result.paths).toHaveProperty('/GetUser');
    expect(result.paths['/GetUser'].post.operationId).toBe('op1');
    expect(result.paths['/GetUser'].post.summary).toBe('Execute GetUser operation');
  });

  test('uses filePath when operation name is not available', () => {
    const operations = [
      createMockOperation(
        'op1',
        [],
        'query { user { name } }',
        'queries/get-user.graphql',
      ),
    ];

    const result = createOpenAPISpec('TestGraph', operations, mockExtractVariables);
    
    expect(result.paths).toHaveProperty('/queries_get-user.graphql');
  });

  test('includes variables schema and example in request body', () => {
    const operations = [
      createMockOperation(
        'op1',
        ['GetUser'],
        'query GetUser($id: ID!) { user(id: $id) { name } }',
        'queries/user.graphql',
      ),
    ];

    const result = createOpenAPISpec('TestGraph', operations, mockExtractVariables);
    const requestSchema = result.paths['/GetUser'].post.requestBody.content['application/json'].schema;
    
    expect(requestSchema.properties.variables.properties).toEqual(mockExtractVariables('').schemas);
    expect(requestSchema.properties.variables.example).toEqual(mockExtractVariables('').variables);
  });

  test('includes error response schema', () => {
    const operations = [
      createMockOperation(
        'op1',
        ['GetUser'],
        'query GetUser($id: ID!) { user(id: $id) { name } }',
        'queries/user.graphql',
      ),
    ];

    const result = createOpenAPISpec('TestGraph', operations, mockExtractVariables);
    const errorSchema = result.paths['/GetUser'].post.responses[400].content['application/json'].schema;
    
    expect(errorSchema.properties.message.type).toBe('string');
  });

  test('handles multiple operations', () => {
    const operations = [
      createMockOperation(
        'op1',
        ['GetUser'],
        'query GetUser($id: ID!) { user(id: $id) { name } }',
        'queries/user.graphql',
      ),
      createMockOperation(
        'op2',
        ['UpdateUser'],
        'mutation UpdateUser($id: ID!, $name: String!) { updateUser(id: $id, name: $name) { id } }',
        'mutations/user.graphql',
      ),
    ];

    const result = createOpenAPISpec('TestGraph', operations, mockExtractVariables);
    
    expect(Object.keys(result.paths)).toHaveLength(2);
    expect(result.paths).toHaveProperty('/GetUser');
    expect(result.paths).toHaveProperty('/UpdateUser');
  });
}); 