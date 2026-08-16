import { Router } from 'express';
import {
  requestSignature,
  checkSignatureStatus,
  getSignatureSession,
  submitSignature
} from '../controllers/signature.controller';

const router = Router();

// Routes pour la caisse (Générer et écouter le statut)
router.post('/request', requestSignature);
router.get('/:token', checkSignatureStatus);

// Routes pour le téléphone (Afficher et soumettre)
router.get('/session/:token', getSignatureSession);
router.post('/:token/submit', submitSignature);

export default router;
