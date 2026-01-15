import { randomUUID } from 'crypto';
import { Router } from 'express';
import { requireAdmin } from '../../lib/auth.js';
import { getDb } from '../../lib/db.js';
import type { AppConfig, AuthRequest } from '../../lib/types.js';
import { badRequest, conflict, jsonResponse, normalizeIcon, normalizeSemantic, notFound } from '../../lib/utils.js';

type Payload = {
  semantic?: string;
  icon?: string;
};

export function createAdminCollection1Router(config: AppConfig) {
  const router = Router();
  const adminMiddleware = requireAdmin(config);

  router.post('/', adminMiddleware, (req: AuthRequest, res) => {
    const body = req.body as Payload;
    if (!body?.semantic || !body?.icon) {
      return badRequest(res, "semantic and icon are required");
    }

    const semantic = normalizeSemantic(body.semantic);
    const icon = normalizeIcon(body.icon);
    if (!semantic || !icon) {
      return badRequest(res, "semantic and icon are required");
    }

    const db = getDb();
    try {
      db.prepare("INSERT INTO collection1 (semantic, icon) VALUES (?, ?)")
        .run(semantic, icon);
    } catch {
      return conflict(res, "semantic already exists");
    }

    db.prepare(
      "INSERT INTO journal (id, semantic, icon, user, created, applied) VALUES (?, ?, ?, ?, ?, 0)"
    ).run(randomUUID(), semantic, icon, req.session!.login, new Date().toISOString());

    jsonResponse(res, { ok: true });
  });

  router.put('/', adminMiddleware, (req: AuthRequest, res) => {
    const body = req.body as Payload;
    if (!body?.semantic || !body?.icon) {
      return badRequest(res, "semantic and icon are required");
    }

    const semantic = normalizeSemantic(body.semantic);
    const icon = normalizeIcon(body.icon);
    if (!semantic || !icon) {
      return badRequest(res, "semantic and icon are required");
    }

    const db = getDb();
    const result = db.prepare("UPDATE collection1 SET icon = ? WHERE semantic = ?")
      .run(icon, semantic);
    
    if (result.changes === 0) {
      return notFound(res, "semantic not found");
    }

    db.prepare(
      "INSERT INTO journal (id, semantic, icon, user, created, applied) VALUES (?, ?, ?, ?, ?, 0)"
    ).run(randomUUID(), semantic, icon, req.session!.login, new Date().toISOString());

    jsonResponse(res, { ok: true });
  });

  router.delete('/', adminMiddleware, (req: AuthRequest, res) => {
    const body = req.body as Payload;
    if (!body?.semantic) {
      return badRequest(res, "semantic is required");
    }

    const semantic = normalizeSemantic(body.semantic);
    if (!semantic) {
      return badRequest(res, "semantic is required");
    }

    const db = getDb();
    
    // Получаем текущий icon перед удалением для журнала
    const current = db.prepare("SELECT icon FROM collection1 WHERE semantic = ?")
      .get(semantic) as { icon: string } | undefined;
    
    if (!current) {
      return notFound(res, "semantic not found");
    }

    const result = db.prepare("DELETE FROM collection1 WHERE semantic = ?")
      .run(semantic);
    
    if (result.changes === 0) {
      return notFound(res, "semantic not found");
    }

    // Логируем удаление с пометкой в icon
    db.prepare(
      "INSERT INTO journal (id, semantic, icon, user, created, applied) VALUES (?, ?, ?, ?, ?, 0)"
    ).run(randomUUID(), semantic, `[deleted] ${current.icon}`, req.session!.login, new Date().toISOString());

    jsonResponse(res, { ok: true });
  });

  return router;
}
