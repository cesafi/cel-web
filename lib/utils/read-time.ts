/**
 * Calculate estimated reading time for article content
 * Based on average reading speed and content analysis
 */

import { extractPlainText } from './content-renderer';

// Reading speed constants (words per minute)
const AVERAGE_WPM = 200; // Average adult reading speed
const SLOW_WPM = 150;    // Conservative estimate
const FAST_WPM = 250;    // Fast readers

// Content type multipliers
const CONTENT_MULTIPLIERS = {
  // Technical content takes longer to read
  technical: 0.8,
  // Sports content is generally easier
  sports: 1.1,
  // News content is standard
  news: 1.0,
  // General content
  general: 1.0
};

// Additional time for media content (in minutes)
const MEDIA_TIME = {
  image: 0.2,      // 12 seconds per image
  video: 1.0,      // 1 minute per video
  table: 0.5,      // 30 seconds per table
  list: 0.1,       // 6 seconds per list
  blockquote: 0.2, // 12 seconds per quote
  codeblock: 0.5   // 30 seconds per code block
};

interface ReadTimeOptions {
  wpm?: number;
  contentType?: keyof typeof CONTENT_MULTIPLIERS;
  includeMedia?: boolean;
}

interface ReadTimeResult {
  minutes: number;
  words: number;
  formattedTime: string;
  readingSpeed: 'fast' | 'average' | 'slow';
}

/**
 * Count words in text content
 */
function countWords(text: string): number {
  // Remove extra whitespace and split by word boundaries
  const words = text
    .trim()
    .replace(/\s+/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 0);
  
  return words.length;
}

/**
 * Analyze content for media elements that affect reading time
 */
function analyzeMediaContent(htmlContent: string): number {
  let additionalTime = 0;
  
  // Count images
  const imageMatches = htmlContent.match(/<img[^>]*>/gi) || [];
  additionalTime += imageMatches.length * MEDIA_TIME.image;
  
  // Count videos (if any video tags or embeds)
  const videoMatches = htmlContent.match(/<video[^>]*>|<iframe[^>]*youtube|<iframe[^>]*vimeo/gi) || [];
  additionalTime += videoMatches.length * MEDIA_TIME.video;
  
  // Count tables
  const tableMatches = htmlContent.match(/<table[^>]*>/gi) || [];
  additionalTime += tableMatches.length * MEDIA_TIME.table;
  
  // Count lists (ul, ol)
  const listMatches = htmlContent.match(/<[uo]l[^>]*>/gi) || [];
  additionalTime += listMatches.length * MEDIA_TIME.list;
  
  // Count blockquotes
  const quoteMatches = htmlContent.match(/<blockquote[^>]*>/gi) || [];
  additionalTime += quoteMatches.length * MEDIA_TIME.blockquote;
  
  // Count code blocks
  const codeMatches = htmlContent.match(/<pre[^>]*>|<code[^>]*>/gi) || [];
  additionalTime += codeMatches.length * MEDIA_TIME.codeblock;
  
  return additionalTime;
}

/**
 * Determine reading speed category based on calculated time
 */
function getReadingSpeedCategory(words: number, minutes: number): ReadTimeResult['readingSpeed'] {
  const actualWPM = words / minutes;
  
  if (actualWPM >= FAST_WPM) return 'fast';
  if (actualWPM <= SLOW_WPM) return 'slow';
  return 'average';
}

/**
 * Format reading time into human-readable string
 */
function formatReadTime(minutes: number): string {
  if (minutes < 1) {
    return 'Less than 1 min read';
  }
  
  const roundedMinutes = Math.ceil(minutes);
  
  if (roundedMinutes === 1) {
    return '1 min read';
  }
  
  return `${roundedMinutes} min read`;
}

/**
 * Calculate reading time from article content
 */
export function calculateReadTime(
  content: unknown,
  options: ReadTimeOptions = {}
): ReadTimeResult {
  const {
    wpm = AVERAGE_WPM,
    contentType = 'general',
    includeMedia = true
  } = options;
  
  // Extract plain text from content
  const plainText = extractPlainText(content, Infinity);
  
  // Count words
  const wordCount = countWords(plainText);
  
  // Calculate base reading time
  let baseMinutes = wordCount / wpm;
  
  // Apply content type multiplier
  const multiplier = CONTENT_MULTIPLIERS[contentType] || 1.0;
  baseMinutes *= multiplier;
  
  // Add time for media content if enabled
  let totalMinutes = baseMinutes;
  if (includeMedia && typeof content === 'object' && content !== null) {
    // Try to get HTML content for media analysis
    const htmlContent = typeof content === 'string' ? content : JSON.stringify(content);
    const mediaTime = analyzeMediaContent(htmlContent);
    totalMinutes += mediaTime;
  }
  
  // Ensure minimum reading time
  totalMinutes = Math.max(totalMinutes, 0.5);
  
  return {
    minutes: totalMinutes,
    words: wordCount,
    formattedTime: formatReadTime(totalMinutes),
    readingSpeed: getReadingSpeedCategory(wordCount, totalMinutes)
  };
}

/**
 * Calculate reading time specifically for sports articles
 */
export function calculateSportsReadTime(content: unknown): ReadTimeResult {
  return calculateReadTime(content, {
    contentType: 'sports',
    includeMedia: true
  });
}

/**
 * Calculate reading time for news articles
 */
export function calculateNewsReadTime(content: unknown): ReadTimeResult {
  return calculateReadTime(content, {
    contentType: 'news',
    includeMedia: true
  });
}

/**
 * Get a simple formatted read time string (backward compatibility)
 */
export function getReadTimeString(content: unknown): string {
  const result = calculateReadTime(content);
  return result.formattedTime;
}

/**
 * Calculate reading time with different speeds for comparison
 */
export function calculateReadTimeRange(content: unknown): {
  fast: string;
  average: string;
  slow: string;
} {
  const fastResult = calculateReadTime(content, { wpm: FAST_WPM });
  const averageResult = calculateReadTime(content, { wpm: AVERAGE_WPM });
  const slowResult = calculateReadTime(content, { wpm: SLOW_WPM });
  
  return {
    fast: fastResult.formattedTime,
    average: averageResult.formattedTime,
    slow: slowResult.formattedTime
  };
}