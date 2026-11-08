import { redirect } from "next/navigation";
import { ROUTES } from "@/constants";

export default function AcademyPage() {
  redirect(ROUTES.psychology);
}
