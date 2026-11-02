import { hashString } from "@/lib/utils/id";

export const ARTWORK_GRADIENTS = [
  "from-[#3b2f63] via-[#221c3d] to-[#0e0c18]",
  "from-[#1e4d3f] via-[#123028] to-[#08120f]",
  "from-[#5b3a1e] via-[#33210f] to-[#140c06]",
  "from-[#4d1e2e] via-[#2c1019] to-[#12070a]",
  "from-[#1e3f5b] via-[#102433] to-[#060d12]",
  "from-[#3e4d1e] via-[#232c10] to-[#0d1206]",
  "from-[#4d2a1e] via-[#2c1810] to-[#120906]",
  "from-[#2d1e5b] via-[#1a1033] to-[#090614]",
];

export function artworkGradient(id: string) {
  return ARTWORK_GRADIENTS[parseInt(hashString(id), 36) % ARTWORK_GRADIENTS.length];
}
