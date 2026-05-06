





const AVATAR_COLOR_GRADIENTS = [
  "from-indigo-400 to-purple-500",
  "from-purple-400 to-pink-500",
  "from-pink-400 to-red-500",
  "from-red-400 to-orange-500",
  "from-orange-400 to-yellow-500",
  "from-green-400 to-emerald-500",
  "from-emerald-400 to-teal-500",
  "from-teal-400 to-cyan-500",
  "from-cyan-400 to-blue-500",
  "from-blue-400 to-indigo-500",
] as const;


export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLOR_GRADIENTS[
    Math.abs(hash) % AVATAR_COLOR_GRADIENTS.length
  ];
}


export function getInitials(name: string): string {
  if (!name || name === "Unknown User") return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
