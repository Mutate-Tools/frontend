import nacl from "tweetnacl";
import { decodeBase64, encodeBase64 } from "tweetnacl-util";
import { IdentityKeypair } from "./identity-util";
import SHA256 from "crypto-js/sha256";
import CryptoJS from "crypto-js";
import { lsGet, lsSet } from "@/src/utils/safe-storage";


function wordToUint8Array(wordArray: any): Uint8Array {
    const l = wordArray.sigBytes;
    const words = wordArray.words;
    const result = new Uint8Array(l);
    for (let i = 0; i < l; i++) {
        result[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
    }
    return result;
}






export interface PrekeyBundle {
    identityKey: string;
    identitySigningKey: string;
    signedPrekey: {
        key: string;
        signature: string;
    };
    oneTimePrekey?: {
        key: string;
        id: string;
    } | null;
}




export const generateUserPrekeyBundle = (identityKeypair: IdentityKeypair) => {
    const currentIdPKB64 = encodeBase64(identityKeypair.encryption.publicKey);
    const existingSPKPubB64 = lsGet(`active_spk_pub_${currentIdPKB64}`);
    const existingSPKSecB64 = existingSPKPubB64 ? lsGet(`signed_prekey_secret_${existingSPKPubB64}`) : null;

    let signedPrekey: nacl.BoxKeyPair;
    let signature: string;

    if (existingSPKPubB64 && existingSPKSecB64) {
        signedPrekey = {
            publicKey: decodeBase64(existingSPKPubB64),
            secretKey: decodeBase64(existingSPKSecB64)
        };
        signature = encodeBase64(
            nacl.sign.detached(signedPrekey.publicKey, identityKeypair.signing.secretKey)
        );
    } else {
        signedPrekey = nacl.box.keyPair();
        signature = encodeBase64(
            nacl.sign.detached(signedPrekey.publicKey, identityKeypair.signing.secretKey)
        );

        const spkPubB64 = encodeBase64(signedPrekey.publicKey);
        lsSet(`signed_prekey_secret_${spkPubB64}`, encodeBase64(signedPrekey.secretKey));
        lsSet(`active_spk_pub_${currentIdPKB64}`, spkPubB64);
    }

    const oneTimePrekeys = Array.from({ length: 10 }, (_, i) => {
        const kp = nacl.box.keyPair();
        return {
            id: `otpk_${Date.now()}_${i}`,
            key: encodeBase64(kp.publicKey),
            secretKey: encodeBase64(kp.secretKey),
        };
    });

    oneTimePrekeys.forEach(pk => {
        lsSet(`otpk_secret_${pk.id}`, pk.secretKey);
    });

    return {
        identityKey: encodeBase64(identityKeypair.encryption.publicKey),
        identitySigningKey: encodeBase64(identityKeypair.signing.publicKey),
        signedPrekey: {
            key: encodeBase64(signedPrekey.publicKey),
            signature,
        },
        oneTimePrekeys: oneTimePrekeys.map(pk => ({ id: pk.id, key: pk.key })),
    };
};




export const initiateX3DH = (
    aliceIdentity: IdentityKeypair,
    bobBundle: PrekeyBundle
) => {
    const ephemeral = nacl.box.keyPair();

    const bobEncryptionKey = decodeBase64(bobBundle.identityKey);
    const bobSignedPrekey = decodeBase64(bobBundle.signedPrekey.key);
    const bobOneTimePrekey = bobBundle.oneTimePrekey ? decodeBase64(bobBundle.oneTimePrekey.key) : null;

    const dh1 = nacl.scalarMult(aliceIdentity.encryption.secretKey, bobSignedPrekey);
    const dh2 = nacl.scalarMult(ephemeral.secretKey, bobEncryptionKey);
    const dh3 = nacl.scalarMult(ephemeral.secretKey, bobSignedPrekey);
    const dh4 = bobOneTimePrekey
        ? (nacl.scalarMult(ephemeral.secretKey, bobOneTimePrekey) as Uint8Array)
        : new Uint8Array(32);

    const combined = new Uint8Array(dh1.length + dh2.length + dh3.length + (bobOneTimePrekey ? dh4.length : 0));
    combined.set(dh1);
    combined.set(dh2 as any, dh1.length);
    combined.set(dh3 as any, dh1.length + dh2.length);
    if (bobOneTimePrekey) combined.set(dh4 as any, dh1.length + dh2.length + dh3.length);

    const sharedSecret = wordToUint8Array(SHA256(CryptoJS.lib.WordArray.create(combined as any)));

    return {
        sharedSecret,
        ephemeralPublicKey: encodeBase64(ephemeral.publicKey),
        usedSignedPrekey: bobBundle.signedPrekey.key,
        usedOneTimePrekeyId: bobBundle.oneTimePrekey?.id,
    };
};




export const respondX3DH = (
    bobIdentity: IdentityKeypair,
    aliceIdentityPublicKey: string,
    aliceEphemeralKey: string,
    bobSignedPrekeyPublicKey: string,
    bobOneTimePrekeyId?: string
) => {
    const aliceIdentity = decodeBase64(aliceIdentityPublicKey);
    const aliceEphemeral = decodeBase64(aliceEphemeralKey);

    let bobSignedPrekeySecret: Uint8Array;
    const signedPrekeySecretVal = lsGet(`signed_prekey_secret_${bobSignedPrekeyPublicKey}`);

    if (signedPrekeySecretVal) {
        bobSignedPrekeySecret = decodeBase64(signedPrekeySecretVal);
    } else if (bobSignedPrekeyPublicKey === encodeBase64(bobIdentity.encryption.publicKey)) {
        bobSignedPrekeySecret = bobIdentity.encryption.secretKey;
    } else {
        throw new Error(`Missing signed prekey secret for ${bobSignedPrekeyPublicKey}`);
    }

    if (bobSignedPrekeySecret.length !== 32) {
        throw new Error(`Bad Bob Signed Prekey Secret size: ${bobSignedPrekeySecret.length}`);
    }

    let bobOneTimePrekeySecret: Uint8Array | null = null;
    if (bobOneTimePrekeyId) {
        const otpkSecretVal = lsGet(`otpk_secret_${bobOneTimePrekeyId}`);
        if (otpkSecretVal) {
            bobOneTimePrekeySecret = decodeBase64(otpkSecretVal);
        }
    }

    const dh1 = nacl.scalarMult(bobSignedPrekeySecret, aliceIdentity);
    const dh2 = nacl.scalarMult(bobIdentity.encryption.secretKey, aliceEphemeral);
    const dh3 = nacl.scalarMult(bobSignedPrekeySecret, aliceEphemeral);

    const dh4 = bobOneTimePrekeySecret
        ? (nacl.scalarMult(bobOneTimePrekeySecret, aliceEphemeral) as Uint8Array)
        : new Uint8Array(32);

    const combined = new Uint8Array(dh1.length + dh2.length + dh3.length + (bobOneTimePrekeySecret ? dh4.length : 0));
    combined.set(dh1);
    combined.set(dh2 as any, dh1.length);
    combined.set(dh3 as any, dh1.length + dh2.length);
    if (bobOneTimePrekeySecret) combined.set(dh4 as any, dh1.length + dh2.length + dh3.length);

    const sharedSecret = wordToUint8Array(SHA256(CryptoJS.lib.WordArray.create(combined as any)));

    return sharedSecret;
};
