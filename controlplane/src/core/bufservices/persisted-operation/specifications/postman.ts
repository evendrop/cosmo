import { PersistedOperationWithClientDTO } from '../../../../types/index.js';
import { APICollection, PostmanRequestItem, PostmanFolderItem, SchemaResult } from './types.js';

export const createPostmanCollection = (
  federatedGraphName: string,
  operations: PersistedOperationWithClientDTO[],
  baseUrl: string,
  extractVariablesFromGraphQL: (query: string) => SchemaResult,
): APICollection => {
  // Group operations by client name
  const operationsByClient = operations.reduce<Record<string, PersistedOperationWithClientDTO[]>>((acc, op) => {
    const clientName = op.clientName || 'Unknown Client';
    if (!acc[clientName]) {
      acc[clientName] = [];
    }
    acc[clientName].push(op);
    return acc;
  }, {});

  return {
    info: {
      name: `${federatedGraphName} Operations`,
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    item: Object.entries(operationsByClient).map(([clientName, clientOperations]) => ({
      name: clientName,
      item: clientOperations.map((operation) => ({
        name: operation.operationNames[0] || operation.filePath,
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
              query: operation.contents,
              variables: JSON.stringify(extractVariablesFromGraphQL(operation.contents).variables, null, 2),
            },
          },
          url: {
            raw: '{{baseUrl}}',
            host: ['{{baseUrl}}'],
          },
        },
      })),
    })),
    variable: [
      {
        key: 'baseUrl',
        value: baseUrl === '/' ? '' : baseUrl,
      },
    ],
  };
}; 