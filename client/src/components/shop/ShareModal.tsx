import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Facebook, 
  Twitter, 
  Linkedin, 
  Mail, 
  Copy, 
  Check,
  MessageCircle,
  Instagram,
  Share2,
  Download,
  QrCode,
  Heart
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useSocialTracking } from '@/lib/socialTracking';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  productUrl: string;
  productImage?: string;
  productPrice?: number;
  productDescription?: string;
  productId?: number;
}

const ShareModal: React.FC<ShareModalProps> = ({ 
  isOpen, 
  onClose, 
  productName, 
  productUrl,
  productImage,
  productPrice,
  productDescription
}) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [shareCount, setShareCount] = useState(0);
  const [showQRCode, setShowQRCode] = useState(false);

  const shareText = customMessage || `Check out ${productName} on Blinkeach! ${productPrice ? `Only ₹${(productPrice / 100).toLocaleString('en-IN')}` : ''}`;
  const encodedShareText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(productUrl);

  // Generate QR code URL using a free service
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedUrl}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      setShareCount(prev => prev + 1);
      toast({
        title: "Link copied!",
        description: "Product link has been copied to clipboard",
        duration: 3000
      });
      
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy link. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleShare = (platform: string, url: string) => {
    setShareCount(prev => prev + 1);
    window.open(url, '_blank', 'width=600,height=400');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: productName,
          text: shareText,
          url: productUrl,
        });
        setShareCount(prev => prev + 1);
      } catch (error) {
        // User cancelled or error occurred
      }
    }
  };

  const shareLinks = [
    {
      name: 'Facebook',
      icon: <Facebook className="h-5 w-5" />,
      color: 'bg-blue-600 hover:bg-blue-700',
      textColor: 'text-white',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedShareText}`,
      description: 'Share on Facebook'
    },
    {
      name: 'Twitter',
      icon: <Twitter className="h-5 w-5" />,
      color: 'bg-black hover:bg-gray-800',
      textColor: 'text-white',
      url: `https://twitter.com/intent/tweet?text=${encodedShareText}&url=${encodedUrl}`,
      description: 'Share on Twitter'
    },
    {
      name: 'LinkedIn',
      icon: <Linkedin className="h-5 w-5" />,
      color: 'bg-blue-700 hover:bg-blue-800',
      textColor: 'text-white',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      description: 'Share on LinkedIn'
    },
    {
      name: 'WhatsApp',
      icon: <MessageCircle className="h-5 w-5" />,
      color: 'bg-green-600 hover:bg-green-700',
      textColor: 'text-white',
      url: `https://wa.me/?text=${encodedShareText}%20${encodedUrl}`,
      description: 'Share on WhatsApp'
    },
    {
      name: 'Email',
      icon: <Mail className="h-5 w-5" />,
      color: 'bg-gray-600 hover:bg-gray-700',
      textColor: 'text-white',
      url: `mailto:?subject=${encodeURIComponent(productName)}&body=${encodedShareText}%20${encodedUrl}`,
      description: 'Share via Email'
    }
  ];

  const downloadImage = async () => {
    if (!productImage) return;
    
    try {
      const response = await fetch(productImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${productName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Image downloaded",
        description: "Product image has been saved to your device",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Unable to download image. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Product
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Product Preview */}
          {productImage && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <img 
                src={productImage} 
                alt={productName}
                className="w-12 h-12 object-cover rounded"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{productName}</p>
                {productPrice && (
                  <p className="text-sm text-gray-600">₹{(productPrice / 100).toLocaleString('en-IN')}</p>
                )}
              </div>
              {shareCount > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  {shareCount}
                </Badge>
              )}
            </div>
          )}

          {/* Custom Message */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Custom message (optional)</label>
            <Textarea
              placeholder="Add your personal message..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>

          {/* Social Media Buttons */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Share on social media</h4>
            <div className="grid grid-cols-2 gap-2">
              {shareLinks.map((link) => (
                <Button
                  key={link.name}
                  variant="outline"
                  className={`${link.color} ${link.textColor} border-0 justify-start gap-3`}
                  onClick={() => handleShare(link.name, link.url)}
                >
                  {link.icon}
                  {link.name}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Quick Actions */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Quick actions</h4>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleCopyLink}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setShowQRCode(!showQRCode)}
              >
                <QrCode className="h-4 w-4" />
              </Button>
              
              {productImage && (
                <Button
                  variant="outline"
                  onClick={downloadImage}
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
              
              {typeof navigator !== 'undefined' && navigator.share && (
                <Button
                  variant="outline"
                  onClick={handleNativeShare}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* QR Code */}
          {showQRCode && (
            <div className="text-center space-y-2">
              <img 
                src={qrCodeUrl} 
                alt="QR Code" 
                className="mx-auto border rounded"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              <p className="text-xs text-gray-500">Scan to view product</p>
            </div>
          )}

          {/* Link Preview */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Product link</label>
            <div className="flex gap-2">
              <Input
                value={productUrl}
                readOnly
                className="flex-1 text-sm"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;