export type V2ManifestPreview = {
  preview_id?: string;
  preview_url?: string;
  approved_at?: string | null;
};

export type V2Manifest = {
  version?: string;
  status?: string;
  generated_at?: string;
  business_type?: string;
  template_id?: string;
  modules?: string[];
  language?: string;
  delivery_method?: string;
  client_contacts?: {
    business_name?: string;
    phone?: string;
    whatsapp?: string;
    telegram?: string;
    email?: string;
  };
  preview?: V2ManifestPreview;
  outputs?: {
    react_mvp?: string;
    final_package?: string;
  };
};

export type ClientPreviewDemoFlow = {
  questionnaire: {
    business_name: string;
    business_category: string;
    language: string;
    email: string;
    phone: string;
  };
  sphere: {
    selected_sphere: string;
    template: string;
    modules: string[];
  };
  manifest_card: {
    business_name: string;
    business_type: string;
    selected_template: string;
    language: string;
    delivery_ready: boolean;
    artifacts_in_sync: boolean;
  };
};

export type ClientScreenshotItem = {
  name: string;
  label: string;
  url: string;
};

export type ClientPreviewPayload = {
  ok: boolean;
  preview_id: string;
  business_name: string;
  business_type: string;
  language: string;
  selected_modules: string[];
  selected_template: string;
  preview_url: string;
  manifest_status: string;
  delivery_ready: boolean;
  dist_available: boolean;
  screenshots?: ClientScreenshotItem[];
  demo_video_available?: boolean;
  demo_video_url?: string;
  demo_flow?: ClientPreviewDemoFlow | null;
  error?: string;
};

export type DeliveryOptionKey =
  | "zip"
  | "netlify"
  | "custom_domain"
  | "github"
  | "apk"
  | "pwa"
  | "readme"
  | "demo_mp4";

export type DeliveryOption = {
  key: DeliveryOptionKey;
  label: string;
  available: boolean;
  href?: string;
  description?: string;
};

export type ClientResultPayload = {
  ok: boolean;
  preview_id: string;
  business_name: string;
  business_type: string;
  language: string;
  selected_template: string;
  selected_modules: string[];
  delivery_options: DeliveryOption[];
  artifacts_in_sync?: boolean;
  artifacts_sync_warning?: string;
  artifact_mismatches?: string[];
  factory_drift?: string[];
  demo_video_synced?: boolean;
  demo_video_warning?: string;
  error?: string;
};
