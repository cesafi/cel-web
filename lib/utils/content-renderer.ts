// Lexical node types
interface LexicalTextNode {
  type: 'text';
  text: string;
  format?: number;
  style?: string;
  mode?: string;
  detail?: number;
  version?: number;
}

interface LexicalParagraphNode {
  type: 'paragraph';
  children: LexicalNode[];
  format?: string; // 'left', 'center', 'right', 'justify'
  indent?: number;
  version?: number;
  direction?: string | null;
  textStyle?: string;
  textFormat?: number;
}

interface LexicalHeadingNode {
  type: 'heading';
  tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  children: LexicalNode[];
  format?: string;
  indent?: number;
  version?: number;
  direction?: string | null;
}

interface LexicalHorizontalRuleNode {
  type: 'horizontalrule';
}

interface LexicalListNode {
  type: 'list';
  listType: 'bullet' | 'number';
  start?: number;
  children: LexicalNode[];
}

interface LexicalListItemNode {
  type: 'listitem';
  value?: number;
  children: LexicalNode[];
}

interface LexicalQuoteNode {
  type: 'quote';
  children: LexicalNode[];
  format?: string;
  indent?: number;
  version?: number;
  direction?: string | null;
}

interface LexicalLinkNode {
  type: 'link';
  url: string;
  children: LexicalNode[];
}

interface LexicalLineBreakNode {
  type: 'linebreak';
}

interface LexicalImageNode {
  type: 'image';
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  version?: number;
}

interface LexicalCodeNode {
  type: 'code';
  language?: string;
  children: LexicalNode[];
}

interface LexicalTableNode {
  type: 'table';
  children: LexicalTableRowNode[];
}

interface LexicalTableRowNode {
  type: 'tablerow';
  children: LexicalTableCellNode[];
}

interface LexicalTableCellNode {
  type: 'tablecell';
  headerState?: number; // 0 = no header, 1 = row header, 2 = column header, 3 = both
  children: LexicalNode[];
}

interface LexicalVideoNode {
  type: 'video';
  src: string;
  width?: number;
  height?: number;
  controls?: boolean;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
}

interface LexicalEmbedNode {
  type: 'embed';
  url: string;
  width?: number;
  height?: number;
  title?: string;
}

interface LexicalYouTubeNode {
  type: 'youtube';
  videoId: string;
  width?: number;
  height?: number;
  title?: string;
}

interface LexicalTwitterNode {
  type: 'twitter';
  tweetId: string;
  username?: string;
}

interface LexicalCalloutNode {
  type: 'callout';
  variant: 'info' | 'warning' | 'error' | 'success';
  children: LexicalNode[];
}

interface LexicalSpoilerNode {
  type: 'spoiler';
  title?: string;
  children: LexicalNode[];
}

interface LexicalMentionNode {
  type: 'mention';
  mentionName: string;
  userId?: string;
}

type LexicalNode =
  | LexicalTextNode
  | LexicalParagraphNode
  | LexicalHeadingNode
  | LexicalHorizontalRuleNode
  | LexicalListNode
  | LexicalListItemNode
  | LexicalQuoteNode
  | LexicalLinkNode
  | LexicalLineBreakNode
  | LexicalImageNode
  | LexicalCodeNode
  | LexicalTableNode
  | LexicalTableRowNode
  | LexicalTableCellNode
  | LexicalVideoNode
  | LexicalEmbedNode
  | LexicalYouTubeNode
  | LexicalTwitterNode
  | LexicalCalloutNode
  | LexicalSpoilerNode
  | LexicalMentionNode;

interface LexicalRoot {
  type: 'root';
  children: LexicalNode[];
}

interface LexicalState {
  root: LexicalRoot;
}

/**
 * Convert Lexical editor state (JSON) to HTML string using manual parsing
 */
export function lexicalToHtml(lexicalState: unknown): string {
  try {
    // Validate that lexicalState is a valid object
    if (!lexicalState || typeof lexicalState !== 'object') {
      return '';
    }

    const state = lexicalState as LexicalState;

    if (!state.root || !state.root.children) {
      return '';
    }

    return convertNodesToHtml(state.root.children);
  } catch (error) {
    console.error('Error converting Lexical to HTML:', error);
    return '';
  }
}

/**
 * Convert Lexical nodes to HTML
 */
function convertNodesToHtml(nodes: LexicalNode[]): string {
  return nodes.map(node => convertNodeToHtml(node)).join('');
}

/**
 * Convert a single Lexical node to HTML
 */
function convertNodeToHtml(node: LexicalNode): string {
  switch (node.type) {
    case 'paragraph':
      const paragraphContent = convertNodesToHtml(node.children);
      // Skip empty paragraphs
      if (!paragraphContent.trim()) {
        return '<p>&nbsp;</p>'; // Keep empty paragraphs for spacing
      }

      // Handle text alignment - use inline styles to match Lexical editor output
      let alignmentStyle = '';
      if (node.format) {
        switch (node.format) {
          case 'center':
            alignmentStyle = ' style="text-align: center;"';
            break;
          case 'right':
            alignmentStyle = ' style="text-align: right;"';
            break;
          case 'justify':
            alignmentStyle = ' style="text-align: justify;"';
            break;
          case 'left':
          default:
            alignmentStyle = ' style="text-align: left;"';
            break;
        }
      }

      return `<p${alignmentStyle}>${paragraphContent}</p>`;

    case 'heading':
      const headingContent = convertNodesToHtml(node.children);
      return `<${node.tag}>${headingContent}</${node.tag}>`;

    case 'text':
      let text = escapeHtml(node.text);

      // Apply text formatting based on format flags
      if (node.format) {
        // Bold (format & 1)
        if (node.format & 1) {
          text = `<strong>${text}</strong>`;
        }
        // Italic (format & 2)
        if (node.format & 2) {
          text = `<em>${text}</em>`;
        }
        // Strikethrough (format & 4)
        if (node.format & 4) {
          text = `<s>${text}</s>`;
        }
        // Underline (format & 8)
        if (node.format & 8) {
          text = `<u>${text}</u>`;
        }
        // Code (format & 16)
        if (node.format & 16) {
          text = `<code>${text}</code>`;
        }
        // Superscript (format & 64)
        if (node.format & 64) {
          text = `<sup>${text}</sup>`;
        }
        // Subscript (format & 128)
        if (node.format & 128) {
          text = `<sub>${text}</sub>`;
        }
      }

      return text;

    case 'linebreak':
      return '<br>';

    case 'horizontalrule':
      return '<hr>';

    case 'list':
      const listContent = convertNodesToHtml(node.children);
      if (node.listType === 'number') {
        const startAttr = node.start && node.start !== 1 ? ` start="${node.start}"` : '';
        return `<ol${startAttr}>${listContent}</ol>`;
      } else {
        return `<ul>${listContent}</ul>`;
      }

    case 'listitem':
      const listItemContent = convertNodesToHtml(node.children);
      return `<li>${listItemContent}</li>`;

    case 'quote':
      const quoteContent = convertNodesToHtml(node.children);
      return `<blockquote>${quoteContent}</blockquote>`;

    case 'link':
      const linkContent = convertNodesToHtml(node.children);
      const safeUrl = escapeHtml(node.url);
      return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${linkContent}</a>`;

    case 'image':
      const altText = node.alt ? escapeHtml(node.alt) : '';
      const imageSrc = escapeHtml(node.src);
      let imageAttrs = `src="${imageSrc}" alt="${altText}"`;

      if (node.width) {
        imageAttrs += ` width="${node.width}"`;
      }
      if (node.height) {
        imageAttrs += ` height="${node.height}"`;
      }

      // Wrap in div to match Lexical editor output and apply consistent styling
      return `<div class="my-4">
        <img ${imageAttrs} class="article-image rounded-lg shadow-sm" loading="lazy" style="max-width: 100%; height: auto; border-radius: 8px;">
      </div>`;

    case 'code':
      const codeContent = convertNodesToHtml(node.children);
      const language = node.language ? ` class="language-${escapeHtml(node.language)}"` : '';
      return `<pre><code${language}>${codeContent}</code></pre>`;

    case 'table':
      const tableContent = convertNodesToHtml(node.children);
      return `<table class="article-table">${tableContent}</table>`;

    case 'tablerow':
      const rowContent = convertNodesToHtml(node.children);
      return `<tr>${rowContent}</tr>`;

    case 'tablecell':
      const cellContent = convertNodesToHtml(node.children);
      const isHeader = node.headerState && node.headerState > 0;
      const tag = isHeader ? 'th' : 'td';
      return `<${tag}>${cellContent}</${tag}>`;

    case 'video':
      const videoSrc = escapeHtml(node.src);
      let videoAttrs = `src="${videoSrc}"`;

      if (node.width) videoAttrs += ` width="${node.width}"`;
      if (node.height) videoAttrs += ` height="${node.height}"`;
      if (node.controls !== false) videoAttrs += ' controls';
      if (node.autoplay) videoAttrs += ' autoplay';
      if (node.muted) videoAttrs += ' muted';
      if (node.loop) videoAttrs += ' loop';

      return `<video ${videoAttrs} class="article-video">Your browser does not support the video tag.</video>`;

    case 'embed':
      const embedUrl = escapeHtml(node.url);
      const embedTitle = node.title ? escapeHtml(node.title) : 'Embedded content';
      let embedAttrs = `src="${embedUrl}" title="${embedTitle}"`;

      if (node.width) embedAttrs += ` width="${node.width}"`;
      if (node.height) embedAttrs += ` height="${node.height}"`;

      return `<iframe ${embedAttrs} class="article-embed" frameborder="0" allowfullscreen></iframe>`;

    case 'youtube':
      const youtubeId = escapeHtml(node.videoId);
      const youtubeTitle = node.title ? escapeHtml(node.title) : 'YouTube video';
      const youtubeWidth = node.width || 560;
      const youtubeHeight = node.height || 315;

      return `<div class="youtube-embed">
        <iframe 
          width="${youtubeWidth}" 
          height="${youtubeHeight}" 
          src="https://www.youtube.com/embed/${youtubeId}" 
          title="${youtubeTitle}"
          frameborder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowfullscreen>
        </iframe>
      </div>`;

    case 'twitter':
      const tweetId = escapeHtml(node.tweetId);
      const username = node.username ? escapeHtml(node.username) : '';

      return `<div class="twitter-embed">
        <blockquote class="twitter-tweet">
          <a href="https://twitter.com/${username}/status/${tweetId}">View Tweet</a>
        </blockquote>
      </div>`;

    case 'callout':
      const calloutContent = convertNodesToHtml(node.children);
      const variant = node.variant || 'info';

      return `<div class="callout callout-${variant}">
        <div class="callout-content">${calloutContent}</div>
      </div>`;

    case 'spoiler':
      const spoilerContent = convertNodesToHtml(node.children);
      const spoilerTitle = node.title ? escapeHtml(node.title) : 'Spoiler';

      return `<details class="spoiler">
        <summary class="spoiler-title">${spoilerTitle}</summary>
        <div class="spoiler-content">${spoilerContent}</div>
      </details>`;

    case 'mention':
      const mentionName = escapeHtml(node.mentionName);
      const userId = node.userId ? `data-user-id="${escapeHtml(node.userId)}"` : '';

      return `<span class="mention" ${userId}>@${mentionName}</span>`;

    default:
      // For unknown node types, try to extract children if they exist
      const unknownNode = node as Record<string, unknown>;
      if (unknownNode.children && Array.isArray(unknownNode.children)) {
        return convertNodesToHtml(unknownNode.children as LexicalNode[]);
      }
      return '';
  }
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };

  return text.replace(/[&<>"']/g, (match) => htmlEscapes[match]);
}

/**
 * Comprehensive HTML entity decoder
 */
function decodeHtmlEntities(text: string): string {
  const entityMap: Record<string, string> = {
    // Common entities
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",

    // Extended entities
    '&copy;': '©',
    '&reg;': '®',
    '&trade;': '™',
    '&hellip;': '…',
    '&mdash;': '—',
    '&ndash;': '–',
    '&lsquo;': '\u2018',
    '&rsquo;': '\u2019',
    '&ldquo;': '\u201C',
    '&rdquo;': '\u201D',
    '&bull;': '•',
    '&middot;': '·',
    '&sect;': '§',
    '&para;': '¶',
    '&dagger;': '†',
    '&Dagger;': '‡',
    '&permil;': '‰',
    '&lsaquo;': '‹',
    '&rsaquo;': '›',
    '&euro;': '€',
    '&pound;': '£',
    '&yen;': '¥',
    '&cent;': '¢',

    // Math symbols
    '&times;': '×',
    '&divide;': '÷',
    '&plusmn;': '±',
    '&minus;': '−',
    '&sup1;': '¹',
    '&sup2;': '²',
    '&sup3;': '³',
    '&frac14;': '¼',
    '&frac12;': '½',
    '&frac34;': '¾',

    // Arrows
    '&larr;': '←',
    '&uarr;': '↑',
    '&rarr;': '→',
    '&darr;': '↓',
    '&harr;': '↔',

    // Greek letters (common ones)
    '&alpha;': 'α',
    '&beta;': 'β',
    '&gamma;': 'γ',
    '&delta;': 'δ',
    '&epsilon;': 'ε',
    '&pi;': 'π',
    '&sigma;': 'σ',
    '&omega;': 'ω'
  };

  // Replace named entities
  let decoded = text;
  for (const [entity, replacement] of Object.entries(entityMap)) {
    decoded = decoded.replace(new RegExp(entity, 'g'), replacement);
  }

  // Handle numeric entities (&#123; and &#x1A;)
  decoded = decoded.replace(/&#(\d+);/g, (match, num) => {
    try {
      return String.fromCharCode(parseInt(num, 10));
    } catch {
      return match; // Return original if conversion fails
    }
  });

  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
    try {
      return String.fromCharCode(parseInt(hex, 16));
    } catch {
      return match; // Return original if conversion fails
    }
  });

  return decoded;
}

/**
 * Render article content - handles both Lexical JSON and HTML string formats
 */
export function renderArticleContent(content: unknown): string {
  // If content is null or undefined, return empty string
  if (!content) {
    return '';
  }

  // If content is already a string (HTML), return it directly
  if (typeof content === 'string') {
    return content;
  }

  // If content is an object, it might be Lexical JSON format
  if (typeof content === 'object' && content !== null) {
    const contentObj = content as Record<string, unknown>;

    // Check if it has Lexical editor state structure
    if (contentObj.root && typeof contentObj.root === 'object' && contentObj.root !== null) {
      const rootObj = contentObj.root as Record<string, unknown>;
      if (rootObj.children) {
        return lexicalToHtml(content);
      }
    }

    // Check if it's a wrapper object with body property
    if (contentObj.body) {
      return renderArticleContent(contentObj.body);
    }

    // If it's an object but not Lexical format, try to stringify and return
    try {
      return JSON.stringify(content);
    } catch {
      return '[Invalid content format]';
    }
  }

  // Fallback for other types
  return String(content);
}

/**
 * Render article content with consistent styling wrapper
 * This ensures the content uses the same CSS classes as the Lexical editor
 */
export function renderArticleContentWithStyling(content: unknown): string {
  const htmlContent = renderArticleContent(content);

  // If content is empty, return empty string
  if (!htmlContent.trim()) {
    return '';
  }

  // Return the content - the article-content class should be applied by the consuming component
  return htmlContent;
}

/**
 * Get the Lexical editor theme configuration that matches the article-content CSS
 * This ensures consistency between the editor and rendered content
 */
export function getLexicalEditorTheme() {
  return {
    root: 'p-4 min-h-[400px] focus:outline-none font-roboto',
    paragraph: 'mb-2 font-roboto',
    heading: {
      h1: 'text-3xl font-bold mb-4 font-moderniz',
      h2: 'text-2xl font-bold mb-3 font-moderniz',
      h3: 'text-xl font-bold mb-2 font-moderniz',
    },
    quote: 'border-l-4 border-border pl-4 italic my-4 font-roboto',
    list: {
      nested: {
        listitem: 'list-none',
      },
      ol: 'list-decimal list-inside mb-2 font-roboto',
      ul: 'list-disc list-inside mb-2 font-roboto',
      listitem: 'mb-1 font-roboto',
    },
    link: 'text-blue-600 underline font-roboto',
    text: {
      bold: 'font-bold',
      italic: 'italic',
      underline: 'underline',
      strikethrough: 'line-through',
      code: 'bg-secondary px-1 py-0.5 rounded text-sm font-mono',
    },
  };
}

/**
 * Get the CSS classes that should be applied to rendered article content
 * This matches the Lexical editor theme and ensures consistent styling
 * Uses the article-content.css file for consistent styling with proper fonts
 */
export function getArticleContentClasses(): string {
  return 'article-content prose prose-lg prose-gray max-w-none';
}

/**
 * Extract plain text from article content for excerpts
 */
export function extractPlainText(content: unknown, maxLength: number = 200): string {
  const htmlContent = renderArticleContent(content);

  // Remove HTML tags and get plain text
  let plainText = htmlContent.replace(/<[^>]*>/g, '');

  // Decode HTML entities using comprehensive decoder
  plainText = decodeHtmlEntities(plainText);

  // Clean up whitespace and formatting
  plainText = plainText
    .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .trim();

  // Return full text if maxLength is Infinity (for read time calculation)
  if (maxLength === Infinity) {
    return plainText;
  }

  // Truncate if needed
  if (plainText.length > maxLength) {
    // Try to break at word boundary
    const truncated = plainText.substring(0, maxLength);
    const lastSpaceIndex = truncated.lastIndexOf(' ');

    if (lastSpaceIndex > maxLength * 0.8) {
      // If we can break at a word boundary without losing too much text
      return truncated.substring(0, lastSpaceIndex).trim() + '...';
    } else {
      // Otherwise just truncate at character boundary
      return truncated.trim() + '...';
    }
  }

  return plainText;
}

/**
 * Extract a clean, meaningful excerpt from Lexical content
 * Prioritizes paragraph content over headings and other elements
 */
export function extractSmartExcerpt(content: unknown, maxLength: number = 200): string {
  try {
    // If content is null or undefined, return empty string
    if (!content) {
      return '';
    }

    // If content is already a string (HTML), extract from it
    if (typeof content === 'string') {
      return extractPlainText(content, maxLength);
    }

    // If content is an object, it might be Lexical JSON format
    if (typeof content === 'object' && content !== null) {
      const contentObj = content as Record<string, unknown>;

      // Check if it has Lexical editor state structure
      if (contentObj.root && typeof contentObj.root === 'object' && contentObj.root !== null) {
        const rootObj = contentObj.root as Record<string, unknown>;
        if (rootObj.children && Array.isArray(rootObj.children)) {
          // Extract text from Lexical nodes, prioritizing paragraphs
          const excerptText = extractTextFromLexicalNodes(rootObj.children as LexicalNode[], maxLength);
          if (excerptText.trim()) {
            return excerptText;
          }
        }
      }
    }

    // Fallback to regular extraction
    return extractPlainText(content, maxLength);
  } catch (error) {
    console.error('Error extracting smart excerpt:', error);
    return extractPlainText(content, maxLength);
  }
}

/**
 * Extract text from Lexical nodes, prioritizing meaningful content
 */
function extractTextFromLexicalNodes(nodes: LexicalNode[], maxLength: number): string {
  let extractedText = '';
  let currentLength = 0;

  for (const node of nodes) {
    if (currentLength >= maxLength) break;

    // Prioritize paragraph content
    if (node.type === 'paragraph' && 'children' in node && node.children) {
      const paragraphText = extractTextFromChildren(node.children);
      if (paragraphText.trim()) {
        if (extractedText) extractedText += ' ';
        extractedText += paragraphText;
        currentLength = extractedText.length;
      }
    }
    // Include blockquotes as they often contain meaningful content
    else if (node.type === 'quote' && 'children' in node && node.children) {
      const quoteText = extractTextFromChildren(node.children);
      if (quoteText.trim()) {
        if (extractedText) extractedText += ' ';
        extractedText += quoteText;
        currentLength = extractedText.length;
      }
    }
    // Skip headings for excerpts as they're usually not descriptive
    // Skip lists as they're often not great for excerpts
  }

  // If we didn't get enough content from paragraphs, include other elements
  if (currentLength < maxLength * 0.5) {
    for (const node of nodes) {
      if (currentLength >= maxLength) break;

      if (node.type === 'heading' && 'children' in node && node.children) {
        const headingText = extractTextFromChildren(node.children);
        if (headingText.trim()) {
          if (extractedText) extractedText += ' ';
          extractedText += headingText;
          currentLength = extractedText.length;
        }
      }
    }
  }

  // Clean up and truncate
  extractedText = extractedText
    .replace(/\s+/g, ' ')
    .trim();

  if (extractedText.length > maxLength) {
    const truncated = extractedText.substring(0, maxLength);
    const lastSpaceIndex = truncated.lastIndexOf(' ');

    if (lastSpaceIndex > maxLength * 0.8) {
      return truncated.substring(0, lastSpaceIndex).trim() + '...';
    } else {
      return truncated.trim() + '...';
    }
  }

  return extractedText;
}

/**
 * Extract text from child nodes
 */
function extractTextFromChildren(children: LexicalNode[]): string {
  let text = '';

  for (const child of children) {
    if (child.type === 'text') {
      text += child.text || '';
    } else if ('children' in child && child.children) {
      text += extractTextFromChildren(child.children);
    }
  }

  return text;
}

/**
 * Content analysis interface
 */
export interface ContentAnalysis {
  wordCount: number;
  characterCount: number;
  paragraphCount: number;
  headingCount: number;
  imageCount: number;
  linkCount: number;
  listCount: number;
  codeBlockCount: number;
  tableCount: number;
  videoCount: number;
  embedCount: number;
  readingTimeMinutes: number;
  hasImages: boolean;
  hasVideos: boolean;
  hasTables: boolean;
  hasCode: boolean;
  complexity: 'simple' | 'moderate' | 'complex';
}

/**
 * Analyze content structure and metadata
 */
export function analyzeContent(content: unknown): ContentAnalysis {
  const plainText = extractPlainText(content, Infinity);
  const htmlContent = renderArticleContent(content);

  // Basic text metrics
  const words = plainText.trim().split(/\s+/).filter(word => word.length > 0);
  const wordCount = words.length;
  const characterCount = plainText.length;

  // Count different elements
  const paragraphCount = (htmlContent.match(/<p[^>]*>/g) || []).length;
  const headingCount = (htmlContent.match(/<h[1-6][^>]*>/g) || []).length;
  const imageCount = (htmlContent.match(/<img[^>]*>/g) || []).length;
  const linkCount = (htmlContent.match(/<a[^>]*>/g) || []).length;
  const listCount = (htmlContent.match(/<[uo]l[^>]*>/g) || []).length;
  const codeBlockCount = (htmlContent.match(/<pre[^>]*>/g) || []).length;
  const tableCount = (htmlContent.match(/<table[^>]*>/g) || []).length;
  const videoCount = (htmlContent.match(/<video[^>]*>/g) || []).length;
  const embedCount = (htmlContent.match(/<iframe[^>]*>/g) || []).length;

  // Calculate reading time (average 200 words per minute)
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  // Boolean flags
  const hasImages = imageCount > 0;
  const hasVideos = videoCount > 0;
  const hasTables = tableCount > 0;
  const hasCode = codeBlockCount > 0;

  // Determine complexity
  let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
  const complexityScore = headingCount + (imageCount * 2) + (tableCount * 3) +
    (codeBlockCount * 3) + (videoCount * 2) + (embedCount * 2);

  if (complexityScore > 10 || wordCount > 2000) {
    complexity = 'complex';
  } else if (complexityScore > 5 || wordCount > 800) {
    complexity = 'moderate';
  }

  return {
    wordCount,
    characterCount,
    paragraphCount,
    headingCount,
    imageCount,
    linkCount,
    listCount,
    codeBlockCount,
    tableCount,
    videoCount,
    embedCount,
    readingTimeMinutes,
    hasImages,
    hasVideos,
    hasTables,
    hasCode,
    complexity
  };
}

/**
 * Extract all headings from content for table of contents
 */
export function extractHeadings(content: unknown): Array<{ level: number; text: string; id: string }> {
  const headings: Array<{ level: number; text: string; id: string }> = [];

  try {
    if (!content || typeof content !== 'object') {
      return headings;
    }

    const contentObj = content as Record<string, unknown>;
    if (contentObj.root && typeof contentObj.root === 'object') {
      const rootObj = contentObj.root as Record<string, unknown>;
      if (rootObj.children && Array.isArray(rootObj.children)) {
        extractHeadingsFromNodes(rootObj.children as LexicalNode[], headings);
      }
    }
  } catch (error) {
    console.error('Error extracting headings:', error);
  }

  return headings;
}

/**
 * Extract headings from Lexical nodes recursively
 */
function extractHeadingsFromNodes(nodes: LexicalNode[], headings: Array<{ level: number; text: string; id: string }>): void {
  for (const node of nodes) {
    if (node.type === 'heading' && 'children' in node && node.children) {
      const text = extractTextFromChildren(node.children).trim();
      if (text) {
        const level = parseInt(node.tag.substring(1)); // h1 -> 1, h2 -> 2, etc.
        const id = text.toLowerCase()
          .replace(/[^\w\s-]/g, '') // Remove special characters
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .substring(0, 50); // Limit length

        headings.push({ level, text, id });
      }
    }

    // Recursively check child nodes
    if ('children' in node && node.children) {
      extractHeadingsFromNodes(node.children, headings);
    }
  }
}

/**
 * Extract all images from content with metadata
 */
export function extractImages(content: unknown): Array<{ src: string; alt: string; width?: number; height?: number }> {
  const images: Array<{ src: string; alt: string; width?: number; height?: number }> = [];

  try {
    if (!content || typeof content !== 'object') {
      return images;
    }

    const contentObj = content as Record<string, unknown>;
    if (contentObj.root && typeof contentObj.root === 'object') {
      const rootObj = contentObj.root as Record<string, unknown>;
      if (rootObj.children && Array.isArray(rootObj.children)) {
        extractImagesFromNodes(rootObj.children as LexicalNode[], images);
      }
    }
  } catch (error) {
    console.error('Error extracting images:', error);
  }

  return images;
}

/**
 * Extract images from Lexical nodes recursively
 */
function extractImagesFromNodes(nodes: LexicalNode[], images: Array<{ src: string; alt: string; width?: number; height?: number }>): void {
  for (const node of nodes) {
    if (node.type === 'image') {
      images.push({
        src: node.src,
        alt: node.alt || '',
        width: node.width,
        height: node.height
      });
    }

    // Recursively check child nodes
    if ('children' in node && node.children) {
      extractImagesFromNodes(node.children, images);
    }
  }
}

/**
 * Clean and normalize text content
 */
export function cleanTextContent(text: string): string {
  return text
    // Decode HTML entities
    .replace(/&[a-zA-Z0-9#]+;/g, (entity) => decodeHtmlEntities(entity))
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Remove excessive punctuation
    .replace(/[.]{3,}/g, '…')
    .replace(/[!]{2,}/g, '!')
    .replace(/[?]{2,}/g, '?')
    // Clean up quotes
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    // Remove control characters
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim();
}

/**
 * React component props for rendering article content
 */
export interface ArticleContentProps {
  content: unknown;
  className?: string;
}

/**
 * Render article content as JSX with consistent styling
 * This is a utility function that returns the proper className and HTML
 */
export function getArticleContentProps(content: unknown, additionalClassName?: string): {
  className: string;
  dangerouslySetInnerHTML: { __html: string };
} {
  const htmlContent = renderArticleContent(content);
  const baseClassName = getArticleContentClasses();
  const className = additionalClassName
    ? `${baseClassName} ${additionalClassName}`
    : baseClassName;

  return {
    className,
    dangerouslySetInnerHTML: { __html: htmlContent }
  };
};


/**
 * Generate SEO-friendly meta description from content
 */
export function generateMetaDescription(content: unknown, maxLength: number = 160): string {
  const excerpt = extractSmartExcerpt(content, maxLength);

  // Clean up for SEO
  return cleanTextContent(excerpt)
    // Remove quotes that might break HTML attributes
    .replace(/"/g, "'")
    // Ensure it ends properly
    .replace(/\.\.\.$/, '.')
    // Trim to exact length if needed
    .substring(0, maxLength);
}

/**
 * Extract keywords from content for SEO
 */
export function extractKeywords(content: unknown, maxKeywords: number = 10): string[] {
  const plainText = extractPlainText(content, Infinity).toLowerCase();

  // Common stop words to filter out
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after',
    'above', 'below', 'between', 'among', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'
  ]);

  // Extract words and count frequency
  const words = plainText
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));

  const wordCount = new Map<string, number>();
  words.forEach(word => {
    wordCount.set(word, (wordCount.get(word) || 0) + 1);
  });

  // Sort by frequency and return top keywords
  return Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word);
}

/**
 * Generate structured data for articles
 */
export function generateArticleStructuredData(article: {
  title: string;
  content: unknown;
  author?: string;
  publishedAt?: string;
  updatedAt?: string;
  imageUrl?: string;
  url?: string;
}): Record<string, unknown> {
  const analysis = analyzeContent(article.content);
  const description = generateMetaDescription(article.content);
  const keywords = extractKeywords(article.content);

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: description,
    wordCount: analysis.wordCount,
    keywords: keywords.join(', '),
    ...(article.author && { author: { '@type': 'Person', name: article.author } }),
    ...(article.publishedAt && { datePublished: article.publishedAt }),
    ...(article.updatedAt && { dateModified: article.updatedAt }),
    ...(article.imageUrl && { image: article.imageUrl }),
    ...(article.url && { url: article.url }),
    publisher: {
      '@type': 'Organization',
      name: 'CESAFI Sports'
    }
  };
}

/**
 * Validate content structure and return issues
 */
export function validateContent(content: unknown): Array<{ type: 'warning' | 'error'; message: string }> {
  const issues: Array<{ type: 'warning' | 'error'; message: string }> = [];

  try {
    const analysis = analyzeContent(content);

    // Check word count
    if (analysis.wordCount < 50) {
      issues.push({ type: 'warning', message: 'Content is very short (less than 50 words)' });
    } else if (analysis.wordCount > 5000) {
      issues.push({ type: 'warning', message: 'Content is very long (over 5000 words)' });
    }

    // Check structure
    if (analysis.paragraphCount === 0) {
      issues.push({ type: 'error', message: 'Content has no paragraphs' });
    }

    if (analysis.headingCount === 0 && analysis.wordCount > 500) {
      issues.push({ type: 'warning', message: 'Long content without headings may be hard to read' });
    }

    // Check images
    const images = extractImages(content);
    for (const image of images) {
      if (!image.alt || image.alt.trim().length === 0) {
        issues.push({ type: 'warning', message: `Image missing alt text: ${image.src}` });
      }
    }

    // Check readability
    if (analysis.complexity === 'complex' && analysis.paragraphCount < 5) {
      issues.push({ type: 'warning', message: 'Complex content with few paragraphs may be hard to read' });
    }

  } catch (error) {
    issues.push({ type: 'error', message: `Content validation failed: ${error}` });
  }

  return issues;
}

/**
 * Debug function to test content rendering
 */
export function debugContentRenderer(content: unknown): void {
  console.log('=== DEBUG CONTENT RENDERER ===');
  console.log('Input content:', content);
  console.log('Type:', typeof content);

  if (content && typeof content === 'object') {
    const contentObj = content as Record<string, unknown>;
    console.log('Has root:', !!contentObj.root);

    if (contentObj.root && typeof contentObj.root === 'object') {
      const rootObj = contentObj.root as Record<string, unknown>;
      console.log('Root children:', rootObj.children);
    }
  }

  const result = renderArticleContent(content);
  console.log('Rendered HTML:', result);

  const analysis = analyzeContent(content);
  console.log('Content Analysis:', analysis);

  const headings = extractHeadings(content);
  console.log('Headings:', headings);

  const images = extractImages(content);
  console.log('Images:', images);

  console.log('=== END DEBUG ===');
}