"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import axios from "axios";
import btnbg from "@assets/dappbtnbg.svg";
import env from "../constants/environment";
import { useAuth } from "../contexts/AuthContext";
import { useChat, GroupDoc } from "../contexts/ChatContext";
import { useChatStore } from "../state/chat-store";
import toast from "react-hot-toast";
import { FiSearch, FiX } from "react-icons/fi";
import CreateGroupSuccess from "./createGroupSuccess";
import { getBackendUrl } from '@/src/utils/backend-url';

type CreateGroupProps = {
  onBack: () => void;
};

interface SearchUser {
  emailHash: string;
  username: string | null;
  avatarId?: number;
}


const CreateGroup: React.FC<CreateGroupProps> = ({ onBack }) => {
  const { token } = useAuth();
  const { createGroup, setSelectedChat } = useChat();
  const { setActiveInbox } = useChatStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [groupName, setGroupName] = useState("");
  const [groupType, setGroupType] = useState<"private" | "public">("private");
  const [description, setDescription] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<number>(0);

  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<SearchUser[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [createdGroup, setCreatedGroup] = useState<GroupDoc | null>(null);

  useEffect(() => {
    if (!search.trim() || !token) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await axios.get(
          `${getBackendUrl()}/users/search?q=${encodeURIComponent(search.trim())}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setResults(res.data.users || []);
      } catch (e) {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [search, token]);

  const selectedHashes = useMemo(
    () => new Set(selectedMembers.map((m) => m.emailHash.toLowerCase())),
    [selectedMembers]
  );

  const toggleMember = (user: SearchUser) => {
    const hash = user.emailHash.toLowerCase();
    if (selectedHashes.has(hash)) {
      setSelectedMembers((prev) => prev.filter((m) => m.emailHash.toLowerCase() !== hash));
    } else {
      setSelectedMembers((prev) => [...prev, user]);
    }
  };

  const handleNext = () => {
    if (!groupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }
    if (description.length > 200) {
      toast.error("Description cannot exceed 200 characters");
      return;
    }
    setStep(2);
  };

  const handleCreate = async () => {
    
    
    try {
      setSubmitting(true);
      const group = await createGroup(
        groupName.trim(),
        selectedMembers.map((m) => m.emailHash),
        {
          description: description.trim() || groupName.trim(),
          avatarId: selectedAvatar,
          isPublic: groupType === "public",
        }
      );
      setCreatedGroup(group);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || e.message || "Failed to create group");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0F0F14] flex flex-col items-center overflow-auto">
      <div className="flex items-center w-full max-w-md p-4 border-b border-white/10">
        <button onClick={onBack} className="text-white text-2xl mr-4">
          &#8592;
        </button>
        <h2 className="text-white text-center flex-1 font-semibold text-lg">
          Create Group
        </h2>
      </div>

      <div className="w-full max-w-md p-4 flex flex-col gap-6">
        {step === 1 && (
          <>
            <input
              placeholder="Group Name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full rounded-full px-4 py-3 border-2 border-[#EAF0FF1A] bg-transparent text-white outline-none"
            />
            <div className="flex flex-col gap-2">
              {(["private", "public"] as const).map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="groupType"
                    checked={groupType === type}
                    onChange={() => setGroupType(type)}
                  />
                  <span className="text-white capitalize">{type}</span>
                </label>
              ))}
            </div>
            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-2xl px-4 py-3 border-2 border-[#EAF0FF1A] bg-transparent text-white outline-none resize-none"
            />
            <div className="relative w-full h-14 mt-4">
              <Image
                src={btnbg}
                alt="bg"
                className="absolute inset-0 w-full h-full object-cover rounded-full"
              />
              <button
                onClick={handleNext}
                className="relative z-10 w-full h-full text-white font-medium"
              >
                Continue
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h3 className="text-white text-lg font-semibold text-center mb-2">
              Select Group Avatar
            </h3>
            <div className="grid grid-cols-4 gap-4">
              {env.GROUP_AVATARS.map((avatar, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedAvatar(i)}
                  className={`aspect-square w-full rounded-full overflow-hidden border-2 transition-transform ${
                    selectedAvatar === i
                      ? "border-white ring-2 ring-[#3730EA] scale-[1.08]"
                      : "border-transparent"
                  }`}
                >
                  <Image
                    src={avatar}
                    alt={`Avatar ${i + 1}`}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
            <div className="relative w-full h-14 mt-6">
              <Image
                src={btnbg}
                alt="bg"
                className="absolute inset-0 w-full h-full object-cover rounded-full"
              />
              <button
                onClick={() => setStep(3)}
                className="relative z-10 w-full h-full text-white font-medium"
              >
                Continue
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h3 className="text-white text-lg font-semibold text-center">
              Add Members <span className="text-white/50 font-normal text-sm">(optional)</span>
            </h3>
            <p className="text-[11px] text-white/50 text-center -mt-4">
              You can create the group now and invite members later.
            </p>

            {selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedMembers.map((m) => (
                  <button
                    key={m.emailHash}
                    onClick={() => toggleMember(m)}
                    className="flex items-center gap-2 bg-[#3730EA]/50 text-white text-xs px-3 py-1 rounded-full"
                  >
                    {m.username || m.emailHash.slice(0, 10) + "…"}
                    <FiX />
                  </button>
                ))}
              </div>
            )}

            <div className="h-[44px] w-full border border-[#EAF0FF1A] rounded-full flex items-center gap-2 px-4">
              <FiSearch className="text-[#9AA4C7]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search username"
                className="bg-transparent w-full outline-none text-[16px] lg:text-[12px] text-white placeholder-[#9AA4C7]"
              />
            </div>

            <div className="flex flex-col gap-2 max-h-[240px] overflow-y-auto">
              {results.map((user) => {
                const active = selectedHashes.has(user.emailHash.toLowerCase());
                return (
                  <button
                    key={user.emailHash}
                    onClick={() => toggleMember(user)}
                    className={`flex items-center justify-between p-2 rounded-xl border ${
                      active ? "border-[#3730EA] bg-[#3730EA]/20" : "border-white/10 bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Image
                        src={
                          env.GROUP_AVATARS?.[user.avatarId ?? 0] ||
                          env.GROUP_AVATARS?.[0]
                        }
                        alt={user.username || "user"}
                        width={28}
                        height={28}
                        className="rounded-full"
                      />
                      <span className="text-white text-sm">
                        {user.username || user.emailHash.slice(0, 10) + "…"}
                      </span>
                    </div>
                    <span className="text-xs text-white/70">{active ? "Selected" : "Add"}</span>
                  </button>
                );
              })}
            </div>

            <div className="relative w-full h-14 mt-4">
              <Image
                src={btnbg}
                alt="bg"
                className="absolute inset-0 w-full h-full object-cover rounded-full"
              />
              <button
                onClick={handleCreate}
                disabled={submitting}
                className="relative z-10 w-full h-full text-white font-medium disabled:opacity-60"
              >
                {submitting ? "Creating…" : "Create Group"}
              </button>
            </div>
          </>
        )}
      </div>

      {createdGroup && (
        <CreateGroupSuccess
          group={createdGroup}
          onOpen={() => {
            setSelectedChat({ type: "group", groupId: createdGroup._id });
            setActiveInbox(true);
            setCreatedGroup(null);
            onBack();
          }}
          onClose={() => {
            setCreatedGroup(null);
            onBack();
          }}
        />
      )}
    </div>
  );
};

export default CreateGroup;
