import { NextRequest, NextResponse } from 'next/server';
import { fail, getAuth, guardWrite, handle, ok } from '@/lib/http';
import * as store from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ collection: string; id: string }> };

async function target(ctx: Ctx) {
  const { collection, id } = await ctx.params;
  const rule = store.ruleFor(collection);
  if (!rule || !store.SAFE_ID.test(id)) throw fail(404, 'NAO_ENCONTRADO', 'Documento inexistente.');
  return { collection, id, rule };
}

// Escrita: precisa de sessão, CSRF e permissão. Recurso alheio responde 404.
async function authorizedWrite(req: NextRequest, ctx: Ctx, removing = false) {
  const session = await guardWrite(req);
  if (!session) throw fail(401, 'NAO_AUTENTICADO', 'Entre na sua conta para continuar.');
  const found = await target(ctx);
  if (!(removing && found.rule.remove ? found.rule.remove : found.rule.write)(session.user, found.id)) throw fail(404, 'NAO_ENCONTRADO', 'Documento inexistente.');
  return { ...found, user: session.user };
}

const bodyData = async (req: NextRequest) => ((await req.json().catch(() => ({}))) as { data?: unknown }).data;

export const GET = handle(async (req, ctx: Ctx) => {
  const { collection, id, rule } = await target(ctx);
  const data = await store.getDoc(collection, id);
  return NextResponse.json({ data: data !== undefined && rule.read((await getAuth(req))?.user ?? null, id) ? { exists: true, data } : { exists: false } }, { headers: { 'Cache-Control': 'no-store' } });
});

export const PUT = handle(async (req, ctx: Ctx) => {
  const { collection, id, user } = await authorizedWrite(req, ctx);
  return ok(await store.writeDoc(collection, id, await bodyData(req), user));
});

export const PATCH = handle(async (req, ctx: Ctx) => {
  const { collection, id, user } = await authorizedWrite(req, ctx);
  if ((await store.getDoc(collection, id)) === undefined) throw fail(404, 'NAO_ENCONTRADO', 'Documento inexistente.');
  return ok(await store.writeDoc(collection, id, await bodyData(req), user, true));
});

export const DELETE = handle(async (req, ctx: Ctx) => {
  const { collection, id } = await authorizedWrite(req, ctx, true);
  await store.deleteDoc(collection, id);
  return ok(null);
});
