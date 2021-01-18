import { CASStore } from '../../cas/interfaces/cas-store';
import { Client, EveesMutation, PerspectiveGetResult } from '../interfaces/client';
import { Proposals } from '../interfaces/proposals';
import { RemoteEvees } from '../interfaces/remote.evees';
import { SearchEngine } from '../interfaces/search.engine';
import { NewPerspectiveData, UpdateRequest } from '../interfaces/types';

export class RemoteRouter implements Client {
  constructor(protected remotes: RemoteEvees[], public store: CASStore) {}
  proposals?: Proposals | undefined;

  searchEngine!: SearchEngine;

  getRemote(remoteId: string): RemoteEvees {
    const remote = this.remotes.find((r) => r.id === remoteId);
    if (!remote) throw new Error(`Remote not found for ${remoteId}`);
    return remote;
  }

  newPerspective(newPerspective: NewPerspectiveData) {
    throw new Error('Method not implemented.');
  }
  deletePerspective(perspectiveId: string) {
    throw new Error('Method not implemented.');
  }
  updatePerspective(update: UpdateRequest) {
    throw new Error('Method not implemented.');
  }

  async getPerspectiveRemote(perspectiveId: string): Promise<RemoteEvees> {
    const perspective = await this.store.getEntity(perspectiveId);
    return this.getRemote(perspective.object.payload.remote);
  }

  async getPerspective(perspectiveId: string): Promise<PerspectiveGetResult> {
    const remote = await this.getPerspectiveRemote(perspectiveId);
    return remote.getPerspective(perspectiveId);
  }

  async diff(): Promise<EveesMutation> {
    return {
      deletedPerspectives: [],
      newPerspectives: [],
      updates: [],
    };
  }

  async canUpdate(perspectiveId: string, userId?: string) {
    const remote = await this.getPerspectiveRemote(perspectiveId);
    return remote.canUpdate(perspectiveId, userId);
  }

  async update(mutation: EveesMutation) {
    const mutationPerRemote = new Map<string, EveesMutation>();

    const fillDeleted = mutation.deletedPerspectives.map(async (deletedPerspective) => {
      const remote = await this.getPerspectiveRemote(deletedPerspective);
      let mutation = mutationPerRemote.get(remote.id);
      if (!mutation) {
        mutation = {
          deletedPerspectives: [],
          newPerspectives: [],
          updates: [],
        };
        mutationPerRemote.set(remote.id, mutation);
      }
      mutation.deletedPerspectives.push(deletedPerspective);
    });

    const fillNew = mutation.newPerspectives.map(async (newPerspective) => {
      const remote = await this.getPerspectiveRemote(newPerspective.perspective.id);
      let mutation = mutationPerRemote.get(remote.id);
      if (!mutation) {
        mutation = {
          deletedPerspectives: [],
          newPerspectives: [],
          updates: [],
        };
        mutationPerRemote.set(remote.id, mutation);
      }
      mutation.newPerspectives.push(newPerspective);
    });

    const fillUpdated = mutation.updates.map(async (update) => {
      const remote = await this.getPerspectiveRemote(update.perspectiveId);
      let mutation = mutationPerRemote.get(remote.id);
      if (!mutation) {
        mutation = {
          deletedPerspectives: [],
          newPerspectives: [],
          updates: [],
        };
        mutationPerRemote.set(remote.id, mutation);
      }
      mutation.updates.push(update);
    });

    await Promise.all([fillDeleted, fillNew, fillUpdated]);

    /** at this point the mutation is split per remote and is sent to each remote */
    await Promise.all(
      Array.from(mutationPerRemote.keys()).map((remoteId) => {
        const mutation = mutationPerRemote.get(remoteId) as EveesMutation;
        const remote = this.getRemote(remoteId);
        return remote.update(mutation);
      })
    );
  }

  async flush() {}

  async refresh() {}

  /** get all user perspectives on all registered remotes */
  async getUserPerspectives(perspectiveId: string) {
    const all = await Promise.all(
      this.remotes.map((remote) => {
        return remote.getUserPerspectives(perspectiveId);
      })
    );
    return Array.prototype.concat.apply([], all);
  }
}