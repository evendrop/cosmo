import { describe, expect, test } from 'vitest';
import { createPostmanCollection } from '../../../src/core/bufservices/persisted-operation/specifications/postman.js';
import { PersistedOperationWithClientDTO } from '../../../src/types/index.js';
import { SchemaResult, PostmanFolderItem } from '../../../src/core/bufservices/persisted-operation/specifications/types.js';

describe('createPostmanCollection', () => {
  const mockExtractVariables = (query: string): SchemaResult => ({
    variables: {
      id: 'string',
      name: 'string',
    },
    schemas: {},
  });

  const createMockOperation = (overrides?: Partial<PersistedOperationWithClientDTO>): PersistedOperationWithClientDTO => ({
    id: '1',
    operationId: 'op1',
    contents: 'query GetUser($id: ID!) { user(id: $id) { name } }',
    operationNames: ['GetUser'],
    filePath: 'queries/getUser.graphql',
    clientName: 'web-client',
    hash: 'abc123',
    createdAt: new Date().toISOString(),
    createdBy: 'test-user',
    lastUpdatedAt: new Date().toISOString(),
    lastUpdatedBy: 'test-user',
    ...overrides,
  });

  test('creates a valid Postman collection with single operation', () => {
    const mockOperation = createMockOperation();

    const result = createPostmanCollection(
      'TestGraph',
      [mockOperation],
      'http://localhost:8080',
      mockExtractVariables,
    );

    expect(result).toEqual({
      info: {
        name: 'TestGraph Operations',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'web-client',
          item: [
            {
              name: 'GetUser',
              request: {
                method: 'POST',
                header: [
                  {
                    key: 'Content-Type',
                    value: 'application/json',
                  },
                ],
                body: {
                  mode: 'graphql',
                  graphql: {
                    query: mockOperation.contents,
                    variables: JSON.stringify({
                      id: 'string',
                      name: 'string',
                    }, null, 2),
                  },
                },
                url: {
                  raw: '{{baseUrl}}',
                  host: ['{{baseUrl}}'],
                },
              },
            },
          ],
        },
      ],
      variable: [
        {
          key: 'baseUrl',
          value: 'http://localhost:8080',
        },
      ],
    });
  });

  test('groups operations by client name', () => {
    const mockOperations = [
      createMockOperation(),
      createMockOperation({
        id: '2',
        operationId: 'op2',
        contents: 'query GetPosts { posts { title } }',
        operationNames: ['GetPosts'],
        filePath: 'queries/getPosts.graphql',
        clientName: 'mobile-client',
        hash: 'def456',
      }),
      createMockOperation({
        id: '3',
        operationId: 'op3',
        contents: 'query GetProfile { profile { email } }',
        operationNames: ['GetProfile'],
        filePath: 'queries/getProfile.graphql',
        hash: 'ghi789',
      }),
    ];

    const result = createPostmanCollection(
      'TestGraph',
      mockOperations,
      'http://localhost:8080',
      mockExtractVariables,
    );

    const folders = result.item as PostmanFolderItem[];
    expect(folders).toHaveLength(2); // Two clients
    expect(folders[0].item).toHaveLength(2); // web-client has 2 operations
    expect(folders[1].item).toHaveLength(1); // mobile-client has 1 operation
    expect(folders[0].name).toBe('web-client');
    expect(folders[1].name).toBe('mobile-client');
  });

  test('uses filePath as name when operationNames is empty', () => {
    const mockOperation = createMockOperation({
      operationNames: [],
    });

    const result = createPostmanCollection(
      'TestGraph',
      [mockOperation],
      'http://localhost:8080',
      mockExtractVariables,
    );

    const folders = result.item as PostmanFolderItem[];
    expect(folders[0].item[0].name).toBe('queries/getUser.graphql');
  });

  test('handles operations with no client name', () => {
    const mockOperation = createMockOperation({
      clientName: undefined,
    });

    const result = createPostmanCollection(
      'TestGraph',
      [mockOperation],
      'http://localhost:8080',
      mockExtractVariables,
    );

    const folders = result.item as PostmanFolderItem[];
    expect(folders[0].name).toBe('Unknown Client');
  });

  test('handles root URL correctly', () => {
    const mockOperation = createMockOperation();

    const result = createPostmanCollection(
      'TestGraph',
      [mockOperation],
      '/',
      mockExtractVariables,
    );

    expect(result.variable[0]).toEqual({
      key: 'baseUrl',
      value: '',
    });
  });
}); 