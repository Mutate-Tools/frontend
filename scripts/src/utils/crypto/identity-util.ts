import { decodeBase64, encodeBase64 } from "tweetnacl-util";
import nacl from "tweetnacl";
import { lsGet, lsGetJSON, lsRemove, lsSet, lsSetJSON } from "@/src/utils/safe-storage";






export interface Keypair {
    publicKey: Uint8Array;
    secretKey: Uint8Array;
}

export interface IdentityKeypair {
    signing: Keypair;
    encryption: Keypair;
}

const identityKeypairCache = new Map<string, IdentityKeypair>();

const isValidIdentityKeypair = (keypair: IdentityKeypair): boolean => {
    const hasLengths =
        keypair?.signing?.publicKey?.length === 32 &&
        keypair?.signing?.secretKey?.length === 64 &&
        keypair?.encryption?.publicKey?.length === 32 &&
        keypair?.encryption?.secretKey?.length === 32;
    return Boolean(hasLengths);
};




export const generateIdentityKeypair = (): IdentityKeypair => {
    const signing = nacl.sign.keyPair();
    const encryption = nacl.box.keyPair();

    return {
        signing: {
            publicKey: signing.publicKey,
            secretKey: signing.secretKey,
        },
        encryption: {
            publicKey: encryption.publicKey,
            secretKey: encryption.secretKey,
        },
    };
};




export const serializeKeypair = (keypair: IdentityKeypair) => {
    return {
        signing: {
            publicKey: encodeBase64(keypair.signing.publicKey),
            secretKey: encodeBase64(keypair.signing.secretKey),
        },
        encryption: {
            publicKey: encodeBase64(keypair.encryption.publicKey),
            secretKey: encodeBase64(keypair.encryption.secretKey),
        },
    };
};




export const deserializeKeypair = (stored: any): IdentityKeypair => {
    const keypair: IdentityKeypair = {
        signing: {
            publicKey: decodeBase64(stored.signing.publicKey),
            secretKey: decodeBase64(stored.signing.secretKey),
        },
        encryption: {
            publicKey: decodeBase64(stored.encryption.publicKey),
            secretKey: decodeBase64(stored.encryption.secretKey),
        },
    };
    if (!isValidIdentityKeypair(keypair)) {
        throw new Error("Invalid identity keypair lengths");
    }
    return keypair;
};




export const storeIdentityKeypair = (emailHash: string, keypair: IdentityKeypair) => {
    const hash = emailHash.toLowerCase();
    const serialized = serializeKeypair(keypair);
    identityKeypairCache.set(hash, keypair);
    lsSetJSON(`identity_v3_${hash}`, serialized);
};

export const removeIdentityKeypair = (emailHash: string) => {
    const hash = emailHash.toLowerCase();
    identityKeypairCache.delete(hash);
    lsRemove(`identity_v3_${hash}`);
};




export const getIdentityKeypair = (emailHash: string): IdentityKeypair | null => {
    const hash = emailHash.toLowerCase();
    const cached = identityKeypairCache.get(hash);
    if (cached) return cached;
    const stored = lsGetJSON<ReturnType<typeof serializeKeypair>>(`identity_v3_${hash}`);
    if (!stored) return null;
    try {
        const keypair = deserializeKeypair(stored);
        identityKeypairCache.set(hash, keypair);
        return keypair;
    } catch (e) {
        console.error("Failed to parse identity keypair", e);
        removeIdentityKeypair(hash);
        return null;
    }
};

export const listStoredIdentityHashes = (): string[] => {
    if (typeof window === "undefined") return [];
    const hashes: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("identity_v3_")) hashes.push(key.slice("identity_v3_".length));
    }
    return hashes;
};

export const exportIdentityStorage = () => {
    if (typeof window === "undefined") return {};
    const out: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (
            key.startsWith("identity_v3_") ||
            key.startsWith("ratchet_v3_") ||
            key.startsWith("signed_prekey_secret_") ||
            key.startsWith("active_spk_pub_") ||
            key.startsWith("otpk_secret_") ||
            key.startsWith("bundle_uploaded_") ||
            key.startsWith("active_subprofile_")
        ) {
            const value = lsGet(key);
            if (value !== null) out[key] = value;
        }
    }
    return out;
};

export const importIdentityStorage = (entries: Record<string, string>) => {
    if (typeof window === "undefined") return;
    for (const [key, value] of Object.entries(entries || {})) {
        if (typeof value === "string") {
            lsSet(key, value);
            if (key.startsWith("identity_v3_")) identityKeypairCache.delete(key.slice("identity_v3_".length));
        }
    }
};
