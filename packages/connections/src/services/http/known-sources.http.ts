import { KnownSourcesService } from '@uprtcl/cortex';
import { HttpConnection } from './http.connection';
import { ConnectionOptions } from '../../connections/connection';
import { Logger } from '@uprtcl/micro-orchestrator';
import { HttpProvider } from './http.provider';

const uprtcl_api: string = 'uprtcl-ks-v1';
export class KnownSourcesHttp extends HttpProvider implements KnownSourcesService {
  logger = new Logger('HTTP-KWN-SRC-PROVIDER');

  constructor(host: string, protected connection: HttpConnection) {
    super(
      {
        host: host,
        apiId: uprtcl_api
      },
      connection
    );
  }

  async getKnownSources(hash: string): Promise<string[]> {
    return this.connection.get(`/discovery/${hash}`);
  }

  async addKnownSources(hash: string, sources: string[]): Promise<void> {
    await this.connection.put(`/discovery/${hash}`, sources);
  }

  async removeKnownSource(hash: string, source: string): Promise<void> {
    console.log({ hash, source });
    throw new Error('Method not implemented');
  }
}
