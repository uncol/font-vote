import { randomUUID } from 'crypto';
import { Router } from 'express';
import { requireAdmin } from '../../lib/auth.js';
import { getDb } from '../../lib/db.js';
import type { AppConfig, AuthRequest } from '../../lib/types.js';
import { badRequest, conflict, jsonResponse, notFound } from '../../lib/utils.js';

type Payload = {
  id?: string;
};

export function createAdminApplyRouter(config: AppConfig) {
  const router = Router();
  const adminMiddleware = requireAdmin(config);

  router.post('/', adminMiddleware, (req: AuthRequest, res) => {
    const body = req.body as Payload;
    if (!body?.id) {
      return badRequest(res, "id is required");
    }

    const db = getDb();
    const entry = db.prepare("SELECT id, semantic, icon, applied FROM journal WHERE id = ?")
      .get(body.id) as { id: string; semantic: string; icon: string; applied: number } | undefined;
    
    if (!entry) {
      return notFound(res, "journal entry not found");
    }
    
    if (entry.applied) {
      return conflict(res, "journal entry already applied");
    }

    const semanticRow = db.prepare("SELECT semantic FROM collection1 WHERE semantic = ?")
      .get(entry.semantic);
    
    if (!semanticRow) {
      return conflict(res, "semantic does not exist");
    }

    const newId = randomUUID();
    const created = new Date().toISOString();

    // Use transaction for atomic operation
    const transaction = db.transaction(() => {
      // Check again that it's not applied
      const check = db.prepare("SELECT applied FROM journal WHERE id = ? AND applied = 0")
        .get(entry.id) as { applied: number } | undefined;
      
      if (!check) {
        throw new Error("journal entry already applied");
      }

      db.prepare("UPDATE collection1 SET icon = ? WHERE semantic = ?")
        .run(entry.icon, entry.semantic);

      db.prepare(
        "INSERT INTO journal (id, semantic, icon, user, created, applied) VALUES (?, ?, ?, ?, ?, 0)"
      ).run(newId, entry.semantic, entry.icon, req.session!.login, created);

      db.prepare("UPDATE journal SET applied = 1 WHERE id = ?")
        .run(entry.id);
    });

    try {
      transaction();
      jsonResponse(res, { ok: true });
    } catch (err: any) {
      if (err.message === "journal entry already applied") {
        return conflict(res, "journal entry already applied");
      }
      throw err;
    }
  });

  return router;
}
