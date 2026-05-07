import { randomBytes, secretbox } from "tweetnacl";
import { decodeBase64, encodeBase64 } from "tweetnacl-util";

export interface EncryptedFile {
  ciphertext: Uint8Array;
  key: string;
  nonce: string;
}

export async function encryptFileBytes(file: File | Blob): Promise<EncryptedFile> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  const key = randomBytes(secretbox.keyLength);
  const nonce = randomBytes(secretbox.nonceLength);
  const ciphertext = secretbox(bytes, nonce, key);
  return {
    ciphertext,
    key: encodeBase64(key),
    nonce: encodeBase64(nonce),
  };
}

export function decryptFileBytes(
  ciphertext: Uint8Array,
  keyB64: string,
  nonceB64: string
): Uint8Array {
  const key = decodeBase64(keyB64);
  const nonce = decodeBase64(nonceB64);
  if (key.length !== secretbox.keyLength) throw new Error("Invalid file key length");
  if (nonce.length !== secretbox.nonceLength) throw new Error("Invalid file nonce length");
  const plaintext = secretbox.open(ciphertext, nonce, key);
  if (!plaintext) throw new Error("File decryption failed");
  return plaintext;
}
