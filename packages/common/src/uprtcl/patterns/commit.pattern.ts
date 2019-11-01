import { injectable, inject } from 'inversify';
import { html } from 'lit-element';

import {
  Pattern,
  Secured,
  HasRedirect,
  IsSecure,
  HasLinks,
  Creatable,
  HasLenses,
  Lens,
  Signed,
  PatternTypes
} from '@uprtcl/cortex';

import { Commit, UprtclTypes } from '../../types';
import { Uprtcl } from '../services/uprtcl';

export const propertyOrder = ['creatorId', 'timestamp', 'message', 'parentsIds', 'dataId'];

@injectable()
export class CommitPattern
  implements
    Pattern,
    HasLinks,
    HasRedirect,
    Creatable<
      { dataId: string; message: string; parentsIds: string[]; timestamp?: number },
      Signed<Commit>
    >,
    HasLenses {
  constructor(
    @inject(PatternTypes.Core.Secured)
    protected securedPattern: Pattern & IsSecure<Secured<Commit>>,
    @inject(UprtclTypes.Uprtcl) protected uprtcl: Uprtcl
  ) {}

  recognize(object: object) {
    return (
      this.securedPattern.recognize(object) &&
      propertyOrder.every(p =>
        this.securedPattern.extract(object as Secured<Commit>).hasOwnProperty(p)
      )
    );
  }

  getHardLinks: (commit: Secured<Commit>) => string[] = (commit: Secured<Commit>): string[] => [
    commit.object.payload.dataId,
    ...commit.object.payload.parentsIds
  ];
  getSoftLinks: (commit: Secured<Commit>) => Promise<string[]> = async (commit: Secured<Commit>) =>
    [] as string[];
  getLinks: (commit: Secured<Commit>) => Promise<string[]> = (commit: Secured<Commit>) =>
    this.getSoftLinks(commit).then(links => links.concat(this.getHardLinks(commit)));

  redirect: (commit: Secured<Commit>) => Promise<string> = async (commit: Secured<Commit>) =>
    commit.object.payload.dataId;

  create: (
    args: {
      dataId: string;
      message: string;
      parentsIds: string[];
      timestamp?: number;
    },
    providerName?: string
  ) => Promise<Secured<Commit>> = async (
    args: {
      dataId: string;
      message: string;
      parentsIds: string[];
      timestamp?: number;
    },
    providerName?: string
  ) => {
    return this.uprtcl.createCommit(args, providerName);
  };

  getLenses: (commit: Secured<Commit>) => Lens[] = (commit: Secured<Commit>): Lens[] => {
    return [
      {
        name: 'commit-history',
        render: html`
          <commit-history .data=${commit}></commit-history>
        `
      }
    ];
  };
}