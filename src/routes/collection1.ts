import { Router } from 'express';
import { getDb } from '../lib/db.js';
import { clampSortOrder, jsonResponse, normalizeSemantic } from '../lib/utils.js';

const router = Router();

router.get('/', (req, res) => {
  const semantic = req.query.semantic as string | undefined;
  const icon = req.query.icon as string | undefined;
  const sort = req.query.sort === "icon" ? "icon" : "semantic";
  const order = clampSortOrder(req.query.order as string, "asc");

  const semanticFilter = semantic ? `%${normalizeSemantic(semantic)}%` : "%";
  const iconFilter = icon ? `%${icon.trim()}%` : "%";

  const db = getDb();
  const stmt = db.prepare(
    `SELECT semantic, icon FROM collection1 WHERE semantic LIKE ? AND icon LIKE ? ORDER BY ${sort} ${order}`
  );

  const results = stmt.all(semanticFilter, iconFilter) as Array<{ semantic: string; icon: string }>;
  jsonResponse(res, { items: results });
});

export default router;
