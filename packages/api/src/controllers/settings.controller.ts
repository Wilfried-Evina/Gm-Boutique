import { Request, Response } from 'express';

export const settingsController = {
  async getCgu(req: Request, res: Response) {
    const cguText = `
### Propriété des articles déposés
Je certifie être le/la propriétaire légitime des articles déposés. 
Je m'engage à ce que les articles soient authentiques et non issus d'activités frauduleuses.

### Conditions Générales de Dépôt-Vente
1. Les articles déposés restent la propriété du déposant jusqu'à leur vente.
2. Gm-Boutique fixe le prix de vente en accord avec le déposant et prélève une commission sur chaque vente selon le barème en vigueur.
3. Les articles invendus doivent être récupérés à l'issue de la période contractuelle. À défaut, ils pourront être soldés ou donnés à une œuvre caritative.
4. Gm-Boutique décline toute responsabilité en cas de vol, perte ou détérioration liée à un cas de force majeure.

*(Ce texte est temporaire et sera remplacé par la version validée par l'avocat)*
    `.trim();

    res.json({ text: cguText });
  }
};
