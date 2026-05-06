import SHA256 from "crypto-js/sha256";





export const hashEmail = (email: string): string => {
    return SHA256(email.trim().toLowerCase()).toString();
};
