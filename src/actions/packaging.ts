'use server';

import * as inventory from './inventory';

export async function getPackagingMaterials(search?: string, statusFilter?: string) {
  return inventory.getPackagingMaterials(search, statusFilter);
}

export async function getPackagingMaterialByCode(code: string) {
  return inventory.getPackagingMaterialByCode(code);
}

export async function createPackagingMaterial(data: Parameters<typeof inventory.createPackagingMaterial>[0]) {
  return inventory.createPackagingMaterial(data);
}

export async function updatePackagingMaterial(id: string, data: Parameters<typeof inventory.updatePackagingMaterial>[1]) {
  return inventory.updatePackagingMaterial(id, data);
}

export async function inwardPackagingMaterial(data: Parameters<typeof inventory.inwardPackagingMaterial>[0]) {
  return inventory.inwardPackagingMaterial(data);
}

export async function deletePackagingMaterial(id: string) {
  return inventory.deletePackagingMaterial(id);
}

export async function archivePackagingMaterial(id: string) {
  return inventory.archivePackagingMaterial(id);
}
