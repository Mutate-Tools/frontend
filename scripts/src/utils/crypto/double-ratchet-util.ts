import nacl, { box, randomBytes, secretbox } from "tweetnacl";
import { decodeBase64, encodeBase64 } from "tweetnacl-util";
import HmacSHA256 from "crypto-js/hmac-sha256";
import CryptoJS from "crypto-js";







function wordToUint8Array(wordArray: any): Uint8Array {
    const l = wordArray.sigBytes;
    const words = wordArray.words;
    const result = new Uint8Array(l);
    for (let i = 0; i < l; i++) {
        result[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
    }
    return result;
}

export interface RatchetState {
    identitySK: Uint8Array;
    DHs: { publicKey: Uint8Array; secretKey: Uint8Array };
    DHr: Uint8Array | null;
    RK: Uint8Array;
    CKs: Uint8Array | null;
    CKr: Uint8Array | null;
    Ns: number;
    Nr: number;
    PN: number;
    MKSKIPPED: Map<string, Uint8Array>;
    role: "initiator" | "responder";
    handshake?: {
        aliceIdentityKey: string;
        aliceEphemeralKey: string;
        usedSignedPrekey?: string;
        usedOneTimePrekeyId?: string;
    };
}

function KDF_RK(rk: Uint8Array, dhOutput: Uint8Array): [Uint8Array, Uint8Array] {
    const rkWords = CryptoJS.lib.WordArray.create(rk as any);
    const dhWords = CryptoJS.lib.WordArray.create(dhOutput as any);
    const newRK = wordToUint8Array(HmacSHA256(dhWords, rkWords));
    const newCK = wordToUint8Array(HmacSHA256("ratchet-chain-key-salt", CryptoJS.lib.WordArray.create(newRK as any)));
    return [newRK, newCK];
}

function KDF_CK(ck: Uint8Array): [Uint8Array, Uint8Array] {
    const ckWords = CryptoJS.lib.WordArray.create(ck as any);
    const nextCK = wordToUint8Array(HmacSHA256("next-chain-key-salt", ckWords));
    const msgKey = wordToUint8Array(HmacSHA256("message-key-salt", ckWords));
    return [nextCK, msgKey];
}

export function initiateSessionAsInitiator(
    identitySK: Uint8Array,
    remotePublicKeyB64: string,
    sharedSecret: Uint8Array
): RatchetState {
    const remotePubKey = decodeBase64(remotePublicKeyB64);
    const ephemeralDH = box.keyPair();
    const dhOutput = nacl.scalarMult(ephemeralDH.secretKey, remotePubKey);
    const [rk, cks] = KDF_RK(sharedSecret, dhOutput);

    return {
        identitySK,
        DHs: ephemeralDH,
        DHr: remotePubKey,
        RK: rk,
        CKs: cks,
        CKr: null,
        Ns: 0,
        Nr: 0,
        PN: 0,
        MKSKIPPED: new Map(),
        role: "initiator",
    };
}

export function initiateSessionAsResponder(
    identitySK: Uint8Array,
    remotePublicKeyB64: string,
    sharedSecret: Uint8Array
): RatchetState {
    const remotePubKey = decodeBase64(remotePublicKeyB64);
    const identityKeyPair = box.keyPair.fromSecretKey(identitySK);

    return {
        identitySK,
        DHs: identityKeyPair,
        DHr: remotePubKey,
        RK: sharedSecret,
        CKs: null,
        CKr: null,
        Ns: 0,
        Nr: 0,
        PN: 0,
        MKSKIPPED: new Map(),
        role: "responder",
    };
}

export function encryptRatchet(
    state: RatchetState,
    plaintext: string
): { ciphertext: string; nonce: string; header: { dh: string; n: number; pn: number } } {

    if (!state.CKs) {
        const newDHs = box.keyPair();
        state.DHs = newDHs;
        state.PN = state.Ns;
        state.Ns = 0;

        const dhOutput = nacl.scalarMult(state.DHs.secretKey, state.DHr!);
        const [newRK, cks] = KDF_RK(state.RK, dhOutput);
        state.RK = newRK;
        state.CKs = cks;
    }

    const [newCKs, mk] = KDF_CK(state.CKs);
    state.CKs = newCKs;

    const nonce = randomBytes(secretbox.nonceLength);
    const plaintextUint8 = new TextEncoder().encode(plaintext);
    const ciphertext = secretbox(plaintextUint8, nonce, mk);

    const header = {
        dh: encodeBase64(state.DHs.publicKey),
        n: state.Ns,
        pn: state.PN,
    };

    state.Ns++;

    return {
        ciphertext: encodeBase64(ciphertext),
        nonce: encodeBase64(nonce),
        header,
    };
}

function skipMessageKeys(state: RatchetState, until: number) {
    if (!state.CKr) return;
    if (state.Nr >= until) return;

    while (state.Nr < until) {
        const [nextCKr, mk] = KDF_CK(state.CKr);
        const key = `${encodeBase64(state.DHr!)}-${state.Nr}`;
        state.MKSKIPPED.set(key, mk);
        state.CKr = nextCKr;
        state.Nr++;
    }
}

export function decryptRatchet(
    state: RatchetState,
    header: { dh: string; n: number; pn: number },
    ciphertextB64: string,
    nonceB64: string
): string {
    const dhrNew = decodeBase64(header.dh);
    const ciphertext = decodeBase64(ciphertextB64);
    const nonce = decodeBase64(nonceB64);
    const mkKey = `${header.dh}-${header.n}`;

    if (state.MKSKIPPED.has(mkKey)) {
        const mk = state.MKSKIPPED.get(mkKey)!;
        const decrypted = secretbox.open(ciphertext, nonce, mk);
        if (!decrypted) throw new Error("Decryption failed for skipped message");
        state.MKSKIPPED.delete(mkKey);
        return new TextDecoder().decode(decrypted);
    }

    const isDHRatchet = !state.DHr || encodeBase64(dhrNew) !== encodeBase64(state.DHr);

    if (isDHRatchet) {
        skipMessageKeys(state, header.pn);

        const isFirstRatchet = state.CKr === null;

        state.PN = state.Ns;
        state.Ns = 0;
        state.Nr = 0;
        state.DHr = dhrNew;

        const isBobFirstReceive = state.role === "responder" && isFirstRatchet;
        const secretKeyToUse = isBobFirstReceive ? state.identitySK : state.DHs.secretKey;

        if (state.DHr.length !== 32 || secretKeyToUse.length !== 32) {
            throw new Error(`Invalid key lengths for DH: DHr=${state.DHr.length}, SK=${secretKeyToUse.length}`);
        }

        const dhOutput = nacl.scalarMult(secretKeyToUse, state.DHr);
        const [newRK, ckr] = KDF_RK(state.RK, dhOutput);
        state.RK = newRK;
        state.CKr = ckr;

        state.CKs = null;
    }

    skipMessageKeys(state, header.n);

    if (!state.CKr) throw new Error("Receiving chain not initialized");
    const [nextCKr, mk] = KDF_CK(state.CKr);

    const decrypted = secretbox.open(ciphertext, nonce, mk);
    if (!decrypted) {
        throw new Error("Decryption failed - possibly wrong key or corrupted data");
    }

    state.CKr = nextCKr;
    state.Nr++;

    return new TextDecoder().decode(decrypted);
}

export function serializeRatchetState(state: RatchetState): string {
    const toB64 = (arr: Uint8Array | null | undefined) => arr ? encodeBase64(arr) : null;
    const obj = {
        identitySK: toB64(state.identitySK),
        DHs: {
            publicKey: toB64(state.DHs.publicKey),
            secretKey: toB64(state.DHs.secretKey)
        },
        DHr: toB64(state.DHr),
        RK: toB64(state.RK),
        CKs: toB64(state.CKs),
        CKr: toB64(state.CKr),
        Ns: state.Ns,
        Nr: state.Nr,
        PN: state.PN,
        MKSKIPPED: Array.from(state.MKSKIPPED.entries()).map(([k, v]) => [k, encodeBase64(v)]),
        role: state.role,
        handshake: state.handshake
    };
    return JSON.stringify(obj);
}

export function deserializeRatchetState(json: string): RatchetState {
    const data = JSON.parse(json);
    const fromB64 = (s: string | null) => s ? decodeBase64(s) : null;
    return {
        identitySK: fromB64(data.identitySK)!,
        DHs: {
            publicKey: fromB64(data.DHs.publicKey)!,
            secretKey: fromB64(data.DHs.secretKey)!
        },
        DHr: fromB64(data.DHr),
        RK: fromB64(data.RK)!,
        CKs: fromB64(data.CKs),
        CKr: fromB64(data.CKr),
        Ns: data.Ns,
        Nr: data.Nr,
        PN: data.PN,
        MKSKIPPED: new Map(data.MKSKIPPED.map(([k, v]: [string, string]) => [k, decodeBase64(v)])),
        role: data.role || "initiator",
        handshake: data.handshake
    };
}
