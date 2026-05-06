"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RoomPage() {
  const { roomId } = useParams();
  const router = useRouter();

  useEffect(() => {
    const validate = async () => {
      const isMember = true;

      if (!isMember) {
        router.replace("/chat/inbox");
      }
    };

    validate();
  }, [roomId, router]);

  return <div className="text-white">Chat Room {roomId}</div>;
}
