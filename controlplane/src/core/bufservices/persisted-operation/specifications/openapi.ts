import { PersistedOperationWithClientDTO } from '../../../../types/index.js';
import { SchemaResult } from './types.js';

export const createOpenAPISpec = (
  federatedGraphName: string,
  operations: PersistedOperationWithClientDTO[],
  extractVariablesFromGraphQL: (query: string) => SchemaResult,
) => {
  return {
    openapi: '3.0.0',
    info: {
      title: `${federatedGraphName} Operations`,
      version: '1.0.0',
    },
    paths: Object.fromEntries(
      operations.map((op) => {
        const { variables, schemas: opSchemas } = extractVariablesFromGraphQL(op.contents);
        return [
          `/${op.operationNames[0] || op.filePath.replace(/\//g, '_')}`,
          {
            post: {
              summary: `Execute ${op.operationNames[0] || op.filePath} operation`,
              operationId: op.operationId,
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        query: {
                          type: 'string',
                          description: 'GraphQL query',
                          example: op.contents,
                        },
                        variables: {
                          type: 'object',
                          description: 'Query variables',
                          properties: opSchemas,
                          example: variables,
                        },
                      },
                      required: ['query'],
                    },
                  },
                },
              },
              responses: {
                '200': {
                  description: 'Successful operation',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'object',
                            description: 'Results from the GraphQL operation',
                          },
                          errors: {
                            type: 'array',
                            description: 'Errors encountered during operation execution',
                            items: {
                              type: 'object',
                              properties: {
                                message: {
                                  type: 'string',
                                  description: 'Error message',
                                },
                                locations: {
                                  type: 'array',
                                  description: 'Locations in the GraphQL document where the error occurred',
                                  items: {
                                    type: 'object',
                                    properties: {
                                      line: {
                                        type: 'integer',
                                        description: 'Line number in the GraphQL document',
                                      },
                                      column: {
                                        type: 'integer',
                                        description: 'Column number in the GraphQL document',
                                      },
                                    },
                                  },
                                },
                                path: {
                                  type: 'array',
                                  description: 'Path in the query to the field that caused the error',
                                  items: {
                                    oneOf: [
                                      { type: 'string' },
                                      { type: 'integer' }
                                    ],
                                  },
                                },
                                extensions: {
                                  type: 'object',
                                  description: 'Additional error information provided by the server',
                                },
                              },
                              required: ['message'],
                            },
                          },
                        },
                      },
                    },
                  },
                },
                '400': {
                  description: 'Invalid request',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          errors: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                message: {
                                  type: 'string',
                                  description: 'Error message',
                                },
                              },
                              required: ['message'],
                            },
                          },
                        },
                        required: ['errors'],
                      },
                    },
                  },
                },
              },
            },
          },
        ];
      }),
    ),
  };
}; 