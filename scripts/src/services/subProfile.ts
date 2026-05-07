import axios from "axios";
import { getBackendUrl } from '@/src/utils/backend-url';













const authHeaders = (token: string) => ({
    headers: { Authorization: `Bearer ${token}` },
});

export interface SubProfileDTO {
    _id: string;
    identityHash: string;
    name: string;
    avatarId: number;
    avatarUrl?: string | null;
    publicIdentityKey?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export const SubProfileAPI = {
    list: async (token: string): Promise<SubProfileDTO[]> => {
        const res = await axios.get(`${getBackendUrl()}/subprofiles`, authHeaders(token));
        return res.data?.subProfiles || [];
    },
    create: async (
        token: string,
        body: { name: string; avatarId: number }
    ): Promise<SubProfileDTO> => {
        const res = await axios.post(`${getBackendUrl()}/subprofiles`, body, authHeaders(token));
        return res.data.subProfile;
    },
    update: async (
        token: string,
        identityHash: string,
        body: { name?: string; avatarId?: number }
    ): Promise<SubProfileDTO> => {
        const res = await axios.patch(
            `${getBackendUrl()}/subprofiles/${identityHash}`,
            body,
            authHeaders(token)
        );
        return res.data.subProfile;
    },
    remove: async (token: string, identityHash: string): Promise<void> => {
        await axios.delete(`${getBackendUrl()}/subprofiles/${identityHash}`, authHeaders(token));
    },
};

export default SubProfileAPI;
