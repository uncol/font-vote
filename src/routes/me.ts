import { Router } from 'express';
import { isAdmin, parseAllowlist } from '../lib/auth.js';
import type { AppConfig, AuthRequest } from '../lib/types.js';
import { jsonResponse } from '../lib/utils.js';

const router = Router();

export function createMeRouter(config: AppConfig) {
  router.get('/', (req: AuthRequest, res) => {
    const allowlist = parseAllowlist(config.ADMIN_ALLOWLIST);
    const login = req.session?.login ?? null;
    jsonResponse(res, {
      user: login,
      isAdmin: isAdmin(login, allowlist),
    });
  });
  
  return router;
}

export default router;
