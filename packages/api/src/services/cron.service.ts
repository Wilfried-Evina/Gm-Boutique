import cron from 'node-cron';
import { Article } from '../models/Article';
import { ActionOnExpiry, ArticleStatus } from '@gm-boutique/shared';
import { logger } from '../utils/logger';

export const startCronJobs = () => {
  // Exécuter ce job tous les jours à minuit (0 0 * * *)
  cron.schedule('0 0 * * *', async () => {
    logger.info('Running cron job: check expired price reductions...');
    try {
      const now = new Date();

      // Rechercher les articles dont la date d'expiration est passée
      // et qui sont encore en statut DEPOSITED ou ON_SALE
      const expiredArticles = await Article.find({
        'priceReduction.deadlineDate': { $lt: now },
        status: { $in: [ArticleStatus.DEPOSITED, ArticleStatus.ON_SALE] }
      });

      for (const article of expiredArticles) {
        if (!article.priceReduction) continue;

        const action = article.priceReduction.actionOnExpiry;

        if (action === ActionOnExpiry.REDUCE_PRICE) {
          // 1. Baisser le prix
          if (article.priceReduction.reducedClientPrice !== undefined) {
             article.clientPrice = article.priceReduction.reducedClientPrice;
          }
          if (article.priceReduction.reducedPublicPrice !== undefined) {
             article.publicPrice = article.priceReduction.reducedPublicPrice;
          }
          
          logger.info(`Article ${article.barcode} price reduced (Action: REDUCE_PRICE).`);
          
          // Retirer la règle de réduction puisqu'elle a été appliquée
          article.priceReduction = undefined;
          await article.save();

        } else if (action === ActionOnExpiry.RETURN_TO_CLIENT) {
          // 2. Restituer l'article
          article.status = ArticleStatus.RETURNED;
          
          logger.info(`Article ${article.barcode} status changed to RETURNED (Action: RETURN_TO_CLIENT).`);
          
          // On retire aussi la règle de réduction
          article.priceReduction = undefined;
          await article.save();
        }
      }

      logger.info(`Cron job finished: ${expiredArticles.length} articles processed.`);
    } catch (error) {
      logger.error('Error running cron job for price reductions:', error);
    }
  });
};
