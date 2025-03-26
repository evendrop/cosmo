import { parse, Kind } from 'graphql';
import { SchemaResult } from './types.js';

export function extractVariablesFromGraphQL(query: string): SchemaResult {
  try {
    const variables: Record<string, unknown> = {};
    const schemas: Record<string, any> = {};
    const parsedOp = parse(query);

    if (parsedOp.definitions[0].kind === Kind.OPERATION_DEFINITION) {
      parsedOp.definitions[0].variableDefinitions?.forEach((vd) => {
        const variableName = vd.variable.name.value;
        
        // Handle different types of variables
        if (vd.type.kind === Kind.NAMED_TYPE) {
          const typeName = vd.type.name.value;
          
          // If it's an enum type (uppercase by convention)
          if (typeName === typeName.toUpperCase()) {
            schemas[variableName] = {
              type: 'string',
              enum: [], // We can't know the actual enum values without the schema
              description: `${typeName} enum type`,
            };
            // Use default value if provided, otherwise null
            if (vd.defaultValue?.kind === Kind.ENUM) {
              variables[variableName] = vd.defaultValue.value;
            } else {
              variables[variableName] = null;
            }
          } else {
            // Map GraphQL types to JSON Schema types
            let jsonType: string;
            switch (typeName.toLowerCase()) {
              case 'int':
              case 'float':
                jsonType = 'number';
                break;
              case 'boolean':
                jsonType = 'boolean';
                break;
              case 'id':
              default:
                jsonType = 'string';
            }
            
            variables[variableName] = vd.defaultValue && 'value' in vd.defaultValue 
              ? vd.defaultValue.value 
              : null;
            schemas[variableName] = {
              type: jsonType,
              description: `GraphQL type: ${typeName}`,
            };
          }
        }
      });
    }

    return { variables, schemas };
  } catch (e) {
    return { variables: {}, schemas: {} };
  }
} 