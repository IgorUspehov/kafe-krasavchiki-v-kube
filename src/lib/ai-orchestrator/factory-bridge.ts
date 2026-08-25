import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import type { AnalyzeIdeaResponse } from "@/lib/ai-orchestrator/types";

const ROOT = process.cwd();

function safeName(value: string): string {
  return (value || "MVP_PROJECT")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}

function writeJsonBoth(relativePath: string, data: unknown) {
  const targets = [
    path.join(ROOT, "artifacts", "presentation", relativePath),
    path.join(ROOT, "public", "artifacts", "presentation", relativePath),
  ];

  for (const target of targets) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, JSON.stringify(data, null, 2) + "\n", "utf8");
  }
}

function buildProjectName(analysis: AnalyzeIdeaResponse): string {
  const idea = (analysis.idea || "").toLowerCase();
  const summary = (analysis.summary || "").toLowerCase();
  const combined = `${idea} ${summary}`;

  if (combined.includes("альпинизм") || combined.includes("alpin") || combined.includes("climbing")) {
    return "INDUSTRIAL_CLIMBING_CRM";
  }

  if (combined.includes("crm")) {
    return "NICHE_CRM_SAAS";
  }

  const raw = `${analysis.project_type || "mvp"}_${analysis.summary || analysis.idea || "project"}`;
  return safeName(raw).slice(0, 80) || "MVP_PROJECT";
}

function run(command: string) {
  console.log(`[FactoryBridge] → ${command}`);
  execSync(command, {
    cwd: ROOT,
    stdio: "inherit",
    env: {
      ...process.env,
      FACTORY_FROM_OPENAI: "1",
    },
  });
}

export async function runFactoryPipelineFromAnalysis(analysis: AnalyzeIdeaResponse) {
  const generatedAt = new Date().toISOString();
  const projectName = buildProjectName(analysis);
  const projectType = analysis.project_type || "generic_mvp";
  const features = Array.isArray(analysis.mvp_features) ? analysis.mvp_features : [];

  const projectCard = {
    project_name: projectName,
    project_type: projectType,
    repository: "factory-generated-from-openai",
    template: "mvp",
    ui_library: "shadcn/ui",
    complexity: "medium",
    estimated_cost: "factory-estimate",
    estimated_time: "automated",
    audit_status: "OPENAI_MANIFEST_READY",
    presentation_ready: true,
    idea: analysis.idea,
    summary: analysis.summary,
    recommended_stack: analysis.recommended_stack,
    generated_at: generatedAt,
  };

  const selectedPrompt = {
    idea: analysis.idea,
    raw_idea: analysis.idea,
    prompt: analysis.idea,
    title: analysis.summary || analysis.idea,
    source: "openai_manifest",
    project_name: projectName,
    project_type: projectType,
    mvp_features: features,
    recommended_stack: analysis.recommended_stack,
    generated_at: generatedAt,
  };

  const selectedOption = {
    option: projectType,
    selected_option: projectType,
    name: projectType,
    label: projectType.replace(/_/g, " "),
    option_id: "openai_option_1",
    final_score: 100,
    features,
    risks: analysis.risks || [],
    next_steps: analysis.next_steps || [],
    generated_at: generatedAt,
  };

  /*
    Сначала полностью пересобираем доменную модель (llm_manifest + K5–K8).
    Без этого downstream-фабрики читают stale mvp_package.json прошлого запуска.
  */
  const escapedIdea = analysis.idea.replace(/"/g, '\\"');
  run(`FACTORY_IDEA="${escapedIdea}" node scripts/sync-domain-pipeline.mjs`);

  writeJsonBoth("project_card.json", projectCard);
  writeJsonBoth("selected_prompt.json", selectedPrompt);
  writeJsonBoth("selected_option.json", selectedOption);

  const commands = [
    "npm run package:generate",
    "npm run release:generate",
    "npm run github:generate",
    "npm run deploy:generate",
    "npm run client:generate",
    "npm run runtime:generate",
    "npm run app:generate",
    "npm run scaffold:generate",
    "npm run assembly:generate",
    "npm run data:generate",
    "npm run backend:generate",
    "npm run binding:generate",
    "npm run execution:generate",
    "npm run database:generate",
    "npm run validation:generate",
    "npm run real-mvp:materialize",
    "python3 factory/zip_factory.py",
  ];

  for (const command of commands) {
    run(command);
  }

  return {
    status: "FACTORY_PIPELINE_DONE",
    project_name: projectName,
    project_type: projectType,
    project_card: "artifacts/presentation/project_card.json",
    selected_prompt: "artifacts/presentation/selected_prompt.json",
    selected_option: "artifacts/presentation/selected_option.json",
    zip: "artifacts/factory_output/package/mvp_package.zip",
  };
}
