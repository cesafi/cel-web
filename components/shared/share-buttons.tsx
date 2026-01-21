'use client';

import { useState } from 'react';
import { Share2, Twitter, Facebook, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { moderniz } from '@/lib/fonts';
import { toast } from 'sonner';
import { isValidShareUrl } from '@/lib/utils/site-url';

interface ShareButtonsProps {
  title: string;
  url?: string;
  variant?: 'default' | 'compact' | 'expanded' | 'full';
  disabled?: boolean;
}

export default function ShareButtons({
  title,
  url,
  variant = 'default',
  disabled = false
}: ShareButtonsProps) {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async (platform?: string) => {
    if (disabled) return;

    setIsSharing(true);
    const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

    // Validate URL to prevent malicious URLs
    if (!shareUrl || !isValidShareUrl(shareUrl)) {
      toast.error('Invalid URL for sharing');
      setIsSharing(false);
      return;
    }

    try {
      if (platform === 'twitter') {
        // Limit title length for Twitter (280 char limit)
        const truncatedTitle = title.length > 200 ? title.substring(0, 200) + '...' : title;
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(truncatedTitle)}&url=${encodeURIComponent(shareUrl)}`;

        // Open with security attributes
        const popup = window.open(twitterUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
        if (!popup) {
          toast.error('Please allow popups to share on Twitter');
        }
      } else if (platform === 'facebook') {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

        // Open with security attributes
        const popup = window.open(
          facebookUrl,
          '_blank',
          'noopener,noreferrer,width=600,height=400'
        );
        if (!popup) {
          toast.error('Please allow popups to share on Facebook');
        }
      } else {
        // Copy to clipboard with fallback
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(shareUrl);
          toast.success('Link copied to clipboard!');
        } else {
          // Fallback for older browsers or non-HTTPS
          const textArea = document.createElement('textarea');
          textArea.value = shareUrl;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          textArea.style.top = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();

          try {
            document.execCommand('copy');
            toast.success('Link copied to clipboard!');
          } catch (_) {
            toast.error('Failed to copy link. Please copy manually: ' + shareUrl);
          } finally {
            document.body.removeChild(textArea);
          }
        }
      }
    } catch (error) {
      console.error('Share error:', error);
      if (platform === 'twitter' || platform === 'facebook') {
        toast.error('Failed to open sharing window. Please check your popup blocker.');
      } else {
        toast.error('Failed to copy link to clipboard');
      }
    } finally {
      setIsSharing(false);
    }
  };

  // Compact variant - horizontal buttons without card
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShare('twitter')}
          disabled={disabled || isSharing}
        >
          <Twitter className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShare('facebook')}
          disabled={disabled || isSharing}
        >
          <Facebook className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShare()}
          disabled={disabled || isSharing}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // Expanded variant - horizontal buttons with labels
  if (variant === 'expanded') {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShare('twitter')}
          disabled={disabled || isSharing}
          className="flex items-center gap-2"
        >
          <Twitter className="h-4 w-4" />
          Twitter
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShare('facebook')}
          disabled={disabled || isSharing}
          className="flex items-center gap-2"
        >
          <Facebook className="h-4 w-4" />
          Facebook
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShare()}
          disabled={disabled || isSharing}
          className="flex items-center gap-2"
        >
          <LinkIcon className="h-4 w-4" />
          Copy Link
        </Button>
      </div>
    );
  }

  // Full variant - horizontal buttons with labels (same as expanded but different name for clarity)
  if (variant === 'full') {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShare('twitter')}
          disabled={disabled || isSharing}
          className="flex items-center gap-2"
        >
          <Twitter className="h-4 w-4" />
          Twitter
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShare('facebook')}
          disabled={disabled || isSharing}
          className="flex items-center gap-2"
        >
          <Facebook className="h-4 w-4" />
          Facebook
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShare()}
          disabled={disabled || isSharing}
          className="flex items-center gap-2"
        >
          <LinkIcon className="h-4 w-4" />
          Copy Link
        </Button>
      </div>
    );
  }

  // Default variant - card with vertical buttons
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className={`${moderniz.className} flex items-center gap-2 text-lg`}>
          <Share2 className="h-5 w-5" />
          Share Article
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={() => handleShare('twitter')}
          disabled={disabled || isSharing}
        >
          <Twitter className="mr-2 h-4 w-4" />
          Twitter
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={() => handleShare('facebook')}
          disabled={disabled || isSharing}
        >
          <Facebook className="mr-2 h-4 w-4" />
          Facebook
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={() => handleShare()}
          disabled={disabled || isSharing}
        >
          <LinkIcon className="mr-2 h-4 w-4" />
          Copy Link
        </Button>
      </CardContent>
    </Card>
  );
}
