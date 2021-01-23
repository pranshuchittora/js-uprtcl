import {
  Logger,
  CASRemote,
  CidConfig,
  Entity,
  ObjectOnRemote,
  EntityGetResult,
  hashObject,
} from '@uprtcl/evees';
import { HttpConnectionLogged } from '@uprtcl/http-provider';

const store_api = 'store';

const httpCidConfig: CidConfig = {
  base: 'base58btc',
  version: 1,
  codec: 'raw',
  type: 'sha3-256',
};

export class HttpStore implements CASRemote {
  logger = new Logger('Http Store');

  constructor(protected connection: HttpConnectionLogged, public cidConfig: CidConfig) {}

  get casID() {
    return `http:${store_api}:${this.connection.host}`;
  }

  ready() {
    return Promise.resolve();
  }

  async get(hash: string): Promise<Entity<any>> {
    return this.connection.get<Entity<any>>(`/get/${hash}`);
  }

  async hash(object: object) {
    /** optimistically hash based on the CidConfig without asking the server */
    const id = await hashObject(object, httpCidConfig);
    return {
      id,
      object,
    };
  }

  cacheEntities(entities: Entity<any>[]): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async storeEntities(objects: ObjectOnRemote[]): Promise<Entity<any>[]> {
    throw new Error('Use storeObjects on CASRemotes');
  }

  async storeObjects(objects: object[]): Promise<Entity<any>[]> {
    const result: any = await this.connection.post(`/data`, {
      datas: objects.map((object) => {
        return {
          id: '',
          object,
        };
      }),
    });
    return result.entities;
  }

  hashEntities(objects: ObjectOnRemote[]): Promise<Entity<any>[]> {
    return Promise.all(objects.map((object) => this.hash(object.object)));
  }

  async getEntities(hashes: string[]): Promise<EntityGetResult> {
    const entities = await Promise.all(hashes.map((hash) => this.get(hash)));
    return { entities };
  }

  async flush(): Promise<void> {}

  async getEntity(hash: string): Promise<Entity<any>> {
    const entities = await this.getEntities([hash]);
    return entities[0];
  }

  async storeEntity(object: ObjectOnRemote): Promise<string> {
    const entities = await this.storeEntities([object]);
    return entities[0].id;
  }

  async hashEntity(object: ObjectOnRemote): Promise<string> {
    const entities = await this.hashEntities([object]);
    return entities[0].id;
  }
}