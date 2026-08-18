'use server';

import * as ops from './operations';

export async function getMovements(search?: string) {
  return ops.getRMIssues(search);
}

export async function createRMIssue(data: Parameters<typeof ops.createRMIssue>[0]) {
  return ops.createRMIssue(data);
}

export async function postIssue(data: Parameters<typeof ops.createRMIssue>[0]) {
  return ops.createRMIssue(data);
}

export async function createProductionLog(data: Parameters<typeof ops.createProductionLog>[0]) {
  return ops.createProductionLog(data);
}

export async function postGRN(data: Parameters<typeof ops.createProductionLog>[0]) {
  return ops.createProductionLog(data);
}

export async function createPackagingIssue(data: Parameters<typeof ops.createPackagingIssue>[0]) {
  return ops.createPackagingIssue(data);
}

export async function createDispatch(data: Parameters<typeof ops.createDispatch>[0]) {
  return ops.createDispatch(data);
}
