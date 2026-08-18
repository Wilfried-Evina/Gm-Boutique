import { Router, Request, Response } from 'express';
import { SignatureSession } from '../models/SignatureSession';

const router = Router();

router.get('/sessions', async (req: Request, res: Response) => {
  const sessions = await SignatureSession.find({});
  res.json(sessions);
});

export default router;
