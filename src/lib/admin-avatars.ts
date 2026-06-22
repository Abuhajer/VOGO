import { slugifyProductName } from "@/lib/admin-products";
import type { AvatarFormInput } from "@/server/fitting-room-avatars";

export function slugifyAvatarName(value: string) {
  return slugifyProductName(value);
}

export const emptyAvatarForm: AvatarFormInput = {
  slug: "",
  labelEn: "",
  labelAr: "",
  imageSrc: "",
  sortOrder: 0,
  active: true,
};
