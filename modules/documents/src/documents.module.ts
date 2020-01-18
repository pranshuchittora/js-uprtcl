import { interfaces } from 'inversify';

import { SourcesModule } from '@uprtcl/multiplatform';
import { PatternsModule } from '@uprtcl/cortex';
import { GraphQlSchemaModule } from '@uprtcl/common';
import { ElementsModule, i18nextModule, MicroModule, Dictionary } from '@uprtcl/micro-orchestrator';

import { DocumentTextNode } from './elements/document-text-node';
import {
  TextNodeActions,
  TextNodeCreate,
  TextNodePatterns,
  TextNodeTitle
} from './patterns/text-node.entity';
import { DocumentsRemote } from './services/documents.remote';
import { documentsTypeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';

import en from '../i18n/en.json';
import { DocumentsBindings } from './bindings';

/**
 * Configure a documents module with the given service providers
 *
 * Depends on these modules being present: LensesModule, CortexModule, DiscoveryModule, i18nBaseModule
 *
 * Example usage:
 *
 * ```ts
 * import { IpfsConnection } from '@uprtcl/connections';
 * import { DocumentsModule, DocumentsIpfs } from '@uprtcl/documents';
 *
 * const ipfsConnection = new IpfsConnection({
 *   host: 'ipfs.infura.io',
 *   port: 5001,
 *   protocol: 'https'
 * });
 *
 *  const documentsProvider = new DocumentsIpfs(ipfsConnection);
 *
 * const docs = new DocumentsModule([ documentsProvider ]);
 * await orchestrator.loadModule(docs);
 * ```
 *
 * @category CortexModule
 *
 * @param documentsRemote an array of remotes of documents
 */
export class DocumentsModule extends MicroModule {
  static id = Symbol('documents-module');

  static bindings = DocumentsBindings;

  constructor(
    protected documentsRemotes: DocumentsRemote[],
    protected remoteLinks: Dictionary<string>
  ) {
    super();
  }

  submodules = [
    new GraphQlSchemaModule(documentsTypeDefs, resolvers),
    new i18nextModule('documents', { en: en }),
    new SourcesModule(
      this.documentsRemotes.map(remote => ({
        symbol: DocumentsModule.bindings.DocumentsRemote,
        source: remote
      }))
    ),
    new ElementsModule({
      'documents-text-node': DocumentTextNode
    }),
    new PatternsModule({
      [DocumentsModule.bindings.TextNodeEntity]: [
        TextNodeActions,
        TextNodeCreate,
        TextNodePatterns,
        TextNodeTitle
      ]
    })
  ];
}
