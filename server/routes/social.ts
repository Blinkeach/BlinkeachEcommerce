import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { socialShares, socialEngagements, socialAnalytics } from '../../shared/social-schema';
import { eq, and, gte, desc, sql } from 'drizzle-orm';

const router = Router();

// Track a social share
router.post('/share', async (req, res) => {
  try {
    const shareData = z.object({
      productId: z.number(),
      platform: z.string(),
      sharedBy: z.string().optional(),
      shareUrl: z.string(),
      metadata: z.any().optional(),
    }).parse(req.body);

    const [share] = await db
      .insert(socialShares)
      .values(shareData)
      .returning();

    res.json(share);
  } catch (error) {
    console.error('Error tracking social share:', error);
    res.status(400).json({ error: 'Invalid share data' });
  }
});

// Track an engagement (click, view, purchase)
router.post('/engage', async (req, res) => {
  try {
    const engagementData = z.object({
      shareId: z.number(),
      engagementType: z.string(),
      userAgent: z.string().optional(),
      referrer: z.string().optional(),
      ipAddress: z.string().optional(),
      sessionId: z.string().optional(),
      userId: z.number().optional(),
      metadata: z.any().optional(),
    }).parse(req.body);

    const [engagement] = await db
      .insert(socialEngagements)
      .values(engagementData)
      .returning();

    // Update click count on the share record
    if (engagementData.engagementType === 'click') {
      await db
        .update(socialShares)
        .set({ 
          clickCount: sql`${socialShares.clickCount} + 1`,
          updatedAt: new Date()
        })
        .where(eq(socialShares.id, engagementData.shareId));
    }

    // Update conversion count on purchase
    if (engagementData.engagementType === 'purchase') {
      await db
        .update(socialShares)
        .set({ 
          conversionCount: sql`${socialShares.conversionCount} + 1`,
          updatedAt: new Date()
        })
        .where(eq(socialShares.id, engagementData.shareId));
    }

    res.json(engagement);
  } catch (error) {
    console.error('Error tracking engagement:', error);
    res.status(400).json({ error: 'Invalid engagement data' });
  }
});

// Get social analytics for a product
router.get('/analytics/:productId', async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);
    const period = req.query.period as string || 'monthly';
    const startDate = new Date();
    
    // Calculate date range based on period
    if (period === 'daily') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (period === 'weekly') {
      startDate.setDate(startDate.getDate() - 90);
    } else {
      startDate.setMonth(startDate.getMonth() - 12);
    }

    const analytics = await db
      .select()
      .from(socialAnalytics)
      .where(
        and(
          eq(socialAnalytics.productId, productId),
          eq(socialAnalytics.period, period),
          gte(socialAnalytics.periodDate, startDate)
        )
      )
      .orderBy(desc(socialAnalytics.periodDate));

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching social analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get overall social metrics
router.get('/metrics', async (req, res) => {
  try {
    const period = req.query.period as string || '30';
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Get total shares
    const sharesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(socialShares)
      .where(gte(socialShares.createdAt, startDate));

    // Get total engagements
    const engagementsResult = await db
      .select({ 
        views: sql<number>`count(*) filter (where engagement_type = 'view')`,
        clicks: sql<number>`count(*) filter (where engagement_type = 'click')`,
        purchases: sql<number>`count(*) filter (where engagement_type = 'purchase')`
      })
      .from(socialEngagements)
      .where(gte(socialEngagements.createdAt, startDate));

    // Get platform breakdown
    const platformResult = await db
      .select({
        platform: socialShares.platform,
        shares: sql<number>`count(*)`
      })
      .from(socialShares)
      .where(gte(socialShares.createdAt, startDate))
      .groupBy(socialShares.platform)
      .orderBy(desc(sql`count(*)`));

    const totalShares = sharesResult[0]?.count || 0;
    const totalViews = engagementsResult[0]?.views || 0;
    const totalClicks = engagementsResult[0]?.clicks || 0;
    const totalPurchases = engagementsResult[0]?.purchases || 0;

    const conversionRate = totalClicks > 0 ? (totalPurchases / totalClicks) * 100 : 0;
    const engagementRate = totalShares > 0 ? (totalClicks / totalShares) * 100 : 0;

    res.json({
      totalShares,
      totalViews,
      totalClicks,
      totalPurchases,
      conversionRate,
      engagementRate,
      topPlatform: platformResult[0]?.platform || 'None',
      platformBreakdown: platformResult
    });
  } catch (error) {
    console.error('Error fetching social metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// Get share performance for a specific share ID
router.get('/share/:shareId/performance', async (req, res) => {
  try {
    const shareId = parseInt(req.params.shareId);

    const share = await db
      .select()
      .from(socialShares)
      .where(eq(socialShares.id, shareId))
      .limit(1);

    if (!share.length) {
      return res.status(404).json({ error: 'Share not found' });
    }

    const engagements = await db
      .select({
        type: socialEngagements.engagementType,
        count: sql<number>`count(*)`
      })
      .from(socialEngagements)
      .where(eq(socialEngagements.shareId, shareId))
      .groupBy(socialEngagements.engagementType);

    res.json({
      share: share[0],
      engagements
    });
  } catch (error) {
    console.error('Error fetching share performance:', error);
    res.status(500).json({ error: 'Failed to fetch share performance' });
  }
});

export default router;