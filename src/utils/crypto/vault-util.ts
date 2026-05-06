import { decodeBase64, encodeBase64 } from "tweetnacl-util";
import { exportIdentityStorage, importIdentityStorage } from "./identity-util";
import { storageUtil } from "./storage-util";

export interface EncryptedVaultPayload {
  ciphertext: string;
  nonce: string;
  salt: string;
  version: number;
  kdf: {
    name: "PBKDF2";
    hash: "SHA-256";
    iterations: number;
  };
}

const ITERATIONS = 250000;

const deriveVaultKey = async (passphrase: string, salt: Uint8Array, iterations: number) => {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
};

export const exportVaultPlaintext = async () => {
  const localStorage = exportIdentityStorage();
  const indexedDb = await storageUtil.exportAll();

  console.log("[Vault] Exporting vault:", {
    version: 1,
    exportedAt: new Date().toISOString(),
    localStorageKeys: Object.keys(localStorage),
    messageCount: indexedDb.messages?.length || 0,
    groupKeyCount: indexedDb.groupKeys?.length || 0,
    groupMessageCount: indexedDb.groupMessages?.length || 0,
  });

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    localStorage,
    indexedDb,
  };
};

export const importVaultPlaintext = async (vault: any) => {
  const localStorageData = vault?.localStorage || {};
  const indexedDbData = vault?.indexedDb || {};

  console.log("[Vault] Importing vault:", {
    version: vault?.version || "unknown",
    exportedAt: vault?.exportedAt || "unknown",
    localStorageKeys: Object.keys(localStorageData),
    messageCount: indexedDbData.messages?.length || 0,
    groupKeyCount: indexedDbData.groupKeys?.length || 0,
    groupMessageCount: indexedDbData.groupMessages?.length || 0,
  });

  importIdentityStorage(localStorageData);
  await storageUtil.importAll(indexedDbData);

  console.log("[Vault] Import completed");
};

export const encryptVault = async (passphrase: string): Promise<EncryptedVaultPayload> => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveVaultKey(passphrase, salt, ITERATIONS);
  const plaintext = JSON.stringify(await exportVaultPlaintext());
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce },
    key,
    new TextEncoder().encode(plaintext)
  );
  return {
    ciphertext: encodeBase64(new Uint8Array(ciphertext)),
    nonce: encodeBase64(nonce),
    salt: encodeBase64(salt),
    version: 1,
    kdf: { name: "PBKDF2", hash: "SHA-256", iterations: ITERATIONS },
  };
};

export const decryptVault = async (payload: EncryptedVaultPayload, passphrase: string) => {
  const salt = decodeBase64(payload.salt);
  const nonce = decodeBase64(payload.nonce);
  const key = await deriveVaultKey(passphrase, salt, payload.kdf?.iterations || ITERATIONS);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: nonce },
    key,
    decodeBase64(payload.ciphertext)
  );
  return JSON.parse(new TextDecoder().decode(plaintext));
};
