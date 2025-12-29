import { Router } from 'express';
import { getDb } from '../lib/db.js';
import { clampSortOrder, jsonResponse, normalizeSemantic } from '../lib/utils.js';

const router = Router();

router.get('/', (req, res) => {
  const semantic = req.query.semantic as string | undefined;
  const user = req.query.user as string | undefined;
  const order = clampSortOrder(req.query.order as string, "desc");

  const semanticFilter = semantic ? `%${normalizeSemantic(semantic)}%` : "%";
  const userFilter = user ? `%${user.trim()}%` : "%";

  const db = getDb();
  const stmt = db.prepare(
    `SELECT id, semantic, icon, user, created, applied FROM journal WHERE semantic LIKE ? AND user LIKE ? ORDER BY created ${order}`
  );

  const results = stmt.all(semanticFilter, userFilter) as Array<{ id: string; semantic: string; icon: string; user: string; created: string; applied: number }>;
  jsonResponse(res, { items: results });
});

export default router;
