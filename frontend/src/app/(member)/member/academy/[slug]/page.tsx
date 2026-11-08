import { redirect } from "next/navigation";
import { ROUTES } from "@/constants";

export default async function AcademyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await params;
  redirect(ROUTES.psychology);
}
