export type ShowcaseDemo = {
  id: string;
  title: string;
  description: string;
  screenshot: string;
  demoUrl: string | null;
  artifactSource: string;
};

export const SHOWCASE_FLOW_STEPS = [
  "Идея",
  "Опросник",
  "Manifest",
  "MVP",
  "Deploy",
  "Готовая ссылка",
] as const;

export const SHOWCASE_DELIVERABLES = [
  {
    title: "Web MVP",
    description: "Готовое React-приложение с CRM, booking и dashboard",
  },
  {
    title: "Mobile Ready UI",
    description: "Адаптивный интерфейс для телефона и планшета",
  },
  {
    title: "Deploy Link",
    description: "Рабочая ссылка на демо или пакет для GitHub",
  },
  {
    title: "Client Package",
    description: "ZIP с MVP, README, screenshots и demo video",
  },
  {
    title: "Documentation",
    description: "Инструкции по запуску и передаче клиенту",
  },
] as const;

export const SHOWCASE_DEMOS: ShowcaseDemo[] = [
  {
    id: "beauty_salon",
    title: "Beauty Salon",
    description:
      "CRM для салона красоты: клиенты, мастера, услуги, записи. Текущий control path V8.",
    screenshot: "/showcase/beauty_salon/dashboard.png",
    demoUrl: "https://harmonious-unicorn-e1596b.netlify.app",
    artifactSource: "artifacts/factory_output/client_delivery/screenshots/",
  },
  {
    id: "dental_clinic",
    title: "Dental Clinic",
    description:
      "CRM для стоматологии: пациенты, приёмы, врачи, dashboard с demo data.",
    screenshot: "/showcase/dental_clinic/dashboard.png",
    demoUrl: null,
    artifactSource:
      "artifacts/factory_output/multi_business/runs/dental_clinic/final_package/demo/screenshots/",
  },
  {
    id: "fitness_club",
    title: "Fitness Studio",
    description:
      "CRM для фитнес-клуба: memberships, trainers, bookings и расписание.",
    screenshot: "/showcase/fitness_club/dashboard.png",
    demoUrl: null,
    artifactSource:
      "artifacts/factory_output/multi_business/runs/fitness_club/final_package/demo/screenshots/",
  },
  {
    id: "consultant",
    title: "Consultant",
    description:
      "Презентационный MVP для консультанта: demo CRM для пitch и первых клиентов.",
    screenshot: "/showcase/consultant/dashboard.png",
    demoUrl: null,
    artifactSource: "public/artifacts/factory_output/presentation/screenshots/",
  },
];

export const SHOWCASE_LINKS = {
  questionnaire: "/client-questionnaire",
  feedback: "/showcase#feedback",
  netlifyDeploy:
    "artifacts/factory_output/netlify_deploy/deployment_url.txt",
} as const;
