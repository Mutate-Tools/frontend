import nacl, { randomBytes, secretbox } from "tweetnacl";
import { decodeBase64, encodeBase64 } from "tweetnacl-util";
import { RatchetState, encryptRatchet, decryptRatchet } from "./double-ratchet-util";

export interface GroupKeyEnvelope {
  ciphertext: string;
  nonce: string;
  header: { dh: string; n: number; pn: number };
  aliceIdentityKey?: string;
  aliceEphemeralKey?: string;
  usedSignedPrekey?: string;
  usedOneTimePrekeyId?: string;
}

export function generateGroupKey(): string {
  return encodeBase64(randomBytes(secretbox.keyLength));
}

export function encryptGroupMessage(
  groupKeyB64: string,
  plaintext: string
): { ciphertext: string; nonce: string } {
  const key = decodeBase64(groupKeyB64);
  if (key.length !== secretbox.keyLength) {
    throw new Error(`Invalid group key length: ${key.length}`);
  }
  const nonce = randomBytes(secretbox.nonceLength);
  const ciphertext = secretbox(new TextEncoder().encode(plaintext), nonce, key);
  return {
    ciphertext: encodeBase64(ciphertext),
    nonce: encodeBase64(nonce),
  };
}

export function decryptGroupMessage(
  groupKeyB64: string,
  ciphertextB64: string,
  nonceB64: string
): string {
  const key = decodeBase64(groupKeyB64);
  const ciphertext = decodeBase64(ciphertextB64);
  const nonce = decodeBase64(nonceB64);
  const plaintext = secretbox.open(ciphertext, nonce, key);
  if (!plaintext) {
    throw new Error("Group message decryption failed");
  }
  return new TextDecoder().decode(plaintext);
}

export function wrapGroupKeyForMember(
  groupKeyB64: string,
  ratchetState: RatchetState
): GroupKeyEnvelope {
  const payload = JSON.stringify({ groupKey: groupKeyB64 });
  const { ciphertext, nonce, header } = encryptRatchet(ratchetState, payload);
  const envelope: GroupKeyEnvelope = { ciphertext, nonce, header };
  if (ratchetState.handshake) {
    envelope.aliceIdentityKey = ratchetState.handshake.aliceIdentityKey;
    envelope.aliceEphemeralKey = ratchetState.handshake.aliceEphemeralKey;
    envelope.usedSignedPrekey = ratchetState.handshake.usedSignedPrekey;
    envelope.usedOneTimePrekeyId = ratchetState.handshake.usedOneTimePrekeyId;
  }
  return envelope;
}

export function unwrapGroupKey(
  envelope: GroupKeyEnvelope,
  ratchetState: RatchetState
): string {
  const plaintext = decryptRatchet(
    ratchetState,
    envelope.header,
    envelope.ciphertext,
    envelope.nonce
  );
  const parsed = JSON.parse(plaintext) as { groupKey: string };
  if (!parsed.groupKey) throw new Error("Unwrapped payload missing groupKey");
  const keyBytes = decodeBase64(parsed.groupKey);
  if (keyBytes.length !== secretbox.keyLength) {
    throw new Error(`Unwrapped group key has invalid length: ${keyBytes.length}`);
  }
  return parsed.groupKey;
}
