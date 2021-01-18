import { html } from 'lit-element';

import { AccessControl, Logger, Lens } from '@uprtcl/evees';
import { HttpProvider } from '@uprtcl/http-provider';

import { PermissionType, UserPermissions } from './types';

const uprtcl_api: string = 'uprtcl-acl-v1';
export class EveesAccessControlHttp implements AccessControl {
  logger = new Logger('HTTP-EVEES-ACCESS-CONTROL');

  constructor(protected provider: HttpProvider) {}

  async toggleDelegate(hash: string, delegate: boolean, delegateTo: string) {
    await this.provider.put(
      `/permissions/${hash}/delegate?delegate=${delegate}&delegateTo=${delegateTo}`,
      {}
    );
  }

  async getUserPermissions(hash: string) {
    return await this.provider.getObject<UserPermissions>(`/permissions/${hash}`);
  }

  async getPermissions(hash: string): Promise<any | undefined> {
    return this.provider.getObject(`/permissions/${hash}/details`);
  }

  async removePermissions(hash: string, userId: string) {
    await this.provider.delete(`/permissions/${hash}/single/${userId}`);
  }

  async setPrivatePermissions(hash: string, type: PermissionType, userId: string) {
    await this.provider.put(`/permissions/${hash}/single`, {
      type,
      userId,
    });
  }

  async setPublicPermissions(hash: string, type: PermissionType, value: Boolean) {
    await this.provider.put(`/permissions/${hash}/public`, { type, value });
  }

  async canUpdate(uref: string) {
    const res = await this.getUserPermissions(uref);
    return res.canUpdate;
  }

  lense(): Lens {
    return {
      name: 'evees-http:access-control',
      type: 'access-control',
      render: (entity: any) => {
        return html`
          <evees-http-permissions uref=${entity.uref} parentId=${entity.parentId}>
          </evees-http-permissions>
        `;
      },
    };
  }
}