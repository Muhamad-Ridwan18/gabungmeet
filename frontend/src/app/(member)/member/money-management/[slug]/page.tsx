import { ContentDetail } from "@/components/member/ContentDetail";

export default async function MoneyManagementDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ContentDetail slug={slug} backHref="/member/money-management" />;
}
