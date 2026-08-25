/**
 * True when this process is a buyer-deployed Deployable ZIP (€999),
 * not the SaaS host (webstudio-muenchen.com / Render).
 *
 * ZIP builds bake `IS_DEPLOYABLE_ZIP=true` into `.env` via the ZIP builder.
 */
export function isDeployableZipRuntime(): boolean {
  return process.env.IS_DEPLOYABLE_ZIP === "true";
}
