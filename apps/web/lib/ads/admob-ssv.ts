import crypto from "crypto";

const ADMOB_VERIFIER_KEYS_URL = "https://gstatic.com/admob/reward/verifier-keys.json";
const KEY_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 saat

interface GoogleAdMobKeyEntry {
    keyId: number | string;
    pem?: string;
    base64?: string;
}

let cachedKeys: GoogleAdMobKeyEntry[] = [];
let cacheFetchedAt = 0;

function formatPublicKeyFromEntry(entry: GoogleAdMobKeyEntry): crypto.KeyObject {
    if (entry.pem) {
        return crypto.createPublicKey(entry.pem);
    }
    if (entry.base64) {
        const wrapped = `-----BEGIN PUBLIC KEY-----\n${entry.base64}\n-----END PUBLIC KEY-----`;
        return crypto.createPublicKey(wrapped);
    }
    throw new Error("AdMob key entry missing pem/base64");
}

async function fetchGoogleAdMobKeys(forceRefresh = false): Promise<GoogleAdMobKeyEntry[]> {
    const now = Date.now();
    if (!forceRefresh && cachedKeys.length > 0 && now - cacheFetchedAt < KEY_CACHE_TTL_MS) {
        return cachedKeys;
    }

    const res = await fetch(ADMOB_VERIFIER_KEYS_URL, {
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
        throw new Error(`Failed to fetch AdMob verifier keys: ${res.status}`);
    }

    const data = (await res.json()) as { keys?: GoogleAdMobKeyEntry[] };
    if (!Array.isArray(data.keys)) {
        throw new Error("Invalid AdMob verifier keys payload");
    }

    cachedKeys = data.keys;
    cacheFetchedAt = now;
    return cachedKeys;
}

async function resolvePublicKeyById(keyId: string): Promise<crypto.KeyObject | null> {
    let keys = await fetchGoogleAdMobKeys(false);
    let match = keys.find((k) => String(k.keyId) === String(keyId));
    if (!match) {
        // Key rotation olabilir: zorunlu yenile
        keys = await fetchGoogleAdMobKeys(true);
        match = keys.find((k) => String(k.keyId) === String(keyId));
    }
    return match ? formatPublicKeyFromEntry(match) : null;
}

export function extractAdMobSignedContent(rawUrl: string): {
    signedContent: string;
    signatureBase64: string;
    keyId: string;
} | null {
    const urlObj = new URL(rawUrl, "https://learnaxia.com");
    const signatureBase64 = urlObj.searchParams.get("signature");
    const keyId = urlObj.searchParams.get("key_id");

    if (!signatureBase64 || !keyId) {
        return null;
    }

    const rawQuery = urlObj.search.startsWith("?") ? urlObj.search.slice(1) : urlObj.search;
    const sigPrefix = rawQuery.includes("&signature=") ? "&signature=" : "signature=";
    const sigIndex = rawQuery.indexOf(sigPrefix);
    if (sigIndex <= 0) {
        return null;
    }

    return {
        signedContent: rawQuery.slice(0, sigIndex),
        signatureBase64,
        keyId,
    };
}

export function verifyAdMobSignatureWithPem(params: {
    signedContent: string;
    signatureBase64: string;
    publicKey: crypto.KeyObject | string;
}): boolean {
    const { signedContent, signatureBase64, publicKey } = params;
    let normalized = signatureBase64.replace(/-/g, "+").replace(/_/g, "/");
    while (normalized.length % 4 !== 0) {
        normalized += "=";
    }
    const sigBuffer = Buffer.from(normalized, "base64");
    const keyObj = typeof publicKey === "string" ? crypto.createPublicKey(publicKey) : publicKey;

    return crypto.verify("sha256", Buffer.from(signedContent, "utf8"), keyObj, sigBuffer);
}

export async function verifyAdMobCallbackRequest(rawUrl: string): Promise<boolean> {
    try {
        const extracted = extractAdMobSignedContent(rawUrl);
        if (!extracted) return false;

        const keyObj = await resolvePublicKeyById(extracted.keyId);
        if (!keyObj) return false;

        return verifyAdMobSignatureWithPem({
            signedContent: extracted.signedContent,
            signatureBase64: extracted.signatureBase64,
            publicKey: keyObj,
        });
    } catch (error) {
        console.error("[AdMob SSV] Signature verification failed:", error);
        return false;
    }
}
