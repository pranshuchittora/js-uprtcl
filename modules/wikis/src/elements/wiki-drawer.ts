import { property, html, css, LitElement, query } from 'lit-element';
import { ApolloClient } from 'apollo-boost';
const styleMap = style => {
  return Object.entries(style).reduce((styleString, [propName, propValue]) => {
    propName = propName.replace(/([A-Z])/g, matches => `-${matches[0].toLowerCase()}`);
    return `${styleString}${propName}:${propValue};`;
  }, '');
};

import { Logger, moduleConnect } from '@uprtcl/micro-orchestrator';
import { sharedStyles } from '@uprtcl/lenses';
import { CortexModule, PatternRecognizer, Signed } from '@uprtcl/cortex';
import {
  EveesRemote,
  EveesModule,
  eveeColor,
  DEFAULT_COLOR,
  Perspective,
  CONTENT_UPDATED_TAG,
  ContentUpdatedEvent
} from '@uprtcl/evees';
import { ApolloClientModule } from '@uprtcl/graphql';
import { WikiDrawerContent } from './wiki-drawer-content';
import { loadEntity } from '@uprtcl/multiplatform';
import { CREATE_PROPOSAL, PROPOSAL_CREATED_TAG } from '@uprtcl/evees';
import { ProposalCreatedEvent } from '@uprtcl/evees/dist/types/types';

export class WikiDrawer extends moduleConnect(LitElement) {
  logger = new Logger('WIKI-DRAWER');

  @property({ type: String, attribute: 'uref' })
  firstRef!: string;

  @property({ type: Boolean, attribute: 'show-proposals' })
  showProposals: boolean = false;

  @property({ attribute: false })
  uref!: string;

  @property({ attribute: false })
  officialOwner!: string;

  @property({ attribute: false })
  loading: boolean = true;

  @property({ attribute: false })
  creatorId!: string;

  @query('#wiki-drawer-content')
  content!: WikiDrawerContent;

  @query('#evees-info-row')
  eveesInfoLocal!: any;

  protected client!: ApolloClient<any>;
  protected eveesRemotes!: EveesRemote[];
  protected recognizer!: PatternRecognizer;

  constructor() {
    super();
  }

  async firstUpdated() {
    this.client = this.request(ApolloClientModule.bindings.Client);
    this.eveesRemotes = this.requestAll(EveesModule.bindings.EveesRemote);
    this.recognizer = this.request(CortexModule.bindings.Recognizer);

    this.logger.log('firstUpdated()', { uref: this.uref });

    this.uref = this.firstRef;

    /** the official owner is the creator of the firstRef of the Wiki,
     * the firstRef is comming from the outside e.g. browser url. */
    const official = await loadEntity<Signed<Perspective>>(this.client, this.firstRef);
    if (!official) throw new Error(`cant find official perspective ${this.firstRef}`);
    this.officialOwner = official.object.payload.creatorId;

    await this.load();
    this.loading = false;
  }

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('checkout-perspective', ((event: CustomEvent) => {
      this.uref = event.detail.perspectiveId;
    }) as EventListener);

    this.addEventListener(CONTENT_UPDATED_TAG, ((event: ContentUpdatedEvent) => {
      if (this.uref === event.detail.uref) {
        this.content.load();
      }
    }) as EventListener);

    this.addEventListener(PROPOSAL_CREATED_TAG, ((event: ProposalCreatedEvent) => {
      this.catchMergeProposal(event);
    }) as EventListener);
  }

  async load() {
    const current = await loadEntity<Signed<Perspective>>(this.client, this.uref);
    if (!current) throw new Error(`cant find current perspective ${this.uref}`);

    this.creatorId = current.object.payload.creatorId;
  }

  updated(changedProperties) {
    if (changedProperties.has('uref')) {
      this.load();
    }
  }

  async catchMergeProposal(e: ProposalCreatedEvent) {
    await this.client.mutate({
      mutation: CREATE_PROPOSAL,
      variables: {
        toPerspectiveId: this.firstRef,
        fromPerspectiveId: this.uref,
        newPerspectives: e.detail.proposalDetails.newPerspectives,
        updates: e.detail.proposalDetails.updates
      }
    });
    this.eveesInfoLocal.load();
  }

  color() {
    if (this.firstRef === this.uref) {
      return DEFAULT_COLOR;
    } else {
      return eveeColor(this.creatorId);
    }
  }

  loggedIn() {
    this.content.load();
    this.eveesInfoLocal.load();
  }

  renderBreadcrumb() {
    return html`
      <evees-info-user-based
        id="evees-info-row"
        uref=${this.uref}
        first-uref=${this.firstRef}
        official-owner=${this.officialOwner}
        ?show-proposals=${this.showProposals}
        show-info
        show-icon
        ?show-debug=${false}
        show-draft
      >
      </evees-info-user-based>
    `;
  }

  renderLoginWidget() {
    return html`
      <evees-login-widget @changed=${() => this.loggedIn()}></evees-login-widget>
    `;
  }

  render() {
    if (this.loading)
      return html`
        <uprtcl-loading></uprtcl-loading>
      `;

    this.logger.log('rendering wiki after loading');

    return html`
      <div class="app-drawer">
        <div
          class="app-topbar"
          style=${styleMap({
            borderColor: this.color()
          })}
        >
          <div class="breadcrum-container">${this.renderBreadcrumb()}</div>
          <div class="login-widget-container">${this.renderLoginWidget()}</div>
        </div>

        <wiki-drawer-content
          id="wiki-drawer-content"
          uref=${this.uref}
          editable
          color=${this.color()}
          official-owner=${this.officialOwner}
        >
        </wiki-drawer-content>
      </div>
    `;
  }

  static get styles() {
    return [
      sharedStyles,
      css`
        :host {
          display: flex;
          flex: 1 1 0;
          flex-direction: column;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, 'Apple Color Emoji',
            Arial, sans-serif, 'Segoe UI Emoji', 'Segoe UI Symbol';
          font-size: 16px;
          color: #37352f;
          --mdc-theme-primary: #2196f3;
          width: 100%;
          position: relative;
        }
        .app-drawer {
          width: 100%;
          flex: 1 1 0;
          display: flex;
          flex-direction: column;
        }
        .app-topbar {
          width: 100%;
          display: flex;
          flex-direction: row;
          height: 68px;
          border-width: 5px;
          border-bottom-style: solid;
        }
        .breadcrum-container {
          flex: 1 1 0;
          padding: 16px;
          display: flex;
          flex-direction: row;
        }
        evees-info-user-based {
          width: 100%;
        }
        .login-widget-container {
          flex: 0 0 0;
          padding: 16px;
        }
      `
    ];
  }
}
