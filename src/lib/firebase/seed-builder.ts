import { pickNicheScenario } from "@/lib/manifest/niche-scenario";

type LocalizedText = {
  ru: string;
  de: string;
  en: string;
};

export type TodayItem = {
  name: LocalizedText;
  service: LocalizedText;
  time: string;
};

export type EntitySeedRecord = {
  entityType: string;
  title: LocalizedText;
  description: LocalizedText;
  scheduledAt: string;
  status: "in_progress" | "scheduled" | "completed";
  sortOrder: number;
  source: "crm_full_provision";
};

function isLocalizedText(value: unknown): value is LocalizedText {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.ru === "string" &&
    typeof record.de === "string" &&
    typeof record.en === "string"
  );
}

function extractTodayItems(scenario: unknown): TodayItem[] {
  if (!scenario || typeof scenario !== "object") {
    return [];
  }

  const todayItems = (scenario as { today_items?: unknown }).today_items;
  if (!Array.isArray(todayItems)) {
    return [];
  }

  return todayItems
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }
      const record = item as Record<string, unknown>;
      if (!isLocalizedText(record.name) || !isLocalizedText(record.service)) {
        return null;
      }
      return {
        name: record.name,
        service: record.service,
        time: String(record.time ?? "").trim() || "09:00",
      };
    })
    .filter((item): item is TodayItem => item !== null);
}

function fallbackTodayItems(businessType: string): TodayItem[] {
  return [
    {
      name: {
        ru: `Клиент ${businessType}`,
        de: `Kunde ${businessType}`,
        en: `Client ${businessType}`,
      },
      service: {
        ru: "Первичная консультация",
        de: "Erstberatung",
        en: "Initial Consultation",
      },
      time: "09:00",
    },
    {
      name: {
        ru: "Повторный визит",
        de: "Folgetermin",
        en: "Follow-up Visit",
      },
      service: {
        ru: "Стандартная услуга",
        de: "Standarddienstleistung",
        en: "Standard Service",
      },
      time: "11:30",
    },
    {
      name: {
        ru: "Новая заявка",
        de: "Neue Anfrage",
        en: "New Request",
      },
      service: {
        ru: "Обработка заявки",
        de: "Anfragebearbeitung",
        en: "Request Processing",
      },
      time: "14:00",
    },
  ];
}

export function resolveTodayItemsForBusinessType(businessType: string): TodayItem[] {
  const scenario = pickNicheScenario(businessType);
  const items = extractTodayItems(scenario);
  return items.length > 0 ? items : fallbackTodayItems(businessType);
}

export function buildEntitySeedRecords(entity: string, businessType: string): EntitySeedRecord[] {
  const todayItems = resolveTodayItemsForBusinessType(businessType).slice(0, 3);

  return todayItems.map((item, index) => ({
    entityType: entity,
    title: item.name,
    description: item.service,
    scheduledAt: item.time,
    status: index === 0 ? "in_progress" : "scheduled",
    sortOrder: index + 1,
    source: "crm_full_provision",
  }));
}
