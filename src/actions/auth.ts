'use server';

import * as rbac from './rbac';

export async function getUsers() {
  return rbac.getUsers();
}

export async function createUser(data: Parameters<typeof rbac.createUser>[0]) {
  return rbac.createUser(data);
}

export async function createStaffUser(data: Parameters<typeof rbac.createUser>[0]) {
  return rbac.createUser(data);
}

export async function updateUser(userId: string, data: Parameters<typeof rbac.updateUser>[1]) {
  return rbac.updateUser(userId, data);
}

export async function deleteUser(userId: string) {
  return rbac.deleteUser(userId);
}

export async function loginUser(usernameInput: string, passwordInput: string) {
  return rbac.loginUser(usernameInput, passwordInput);
}

export async function checkUserLoginStatus(usernameInput: string) {
  return rbac.checkUserLoginStatus(usernameInput);
}

export async function setupFirstTimePassword(usernameInput: string, passwordInput: string) {
  return rbac.setupFirstTimePassword(usernameInput, passwordInput);
}

export async function getCurrentUser() {
  return rbac.getCurrentUser();
}

export async function logoutUser() {
  return rbac.logoutUser();
}
