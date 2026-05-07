import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FiLoader, FiUserPlus, FiUserCheck, FiX } from "react-icons/fi";
import { useAuth } from "@/src/contexts/AuthContext";
import { useSubProfile } from "@/src/contexts/SubProfileContext";
import { getBackendUrl } from '@/src/utils/backend-url';

interface FriendStatusButtonProps {
  otherHash: string;
  onStatusChange?: (status: string) => void;
}

interface FriendStatus {
  status: "pending" | "accepted" | "rejected" | "friends" | "none";
  requestId?: string;
}


export default function FriendStatusButton({
  otherHash,
  onStatusChange,
}: FriendStatusButtonProps) {
  const { token } = useAuth();
  const { activeSubProfile } = useSubProfile();
  const [status, setStatus] = useState<FriendStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  
  useEffect(() => {
    if (token && otherHash) {
      checkFriendStatus();
    }
  }, [token, otherHash]);

  const checkFriendStatus = async () => {
    try {
      setCheckingStatus(true);
      const response = await axios.get(
        `${getBackendUrl()}/friends/request/status/${otherHash}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            ...(activeSubProfile?.identityHash && { "X-Identity-Hash": activeSubProfile.identityHash })
          }
        }
      );
      setStatus(response.data);
      onStatusChange?.(response.data.status);
    } catch (error) {
      console.error("[FriendStatusButton] Error checking status:", error);
      setStatus(null);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleSendRequest = async () => {
    try {
      setLoading(true);
      await axios.post(
        `${getBackendUrl()}/friends/request`,
        { targetHash: otherHash.toLowerCase() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            ...(activeSubProfile?.identityHash && { "X-Identity-Hash": activeSubProfile.identityHash })
          }
        }
      );
      toast.success("Friend request sent!");
      await checkFriendStatus();
    } catch (error: any) {
      const errMsg = error.response?.data?.error || "Failed to send request";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!status?.requestId) return;
    try {
      setLoading(true);
      await axios.delete(
        `${getBackendUrl()}/friends/request/${status.requestId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            ...(activeSubProfile?.identityHash && { "X-Identity-Hash": activeSubProfile.identityHash })
          }
        }
      );
      toast.success("Request cancelled");
      await checkFriendStatus();
    } catch (error) {
      toast.error("Failed to cancel request");
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="px-3 py-1.5 rounded-full bg-white/10 text-white/60 text-xs flex items-center gap-1">
        <FiLoader size={12} className="animate-spin" />
      </div>
    );
  }

  if (!status) {
    return null;
  }

  
  if (status.status === "friends") {
    return (
      <div className="px-3 py-1.5 rounded-full bg-green-500/20 text-green-300 text-xs border border-green-500/30 flex items-center gap-1">
        <FiUserCheck size={12} />
        Friend
      </div>
    );
  }

  
  if (status.status === "pending") {
    return (
      <button
        disabled={loading}
        onClick={handleCancelRequest}
        className="px-3 py-1.5 rounded-full bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 text-xs border border-orange-500/30 flex items-center gap-1 transition disabled:opacity-70"
      >
        {loading ? <FiLoader size={12} className="animate-spin" /> : <FiX size={12} />}
        Cancel Request
      </button>
    );
  }

  
  return (
    <button
      disabled={loading}
      onClick={handleSendRequest}
      className="px-3 py-1.5 rounded-full bg-blue-500 hover:bg-blue-600 text-white text-xs flex items-center gap-1 transition disabled:opacity-70"
    >
      {loading ? <FiLoader size={12} className="animate-spin" /> : <FiUserPlus size={12} />}
      Add Friend
    </button>
  );
}
