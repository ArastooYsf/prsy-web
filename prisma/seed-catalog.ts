import { config } from "dotenv";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client";

config({ path: ".env" });
config({ path: ".env.local", override: true });

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(process.env.DATABASE_URL ?? "") });

type SubSeed = { slug: string; name: string };
type CatSeed = { slug: string; name: string; icon: string; order: number; children: SubSeed[] };

const BRANDS: { slug: string; name: string; order: number }[] = [
  { slug: "caterpillar", name: "کاترپیلار", order: 1 },
  { slug: "cummins", name: "کامینز", order: 2 },
  { slug: "perkins", name: "پرکینز", order: 3 },
  { slug: "volvo", name: "ولوو", order: 4 },
  { slug: "weichai", name: "ویچای", order: 5 },
  { slug: "stamford", name: "استمفورد", order: 6 },
];

const CATEGORIES: CatSeed[] = [
  { slug: "diesel-generator", name: "دیزل ژنراتور", icon: "generator", order: 1, children: [
    { slug: "diesel-generator-industrial", name: "دیزل ژنراتور صنعتی" },
    { slug: "diesel-generator-marine", name: "دیزل ژنراتور دریایی" },
    { slug: "diesel-generator-portable", name: "دیزل ژنراتور پرتابل" },
  ]},
  { slug: "power-engine", name: "موتور برق", icon: "engine", order: 2, children: [
    { slug: "power-engine-gasoline", name: "موتور برق بنزینی" },
    { slug: "power-engine-diesel", name: "موتور برق دیزلی" },
  ]},
  { slug: "spare-parts", name: "قطعات یدکی", icon: "parts", order: 3, children: [
    { slug: "spare-parts-engine", name: "قطعات موتور" },
    { slug: "spare-parts-alternator", name: "قطعات آلترناتور" },
    { slug: "spare-parts-control", name: "قطعات تابلو کنترل" },
  ]},
  { slug: "generator-engine", name: "موتور ژنراتور", icon: "generator-engine", order: 4, children: [
    { slug: "generator-engine-cat", name: "موتور ژنراتور کاترپیلار" },
    { slug: "generator-engine-cummins", name: "موتور ژنراتور کامینز" },
  ]},
  { slug: "alternator", name: "دینام / آلترناتور", icon: "alternator", order: 5, children: [
    { slug: "alternator-brushless", name: "آلترناتور بدون جاروبک" },
    { slug: "alternator-brushed", name: "آلترناتور جاروبکی" },
  ]},
];

// [sub-slug, brand-slug, name, availability, showPrice, price|null]
// NOTE: `Product.price` is a Prisma `Int` (MySQL INT, max 2_147_483_647).
// Every price below MUST stay under 2_000_000_000. Do NOT change the schema.
const PRODUCTS: [string, string, string, "IN_STOCK" | "OUT_OF_STOCK" | "CALL", boolean, number | null][] = [
  ["diesel-generator-industrial", "caterpillar", "دیزل ژنراتور کاترپیلار ۵۰۰ کاوا", "IN_STOCK", true, 1950000000],
  ["diesel-generator-industrial", "cummins", "دیزل ژنراتور کامینز ۴۰۰ کاوا", "IN_STOCK", true, 1750000000],
  ["diesel-generator-industrial", "perkins", "دیزل ژنراتور پرکینز ۲۵۰ کاوا", "CALL", false, null],
  ["diesel-generator-marine", "volvo", "دیزل ژنراتور دریایی ولوو ۱۵۰ کاوا", "IN_STOCK", false, null],
  ["diesel-generator-marine", "cummins", "دیزل ژنراتور دریایی کامینز ۲۰۰ کاوا", "OUT_OF_STOCK", false, null],
  ["diesel-generator-portable", "weichai", "دیزل ژنراتور پرتابل ویچای ۲۰ کاوا", "IN_STOCK", true, 320000000],
  ["diesel-generator-portable", "perkins", "دیزل ژنراتور پرتابل پرکینز ۳۰ کاوا", "IN_STOCK", true, 410000000],
  ["power-engine-gasoline", "weichai", "موتور برق بنزینی ۵ کاوا", "IN_STOCK", true, 45000000],
  ["power-engine-gasoline", "cummins", "موتور برق بنزینی ۷ کاوا", "OUT_OF_STOCK", true, 62000000],
  ["power-engine-diesel", "perkins", "موتور برق دیزلی ۱۰ کاوا", "IN_STOCK", false, null],
  ["power-engine-diesel", "volvo", "موتور برق دیزلی ۱۵ کاوا", "CALL", false, null],
  ["spare-parts-engine", "caterpillar", "پکیج سرسیلندر کاترپیلار C15", "IN_STOCK", false, null],
  ["spare-parts-engine", "cummins", "واتر پمپ کامینز NTA855", "IN_STOCK", true, 28000000],
  ["spare-parts-alternator", "stamford", "دیود آلترناتور استمفورد", "IN_STOCK", false, null],
  ["spare-parts-control", "caterpillar", "برد کنترل کاترپیلار EMCP", "OUT_OF_STOCK", false, null],
  ["generator-engine-cat", "caterpillar", "موتور ژنراتور کاترپیلار C18", "CALL", false, null],
  ["generator-engine-cummins", "cummins", "موتور ژنراتور کامینز QSK19", "IN_STOCK", false, null],
  ["alternator-brushless", "stamford", "آلترناتور استمفورد UCI274", "IN_STOCK", true, 180000000],
];

const INACTIVE_SLUG = "seed-inactive-product";

async function main() {
  const brandIdBySlug = new Map<string, string>();
  for (const b of BRANDS) {
    const row = await prisma.brand.upsert({
      where: { slug: b.slug },
      update: { name: b.name, order: b.order },
      create: { slug: b.slug, name: b.name, order: b.order },
    });
    brandIdBySlug.set(b.slug, row.id);
  }

  const subIdBySlug = new Map<string, string>();
  for (const c of CATEGORIES) {
    const parent = await prisma.productCategory.upsert({
      where: { slug: c.slug },
      update: { name: c.name, icon: c.icon, order: c.order, parentId: null },
      create: { slug: c.slug, name: c.name, icon: c.icon, order: c.order },
    });
    let i = 1;
    for (const s of c.children) {
      const sub = await prisma.productCategory.upsert({
        where: { slug: s.slug },
        update: { name: s.name, parentId: parent.id, order: i },
        create: { slug: s.slug, name: s.name, parentId: parent.id, order: i },
      });
      subIdBySlug.set(s.slug, sub.id);
      i += 1;
    }
  }

  for (const [subSlug, brandSlug, name, availability, showPrice, price] of PRODUCTS) {
    const slug = name
      .trim().replace(/\s+/g, "-").replace(/[^\p{L}\p{N}-]+/gu, "").replace(/-+/g, "-").toLowerCase();
    await prisma.product.upsert({
      where: { slug },
      update: {
        name, categoryId: subIdBySlug.get(subSlug) ?? null, brandId: brandIdBySlug.get(brandSlug) ?? null,
        availability, showPrice, price, isActive: true, deletedAt: null,
        images: [], specs: [{ label: "برند", value: name.split(" ").pop() ?? "" }],
      },
      create: {
        name, slug, categoryId: subIdBySlug.get(subSlug) ?? null, brandId: brandIdBySlug.get(brandSlug) ?? null,
        availability, showPrice, price, isActive: true,
        images: [], specs: [{ label: "برند", value: name.split(" ").pop() ?? "" }],
      },
    });
  }

  await prisma.product.upsert({
    where: { slug: INACTIVE_SLUG },
    update: { name: "محصول غیرفعال (seed)", isActive: false, categoryId: subIdBySlug.get("diesel-generator-industrial") ?? null, images: [], specs: [] },
    create: { slug: INACTIVE_SLUG, name: "محصول غیرفعال (seed)", isActive: false, categoryId: subIdBySlug.get("diesel-generator-industrial") ?? null, images: [], specs: [] },
  });

  console.log(`seeded ${BRANDS.length} brands, ${CATEGORIES.length} categories, ${PRODUCTS.length + 1} products`);
}

main().then(() => prisma.$disconnect()).catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
