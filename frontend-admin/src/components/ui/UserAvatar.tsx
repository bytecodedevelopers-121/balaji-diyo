import { useState } from "react";
import { getPublicUrl } from "@/lib/storage";
import { Avatar, type AvatarSize } from "./Avatar";

interface UserAvatarProps {
  photoPath: string | null | undefined;
  name: string;
  size?: AvatarSize;
  className?: string;
}

// Displays a user profile photo from the public bucket — a plain <img>,
// no API call or signed URL needed.
export function UserAvatar({ photoPath, name, size = "md", className }: UserAvatarProps) {
  const [failed, setFailed] = useState(false);

  if (!photoPath || failed) {
    return <Avatar name={name} size={size} className={className} />;
  }

  return <Avatar name={name} imageUrl={getPublicUrl(photoPath)} size={size} onImageError={() => setFailed(true)} className={className} />;
}
