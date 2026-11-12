import { revalidatePath } from "next/cache";

export function revalidateStorefront() {
  revalidatePath("/");
  revalidatePath("/catalogo");
  revalidatePath("/produto", "layout");
}
