import { DEPLOY_ARTIFACT_ROOT, type DockerReport } from "@/lib/deploy/types";

const DOCKER_ROOT = `${DEPLOY_ARTIFACT_ROOT}/docker`;
const SERVICE_NAME = "saas-idea-ai-mvp-factory-web";

export function generateDockerfile(): string {
  return `FROM node:22-alpine AS base

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
`;
}

export function generateDockerCompose(): string {
  return `services:
  ${SERVICE_NAME}:
    build:
      context: ../../..
      dockerfile: artifacts/deploy/docker/Dockerfile
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
    restart: unless-stopped
`;
}

export function generateDockerReport(): DockerReport {
  return {
    status: "READY",
    dockerfile_path: `${DOCKER_ROOT}/Dockerfile`,
    compose_path: `${DOCKER_ROOT}/docker-compose.yml`,
    image: "node:22-alpine",
    port: "3000:3000",
    service_name: SERVICE_NAME,
  };
}
