import { LitElement, property, html, css } from 'lit-element';

import { Logger, eveesConnect } from '@uprtcl/evees';
import { EveesModule, EveesHelpers, RemoteEvees, Perspective } from '@uprtcl/evees';

import { EveesBlockchainCached } from './evees.blockchain.cached';

export class PermissionsFixedLense extends moduleConnect(LitElement) {
  logger = new Logger('BLOCKCHAIN-PERMISSIONS-FIXED');

  @property({ type: String })
  uref!: string;

  @property({ attribute: false })
  loading: boolean = true;

  @property({ attribute: false })
  owner!: string;

  @property({ attribute: false })
  canUpdate!: boolean;

  client!: Client;
  remote!: EveesBlockchainCached;

  async firstUpdated() {
    this.client = this.request(ClientModule.bindings.Client);
    this.load();
  }

  async load() {
    if (!this.isConnected) return;

    this.loading = true;
    const remoteId = await EveesHelpers.getPerspectiveRemoteId(this.client, this.uref);
    if (remoteId === undefined) throw new Error('remote not found');

    if (!this.isConnected) return;
    this.remote = (this.requestAll(EveesModule.bindings.RemoteEvees) as RemoteEvees[]).find(
      (r) => r.id === remoteId
    ) as EveesBlockchainCached;
    await this.remote.ready();

    this.owner = await this.getOwner(this.uref);
    this.canUpdate = await this.remote.canUpdate(this.uref);

    this.loading = false;
  }

  async getOwner(perspectiveId: string): Promise<string> {
    const singedPerspective = (await loadEntity(this.client, perspectiveId)) as Entity<
      Signed<Perspective>
    >;
    return singedPerspective.object.payload.creatorId;
  }

  renderOwner() {
    return html`
      <evees-author user-id=${this.owner} remote-id=${this.remote.id} show-name></evees-author>
    `;
  }

  render() {
    return html`
      ${
        this.loading
          ? html` <uprtcl-loading></uprtcl-loading> `
          : html`
              <div class="row title">
                <strong>${this.t('access-control:owner')}:</strong>
                ${this.renderOwner()} ${this.canUpdate ? html` <b>(you)</b> ` : ''}
              </div>
            `
      }
            </div>
    `;
  }

  static get styles() {
    return css`
      .title {
        margin-bottom: 32px;
      }
      .row {
        width: 100%;
      }
      evees-author {
        margin: 0 auto;
      }
    `;
  }
}