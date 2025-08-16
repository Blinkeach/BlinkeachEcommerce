import { apiRequest } from './queryClient';

export interface ShareData {
  productId: number;
  platform: string;
  shareUrl: string;
  sharedBy?: string;
  metadata?: any;
}

export interface EngagementData {
  shareId: number;
  engagementType: 'click' | 'view' | 'purchase' | 'add_to_cart';
  userAgent?: string;
  referrer?: string;
  sessionId?: string;
  userId?: number;
  metadata?: any;
}

class SocialTracker {
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  async trackShare(shareData: ShareData): Promise<any> {
    try {
      const response = await apiRequest('POST', '/api/social/share', {
        ...shareData,
        metadata: {
          ...shareData.metadata,
          sessionId: this.sessionId,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          referrer: document.referrer
        }
      });

      return await response.json();
    } catch (error) {
      console.error('Failed to track social share:', error);
      return null;
    }
  }

  async trackEngagement(engagementData: EngagementData): Promise<any> {
    try {
      const response = await apiRequest('POST', '/api/social/engage', {
        ...engagementData,
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        sessionId: this.sessionId,
        metadata: {
          ...engagementData.metadata,
          timestamp: new Date().toISOString(),
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          }
        }
      });

      return await response.json();
    } catch (error) {
      console.error('Failed to track engagement:', error);
      return null;
    }
  }

  async getSocialMetrics(period: string = '30'): Promise<any> {
    try {
      const response = await apiRequest('GET', `/api/social/metrics?period=${period}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch social metrics:', error);
      return null;
    }
  }

  async getProductAnalytics(productId: number, period: string = 'monthly'): Promise<any> {
    try {
      const response = await apiRequest('GET', `/api/social/analytics/${productId}?period=${period}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch product analytics:', error);
      return null;
    }
  }

  // Utility methods for generating share URLs
  generateShareUrl(platform: string, productUrl: string, productName: string, productImage?: string): string {
    const encodedUrl = encodeURIComponent(productUrl);
    const encodedTitle = encodeURIComponent(`Check out this amazing product: ${productName}`);
    const encodedImage = productImage ? encodeURIComponent(productImage) : '';

    switch (platform) {
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&title=${encodedTitle}`;
      
      case 'twitter':
        const twitterText = encodeURIComponent(`${productName} - Check this out!`);
        return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${twitterText}`;
      
      case 'whatsapp':
        const whatsappText = encodeURIComponent(`${productName} - ${productUrl}`);
        return `https://wa.me/?text=${whatsappText}`;
      
      case 'linkedin':
        return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
      
      case 'telegram':
        const telegramText = encodeURIComponent(`${productName} - ${productUrl}`);
        return `https://t.me/share/url?url=${encodedUrl}&text=${telegramText}`;
      
      case 'instagram':
        // Instagram doesn't support direct sharing via URL, return the product URL
        return productUrl;
      
      case 'email':
        const subject = encodeURIComponent(`Check out: ${productName}`);
        const body = encodeURIComponent(`I thought you might be interested in this product:\n\n${productName}\n${productUrl}`);
        return `mailto:?subject=${subject}&body=${body}`;
      
      default:
        return productUrl;
    }
  }

  // Track click-through from social media
  trackSocialClick(shareId: number, userId?: number): void {
    this.trackEngagement({
      shareId,
      engagementType: 'click',
      userId,
      metadata: {
        source: 'social_media',
        clickTime: new Date().toISOString()
      }
    });
  }

  // Track product view from social share
  trackSocialView(shareId: number, userId?: number): void {
    this.trackEngagement({
      shareId,
      engagementType: 'view',
      userId,
      metadata: {
        source: 'social_media',
        viewTime: new Date().toISOString()
      }
    });
  }

  // Track purchase from social share
  trackSocialPurchase(shareId: number, userId?: number, orderValue?: number): void {
    this.trackEngagement({
      shareId,
      engagementType: 'purchase',
      userId,
      metadata: {
        source: 'social_media',
        purchaseTime: new Date().toISOString(),
        orderValue
      }
    });
  }

  // Track add to cart from social share
  trackSocialAddToCart(shareId: number, userId?: number): void {
    this.trackEngagement({
      shareId,
      engagementType: 'add_to_cart',
      userId,
      metadata: {
        source: 'social_media',
        addToCartTime: new Date().toISOString()
      }
    });
  }
}

// Export singleton instance
export const socialTracker = new SocialTracker();

// Helper hook for React components
export const useSocialTracking = () => {
  return {
    trackShare: socialTracker.trackShare.bind(socialTracker),
    trackEngagement: socialTracker.trackEngagement.bind(socialTracker),
    getSocialMetrics: socialTracker.getSocialMetrics.bind(socialTracker),
    getProductAnalytics: socialTracker.getProductAnalytics.bind(socialTracker),
    generateShareUrl: socialTracker.generateShareUrl.bind(socialTracker),
    trackSocialClick: socialTracker.trackSocialClick.bind(socialTracker),
    trackSocialView: socialTracker.trackSocialView.bind(socialTracker),
    trackSocialPurchase: socialTracker.trackSocialPurchase.bind(socialTracker),
    trackSocialAddToCart: socialTracker.trackSocialAddToCart.bind(socialTracker)
  };
};