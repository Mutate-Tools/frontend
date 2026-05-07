import CryptoJS from "crypto-js";

namespace CryptoUtils {
  const CLIENT_SECRET_STORAGE_KEY = "mutate_client_crypto_key_v1";

  const getClientSecret = (): string => {
    if (typeof window === "undefined") return "";
    const cached = window.localStorage.getItem(CLIENT_SECRET_STORAGE_KEY);
    if (cached) return cached;

    const bytes = new Uint8Array(32);
    window.crypto.getRandomValues(bytes);
    const generated = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    window.localStorage.setItem(CLIENT_SECRET_STORAGE_KEY, generated);
    return generated;
  };

  export const decrypt = (data: string) => {
    const secret = getClientSecret();
    const decryptedBytes = CryptoJS.AES.decrypt(data, secret);
    return decryptedBytes.toString(CryptoJS.enc.Utf8);
  };

  export const encrypt = (data: string) => {
    const secret = getClientSecret();
    return CryptoJS.AES.encrypt(data, secret).toString();
  };
}

export default CryptoUtils;
