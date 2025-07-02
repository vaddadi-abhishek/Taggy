import React from "react";
import { Image } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";

type Props = {
  platform: "reddit" | "twitter" | "x" | "instagram" | "youtube";
  size?: number;
};

const iconIds = {
  reddit: "gxDo9YXCsacn",
  twitter: "phOKFKYpe00C",
  x: "phOKFKYpe00C",
  instagram: "Xy10Jcu1L2Su",
  youtube: "qLVB1tIe9Ts9",
};

export const socialPlatforms = [
  { id: "1", name: "Reddit", key: "reddit" },
  { id: "2", name: "Twitter", key: "x" },
  { id: "3", name: "Instagram", key: "instagram" },
];

export default function PlatformIcon({ platform, size = 22 }: Props) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const color = isDark ? "ffffff" : "000000";
  const id = iconIds[platform];

  return (
    <Image
      source={{
        uri: `https://img.icons8.com/?size=100&id=${id}&format=png&color=${color}`,
      }}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}
