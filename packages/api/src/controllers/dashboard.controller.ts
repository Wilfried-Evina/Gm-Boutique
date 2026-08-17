import { Request, Response, NextFunction } from 'express';
import { Article } from '../models/Article';
import { Client } from '../models/Client';
import { ArticleStatus } from '@gm-boutique/shared';

type Period = 'week' | 'month' | 'quarter' | 'year';

interface Bucket {
  label: string;
  start: Date;
  end: Date;
}

/** Génère les tranches temporelles selon la période demandée (les plus récentes en dernier). */
function buildBuckets(period: Period): Bucket[] {
  const now = new Date();
  const buckets: Bucket[] = [];
  const dd = (n: number) => String(n).padStart(2, '0');

  if (period === 'year') {
    for (let i = 4; i >= 0; i--) {
      const y = now.getFullYear() - i;
      buckets.push({ label: String(y), start: new Date(y, 0, 1), end: new Date(y + 1, 0, 1) });
    }
  } else if (period === 'quarter') {
    const curQ = Math.floor(now.getMonth() / 3);
    for (let i = 3; i >= 0; i--) {
      let q = curQ - i;
      let y = now.getFullYear();
      while (q < 0) {
        q += 4;
        y -= 1;
      }
      const sm = q * 3;
      buckets.push({ label: `T${q + 1} ${y}`, start: new Date(y, sm, 1), end: new Date(y, sm + 3, 1) });
    }
  } else if (period === 'week') {
    // 8 dernières semaines (début lundi)
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    for (let i = 7; i >= 0; i--) {
      const s = new Date(monday);
      s.setDate(s.getDate() - i * 7);
      const e = new Date(s);
      e.setDate(e.getDate() + 7);
      buckets.push({ label: `${dd(s.getDate())}.${dd(s.getMonth() + 1)}`, start: s, end: e });
    }
  } else {
    // month : 12 derniers mois
    for (let i = 11; i >= 0; i--) {
      const s = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const e = new Date(s.getFullYear(), s.getMonth() + 1, 1);
      buckets.push({ label: `${dd(s.getMonth() + 1)}.${s.getFullYear()}`, start: s, end: e });
    }
  }
  return buckets;
}

export const dashboardController = {
  async getStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const [totalClients, onSale, sold, returned, deposited, pending] = await Promise.all([
        Client.countDocuments({}),
        Article.countDocuments({ status: ArticleStatus.ON_SALE }),
        Article.countDocuments({ status: ArticleStatus.SOLD }),
        Article.countDocuments({ status: ArticleStatus.RETURNED }),
        Article.countDocuments({ status: ArticleStatus.DEPOSITED }),
        Article.aggregate([
          { $match: { status: ArticleStatus.SOLD, retrocessionPaid: false } },
          {
            $group: {
              _id: null,
              amount: { $sum: { $ifNull: ['$finalClientAmount', '$clientPrice'] } },
              count: { $sum: 1 },
            },
          },
        ]),
      ]);

      const total = onSale + sold + returned + deposited;
      const sellRate = total > 0 ? Math.round((sold / total) * 1000) / 10 : 0;

      res.json({
        totalClients,
        articles: { onSale, sold, returned, deposited, total },
        sellRate,
        pendingRetroAmount: pending[0]?.amount ?? 0,
        pendingRetroCount: pending[0]?.count ?? 0,
      });
    } catch (error) {
      next(error);
    }
  },

  async getCA(req: Request, res: Response, next: NextFunction) {
    try {
      const raw = String(req.query.period ?? 'month');
      const period: Period = (['week', 'month', 'quarter', 'year'].includes(raw) ? raw : 'month') as Period;

      const buckets = buildBuckets(period);
      const rangeStart = buckets[0].start;

      const sold = await Article.find({
        status: ArticleStatus.SOLD,
        updatedAt: { $gte: rangeStart },
      });

      const series = buckets.map((b) => ({ label: b.label, ca: 0, retro: 0, gains: 0 }));
      let totalCA = 0;
      let totalRetro = 0;
      let totalPaid = 0;

      for (const a of sold) {
        const sale = a.finalSalePrice ?? a.publicPrice;
        const clientAmount = a.finalClientAmount ?? a.clientPrice;
        const idx = buckets.findIndex((b) => a.updatedAt >= b.start && a.updatedAt < b.end);
        if (idx >= 0) {
          series[idx].ca += sale;
          series[idx].retro += clientAmount;
        }
        totalCA += sale;
        totalRetro += clientAmount;
        if (a.retrocessionPaid) totalPaid += clientAmount;
      }
      series.forEach((s) => (s.gains = s.ca - s.retro));

      res.json({
        period,
        series,
        totals: {
          totalCA,
          totalRetrocessions: totalRetro,
          totalPaid,
          totalRemaining: Math.max(0, totalRetro - totalPaid),
          storeEarnings: totalCA - totalRetro,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
