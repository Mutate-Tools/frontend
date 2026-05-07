"use client";

import React, { useState } from "react";
import Image from "next/image";
import env from "@/src/constants/environment";
import { stringToColor, getInitials } from "@/src/utils/avatar-color";

export interface AvatarProps {
  
  url?: string | null;
  
  avatarId?: number;
  
  name: string;
  
  hash?: string;
  
  size?: number;
  
  className?: string;
}









const Avatar: React.FC<AvatarProps> = ({
  url,
  avatarId,
  name,
  hash,
  size = 40,
  className = "",
}) => {
  const [urlFailed, setUrlFailed] = useState(false);
  const [presetFailed, setPresetFailed] = useState(false);

  
  if (url && !urlFailed) {
    return (
      <Image
        src={url}
        alt={name}
        width={size}
        height={size}
        onError={() => setUrlFailed(true)}
        className={`rounded-full object-cover flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
        unoptimized
      />
    );
  }

  
  if (
    typeof avatarId === "number" &&
    env.GROUP_AVATARS?.[avatarId] &&
    !presetFailed
  ) {
    return (
      <Image
        src={env.GROUP_AVATARS[avatarId]}
        alt={name}
        width={size}
        height={size}
        onError={() => setPresetFailed(true)}
        className={`rounded-full object-cover flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  
  const colorClass = stringToColor(hash || name);
  return (
    <div
      className={`rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-semibold flex-shrink-0 ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {getInitials(name)}
    </div>
  );
};

export default Avatar;
