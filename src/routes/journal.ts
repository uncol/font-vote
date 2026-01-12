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
    `SELECT journal.id,
            journal.semantic,
            journal.icon,
            journal.user,
            journal.created,
            journal.applied,
            collection1.icon AS current_icon
       FROM journal
       LEFT JOIN collection1 ON collection1.semantic = journal.semantic
      WHERE journal.semantic LIKE ?
        AND journal.user LIKE ?
      ORDER BY journal.created ${order}`
  );

  const results = stmt.all(semanticFilter, userFilter) as Array<{
    id: string;
    semantic: string;
    icon: string;
    user: string;
    created: string;
    applied: number;
    current_icon: string | null;
  }>;
  jsonResponse(res, { items: results });
});

export default router;
