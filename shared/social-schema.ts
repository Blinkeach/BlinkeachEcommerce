import { pgTable, serial, text, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Social Shares tracking table
export const socialShares = pgTable('social_shares', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').notNull(),
  platform: text('platform').notNull(), // 'facebook', 'twitter', 'whatsapp', 'instagram', 'linkedin', 'telegram', 'email'
  sharedBy: text('shared_by'), // user identifier or 'anonymous'
  shareUrl: text('share_url').notNull(),
  clickCount: integer('click_count').default(0),
  conversionCount: integer('conversion_count').default(0),
  metadata: jsonb('metadata'), // Additional platform-specific data
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Social Engagement tracking table
export const socialEngagements = pgTable('social_engagements', {
  id: serial('id').primaryKey(),
  shareId: integer('share_id').notNull(),
  engagementType: text('engagement_type').notNull(), // 'click', 'view', 'purchase', 'add_to_cart'
  userAgent: text('user_agent'),
  referrer: text('referrer'),
  ipAddress: text('ip_address'),
  sessionId: text('session_id'),
  userId: integer('user_id'), // if user is logged in
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Social Analytics aggregates table
export const socialAnalytics = pgTable('social_analytics', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').notNull(),
  platform: text('platform').notNull(),
  period: text('period').notNull(), // 'daily', 'weekly', 'monthly'
  periodDate: timestamp('period_date').notNull(),
  totalShares: integer('total_shares').default(0),
  totalClicks: integer('total_clicks').default(0),
  totalViews: integer('total_views').default(0),
  totalPurchases: integer('total_purchases').default(0),
  revenue: integer('revenue').default(0), // in paise/cents
  conversionRate: integer('conversion_rate').default(0), // percentage * 100
  engagementRate: integer('engagement_rate').default(0), // percentage * 100
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Insert schemas
export const insertSocialShareSchema = createInsertSchema(socialShares).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSocialEngagementSchema = createInsertSchema(socialEngagements).omit({
  id: true,
  createdAt: true,
});

export const insertSocialAnalyticsSchema = createInsertSchema(socialAnalytics).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type SocialShare = typeof socialShares.$inferSelect;
export type InsertSocialShare = z.infer<typeof insertSocialShareSchema>;
export type SocialEngagement = typeof socialEngagements.$inferSelect;
export type InsertSocialEngagement = z.infer<typeof insertSocialEngagementSchema>;
export type SocialAnalyticsData = typeof socialAnalytics.$inferSelect;
export type InsertSocialAnalytics = z.infer<typeof insertSocialAnalyticsSchema>;