import axios from "axios";
import nacl from "tweetnacl";
import { encodeBase64, decodeBase64 } from "tweetnacl-util";
import { IdentityKeypair, serializeKeypair, deserializeKeypair } from "./identity-util";
import { getBackendUrl } from '@/src/utils/backend-url';










export const initiateDeviceSync = async (token: string) => {
    const res = await axios.post(`${getBackendUrl()}/auth/oidc/sync/start`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
};




export const linkNewDevice = async (token: string, syncCode: string, _existingIdentityPublicKey: string) => {
    const ephemeral = nacl.box.keyPair();

    await axios.post(`${getBackendUrl()}/auth/oidc/sync/finalize`, {
        syncCode,
        encryptedPayload: encodeBase64(ephemeral.publicKey),
    }, {
        headers: { Authorization: `Bearer ${token}` }
    });

    return ephemeral;
};




export const transferIdentityKeys = async (
    token: string,
    syncCode: string,
    receiverEphemeralPublicKey: string,
    identityKeypair: IdentityKeypair
) => {
    const receiverPk = decodeBase64(receiverEphemeralPublicKey);

    const serialized = JSON.stringify(serializeKeypair(identityKeypair));
    const nonce = nacl.randomBytes(nacl.box.nonceLength);

    const encryptedKeys = nacl.box(
        new TextEncoder().encode(serialized),
        nonce,
        receiverPk,
        identityKeypair.encryption.secretKey
    );

    const payload = {
        ciphertext: encodeBase64(encryptedKeys),
        nonce: encodeBase64(nonce),
    };

    await axios.post(`${getBackendUrl()}/auth/oidc/sync/finalize`, {
        syncCode,
        encryptedPayload: JSON.stringify(payload),
    }, {
        headers: { Authorization: `Bearer ${token}` }
    });
};




export const finalizeKeyTransfer = (
    encryptedPayload: string,
    receiverEphemeralSecretKey: Uint8Array,
    senderIdentityPublicKey: Uint8Array
) => {
    const { ciphertext, nonce } = JSON.parse(encryptedPayload);

    const decrypted = nacl.box.open(
        decodeBase64(ciphertext),
        decodeBase64(nonce),
        senderIdentityPublicKey,
        receiverEphemeralSecretKey
    );

    if (!decrypted) throw new Error("Failed to decrypt transferred identity keys.");

    const keypairData = JSON.parse(new TextDecoder().decode(decrypted));
    return deserializeKeypair(keypairData);
};
