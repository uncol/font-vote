import { randomUUID } from 'crypto';
import { Router } from 'express';
import { requireAuth } from '../lib/auth.js';
import { getDb } from '../lib/db.js';
import type { AuthRequest } from '../lib/types.js';
import { badRequest, conflict, jsonResponse, normalizeIcon, normalizeSemantic } from '../lib/utils.js';

const router = Router();

type Payload = {
  semantic?: string;
  icon?: string;
};

router.post('/', requireAuth, (req: AuthRequest, res) => {
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
  const exists = db.prepare("SELECT semantic FROM collection1 WHERE semantic = ?")
    .get(semantic);
  
  if (!exists) {
    return conflict(res, "semantic does not exist");
  }

  const stmt = db.prepare(
    "INSERT INTO journal (id, semantic, icon, user, created, applied) VALUES (?, ?, ?, ?, ?, 0)"
  );
  
  stmt.run(randomUUID(), semantic, icon, req.session!.login, new Date().toISOString());
  jsonResponse(res, { ok: true });
});

export default router;
