'use server';

import * as ops from './operations';

export async function getFinishedGoods(search?: string) {
  return ops.getFinishedGoods(search);
}

export async function createFinishedGood(data: Parameters<typeof ops.createFinishedGood>[0]) {
  return ops.createFinishedGood(data);
}

export async function updateFinishedGood(id: string, data: Parameters<typeof ops.updateFinishedGood>[1]) {
  return ops.updateFinishedGood(id, data);
}

export async function inwardFinishedGood(data: Parameters<typeof ops.inwardFinishedGood>[0]) {
  return ops.inwardFinishedGood(data);
}

export async function deleteFinishedGood(id: string) {
  return ops.deleteFinishedGood(id);
}

export async function archiveFinishedGood(id: string) {
  return ops.archiveFinishedGood(id);
}

export async function postDispatch(data: Parameters<typeof ops.createDispatch>[0]) {
  return ops.createDispatch(data);
}
