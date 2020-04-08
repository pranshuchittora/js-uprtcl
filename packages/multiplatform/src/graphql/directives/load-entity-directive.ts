import { GraphQLField } from 'graphql';
import { interfaces, Container } from 'inversify';

import { NamedDirective } from '@uprtcl/graphql';

import { CASSource } from '../../types/cas-source';
import { DiscoveryBindings } from '../../bindings';
import { EntityCache } from '../entity-cache';
import { KnownSourcesService } from 'src/references/known-sources/known-sources.service';
import { Entity, PatternRecognizer, CortexModule } from '@uprtcl/cortex';

export abstract class LoadEntityDirective extends NamedDirective {
  protected abstract resolveEntity(container: Container, reference: string): Promise<Entity<any> | undefined>;

  public visitFieldDefinition(field: GraphQLField<any, any>, detail) {
    let defaultResolver = field.resolve;

    field.resolve = async (parent, args, context, info) => {
      let entityId: string | string[] | undefined = field.name === 'entity' && args.ref;

      if (!entityId) {
        if (!defaultResolver) {
          defaultResolver = parent => parent[field.name];
        }

        entityId = await defaultResolver(parent, args, context, info);
      }

      if (!entityId) return null;

      if (typeof entityId === 'string') return this.loadEntity(entityId, context.container);
      else if (Array.isArray(entityId)) {
        return entityId.map(id => this.loadEntity(id, context.container));
      }
    };
  }

  protected async loadEntity(entityId: string, container: Container): Promise<any | undefined> {
    const entityCache: EntityCache = container.get(DiscoveryBindings.EntityCache);
    const recognizer: PatternRecognizer = container.get(CortexModule.bindings.Recognizer);
    const localKnownSources: KnownSourcesService = container.get(
      DiscoveryBindings.LocalKnownSources
    );

    const cachedEntity = entityCache.getCachedEntity(entityId);

    if (cachedEntity) return { id: cachedEntity.id, ...cachedEntity.entity };

    if (entityCache.pendingLoads[entityId]) return entityCache.pendingLoads[entityId];

    const promise = async () => {
      const entity: Entity<any> | undefined = await this.resolveEntity(container, entityId);

      if (!entity) throw new Error(`Could not find entity with id ${entityId}`);

      const type = recognizer.recognizeType(entity);

      if (entity.casID) {
        await localKnownSources.addKnownSources(entityId, [entity.casID], type);
      }

      entityCache.cacheEntity(entity);

      entityCache.pendingLoads[entityId] = undefined;

      return { id: entityId, ...entity.entity };
    };

    entityCache.pendingLoads[entityId] = promise();
    return entityCache.pendingLoads[entityId];
  }
}
