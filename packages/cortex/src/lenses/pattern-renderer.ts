import { html, LitElement, property } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { Store } from 'redux';
import '@material/mwc-linear-progress';
import '@material/mwc-button';
import '@authentic/mwc-icon';
import '@authentic/mwc-list';
import '@authentic/mwc-menu';

import './lens-renderer';

import { Lens, PatternAction } from '../types';
import { loadEntity, selectEntities, selectById } from '../entities';
import { LensesPattern } from '../patterns/patterns/lenses.pattern';
import { ActionsPattern } from '../patterns/patterns/actions.pattern';
import { RedirectPattern } from '../patterns/patterns/redirect.pattern';
import { PatternRegistry } from '../patterns/registry/pattern.registry';
import { Source } from '../services/sources/source';
import { Pattern } from '../patterns/pattern';
import { UpdatePattern } from '../patterns/patterns/update.pattern';
import { TransformPattern } from '../patterns/patterns/transform.pattern';

interface Isomorphism {
  entity: object;
  lenses: Lens[];
  actions: PatternAction[];
}

export function PatternRenderer<T>(
  patternRegistry: PatternRegistry,
  source: Source,
  store: Store<T>
): typeof HTMLElement {
  class PatternRenderer extends connect(store)(LitElement) {
    @property()
    public hash!: string;
    @property()
    private entity!: object;

    @property()
    private isomorphisms!: Array<Isomorphism>;

    // Lenses
    @property()
    private selectedLensIndex!: [number, number] | undefined;

    @property()
    private lensMenuOpen: boolean = false;
    @property()
    private actionsMenuOpen: boolean = false;

    /**
     * @returns the rendered selected lens
     */
    renderLens() {
      if (!this.selectedLensIndex) return html``;

      const selectedIsomorphism = this.isomorphisms[this.selectedLensIndex[0]];
      const selectedLens = selectedIsomorphism.lenses[this.selectedLensIndex[1]];
      const paramKeys = Object.keys(selectedLens.params);

      /**
       * TODO: add parameters to the lens
       *
       *  ${paramKeys.map(
       *     param =>
       *       html`
       *         ${param}="${selectedLens.params[param]}"
       *       `
       *   )}
       */

      return html`
        <lens-renderer
          .lens=${selectedLens}
          .data=${selectedIsomorphism.entity}
          @content-changed=${(e: CustomEvent) => this.updateContent(e.detail.newContent)}
        >
        </lens-renderer>
      `;
    }

    updateContent(newContent: any) {
      const updatePattern: UpdatePattern = patternRegistry.recognizeMerge(this.entity);

      if (updatePattern.update) {
        updatePattern.update(this.entity, newContent);
      }
    }

    renderLensSelector() {
      return html`
        <mwc-button @click=${() => (this.lensMenuOpen = !this.lensMenuOpen)}>
          <mwc-icon>remove_red_eye</mwc-icon>
        </mwc-button>

        <mwc-menu ?open=${this.lensMenuOpen}>
          <mwc-list>
            ${this.isomorphisms.map((isomorphism, i) =>
              isomorphism.lenses.map(
                (lens, j) =>
                  html`
                    <mwc-list-item
                      @click=${() => {
                        this.lensMenuOpen = false;
                        this.selectedLensIndex = undefined;
                        setTimeout(() => (this.selectedLensIndex = [i, j]), 1000);
                      }}
                    >
                      ${lens.lens}
                    </mwc-list-item>
                  `
              )
            )}
          </mwc-list>
        </mwc-menu>
      `;
    }

    renderActions() {
      return html`
        <mwc-button @click=${() => (this.actionsMenuOpen = !this.actionsMenuOpen)}>
          <mwc-icon>more_vert</mwc-icon>
        </mwc-button>

        <mwc-menu ?open=${this.actionsMenuOpen}>
          <mwc-list>
            ${this.isomorphisms.map(isomorphism =>
              isomorphism.actions.map(
                action =>
                  html`
                    <mwc-list-item @click=${() => action.action()}>
                      <mwc-icon>${action.icon}</mwc-icon>
                      ${action.title}
                    </mwc-list-item>
                  `
              )
            )}
          </mwc-list>
        </mwc-menu>
      `;
    }

    render() {
      return html`
        ${!this.entity || !this.selectedLensIndex
          ? html`
              <mwc-linear-progress></mwc-linear-progress>
            `
          : html`
              <div style="display: flex; flex-direction: row;">
                <div style="flex: 1;">
                  ${this.renderLens()}
                </div>

                ${this.renderLensSelector()} ${this.renderActions()}
              </div>
            `}
      `;
    }

    firstUpdated() {
      this.loadEntity(this.hash);
    }

    loadEntity(hash: string): Promise<any> {
      // TODO: type redux store
      return store.dispatch(loadEntity(source)(hash) as any);
    }

    stateChanged(state: T) {
      const entities = selectEntities(state);
      const entity = selectById(this.hash)(entities);

      if (entity && !this.entity) {
        this.entity = entity;
        let isomorphisms: Isomorphism[] = [];

        // Build first isomorphism: the proper entity
        isomorphisms.push(this.buildIsomorphism(entity));

        // Transform the entity to build its isomorphisms
        isomorphisms = isomorphisms.concat(this.transformEntity(entity));

        // Redirect the entity
        this.redirectEntity(entity).then(i => {
          isomorphisms = isomorphisms.concat(i);
          this.isomorphisms = isomorphisms.reverse();

          const renderIsomorphism = this.isomorphisms.findIndex(i => i.lenses.length > 0);
          this.selectedLensIndex = [renderIsomorphism, 0];
        });
      }
    }

    async redirectEntity(entity: object): Promise<Array<Isomorphism>> {
      const patterns: Array<Pattern | RedirectPattern<any>> = patternRegistry.recognize(entity);

      let isomorphisms: Isomorphism[] = [];

      for (const pattern of patterns) {
        if ((pattern as RedirectPattern<any>).redirect) {
          const redirectHash = await (pattern as RedirectPattern<any>).redirect(entity);

          if (redirectHash) {
            const redirectEntity = await this.loadEntity(redirectHash);

            isomorphisms.push(this.buildIsomorphism(redirectEntity));

            const transformIsomorphisms = this.transformEntity(redirectEntity);
            isomorphisms = isomorphisms.concat(transformIsomorphisms);

            // Recursive call to get all isomorphisms from redirected entities
            const redirectedIsomorphisms = await this.redirectEntity(redirectEntity);
            isomorphisms = isomorphisms.concat(redirectedIsomorphisms);
          }
        }
      }

      return isomorphisms;
    }

    buildIsomorphism<T extends object>(entity: T): Isomorphism {
      const patterns: Array<Pattern | LensesPattern | ActionsPattern> = patternRegistry.recognize(
        entity
      );

      let actions: PatternAction[] = [];
      let lenses: Lens[] = [];

      for (const pattern of patterns) {
        if ((pattern as LensesPattern).getLenses) {
          lenses = lenses.concat((pattern as LensesPattern).getLenses(entity));
        }

        if ((pattern as ActionsPattern).getActions) {
          actions = actions.concat((pattern as ActionsPattern).getActions(entity));
        }
      }

      return {
        entity,
        actions,
        lenses
      };
    }

    transformEntity<T extends object>(entity: T): Array<Isomorphism> {
      const patterns: Array<Pattern | TransformPattern<T, any>> = patternRegistry.recognize(entity);

      let isomorphisms: Array<Isomorphism> = [];

      for (const pattern of patterns) {
        if ((pattern as TransformPattern<any, any>).transform) {
          const transformedEntities: Array<any> = (pattern as TransformPattern<T, any>).transform(
            entity
          );

          isomorphisms = isomorphisms.concat(
            transformedEntities.map(entity => this.buildIsomorphism(entity))
          );
        }
      }

      return isomorphisms;
    }
  }

  return PatternRenderer;
}
