/**
 * Preset model portraits for the virtual fitting room.
 * Local JPGs in public/fitting-room/avatars/
 */
export const FITTING_ROOM_AVATARS = [
  {
    id: "model-classic",
    src: "/fitting-room/avatars/model-classic.jpg",
    labelEn: "Classic Groom",
    labelAr: "عريس كلاسيكي",
  },
  {
    id: "model-slim",
    src: "/fitting-room/avatars/model-slim.jpg",
    labelEn: "Editorial Look",
    labelAr: "مظهر تحريري",
  },
  {
    id: "model-business",
    src: "/fitting-room/avatars/model-business.jpg",
    labelEn: "Business Profile",
    labelAr: "ملف أعمال",
  },
  {
    id: "model-formal",
    src: "/fitting-room/avatars/model-formal.jpg",
    labelEn: "Formal Portrait",
    labelAr: "صورة رسمية",
  },
  {
    id: "model-contemporary",
    src: "/fitting-room/avatars/model-contemporary.jpg",
    labelEn: "Contemporary",
    labelAr: "معاصر",
  },
  {
    id: "model-elegant",
    src: "/fitting-room/avatars/model-elegant.jpg",
    labelEn: "Elegant Fit",
    labelAr: "قصة أنيقة",
  },
] as const;

export type FittingRoomAvatar = (typeof FITTING_ROOM_AVATARS)[number];
