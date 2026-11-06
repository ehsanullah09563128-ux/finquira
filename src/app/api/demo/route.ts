import { redirect } from "next/navigation";
import { ensureDemoData } from "@/db/demo";
import { createSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Opens a read/write tour of the app using the shared demo workspace. */
export async function GET() {
  let userId: string;
  try {
    userId = await ensureDemoData();
  } catch (error) {
    console.error("demo session failed", error);
    redirect("/login?demo=failed");
  }

  await createSession(userId);
  redirect("/dashboard");
}
