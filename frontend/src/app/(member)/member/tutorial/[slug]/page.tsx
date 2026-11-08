import { ContentDetail } from "@/components/member/ContentDetail";

export default async function TutorialDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ContentDetail slug={slug} backHref="/member/tutorial" />;
}
