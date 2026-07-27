import { canAdmin, fail, ok, requireActor } from "@/lib/procurement/api-helpers";
import { ensureStoreHydrated, seedMockState } from "@/lib/procurement/server-store";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  await ensureStoreHydrated();

  if (process.env.NODE_ENV === "production" && process.env.ALLOW_PRODUCTION_SEED !== "true") {
    return fail("Endpoint de seed bloqueado em producao.", 403);
  }

  const auth = await requireActor(req);
  if ("error" in auth) return auth.error;

  const actor = auth.actor;
  if (!canAdmin(actor.role)) return fail("Apenas ADMINISTRADOR pode executar seed.", 403);

  const state = await seedMockState(actor);
  return ok({
    message: "Seed aplicado com sucesso no estado relacional.",
    totals: {
      setores: state.setores.length,
      fornecedores: state.fornecedores.length,
      scs: state.scs.length,
      ocs: state.ocs.length,
      auditoria: state.auditoria.length,
    },
  });
}
