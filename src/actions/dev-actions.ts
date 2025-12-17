"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

export async function setDevRole(role: string) {
  if (process.env.DEV_MODE !== "true") return;
  
  (await cookies()).set("dev_role", role)
  revalidatePath("/")
}
