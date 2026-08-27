'use server';

import * as inventory from './inventory';

export async function getRawMaterials(search?: string, statusFilter?: string) {
  return inventory.getRawMaterials(search, statusFilter);
}

export async function getRawMaterialMasters(search?: string) {
  return inventory.getRawMaterialMasters(search);
}

export async function archiveRawMaterialByCode(code: string) {
  return inventory.archiveRawMaterialByCode(code);
}

export async function getRawMaterialByCode(code: string) {
  return inventory.getRawMaterialByCode(code);
}

export async function createRawMaterial(data: Parameters<typeof inventory.createRawMaterial>[0]) {
  return inventory.createRawMaterial(data);
}

export async function updateRawMaterial(id: string, data: Parameters<typeof inventory.updateRawMaterial>[1]) {
  return inventory.updateRawMaterial(id, data);
}

export async function updateRawMaterialMasterByCode(
  code: string,
  data: Parameters<typeof inventory.updateRawMaterialMasterByCode>[1]
) {
  return inventory.updateRawMaterialMasterByCode(code, data);
}

export async function inwardRawMaterial(data: Parameters<typeof inventory.inwardRawMaterial>[0]) {
  return inventory.inwardRawMaterial(data);
}

export async function deleteRawMaterial(id: string) {
  return inventory.deleteRawMaterial(id);
}
