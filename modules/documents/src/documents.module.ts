import { injectable } from 'inversify';

import { DiscoverableSource, CortexModule, NamedSource } from '@uprtcl/cortex';

import { TextNodeLens } from './lenses/text-node.lens';
import { TextNodePattern } from './patterns/text-node.pattern';
import { DocumentsTypes } from './types';
import { DocumentsProvider } from './services/documents.provider';
import { DocumentsLocal } from './services/documents.local';

export function documentsModule(
  documentsProviders: DiscoverableSource<DocumentsProvider & NamedSource>[],
  documentsLocal: new (...args: any[]) => DocumentsProvider = DocumentsLocal
): new (...args: any[]) => CortexModule {
  @injectable()
  class DocumentsModule extends CortexModule {
    get sources() {
      return documentsProviders.map(provider => ({
        symbol: DocumentsTypes.DocumentsProvider,
        source: provider
      }));
    }

    get services() {
      return [{ symbol: DocumentsTypes.DocumentsCache, service: documentsLocal }];
    }

    get elements() {
      return [{ name: 'text-node', element: TextNodeLens }];
    }

    get patterns() {
      return [{ symbol: DocumentsTypes.TextNodePattern, pattern: TextNodePattern }];
    }
  }

  return DocumentsModule;
}
