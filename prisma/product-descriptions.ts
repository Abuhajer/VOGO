/** Rich catalog copy for product modals and AI try-on (EN + AR). */

type ProductCopyInput = {
  slug: string;
  nameEn: string;
  nameAr: string;
  collectionSlug: string;
};

const COLLECTION_EN: Record<string, (name: string) => string> = {
  "evening-formal": (name) =>
    `${name} is tailored at VOGO BY FAME for black-tie galas, formal dinners, and evening celebrations in Amman. Expect half-canvas construction, premium imported cloth, and a silhouette shaped in a private fitting session.`,
  "wedding-groom": (name) =>
    `${name} is designed for grooms and wedding parties who want a polished, camera-ready look. Bespoke cutting, refined lapels, and luxurious fabric balance tradition with modern confidence.`,
  business: (name) =>
    `${name} belongs in the boardroom, client meetings, and executive travel wardrobe. Crisp lines, durable superfine wool, and VOGO precision tailoring keep you sharp from morning to evening.`,
  "resort-summer": (name) =>
    `${name} is cut for warm-weather elegance — destination weddings, resort evenings, and summer events. Lightweight cloth and a relaxed yet refined drape keep you comfortable without losing structure.`,
};

const COLLECTION_AR: Record<string, (name: string) => string> = {
  "evening-formal": (name) =>
    `${name} من تفصيل ڤوغو باي فيم للسهرات الرسمية وحفلات العشاء والمناسبات الراقية في عمان. بناء نصف كانفس، أقمشة فاخرة مستوردة، وقصة تُشكَّل في جلسة قياس خاصة لإطلالة متقنة.`,
  "wedding-groom": (name) =>
    `${name} مصمم للعريس ولوك الزفاف — إطلالة أنيقة أمام الكاميرا وفي قاعة الحفل. قصة مخصصة، ياقات أنيقة، وأقمشة فاخرة تجمع بين التقاليد والحضور العصري.`,
  business: (name) =>
    `${name} للاجتماعات التنفيذية والسفر وبيئة العمل الراقية. خطوط واضحة، صوف فائق النعومة، وتفصيل دقيق من ڤوغو يحافظ على حضورك من الصباح حتى المساء.`,
  "resort-summer": (name) =>
    `${name} للأجواء الدافئة — زفاف على الشاطئ، منتجعات، ومناسبات الصيف. قماش خفيف وقصة مريحة مع الحفاظ على أناقة البدلة الكاملة.`,
};

function garmentDetailEn(slug: string): string {
  if (/tuxedo|smoking|dinner-jacket/i.test(slug)) {
    return "Satin or grosgrain lapels, formal trouser line, and evening-ready finishing.";
  }
  if (/three-piece|three-piece-groom/i.test(slug)) {
    return "Complete three-piece ensemble — jacket, waistcoat, and trousers cut as one harmonious look.";
  }
  if (/double-breasted/i.test(slug)) {
    return "Double-breasted front with structured shoulders and a commanding formal profile.";
  }
  if (/blazer|jacket/i.test(slug) && !/suit|tuxedo/i.test(slug)) {
    return "Single-breasted blazer with structured lapels and refined tailoring — jacket/outerwear piece only.";
  }
  if (/linen|resort|summer|cotton/i.test(slug)) {
    return "Breathable weave with soft structure — ideal for heat without sacrificing polish.";
  }
  if (/velvet/i.test(slug)) {
    return "Rich velvet texture with evening lapel detail and a luxe light-catching finish.";
  }
  if (/pinstripe|herringbone|windowpane/i.test(slug)) {
    return "Classic pattern woven into superfine cloth for depth and executive character.";
  }
  return "Two-piece suit cut with balanced proportions and clean lapel geometry.";
}

function garmentDetailAr(slug: string): string {
  if (/tuxedo|smoking|dinner-jacket/i.test(slug)) {
    return "ياقات ساتان فاخرة، خط سروال رسمي، وتشطيب جاهز للسهرة.";
  }
  if (/three-piece|three-piece-groom/i.test(slug)) {
    return "طقم ثلاثي متكامل — سترة وسدرة وبنطلون بقصة واحدة متناغمة.";
  }
  if (/double-breasted/i.test(slug)) {
    return "أزرار مزدوجة وكتفان مبنيان لحضور رسمي قوي.";
  }
  if (/blazer|jacket/i.test(slug) && !/suit|tuxedo/i.test(slug)) {
    return "سترة خارجية بقصة أنيقة وياقات مبنية — قطعة علوية فقط.";
  }
  if (/linen|resort|summer|cotton/i.test(slug)) {
    return "نسيج خفيف مع بنية ناعمة — مثالي للحر دون التضحية بالأناقة.";
  }
  if (/velvet/i.test(slug)) {
    return "ملمس مخملي فاخر مع تفاصيل سهرة ولمعة راقية.";
  }
  if (/pinstripe|herringbone|windowpane/i.test(slug)) {
    return "نقشة كلاسيكية على قماش فائق لعمق بصري وحضور تنفيذي.";
  }
  return "بدلة ثنائية بقصة متوازنة وياقات نظيفة.";
}

export function buildProductDescriptions(product: ProductCopyInput): {
  descEn: string;
  descAr: string;
} {
  const collectionEn = COLLECTION_EN[product.collectionSlug] ?? COLLECTION_EN.business;
  const collectionAr = COLLECTION_AR[product.collectionSlug] ?? COLLECTION_AR.business;

  return {
    descEn: `${collectionEn(product.nameEn)} ${garmentDetailEn(product.slug)}`,
    descAr: `${collectionAr(product.nameAr)} ${garmentDetailAr(product.slug)}`,
  };
}

export function applyProductDescriptions<
  T extends ProductCopyInput & { descEn?: string; descAr?: string },
>(products: T[]): T[] {
  return products.map((product) => ({
    ...product,
    ...buildProductDescriptions(product),
  }));
}
