
import { Logger } from '@uprtcl/micro-orchestrator';
import {
  IpfsSource,
  EthereumConnection,
  ConnectionOptions,
  IpfsConnectionOptions,
  provider
} from '@uprtcl/connections';

import * as UprtclContractArtifact from './uprtcl-contract.json';

import { Commit, Perspective, PerspectiveDetails } from '../../../../types';
import { UprtclRemote } from '../../uprtcl.remote';
import { ProposalMock } from '../../proposal.mock';
import { sortObject } from '../../../../utils/utils';
import { Secured } from '../../../../patterns/default-secured.pattern';
import { ADD_PERSP, UPDATE_PERSP_DETAILS, GET_PERSP_DETAILS, hashCid } from './common';
import { UprtclAccessControlEthereum } from './uprtcl-access-control.ethereum';

export class UprtclEthereum extends IpfsSource implements UprtclRemote {
  logger: Logger = new Logger('UprtclEtereum');

  ethConnection!: EthereumConnection;

  constructor(provider: provider, ipfsOptions: IpfsConnectionOptions, options: ConnectionOptions) {
    super(ipfsOptions, options);
    this.ethConnection = new EthereumConnection(
      { provider: provider, contract: UprtclContractArtifact as any },
      options
    );
  }

  get accessControl() {
    return new UprtclAccessControlEthereum(this.ethConnection);
  }

  get proposals() {
    return new ProposalMock();
  }

  /**
   * @override
   */
  async ready(): Promise<void> {
    await Promise.all([super.ready(), this.ethConnection.ready()]);
  }

  /**
   * @override
   */
  async clonePerspective(secured: Secured<Perspective>): Promise<void> {
    let perspective = secured.object.payload;

    /** validate */
    if (!perspective.origin) throw new Error('origin cannot be empty');

    /** Store the perspective data in the data layer */
    const perspectiveId = await this.addObject(sortObject(secured.object));
    this.logger.log(`[ETH] createPerspective - added to IPFS`, perspectiveId);

    if (secured.id && secured.id != perspectiveId) {
      throw new Error(
        `perspective ID computed by IPFS ${perspectiveId} is not the same as the input one ${secured.id}.`
      );
    }

    const perspectiveIdHash = await hashCid(perspectiveId);

    /** TX is sent, and await to force order (preent head update on an unexisting perspective) */
    await this.ethConnection.send(ADD_PERSP, [
      perspectiveIdHash,
      perspectiveIdHash,
      '',
      '',
      '',
      this.ethConnection.getCurrentAccount(),
      perspectiveId
    ]);

    this.logger.log(`[ETH] addPerspective - TX minted`);
  }

  /**
   * @override
   */
  async cloneCommit(secured: Secured<Commit>): Promise<void> {
    const commit = sortObject(secured.object);
    /** Store the perspective data in the data layer */

    let commitId = await this.addObject(commit);
    this.logger.log(`[ETH] createCommit - added to IPFS`, commitId, commit);

    if (secured.id && secured.id != commitId) {
      throw new Error('commit ID computed by IPFS is not the same as the input one.');
    }
  }

  /**
   * @override
   */
  async updatePerspectiveDetails(
    perspectiveId: string,
    details: PerspectiveDetails
  ): Promise<void> {
    let perspectiveIdHash = await hashCid(perspectiveId);

    await this.ethConnection.send(UPDATE_PERSP_DETAILS, [
      perspectiveIdHash,
      details.headId || '',
      details.context || '',
      details.name || ''
    ]);
  }

  /**
   * @override
   */
  getContextPerspectives(context: string): Promise<Secured<Perspective>[]> {
    throw new Error('Method not implemented.');
  }

  /**
   * @override
   */
  async getPerspectiveDetails(perspectiveId: string): Promise<PerspectiveDetails> {
    const perspectiveIdHash = await hashCid(perspectiveId);

    const perspective: PerspectiveDetails & { owner: string } = await this.ethConnection.call(
      GET_PERSP_DETAILS,
      [perspectiveIdHash]
    );
    return { name: perspective.name, context: perspective.context, headId: perspective.headId };
  }
}
