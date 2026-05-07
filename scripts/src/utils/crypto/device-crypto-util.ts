import nacl from "tweetnacl";
import { decodeBase64, encodeBase64 } from "tweetnacl-util";

export interface DeviceKeypair {
  publicKey: string;
  secretKey: string;
}

export interface DeviceBoxEnvelope {
  scheme: "device-box-v1";
  senderDevicePublicKey: string;
  ciphertext: string;
  nonce: string;
}

export const generateDeviceKeypair = (): DeviceKeypair => {
  const kp = nacl.box.keyPair();
  return {
    publicKey: encodeBase64(kp.publicKey),
    secretKey: encodeBase64(kp.secretKey),
  };
};

export const encryptForDevice = (
  plaintext: string,
  recipientDevicePublicKey: string,
  senderDevice: DeviceKeypair
): DeviceBoxEnvelope => {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const boxed = nacl.box(
    new TextEncoder().encode(plaintext),
    nonce,
    decodeBase64(recipientDevicePublicKey),
    decodeBase64(senderDevice.secretKey)
  );
  return {
    scheme: "device-box-v1",
    senderDevicePublicKey: senderDevice.publicKey,
    ciphertext: encodeBase64(boxed),
    nonce: encodeBase64(nonce),
  };
};

export const decryptFromDevice = (
  envelope: DeviceBoxEnvelope,
  currentDevice: DeviceKeypair
): string => {
  const opened = nacl.box.open(
    decodeBase64(envelope.ciphertext),
    decodeBase64(envelope.nonce),
    decodeBase64(envelope.senderDevicePublicKey),
    decodeBase64(currentDevice.secretKey)
  );
  if (!opened) throw new Error("Device envelope decryption failed");
  return new TextDecoder().decode(opened);
};
