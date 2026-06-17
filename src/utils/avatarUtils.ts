/**
 * Shared avatar gradient utility.
 * Uses the first character's char code to deterministically
 * assign a gradient — the same name always gets the same color.
 */
export const AVATAR_GRADIENTS = [
  "bg-gradient-to-tr from-violet-500 to-indigo-500",
  "bg-gradient-to-tr from-rose-500 to-orange-500",
  "bg-gradient-to-tr from-blue-600 to-blue-400",
  "bg-gradient-to-tr from-emerald-500 to-teal-500",
  "bg-gradient-to-tr from-amber-500 to-yellow-400",
  "bg-gradient-to-tr from-pink-500 to-rose-400",
  "bg-gradient-to-tr from-cyan-500 to-blue-500",
  "bg-gradient-to-tr from-orange-500 to-red-500",
]

export const getAvatarGradient = (name: string): string => {
  const code = (name || "").charCodeAt(0) || 0
  return AVATAR_GRADIENTS[code % AVATAR_GRADIENTS.length]
}

export const getInitials = (name: string): string => {
  if (!name) return ""
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}
