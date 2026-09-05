import { redirect } from "next/navigation";

/** System Hub removed — land everyone on SOC triage. */
export default function HomePage() {
  redirect("/soc");
}
