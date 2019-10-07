import { injectable, interfaces } from 'inversify';

import { DiscoverableSource, DiscoveryTypes, PatternTypes } from '@uprtcl/cortex';
import { MicroModule } from '@uprtcl/micro-orchestrator';

import { TextNodeLens } from './lenses/text-node.lens';
import { TextNodePattern } from './patterns/text-node.pattern';
import { DocumentsTypes } from './types';
import { DocumentsProvider } from './services/documents.provider';

export function documentsModule(documentsProvider: DiscoverableSource<DocumentsProvider>): any {
  @injectable()
  class DocumentsModule implements MicroModule {
    async onLoad(
      bind: interfaces.Bind,
      unbind: interfaces.Unbind,
      isBound: interfaces.IsBound,
      rebind: interfaces.Rebind
    ): Promise<void> {
      bind<DiscoverableSource>(DiscoveryTypes.DiscoverableSource).toConstantValue(
        documentsProvider
      );
      bind<DocumentsProvider>(DocumentsTypes.DocumentsProvider).toConstantValue(
        documentsProvider.source
      );

      bind<TextNodePattern>(DocumentsTypes.TextNodePattern).to(TextNodePattern);
      bind<TextNodePattern>(PatternTypes.Pattern).to(TextNodePattern);

      customElements.define('text-node', TextNodeLens);
    }

    async onUnload(): Promise<void> {}
  }

  return DocumentsModule;
}
