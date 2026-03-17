"use client";

import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { getBrandIconUrl } from '@shimokitan/utils';
import { cn } from '@shimokitan/ui';

interface BrandIconProps {
  platform: string;
  className?: string;
  width?: number;
  height?: number;
  fallbackIcon?: string;
}

/**
 * Renders a brand icon from the Shimokitan CDN.
 * Falls back to Iconify (Simple Icons) if the brand is not on the CDN or fails to load.
 */
export function BrandIcon({ 
  platform, 
  className, 
  width, 
  height, 
  fallbackIcon 
}: BrandIconProps) {
  const [error, setError] = useState(false);
  const cdnUrl = getBrandIconUrl(platform);

  if (cdnUrl && !error) {
    return (
      <img 
        src={cdnUrl} 
        alt={platform} 
        className={cn("object-contain transition-all", className)}
        style={{ width, height }}
        loading="lazy"
        onError={() => setError(true)}
      />
    );
  }

  // Fallback to Iconify
  let iconName = fallbackIcon;
  if (!iconName) {
    if (platform === 'official_website') {
      iconName = 'lucide:globe';
    } else {
      // Normalize for simple-icons (e.g. 'youtube_music' -> 'youtubemusic' or 'youtube-music')
      // Simple Icons usually uses hyphens
      iconName = `simple-icons:${platform.toLowerCase().replace(/_/g, '-')}`;
    }
  }
  
  return (
    <Icon 
      icon={iconName} 
      width={width} 
      height={height}
      className={cn("transition-all", className)}
    />
  );
}
