import {
  OwnerAccessControlService,
  OwnerPermissions,
} from '@uprtcl/access-control';
import { OrbitDBConnection } from './orbit-db.connection';
import { CASStore } from '@uprtcl/multiplatform';
import { Signed } from '@uprtcl/cortex';
import { Perspective } from 'src/types';

interface OrbitDBPermissions {
  canAppend: Boolean;
  write: string[] | undefined;
}

export class EveesAccessControlOrbitDB implements OwnerAccessControlService {
  constructor(
    protected orbitdbConnection: OrbitDBConnection,
    protected store: CASStore
  ) {}

  changeOwner(ref: string, newOwnerId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async setCanWrite(ref: string, userId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async getPermissions(
    perspectiveId: string
  ): Promise<OwnerPermissions | undefined> {
    const { payload: perspective } = (await this.store.get(
      perspectiveId
    )) as Signed<Perspective>;
    const { access, identity } = await getPerspectiveStore(
      this.orbitdbConnection,
      perspective
    );
    return {
      canAppend: await access.canAppend({ identity }),
      write: access.write || undefined,
    };
  }

  setPermissions(
    hash: string,
    newPersmissions: OwnerPermissions
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
