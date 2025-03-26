import { PlainMessage } from '@bufbuild/protobuf';
import { HandlerContext } from '@connectrpc/connect';
import { EnumStatusCode } from '@wundergraph/cosmo-connect/dist/common/common_pb';
import {
  ExportPersistedOperationsRequest,
  ExportPersistedOperationsResponse,
  APISpecificationType,
} from '@wundergraph/cosmo-connect/dist/platform/v1/platform_pb';
import { FederatedGraphRepository } from '../../repositories/FederatedGraphRepository.js';
import { OperationsRepository } from '../../repositories/OperationsRepository.js';
import type { RouterOptions } from '../../routes.js';
import { enrichLogger, getLogger, handleError } from '../../util.js';
import { PersistedOperationWithClientDTO } from '../../../types/index.js';
import { createOpenAPISpec } from './specifications/openapi.js';
import { createPostmanCollection } from './specifications/postman.js';
import { extractVariablesFromGraphQL } from './specifications/utils.js';

export function exportPersistedOperations(
  opts: RouterOptions,
  req: ExportPersistedOperationsRequest,
  ctx: HandlerContext,
): Promise<PlainMessage<ExportPersistedOperationsResponse>> {
  let logger = getLogger(ctx, opts.logger);

  return handleError<PlainMessage<ExportPersistedOperationsResponse>>(ctx, logger, async () => {
    const authContext = await opts.authenticator.authenticate(ctx.requestHeader);
    logger = enrichLogger(ctx, logger, authContext);

    const fedRepo = new FederatedGraphRepository(logger, opts.db, authContext.organizationId);
    const federatedGraph = await fedRepo.byName(req.federatedGraphName, req.namespace);

    if (!federatedGraph) {
      return {
        response: {
          code: EnumStatusCode.ERR_NOT_FOUND,
          details: `Federated graph '${req.federatedGraphName}' not found in namespace '${req.namespace}'`,
        },
        exportJson: '',
      };
    }

    const operationsRepo = new OperationsRepository(opts.db, federatedGraph.id);
    let operations: PersistedOperationWithClientDTO[] = [];

    if (req.operationId) {
      const operation = await operationsRepo.getPersistedOperation({ operationId: req.operationId });
      if (operation) {
        operations = [operation];
      }
    } else if (req.clientId) {
      const clientOperations = await operationsRepo.getPersistedOperations(req.clientId);
      // Convert PersistedOperationDTO to PersistedOperationWithClientDTO
      const clients = await operationsRepo.getRegisteredClients();
      const clientName = clients.find(c => c.id === req.clientId)?.name || 'Unknown Client';
      operations = clientOperations.map(op => ({
        ...op,
        clientName,
      }));
    } else {
      // Get all operations for the federated graph
      operations = await operationsRepo.getAllPersistedOperations();
    }

    let exportJson = '';
    switch (req.format) {
      case APISpecificationType.API_SPECIFICATION_TYPE_POSTMAN:
        const baseUrl = (federatedGraph.routingUrl || '/').replace(/\/+$/, '');
        exportJson = JSON.stringify(
          createPostmanCollection(req.federatedGraphName, operations, baseUrl, extractVariablesFromGraphQL),
          null,
          2,
        );
        break;

      case APISpecificationType.API_SPECIFICATION_TYPE_OPENAPI:
        exportJson = JSON.stringify(
          createOpenAPISpec(req.federatedGraphName, operations, extractVariablesFromGraphQL),
          null,
          2,
        );
        break;
    }

    return {
      response: {
        code: EnumStatusCode.OK,
      },
      exportJson,
    };
  });
}
