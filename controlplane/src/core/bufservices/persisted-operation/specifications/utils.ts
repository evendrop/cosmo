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
        
        if (vd.type.kind === Kind.NAMED_TYPE) {
          const typeName = vd.type.name.value;

          if (typeName === typeName.toUpperCase()) {
            schemas[variableName] = {
              type: 'string',
              enum: [], 
              description: `${typeName} enum type`,
            };
            
            if (vd.defaultValue?.kind === Kind.ENUM) {
              variables[variableName] = vd.defaultValue.value;
            } else {
              variables[variableName] = null;
            }
          } else {
            let jsonType: string;
            switch (typeName.toLowerCase()) {
              case 'int':
              case 'float':
                jsonType = 'number';
                if (vd.defaultValue && 'value' in vd.defaultValue) {
                  variables[variableName] = Number(vd.defaultValue.value);
                } else {
                  variables[variableName] = null;
                }
                break;
              case 'boolean':
                jsonType = 'boolean';
                if (vd.defaultValue && 'value' in vd.defaultValue) {
                  variables[variableName] = vd.defaultValue.value === 'true';
                } else {
                  variables[variableName] = null;
                }
                break;
              case 'id':
              default:
                jsonType = 'string';
                variables[variableName] = vd.defaultValue && 'value' in vd.defaultValue 
                  ? vd.defaultValue.value 
                  : null;
            }
            
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