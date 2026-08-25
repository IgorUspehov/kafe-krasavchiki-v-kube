import { ClientResultPage } from "@/views/client-result-page";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <ClientResultPage previewRouteId={id} />;
}
