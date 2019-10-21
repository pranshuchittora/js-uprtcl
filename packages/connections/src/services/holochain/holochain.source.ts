import { NamedSource, Hashed, Source } from '@uprtcl/cortex';
import { HolochainConnection, HolochainConnectionOptions } from './holochain.connection';
import { ConnectionOptions } from '../../connections/connection';
import { HolochainProxy } from './holochain.proxy';

export class HolochainSource extends HolochainConnection implements NamedSource {
  name!: string;

  constructor(
    protected zome: string,
    protected hcOptions: HolochainConnectionOptions,
    options: ConnectionOptions = {},
    protected sourceZome: Source = new HolochainProxy(hcOptions, options)
  ) {
    super(zome, hcOptions, options);
  }

  /**
   * @override
   */
  protected async connect(): Promise<void> {
    await super.connect();

    this.name = await this.call('get_source_name', {});
  }

  /**
   * @override
   */
  public configure(sourceName: string): boolean {
    return this.name === sourceName;
  }

  /**
   * @override
   */
  public async ready() {
    await Promise.all([super.ready(), this.sourceZome.ready()]);
  }

  /**
   * @override
   */
  public async get<T extends object>(hash: string): Promise<Hashed<T> | undefined> {
    return this.sourceZome.get(hash);
  }
}
