export type TemplateManifest = {
  status: string;
  version?: string;
  template_name: string;
  layout: string;
  pages: string[];
  components: string[];
  forms: string[];
  source?: string;
  template_score?: number;
};

export type TemplateExtractionSnapshot = {
  manifest: TemplateManifest | null;
};
