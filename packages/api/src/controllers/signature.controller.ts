import { Request, Response } from 'express';
import crypto from 'crypto';
import { SignatureSession } from '../models/SignatureSession';
import { logger } from '../utils/logger';

// 1. Demander une nouvelle session de signature (côté caisse)
export const requestSignature = async (req: Request, res: Response) => {
  try {
    const { signatureType } = req.body; // 'first_deposit' or 'standard'
    
    if (!['first_deposit', 'standard'].includes(signatureType)) {
      return res.status(400).json({ message: "Type de signature invalide" });
    }

    const token = crypto.randomUUID(); // Génère un identifiant unique (ex: 123e4567-e89b-12d3-a456-426614174000)

    const session = await SignatureSession.create({
      token,
      signatureType,
      status: 'pending'
    });

    res.status(201).json({ token: session.token, signatureType: session.signatureType });
  } catch (error) {
    logger.error('Erreur requestSignature:', error);
    res.status(500).json({ message: "Erreur serveur lors de la création de la session de signature." });
  }
};

// 2. Vérifier le statut (polling côté caisse)
export const checkSignatureStatus = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const session = await SignatureSession.findOne({ token });

    if (!session) {
      return res.status(404).json({ message: "Session introuvable ou expirée" });
    }

    res.json({
      status: session.status,
      signatureBase64: session.signatureBase64,
      cguAccepted: session.cguAccepted
    });
  } catch (error) {
    logger.error('Erreur checkSignatureStatus:', error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// 3. Récupérer les infos de la session (côté téléphone)
export const getSignatureSession = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const session = await SignatureSession.findOne({ token });

    if (!session) {
      return res.status(404).json({ message: "Session introuvable ou expirée" });
    }

    res.json({
      signatureType: session.signatureType,
      status: session.status
    });
  } catch (error) {
    logger.error('Erreur getSignatureSession:', error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// 4. Soumettre la signature (côté téléphone)
export const submitSignature = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { signatureBase64, cguAccepted } = req.body;

    if (!signatureBase64) {
      return res.status(400).json({ message: "La signature est requise." });
    }

    const session = await SignatureSession.findOne({ token });

    if (!session) {
      return res.status(404).json({ message: "Session introuvable ou expirée" });
    }

    if (session.status !== 'pending') {
      return res.status(400).json({ message: "Cette session a déjà été validée." });
    }

    if (session.signatureType === 'first_deposit' && !cguAccepted) {
      return res.status(400).json({ message: "Les CGU doivent être acceptées." });
    }

    session.signatureBase64 = signatureBase64;
    session.cguAccepted = cguAccepted || false;
    session.status = 'completed';
    await session.save();

    res.json({ success: true, message: "Signature validée avec succès." });
  } catch (error) {
    logger.error('Erreur submitSignature:', error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};
