import { ContentDetail } from "@/components/member/ContentDetail";

export default async function PsychologyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ContentDetail slug={slug} backHref="/member/psychology" />;
}
