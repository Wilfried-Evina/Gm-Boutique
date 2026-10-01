import { Router } from 'express';
import { digitalizeClientRecords } from '../controllers/digitalization.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

import { UserRole } from '@gm-boutique/shared';

const router = Router();

// Only admin or collaborator can digitalize historical records
router.post('/clients/:clientId', authenticate, authorize([UserRole.ADMIN, UserRole.GERANTE]), digitalizeClientRecords);

export default router;
