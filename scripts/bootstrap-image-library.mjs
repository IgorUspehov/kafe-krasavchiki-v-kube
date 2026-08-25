#!/usr/bin/env node
/**
 * IMAGE_LIBRARY — populate public/image-library from niche photos.
 * og.jpg: dedicated 1200x630 JPEG <= 250 KB, separate source index from hero/gallery.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const config = JSON.parse(
  fs.readFileSync(path.join(projectRoot, "config/image-library-niches.json"), "utf8"),
);

const OG_WIDTH = config.og_width;
const OG_HEIGHT = config.og_height;
const OG_MAX_BYTES = config.og_max_bytes;
const OG_PHOTO_INDEX = config.og_photo_index;
const PLACEHOLDER_FOLDERS = new Set(config.placeholders);

/** image-library folder → source under mvp-template/dist/assets/niches */
const LIBRARY_SOURCES = {
  hotel: { niche: "hotel", heroIndex: 1, galleryIndices: [2, 3, 4], ogIndex: 5 },
  car_dealer: { niche: "car_service", heroIndex: 1, galleryIndices: [2, 3, 4], ogIndex: 5 },
  beauty_salon: { niche: "beauty", heroIndex: 1, galleryIndices: [2, 3, 4], ogIndex: 5 },
  dental_clinic: { niche: "dental", heroIndex: 1, galleryIndices: [2, 3, 4], ogIndex: 5 },
  restaurant: { niche: "restaurant", heroIndex: 1, galleryIndices: [2, 3, 4], ogIndex: 5 },
  fitness_club: { niche: "fitness", heroIndex: 1, galleryIndices: [2, 3, 4], ogIndex: 5 },
  real_estate: { niche: "real_estate", heroIndex: 1, galleryIndices: [2, 3, 4], ogIndex: 5 },
  technology: { niche: "technology", heroIndex: 1, galleryIndices: [2, 3, 4], ogIndex: 5 },
  generic: { niche: "technology", heroIndex: 2, galleryIndices: [3, 4, 5], ogIndex: 8 },
  logistics: { niche: "logistics", heroIndex: 1, galleryIndices: [2, 3, 4], ogIndex: 5 },
  massage_salon: { niche: "massage", heroIndex: 1, galleryIndices: [2, 3, 4], ogIndex: 5 },
  health_clinic: { niche: "health_clinic", heroIndex: 1, galleryIndices: [2, 3, 4], ogIndex: 5 },
  ecommerce: { niche: "ecommerce", heroIndex: 1, galleryIndices: [2, 3, 4], ogIndex: 5 },
  education: { niche: "education", heroIndex: 1, galleryIndices: [2, 3, 4], ogIndex: 5 },
  cleaning_service: { niche: "cleaning", heroIndex: 1, galleryIndices: [2, 3, 4], ogIndex: 5 },
  veterinary_clinic: { niche: "veterinary", heroIndex: 1, galleryIndices: [2, 3, 4], ogIndex: 5 },
  law_firm: { niche: "law_firm", heroIndex: 1, galleryIndices: [2, 3, 4], ogIndex: 5 },
  accounting: { niche: "accounting", heroIndex: 1, galleryIndices: [2, 3, 4], ogIndex: 5 },
  construction: { niche: "construction", heroIndex: 1, galleryIndices: [2, 3, 4], ogIndex: 5 },
};

const PLACEHOLDER_MARKERS = [];

const TARGET_ROOTS = [
  path.join(projectRoot, "public", "image-library"),
  path.join(projectRoot, "artifacts", "factory_output", "react_mvp", "public", "image-library"),
];

/** Prefer tracked react_mvp niches; fall back to local mvp-template sync. */
const NICHE_ASSETS_CANDIDATES = [
  path.join(projectRoot, "artifacts", "factory_output", "react_mvp", "public", "assets", "niches"),
  path.join(projectRoot, "mvp-template", "dist", "assets", "niches"),
];

function resolveNicheAssetsRoot() {
  for (const candidate of NICHE_ASSETS_CANDIDATES) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return NICHE_ASSETS_CANDIDATES[0];
}

const nicheAssetsRoot = resolveNicheAssetsRoot();

function sourcePhoto(nicheFolder, index) {
  return path.join(
    nicheAssetsRoot,
    nicheFolder,
    `${nicheFolder}_${String(index).padStart(2, "0")}.jpg`,
  );
}

async function writeJpegUnderLimit(input, outputPath, width, height, maxBytes = OG_MAX_BYTES) {
  let quality = 88;
  let buffer = Buffer.alloc(0);
  while (quality >= 45) {
    buffer = await sharp(input)
      .resize(width, height, { fit: "cover", position: "centre" })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
    if (!maxBytes || buffer.length <= maxBytes) {
      break;
    }
    quality -= 5;
  }
  await fs.promises.writeFile(outputPath, buffer);
  return buffer.length;
}

const HERO_WIDTH = 1050;
const HERO_HEIGHT = 700;

function realEstatePlaceholderSvg(variant) {
  const palettes = {
    hero: {
      sky: ["#8EB4C8", "#C5DCE8"],
      ground: "#4A6741",
      buildings: ["#1B3A4B", "#2D5A6F", "#3A6B82"],
      accent: "#E8DCC8",
    },
    gallery1: {
      sky: ["#9BB8D4", "#D4E4F0"],
      ground: "#5C8A4E",
      buildings: ["#8B5E3C"],
      accent: "#F5F0E8",
    },
    gallery2: {
      sky: ["#E8E0D4", "#F5F0EA"],
      ground: "#C4A882",
      buildings: ["#6B5344"],
      accent: "#87CEEB",
    },
    gallery3: {
      sky: ["#D4CFC8", "#EDEAE6"],
      ground: "#B8A99A",
      buildings: ["#4A5568"],
      accent: "#C9A227",
    },
    og: {
      sky: ["#6B8FA3", "#A8C4D4"],
      ground: "#3D5A45",
      buildings: ["#1A3344", "#254A5E", "#306278"],
      accent: "#D4C4A8",
    },
  };
  const p = palettes[variant] ?? palettes.hero;
  const [skyFrom, skyTo] = p.sky;
  const width = variant === "og" ? OG_WIDTH : HERO_WIDTH;
  const height = variant === "og" ? OG_HEIGHT : HERO_HEIGHT;

  const buildingBlocks =
    variant === "gallery1"
      ? `<polygon points="120,${height * 0.55} 280,${height * 0.32} 440,${height * 0.55}" fill="${p.buildings[0]}"/>
         <rect x="200" y="${height * 0.42}" width="50" height="40" rx="2" fill="${p.accent}" opacity="0.7"/>
         <rect x="270" y="${height * 0.38}" width="35" height="35" rx="2" fill="${p.accent}" opacity="0.5"/>
         <rect x="160" y="${height * 0.58}" width="70" height="55" rx="3" fill="#5C4033" opacity="0.85"/>`
      : variant === "gallery2"
        ? `<rect x="0" y="${height * 0.45}" width="${width}" height="${height * 0.55}" fill="${p.ground}"/>
           <rect x="80" y="${height * 0.2}" width="${width * 0.55}" height="${height * 0.5}" fill="${p.accent}" opacity="0.9"/>
           <rect x="${width * 0.62}" y="${height * 0.15}" width="${width * 0.28}" height="${height * 0.35}" fill="${p.accent}" opacity="0.75"/>
           <rect x="100" y="${height * 0.55}" width="120" height="45" rx="6" fill="${p.buildings[0]}" opacity="0.6"/>
           <rect x="240" y="${height * 0.58}" width="80" height="35" rx="4" fill="${p.buildings[0]}" opacity="0.45"/>`
        : variant === "gallery3"
          ? `<rect x="${width * 0.15}" y="${height * 0.35}" width="${width * 0.5}" height="${height * 0.42}" rx="8" fill="#F8F6F2" opacity="0.95"/>
             <rect x="${width * 0.22}" y="${height * 0.42}" width="${width * 0.36}" height="8" rx="2" fill="${p.buildings[0]}" opacity="0.25"/>
             <rect x="${width * 0.22}" y="${height * 0.52}" width="${width * 0.28}" height="6" rx="2" fill="${p.buildings[0]}" opacity="0.2"/>
             <circle cx="${width * 0.72}" cy="${height * 0.55}" r="42" fill="none" stroke="${p.accent}" stroke-width="6"/>
             <circle cx="${width * 0.72}" cy="${height * 0.55}" r="14" fill="${p.accent}" opacity="0.85"/>
             <rect x="${width * 0.68}" y="${height * 0.62}" width="16" height="55" rx="4" fill="${p.accent}" opacity="0.7"/>`
          : `<rect x="40" y="${height * 0.38}" width="120" height="${height * 0.42}" fill="${p.buildings[0]}"/>
             <rect x="55" y="${height * 0.45}" width="18" height="22" fill="${p.accent}" opacity="0.55"/>
             <rect x="80" y="${height * 0.45}" width="18" height="22" fill="${p.accent}" opacity="0.55"/>
             <rect x="105" y="${height * 0.45}" width="18" height="22" fill="${p.accent}" opacity="0.55"/>
             <rect x="180" y="${height * 0.28}" width="95" height="${height * 0.52}" fill="${p.buildings[1] ?? p.buildings[0]}"/>
             <rect x="195" y="${height * 0.35}" width="16" height="20" fill="${p.accent}" opacity="0.5"/>
             <rect x="220" y="${height * 0.35}" width="16" height="20" fill="${p.accent}" opacity="0.5"/>
             <rect x="245" y="${height * 0.35}" width="16" height="20" fill="${p.accent}" opacity="0.5"/>
             <rect x="290" y="${height * 0.22}" width="110" height="${height * 0.58}" fill="${p.buildings[2] ?? p.buildings[0]}"/>
             <rect x="305" y="${height * 0.3}" width="14" height="18" fill="${p.accent}" opacity="0.45"/>
             <rect x="328" y="${height * 0.3}" width="14" height="18" fill="${p.accent}" opacity="0.45"/>
             <rect x="351" y="${height * 0.3}" width="14" height="18" fill="${p.accent}" opacity="0.45"/>
             <rect x="420" y="${height * 0.32}" width="85" height="${height * 0.48}" fill="${p.buildings[1] ?? p.buildings[0]}" opacity="0.9"/>`;

  const groundY = variant === "gallery2" ? height : height * 0.78;
  const groundBlock =
    variant === "gallery2"
      ? ""
      : `<rect x="0" y="${groundY}" width="${width}" height="${height - groundY}" fill="${p.ground}"/>`;

  return Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${skyFrom}"/>
      <stop offset="100%" stop-color="${skyTo}"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#sky)"/>
  ${groundBlock}
  ${buildingBlocks}
</svg>`);
}

async function writeHeroJpeg(svgBuffer, outputPath) {
  const buffer = await sharp(svgBuffer)
    .resize(HERO_WIDTH, HERO_HEIGHT, { fit: "cover", position: "centre" })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();
  await fs.promises.writeFile(outputPath, buffer);
  return buffer.length;
}

async function bootstrapRealEstatePlaceholders(libraryFolder) {
  const slots = [
    { file: "hero.jpg", variant: "hero" },
    { file: "gallery-1.jpg", variant: "gallery1" },
    { file: "gallery-2.jpg", variant: "gallery2" },
    { file: "gallery-3.jpg", variant: "gallery3" },
  ];

  for (const targetRoot of TARGET_ROOTS) {
    const outDir = path.join(targetRoot, libraryFolder);
    fs.mkdirSync(outDir, { recursive: true });

    for (const slot of slots) {
      await writeHeroJpeg(
        realEstatePlaceholderSvg(slot.variant),
        path.join(outDir, slot.file),
      );
    }

    const ogPath = path.join(outDir, "og.jpg");
    const ogBytes = await writeJpegUnderLimit(
      realEstatePlaceholderSvg("og"),
      ogPath,
      OG_WIDTH,
      OG_HEIGHT,
    );
    if (ogBytes > OG_MAX_BYTES) {
      console.warn(`[image-library] ${libraryFolder}/og.jpg is ${ogBytes} bytes (> ${OG_MAX_BYTES})`);
    }
  }

  PLACEHOLDER_MARKERS.push({
    folder: libraryFolder,
    source: "real_estate_svg_placeholders",
    ogPath: `image-library/${libraryFolder}/og.jpg`,
  });
  console.log(`[image-library] ${libraryFolder} ← REAL_ESTATE_PLACEHOLDERS (no hotel/beauty)`);
}

function marketingPlaceholderSvg(palette) {
  const [fr, fg, fb] = palette.from;
  const [tr, tg, tb] = palette.to;
  return Buffer.from(`<svg width="${OG_WIDTH}" height="${OG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgb(${fr},${fg},${fb})"/>
      <stop offset="100%" stop-color="rgb(${tr},${tg},${tb})"/>
    </linearGradient>
  </defs>
  <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#bg)"/>
  <circle cx="980" cy="110" r="200" fill="rgba(255,255,255,0.07)"/>
  <circle cx="1080" cy="520" r="260" fill="rgba(255,255,255,0.05)"/>
  <rect x="72" y="420" width="360" height="10" rx="5" fill="rgba(255,255,255,0.14)"/>
  <rect x="72" y="452" width="240" height="10" rx="5" fill="rgba(255,255,255,0.09)"/>
</svg>`);
}

async function bootstrapFolder(libraryFolder, source) {
  if (source.realEstatePlaceholder) {
    await bootstrapRealEstatePlaceholders(libraryFolder);
    return;
  }

  let loggedPlaceholder = false;

  for (const targetRoot of TARGET_ROOTS) {
    const outDir = path.join(targetRoot, libraryFolder);
    fs.mkdirSync(outDir, { recursive: true });

    if (source.placeholder) {
      const ogPath = path.join(outDir, "og.jpg");
      const bytes = await writeJpegUnderLimit(
        marketingPlaceholderSvg(source.palette),
        ogPath,
        OG_WIDTH,
        OG_HEIGHT,
      );
      if (!loggedPlaceholder) {
        PLACEHOLDER_MARKERS.push({ folder: libraryFolder, ogPath: `image-library/${libraryFolder}/og.jpg`, bytes });
        console.log(`[image-library] ${libraryFolder} ← PLACEHOLDER`);
        loggedPlaceholder = true;
      }
      const genericHero = path.join(projectRoot, "public", "image-library", "generic", "hero.jpg");
      if (fs.existsSync(genericHero)) {
        await fs.promises.copyFile(genericHero, path.join(outDir, "hero.jpg"));
        for (let i = 1; i <= 3; i += 1) {
          const g = path.join(projectRoot, "public", "image-library", "generic", `gallery-${i}.jpg`);
          if (fs.existsSync(g)) {
            await fs.promises.copyFile(g, path.join(outDir, `gallery-${i}.jpg`));
          }
        }
      }
      continue;
    }

    const heroSrc = sourcePhoto(source.niche, source.heroIndex);
    const gallerySources = source.galleryIndices.map((i) => sourcePhoto(source.niche, i));
    const ogSrc = sourcePhoto(source.niche, source.ogIndex);

    for (const src of [heroSrc, ...gallerySources, ogSrc]) {
      if (!fs.existsSync(src)) {
        throw new Error(`Missing source photo for ${libraryFolder}: ${src}`);
      }
    }

    await writeJpegUnderLimit(heroSrc, path.join(outDir, "hero.jpg"), 1920, 1080, null);
    for (let i = 0; i < gallerySources.length; i += 1) {
      await writeJpegUnderLimit(
        gallerySources[i],
        path.join(outDir, `gallery-${i + 1}.jpg`),
        1920,
        1080,
        null,
      );
    }

    const ogPath = path.join(outDir, "og.jpg");
    const ogBytes = await writeJpegUnderLimit(ogSrc, ogPath, OG_WIDTH, OG_HEIGHT);
    if (ogBytes > OG_MAX_BYTES) {
      console.warn(`[image-library] ${libraryFolder}/og.jpg is ${ogBytes} bytes (> ${OG_MAX_BYTES})`);
    }
  }

  if (!source.placeholder) {
    console.log(`[image-library] ${libraryFolder} ← ${source.niche} (og:${source.ogIndex})`);
  }
}

async function main() {
  if (!fs.existsSync(nicheAssetsRoot)) {
    console.log(
      "image-library:bootstrap skipped — niche assets not found, using existing public/image-library/",
    );
    process.exit(0);
  }

  console.log(`[image-library] niche source: ${path.relative(projectRoot, nicheAssetsRoot)}`);

  const genericSource = LIBRARY_SOURCES.generic;
  await bootstrapFolder("generic", genericSource);

  for (const libraryFolder of config.folders) {
    if (libraryFolder === "generic") {
      continue;
    }
    const source = LIBRARY_SOURCES[libraryFolder];
    if (!source) {
      throw new Error(`Missing LIBRARY_SOURCES entry for ${libraryFolder}`);
    }
    await bootstrapFolder(libraryFolder, source);
  }

  const markerPath = path.join(projectRoot, "output/OG_LIBRARY_PLACEHOLDERS.json");
  fs.mkdirSync(path.dirname(markerPath), { recursive: true });
  fs.writeFileSync(markerPath, `${JSON.stringify(PLACEHOLDER_MARKERS, null, 2)}\n`, "utf8");

  console.log("[image-library] done → public/image-library + react_mvp/public/image-library");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
