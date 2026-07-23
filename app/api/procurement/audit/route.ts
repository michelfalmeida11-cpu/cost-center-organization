import { ensureStoreHydrated, listAudit } from "@/lib/procurement/server-store";
import { ok, requireActor } from "@/lib/procurement/api-helpers";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  await ensureStoreHydrated();
  const auth = await requireActor(req);
  if ("error" in auth) return auth.error;
  const params = req.nextUrl.searchParams;
  return ok(
    listAudit({
      page: Number(params.get("page") ?? 1),
      pageSize: Number(params.get("pageSize") ?? 20),
      entidade: params.get("entidade") ?? "",
      acao: params.get("acao") ?? "",
      usuario: params.get("usuario") ?? "",
    }),
  );
}
