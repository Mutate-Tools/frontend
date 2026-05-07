"use client";

import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FiClock, FiX, FiLoader } from "react-icons/fi";
import { useAuth } from "@/src/contexts/AuthContext";
import { useSubProfile } from "@/src/contexts/SubProfileContext";
import Avatar from "./avatar";
import { getBackendUrl } from '@/src/utils/backend-url';

interface OutgoingRequest {
  requestId: string;
  receiverHash: string;
  receiver: {
    username: string;
    avatarId?: number;
    avatarUrl?: string | null;
  };
  createdAt: string;
}

interface PendingRequestsProps {
  onRequestCancelled?: (requestId: string) => void;
}


export default function PendingRequests({
  onRequestCancelled,
}: PendingRequestsProps) {
  const { token } = useAuth();
  const { activeSubProfile } = useSubProfile();
  const [requests, setRequests] = useState<OutgoingRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const fetchOutgoing = useCallback(async () => {
    if (!token || !activeSubProfile?.identityHash) return;
    try {
      setLoading(true);
      const res = await axios.get(
        `${getBackendUrl()}/friends/requests/outgoing`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Identity-Hash": activeSubProfile.identityHash,
          },
        }
      );
      setRequests(res.data || []);
    } catch (err) {
      console.error("[PendingRequests] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [token, activeSubProfile?.identityHash]);

  useEffect(() => {
    fetchOutgoing();
  }, [fetchOutgoing]);

  
  useEffect(() => {
    const onFriendChanged = () => fetchOutgoing();
    window.addEventListener("friend:connected", onFriendChanged);
    window.addEventListener("friend:blocked", onFriendChanged);
    return () => {
      window.removeEventListener("friend:connected", onFriendChanged);
      window.removeEventListener("friend:blocked", onFriendChanged);
    };
  }, [fetchOutgoing]);

  const handleCancel = async (requestId: string) => {
    try {
      setCancelling(requestId);
      await axios.delete(
        `${getBackendUrl()}/friends/request/${requestId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Identity-Hash": activeSubProfile?.identityHash,
          },
        }
      );
      setRequests((prev) => prev.filter((r) => r.requestId !== requestId));
      onRequestCancelled?.(requestId);
      toast.success("Request cancelled");
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Failed to cancel request";
      toast.error(msg);
      console.error("[PendingRequests] cancel error:", err);
    } finally {
      setCancelling(null);
    }
  };

  if (requests.length === 0 && !loading) return null;

  return (
    <div className="px-2 py-2 mt-2 border-t border-white/10">
      <div className="flex items-center justify-between mb-1 px-2">
        <p className="text-[11px] text-white/50 font-semibold tracking-wider flex items-center gap-1.5">
          <FiClock size={10} className="text-white/40" />
          PENDING SENT
        </p>
        <span className="text-[10px] text-white/40 font-medium">
          {requests.length}
        </span>
      </div>

      <div className="space-y-0.5">
        {loading && requests.length === 0 ? (
          [0, 1].map((i) => (
            <div key={i} className="h-10 rounded-lg bg-white/5 animate-pulse" />
          ))
        ) : (
          requests.map((req) => {
            const isCancelling = cancelling === req.requestId;
            return (
              <div
                key={req.requestId}
                className="group flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition"
              >
                <Avatar
                  url={req.receiver.avatarUrl}
                  avatarId={req.receiver.avatarId}
                  name={req.receiver.username}
                  hash={req.receiverHash}
                  size={28}
                />

                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-white/80 truncate">
                    <span className="text-white/50">Pending: </span>
                    <span className="font-medium">{req.receiver.username}</span>
                  </p>
                </div>

                <button
                  onClick={() => handleCancel(req.requestId)}
                  disabled={isCancelling}
                  aria-label="Cancel request"
                  title="Cancel request"
                  className="opacity-0 group-hover:opacity-100 transition w-6 h-6 rounded-full hover:bg-red-500/20 text-white/50 hover:text-red-400 flex items-center justify-center flex-shrink-0 disabled:opacity-50"
                >
                  {isCancelling ? (
                    <FiLoader size={11} className="animate-spin" />
                  ) : (
                    <FiX size={12} />
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
