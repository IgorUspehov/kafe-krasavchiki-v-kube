import type {
  ApiGatewayConfig,
  ApiGatewayFactorySnapshot,
  ApiGatewayReport,
  ApiRoutesConfig,
} from "@/lib/api-gateway-factory/types";

export const API_GATEWAY_FACTORY_BASE = "/artifacts/factory_output/runtime/api_gateway";

export async function fetchApiGatewayFactorySnapshot(): Promise<ApiGatewayFactorySnapshot> {
  const [gatewayRes, routesRes, reportRes] = await Promise.all([
    fetch(`${API_GATEWAY_FACTORY_BASE}/api_gateway.json`),
    fetch(`${API_GATEWAY_FACTORY_BASE}/api_routes.json`),
    fetch(`${API_GATEWAY_FACTORY_BASE}/api_report.json`),
  ]);

  const gateway = gatewayRes.ok ? ((await gatewayRes.json()) as ApiGatewayConfig) : null;
  const routes = routesRes.ok ? ((await routesRes.json()) as ApiRoutesConfig) : null;
  const report = reportRes.ok ? ((await reportRes.json()) as ApiGatewayReport) : null;

  return { gateway, routes, report };
}
