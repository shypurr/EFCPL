'use server';

import * as rbac from './rbac';

export async function getRoles() {
  return rbac.getRoles();
}

export async function createRole(data: Parameters<typeof rbac.createRole>[0]) {
  return rbac.createRole(data);
}

export async function updateRole(roleId: string, data: Parameters<typeof rbac.updateRole>[1]) {
  return rbac.updateRole(roleId, data);
}

export async function deleteRole(roleId: string) {
  return rbac.deleteRole(roleId);
}

export async function getPermissions() {
  return rbac.getPermissions();
}
