import { LitElement, property, html, css, internalProperty } from 'lit-element';

const styleMap = (style) => {
  return Object.entries(style).reduce((styleString, [propName, propValue]) => {
    propName = propName.replace(/([A-Z])/g, (matches) => `-${matches[0].toLowerCase()}`);
    return `${styleString}${propName}:${propValue};`;
  }, '');
};

import {
  Logger,
  servicesConnect,
  eveeColor,
  PerspectiveType,
  CommitType,
  Evees,
  UpdatePerspectiveData,
  CreateEvee,
} from '@uprtcl/evees';

import { TextType, DocNode, CustomBlocks } from '../types';
import { icons } from './prosemirror/icons';
import { DocumentsBindings } from '../bindings';
import { DocumentsModule } from '../documents.module';

const LOGINFO = false;
const SELECTED_BACKGROUND = 'rgb(200,200,200,0.2);';

export class DocumentPreview extends servicesConnect(LitElement) {
  logger = new Logger('DOCUMENT-PREVIEW');

  @property({ type: String, attribute: 'uref' })
  uref!: string;

  reloading;
  doc;
  readonly;

  async firstUpdated() {
    const documentsModule = this.evees.modules.get(DocumentsModule.id);

    const data: Entity<TextNode> =  await this.evees.getPerspectiveData(this.uref);

  }


  render() {
    // if (LOGINFO) this.logger.log('render()', { doc: this.doc });

    if (this.reloading || this.doc === undefined) {
      return html` <uprtcl-loading></uprtcl-loading> `;
    }

    const editorClasses = ['editor-container'];

    if (!this.readOnly) {
      editorClasses.concat(['padding-bottom']);
    }

    return html`
      <div class=${editorClasses.join(' ')}>
        ${this.renderDocNode(this.doc)} ${this.renderDocumentEnd()}
      </div>
      <!-- <div @click=${this.clickAreaClicked} class="click-area"></div> -->
    `;
  }

  static get styles() {
    return css`
      :host {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        text-align: left;
        position: relative;
      }

      * {
        font-family: 'Lora', serif;
      }


    `;
  }
}
