import fs from "fs";
import path from "path";

import { NextResponse } from "next/server";

const CATEGORY_MAP_PATH = path.join(process.cwd(), "config/knowledge_category_map.json");
const KNOWLEDGE_ROOT = path.join(process.cwd(), "knowledge_library");

type CategoryMap = {
  business_type_to_category?: Record<string, string>;
  knowledge_pack_folder_aliases?: Record<string, string>;
  default_category?: string;
};

function readCategoryMap(): CategoryMap {
  if (!fs.existsSync(CATEGORY_MAP_PATH)) {
    return { default_category: "consulting" };
  }
  try {
    return JSON.parse(fs.readFileSync(CATEGORY_MAP_PATH, "utf8")) as CategoryMap;
  } catch {
    return { default_category: "consulting" };
  }
}

function mapBusinessType(businessType: string): string {
  const categoryMap = readCategoryMap();
  const normalized = businessType.trim().toLowerCase();
  return categoryMap.business_type_to_category?.[normalized] ?? categoryMap.default_category ?? "consulting";
}

function resolveKnowledgePackFolder(selectedCategory: string): string {
  const categoryMap = readCategoryMap();
  return categoryMap.knowledge_pack_folder_aliases?.[selectedCategory] ?? selectedCategory;
}

function readJsonList(filePath: string, key: string): unknown[] {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8")) as Record<string, unknown>;
    const value = data[key];
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const businessType = String(url.searchParams.get("business_type") ?? "dental_clinic").trim();
  const language = String(url.searchParams.get("language") ?? "en").trim().toLowerCase();
  const supported = new Set(["en", "de", "ru"]);
  const locale = supported.has(language) ? language : "en";
  const selectedCategory = mapBusinessType(businessType);
  const packFolder = resolveKnowledgePackFolder(selectedCategory);
  const packDir = path.join(KNOWLEDGE_ROOT, locale, packFolder);

  return NextResponse.json({
    status: "PASS",
    business_type: selectedCategory,
    selected_business_category: selectedCategory,
    knowledge_pack_used: path.join("knowledge_library", locale, packFolder),
    language: locale,
    questions: readJsonList(path.join(packDir, "questions.json"), "questions"),
    features: readJsonList(path.join(packDir, "features.json"), "features"),
    faq: readJsonList(path.join(packDir, "faq.json"), "faq"),
    llm_used: false,
  });
}
