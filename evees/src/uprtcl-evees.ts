/** Types */
export {
  Commit,
  Perspective,
  PerspectiveDetails,
  HasDiffLenses,
  DiffLens,
  PartialPerspective,
} from './evees/interfaces/types';

/** interfaces */
export { NewPerspectiveData } from './evees/interfaces/types';
export { EveesConfig } from './evees/interfaces/types';
export { EveesContentModule } from './evees/interfaces/evees.content.module';

export { Evees } from './evees/evees.service';
export { Client } from './evees/interfaces/client';
export { RemoteEvees } from './evees/interfaces/remote.evees';

/** Default Perspectives */
export { getHome, snapDefaultPerspective } from './evees/default.perspectives';

/** Merge */
export { Merge } from './evees/merge/merge.behaviour';

export { SimpleMergeStrategy } from './evees/merge/simple.merge-strategy';
export { RecursiveContextMergeStrategy } from './evees/merge/recursive-context.merge-strategy';
export { mergeStrings, mergeResult } from './evees/merge/utils';

/** Elements */
export { EveesPerspectivesList } from './evees/elements/evees-perspectives-list';
export { EveesBaseElement } from './evees/elements/evees-base';
export { EveesInfoPopper } from './evees/elements/evees-info-popper';
export { EveesInfoPage } from './evees/elements/evees-info-page';
export { EveesInfoBase } from './evees/elements/evees-info-base';
export { EveesInfoUserBased, EveesInfoConfig } from './evees/elements/evees-info-user-based';
export { ProposalsList } from './evees/elements/evees-proposals-list';
export { EveesPerspectiveIcon } from './evees/elements/evees-perspective-icon';

export {
  UpdateContentEvent,
  UpdateContentArgs,
  ContentUpdatedEvent,
  SpliceChildrenEvent,
  ProposalCreatedEvent,
  CONTENT_UPDATED_TAG,
  PROPOSAL_CREATED_TAG,
} from './evees/elements/events';
export { EveesDiff } from './evees/elements/evees-diff';

/** UI support components */
export { prettyAddress } from './evees/elements/support';
export { eveeColor, DEFAULT_COLOR } from './evees/elements/support';

/** Utils */
export { isAncestorOf } from './evees/merge/ancestor';
export { Connection, ConnectionOptions } from './utils/connection';

/** Proposals */
export { Proposal, UpdateRequest } from './evees/interfaces/types';
export { Proposals } from './evees/interfaces/proposals';

/** Aceess Control */
export { AccessControl } from './evees/interfaces/access-control';
export { RemoteLogged } from './evees/interfaces/remote.logged';
export { RemoteWithUI } from './evees/interfaces/remote.with-ui';

export { Logger } from './utils/logger';

/** CAS */
export { Secured, hashObject, deriveEntity, sortObject } from './cas/utils/cid-hash';
export { extractSignedEntity, deriveSecured, signObject } from './cas/utils/signed';
export { Entity } from './cas/interfaces/entity';
export { CASStore } from './cas/interfaces/cas-store';
export { CASRemote } from './cas/interfaces/cas-remote';
export { CidConfig } from './cas/interfaces/cid-config';

/** Patterns */
export { HasChildren } from './patterns/behaviours/has-links';
export { HasLenses, Lens } from './patterns/behaviours/has-lenses';
export { HasTitle } from './patterns/behaviours/has-title';
export { PatternRecognizer } from './patterns/recognizer/pattern-recognizer';
export { Pattern } from './patterns/interfaces/pattern';
export { PerspectiveType } from './evees/patterns/perspective.pattern';
export { CommitType } from './evees/patterns/commit.pattern';

/** container */
export { eveesConnect } from './container/evees-connect.mixin';
export { eveesLoader } from './creator-helpers/evees.loader';

/** Clients */
export { EveesDraftsLocal } from './evees/clients/evees.drafts.local';