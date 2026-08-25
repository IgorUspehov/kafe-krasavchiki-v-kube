import { ClientPreviewPage } from "@/views/client-preview-page";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <ClientPreviewPage previewRouteId={id} />;
}
