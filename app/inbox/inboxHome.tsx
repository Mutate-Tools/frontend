"use client";

import { useEffect, useRef } from "react";
import Chat from "@/src/components/chat";
import InboxLeft from "@/src/components/inboxLeft";
import FriendsRail from "@/src/components/friendsRail";
import NoDataChat from "@/src/components/nodata/noDataChat";
import { useChat } from "@/src/contexts/ChatContext";
import { useChatStore } from "@/src/state/chat-store";

const InboxHome = () => {
  const { selectedChat, setSelectedChat } = useChat();
  const { setActiveInbox } = useChatStore();
  const selectedChatRef = useRef(selectedChat);
  const pushedChatHistoryRef = useRef(false);

  useEffect(() => {
    selectedChatRef.current = selectedChat;
    setActiveInbox(!!selectedChat);
  }, [selectedChat, setActiveInbox]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isMobileChatViewport = () =>
      window.matchMedia("(max-width: 1023px)").matches;

    const closeChatFromHistory = () => {
      if (!pushedChatHistoryRef.current || !selectedChatRef.current) return;
      pushedChatHistoryRef.current = false;
      setSelectedChat(null);
      setActiveInbox(false);
    };

    const onPopState = () => {
      if (!isMobileChatViewport()) return;
      closeChatFromHistory();
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [setActiveInbox, setSelectedChat]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isMobile = window.matchMedia("(max-width: 1023px)").matches;
    if (!isMobile) return;

    if (!selectedChat) {
      if (
        pushedChatHistoryRef.current &&
        window.history.state?.__mutateChatOverlay
      ) {
        pushedChatHistoryRef.current = false;
        window.history.back();
      }
      return;
    }

    if (pushedChatHistoryRef.current) return;

    const currentState = window.history.state;
    const nextState =
      currentState && typeof currentState === "object"
        ? { ...currentState, __mutateChatOverlay: true }
        : { __mutateChatOverlay: true };

    window.history.pushState(nextState, "", window.location.href);
    pushedChatHistoryRef.current = true;
  }, [selectedChat]);

  return (
    <>
      <div className="lg:py-[20px] gap-3 xl:gap-6 lg:flex text-white md:container">
        <div className="lg:max-w-[345px] max-lg:mx-auto w-full">
          <InboxLeft />
        </div>
        {selectedChat ? (
          <div className="flex-1 min-w-0">
            <Chat />
          </div>
        ) : (
          <div className="flex-1">
            <NoDataChat />
          </div>
        )}
        {}
        <div className="max-lg:hidden lg:h-[600px] 2xl:h-[650px] w-[280px] flex-shrink-0">
          <FriendsRail />
        </div>
      </div>
    </>
  );
};

export default InboxHome;
