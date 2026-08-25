export type StepId = "s1" | "s2" | "s3" | "s4" | "s5" | "s6";

export type ClientScreenshotItem = {
  name: string;
  label: string;
  url: string;
};

export type PreviewApiResponse = {
  ok: boolean;
  preview_id: string;
  business_name: string;
  business_type: string;
  language: string;
  selected_template: string;
  preview_url: string;
  dist_available: boolean;
  screenshots?: ClientScreenshotItem[];
  demo_video_available?: boolean;
  demo_video_url?: string;
  demo_flow?: {
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
  } | null;
  error?: string;
};

export type ResultApiResponse = {
  ok: boolean;
  preview_id: string;
  business_name: string;
  delivery_options: Array<{
    key: string;
    label: string;
    available: boolean;
    href?: string;
  }>;
  demo_video_synced?: boolean;
  demo_video_warning?: string;
  error?: string;
};
