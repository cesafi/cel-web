'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { $getRoot, $getSelection, $createTextNode, DecoratorNode, NodeKey, SerializedEditorState, SerializedLexicalNode, FORMAT_ELEMENT_COMMAND } from 'lexical';
import { $setBlocksType } from '@lexical/selection';
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import { $createParagraphNode } from 'lexical';
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, REMOVE_LIST_COMMAND } from '@lexical/list';
// import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRulePlugin';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Minus,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Loader2,
  HelpCircle
} from 'lucide-react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $isRangeSelection, FORMAT_TEXT_COMMAND, TextFormatType } from 'lexical';
import { $isListNode } from '@lexical/list';
import { $isHeadingNode } from '@lexical/rich-text';
import { $isQuoteNode } from '@lexical/rich-text';
import { toast } from 'sonner';
import Image from 'next/image';
import { Json } from '@/lib/types/articles';
import { useAutoSave } from '@/hooks/use-articles';
import { useCloudinary } from '@/hooks/use-cloudinary';
import { getLexicalEditorTheme } from '@/lib/utils/content-renderer';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// Interface for ImageNode JSON structure
interface ImageNodeJSON {
  src: string;
  alt: string;
  type: 'image';
  version: 1;
}

// Type for Lexical editor state
type LexicalEditorState = SerializedEditorState<SerializedLexicalNode>;

// Custom Image Node for Lexical
class ImageNode extends DecoratorNode<React.JSX.Element> {
  __src: string;
  __alt: string;

  static getType(): string {
    return 'image';
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(node.__src, node.__alt, node.__key);
  }

  constructor(src: string, alt: string = '', key?: NodeKey) {
    super(key);
    this.__src = src;
    this.__alt = alt;
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div');
    div.style.display = 'inline-block';
    div.style.maxWidth = '100%';
    return div;
  }

  updateDOM(): false {
    return false;
  }

  decorate(): React.JSX.Element {
    return (
      <div className="my-4">
        <Image
          src={this.__src}
          alt={this.__alt}
          width={800}
          height={600}
          style={{
            maxWidth: '100%',
            height: 'auto',
            borderRadius: '8px',
          }}
          className="rounded-lg shadow-sm"
        />
      </div>
    );
  }

  getSrc(): string {
    return this.__src;
  }

  getAlt(): string {
    return this.__alt;
  }

  setSrc(src: string): void {
    const writable = this.getWritable();
    writable.__src = src;
  }

  setAlt(alt: string): void {
    const writable = this.getWritable();
    writable.__alt = alt;
  }

  exportJSON(): ImageNodeJSON {
    return {
      src: this.__src,
      alt: this.__alt,
      type: 'image',
      version: 1,
    };
  }

  static importJSON(json: ImageNodeJSON): ImageNode {
    return new ImageNode(json.src, json.alt);
  }

  isInline(): false {
    return false;
  }

  isKeyboardSelectable(): boolean {
    return true;
  }
}

function $createImageNode(src: string, alt: string = ''): ImageNode {
  return new ImageNode(src, alt);
}

// Toolbar component
function ToolbarPlugin({
  enableAutoSave,
  articleId,
  autoSave
}: {
  enableAutoSave?: boolean;
  articleId?: string;
  autoSave?: {
    isSaving: boolean;
    lastSaved: Date | null;
    hasUnsavedChanges: boolean;
    saveNow: () => void;
    clearDraft: () => void;
  };
}) {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [blockType, setBlockType] = useState('paragraph');
  const [isAlignLeft, setIsAlignLeft] = useState(false);
  const [isAlignCenter, setIsAlignCenter] = useState(false);
  const [isAlignRight, setIsAlignRight] = useState(false);
  const [isAlignJustify, setIsAlignJustify] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const { uploadImage, isUploading } = useCloudinary();

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      // Update text format
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));
      setIsCode(selection.hasFormat('code'));

      // Update block type
      const anchorNode = selection.anchor.getNode();
      const element = anchorNode.getKey() === 'root' ? anchorNode : anchorNode.getTopLevelElementOrThrow();
      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);

      if (elementDOM !== null) {
        if ($isListNode(element)) {
          const parentList = element.getParent();
          const type = parentList && $isListNode(parentList) ? parentList.getListType() : element.getListType();
          setBlockType(type);
        } else {
          const type = $isHeadingNode(element) ? element.getTag() : $isQuoteNode(element) ? 'quote' : element.getType();
          setBlockType(type);
        }

        // Update alignment state
        const computedStyle = window.getComputedStyle(elementDOM);
        const textAlign = computedStyle.textAlign;
        setIsAlignLeft(textAlign === 'left');
        setIsAlignCenter(textAlign === 'center');
        setIsAlignRight(textAlign === 'right');
        setIsAlignJustify(textAlign === 'justify');
      }

      // Update word count
      const root = $getRoot();
      const textContent = root.getTextContent();
      const words = textContent.trim().split(/\s+/).filter(word => word.length > 0);
      setWordCount(words.length);
    }
  }, [editor]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [editor, updateToolbar]);

  const formatText = (format: TextFormatType) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  const formatParagraph = () => {
    if (blockType !== 'paragraph') {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createParagraphNode());
        }
      });
    }
  };

  const formatHeading = (headingSize: 'h1' | 'h2' | 'h3') => {
    if (blockType !== headingSize) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createHeadingNode(headingSize));
        }
      });
    }
  };

  const formatQuote = () => {
    if (blockType !== 'quote') {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createQuoteNode());
        }
      });
    }
  };

  const insertList = (listType: 'bullet' | 'number') => {
    if (blockType !== listType) {
      editor.dispatchCommand(
        listType === 'bullet' ? INSERT_UNORDERED_LIST_COMMAND : INSERT_ORDERED_LIST_COMMAND,
        undefined
      );
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  };

  const insertHorizontalRule = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        // Insert horizontal rule at current cursor position
        const textNode = $createTextNode('---');
        selection.insertNodes([textNode]);
      }
    });
  };

  const formatAlignment = (alignment: 'left' | 'center' | 'right' | 'justify') => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment);
  };

  const clearFormatting = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.formatText('bold', 0);
        selection.formatText('italic', 0);
        selection.formatText('underline', 0);
        selection.formatText('strikethrough', 0);
        selection.formatText('code', 0);
      }
    });
  };

  const insertImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          // Validate file size (10MB max)
          if (file.size > 10 * 1024 * 1024) {
            toast.error('Image size must be less than 10MB');
            return;
          }

          // Upload to Cloudinary
          const result = await uploadImage(file, {
            folder: 'cesafi-articles',
            resource_type: 'image',
            quality: 'auto',
            format: 'auto'
          });

          if (result.success && result.data) {
            editor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                // Insert image at current cursor position using custom ImageNode
                const imageNode = $createImageNode(result.data!.secure_url, 'Article image');
                selection.insertNodes([imageNode]);
              }
            });

            toast.success('Image uploaded and inserted successfully');
          } else {
            toast.error(result.error || 'Failed to upload image');
          }
        } catch (error) {
          console.error('Error uploading image:', error);
          toast.error('Failed to upload image');
        }
      }
    };
    input.click();
  };

  return (
    <div className="border-b border-border p-2 flex flex-wrap gap-1">
      {/* Text Formatting */}
      <div className="flex gap-1">
        <Button
          type="button"
          variant={isBold ? 'default' : 'ghost'}
          size="sm"
          onClick={() => formatText('bold')}
          className="h-8 w-8 p-0"
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={isItalic ? 'default' : 'ghost'}
          size="sm"
          onClick={() => formatText('italic')}
          className="h-8 w-8 p-0"
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={isUnderline ? 'default' : 'ghost'}
          size="sm"
          onClick={() => formatText('underline')}
          className="h-8 w-8 p-0"
          title="Underline (Ctrl+U)"
        >
          <Underline className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={isStrikethrough ? 'default' : 'ghost'}
          size="sm"
          onClick={() => formatText('strikethrough')}
          className="h-8 w-8 p-0"
          title="Strikethrough (Ctrl+Shift+S)"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={isCode ? 'default' : 'ghost'}
          size="sm"
          onClick={() => formatText('code')}
          className="h-8 w-8 p-0"
          title="Inline Code (Ctrl+E)"
        >
          <Code className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearFormatting}
          className="h-8 w-8 p-0"
          title="Clear formatting (Ctrl+\)"
        >
          <span className="text-xs font-bold">Aa</span>
        </Button>
      </div>

      <Separator orientation="vertical" className="h-8" />

      {/* Block Types */}
      <div className="flex gap-1">
        <Button
          type="button"
          variant={blockType === 'paragraph' ? 'default' : 'ghost'}
          size="sm"
          onClick={formatParagraph}
          className="h-8 px-2"
          title="Paragraph (Ctrl+Alt+0)"
        >
          P
        </Button>
        <Button
          type="button"
          variant={blockType === 'h1' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => formatHeading('h1')}
          className="h-8 px-2"
          title="Heading 1 (Ctrl+Alt+1)"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={blockType === 'h2' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => formatHeading('h2')}
          className="h-8 px-2"
          title="Heading 2 (Ctrl+Alt+2)"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={blockType === 'h3' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => formatHeading('h3')}
          className="h-8 px-2"
          title="Heading 3 (Ctrl+Alt+3)"
        >
          <Heading3 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={blockType === 'quote' ? 'default' : 'ghost'}
          size="sm"
          onClick={formatQuote}
          className="h-8 w-8 p-0"
          title="Blockquote (Ctrl+Shift+Q)"
        >
          <Quote className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-8" />

      {/* Lists */}
      <div className="flex gap-1">
        <Button
          type="button"
          variant={blockType === 'bullet' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => insertList('bullet')}
          className="h-8 w-8 p-0"
          title="Bullet List (Ctrl+Shift+7)"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={blockType === 'number' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => insertList('number')}
          className="h-8 w-8 p-0"
          title="Numbered List (Ctrl+Shift+8)"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-8" />

      {/* Text Alignment */}
      <div className="flex gap-1">
        <Button
          type="button"
          variant={isAlignLeft ? 'default' : 'ghost'}
          size="sm"
          onClick={() => formatAlignment('left')}
          className="h-8 w-8 p-0"
          title="Align Left (Ctrl+Shift+L)"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={isAlignCenter ? 'default' : 'ghost'}
          size="sm"
          onClick={() => formatAlignment('center')}
          className="h-8 w-8 p-0"
          title="Align Center (Ctrl+Shift+E)"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={isAlignRight ? 'default' : 'ghost'}
          size="sm"
          onClick={() => formatAlignment('right')}
          className="h-8 w-8 p-0"
          title="Align Right (Ctrl+Shift+R)"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={isAlignJustify ? 'default' : 'ghost'}
          size="sm"
          onClick={() => formatAlignment('justify')}
          className="h-8 w-8 p-0"
          title="Justify (Ctrl+Shift+J)"
        >
          <AlignJustify className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-8" />

      {/* Insert */}
      <div className="flex gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={insertImage}
          disabled={isUploading}
          className="h-8 w-8 p-0"
          title="Insert Image (Ctrl+Shift+I)"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImageIcon className="h-4 w-4" />
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={insertHorizontalRule}
          className="h-8 w-8 p-0"
          title="Horizontal Rule (Ctrl+Shift+-)"
        >
          <Minus className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-8" />

      {/* Help & Shortcuts */}
      <div className="flex gap-1">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="Keyboard Shortcuts"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Keyboard Shortcuts</h4>
              
              <div className="space-y-3 text-xs">
                <div>
                  <h5 className="font-medium mb-1">Text Formatting</h5>
                  <div className="space-y-1 text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Bold</span>
                      <kbd className="bg-muted px-1 rounded">Ctrl+B</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Italic</span>
                      <kbd className="bg-muted px-1 rounded">Ctrl+I</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Underline</span>
                      <kbd className="bg-muted px-1 rounded">Ctrl+U</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Strikethrough</span>
                      <kbd className="bg-muted px-1 rounded">Ctrl+Shift+S</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Inline Code</span>
                      <kbd className="bg-muted px-1 rounded">Ctrl+E</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Clear Format</span>
                      <kbd className="bg-muted px-1 rounded">Ctrl+\</kbd>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="font-medium mb-1">Block Types</h5>
                  <div className="space-y-1 text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Paragraph</span>
                      <kbd className="bg-muted px-1 rounded">Ctrl+Alt+0</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Heading 1</span>
                      <kbd className="bg-muted px-1 rounded">Ctrl+Alt+1</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Heading 2</span>
                      <kbd className="bg-muted px-1 rounded">Ctrl+Alt+2</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Heading 3</span>
                      <kbd className="bg-muted px-1 rounded">Ctrl+Alt+3</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Blockquote</span>
                      <kbd className="bg-muted px-1 rounded">Ctrl+Shift+Q</kbd>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="font-medium mb-1">Lists & Alignment</h5>
                  <div className="space-y-1 text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Bullet List</span>
                      <kbd className="bg-muted px-1 rounded">Ctrl+Shift+7</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Numbered List</span>
                      <kbd className="bg-muted px-1 rounded">Ctrl+Shift+8</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Align Left</span>
                      <kbd className="bg-muted px-1 rounded">Ctrl+Shift+L</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Align Center</span>
                      <kbd className="bg-muted px-1 rounded">Ctrl+Shift+E</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Align Right</span>
                      <kbd className="bg-muted px-1 rounded">Ctrl+Shift+R</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Justify</span>
                      <kbd className="bg-muted px-1 rounded">Ctrl+Shift+J</kbd>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="font-medium mb-1">Markdown Shortcuts</h5>
                  <div className="space-y-1 text-muted-foreground">
                    <div>Type <kbd className="bg-muted px-1 rounded"># </kbd> for H1</div>
                    <div>Type <kbd className="bg-muted px-1 rounded">## </kbd> for H2</div>
                    <div>Type <kbd className="bg-muted px-1 rounded">### </kbd> for H3</div>
                    <div>Type <kbd className="bg-muted px-1 rounded">&gt; </kbd> for blockquote</div>
                    <div>Type <kbd className="bg-muted px-1 rounded">- </kbd> for bullet list</div>
                    <div>Type <kbd className="bg-muted px-1 rounded">1. </kbd> for numbered list</div>
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <Separator orientation="vertical" className="h-8" />

      {/* Word Count */}
      <div className="flex items-center px-2 text-sm text-muted-foreground">
        <span>{wordCount} words</span>
      </div>

      {/* Auto-save Status */}
      {enableAutoSave && articleId && (
        <>
          <Separator orientation="vertical" className="h-8" />
          <div className="flex items-center px-2 text-sm">
            {autoSave?.isSaving ? (
              <span className="text-blue-600 flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                Saving...
              </span>
            ) : autoSave?.lastSaved ? (
              <span className="text-green-600">
                Saved {autoSave.lastSaved.toLocaleTimeString()}
              </span>
            ) : autoSave?.hasUnsavedChanges ? (
              <span className="text-orange-600">
                Unsaved changes
              </span>
            ) : (
              <span className="text-muted-foreground">
                All changes saved
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Placeholder component
function Placeholder() {
  return (
    <div className="absolute top-4 left-4 text-muted-foreground pointer-events-none">
      Start writing your article...
    </div>
  );
}

// Main editor component
interface LexicalEditorProps {
  initialContent?: string | Json;
  onChange?: (content: string | Json) => void;
  placeholder?: string;
  className?: string;
  outputFormat?: 'html' | 'json';
  articleId?: string; // For auto-save functionality
  enableAutoSave?: boolean; // Enable/disable auto-save
}

export function LexicalEditor({
  initialContent,
  onChange,
  className = "",
  outputFormat = 'html',
  articleId,
  enableAutoSave = false,
}: LexicalEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState<string | Json>('');

  // Auto-save functionality (only for existing articles)
  const autoSave = useAutoSave(
    articleId || '',
    typeof content === 'string' ? content : JSON.stringify(content),
    30000 // 30 seconds delay
  );

  const initialConfig = {
    namespace: 'ArticleEditor',
    theme: getLexicalEditorTheme(),
    nodes: [
      HeadingNode,
      ListNode,
      ListItemNode,
      QuoteNode,
      CodeNode,
      CodeHighlightNode,
      TableNode,
      TableCellNode,
      TableRowNode,
      AutoLinkNode,
      LinkNode,
      HorizontalRuleNode,
      ImageNode,
    ],
    onError: (error: Error) => {
      // Suppress selection errors that are common in Lexical
      if (error.message.includes('setBaseAndExtent') ||
        error.message.includes('IndexSizeError') ||
        error.message.includes('There is no child at offset')) {
        console.warn('Lexical selection error (suppressed):', error.message);
        return;
      }
      console.error('Lexical error:', error);
    },
  };


  return (
    <div className={`lexical-editor border border-border rounded-lg overflow-hidden ${className}`}>
      <LexicalComposer initialConfig={initialConfig}>
        <div className="relative">
          <ToolbarPlugin
            enableAutoSave={enableAutoSave}
            articleId={articleId}
            autoSave={autoSave}
          />
          <div className="relative">
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  ref={editorRef}
                  className="min-h-[400px] p-4 focus:outline-none"
                />
              }
              placeholder={<Placeholder />}
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
            <AutoFocusPlugin />
            <LinkPlugin />
            <ListPlugin />
            <HorizontalRulePlugin />
            <MarkdownShortcutPlugin />
            <TabIndentationPlugin />
            <OnChangePlugin
              onChange={(newContent) => {
                setContent(newContent);
                onChange?.(newContent);
              }}
              outputFormat={outputFormat}
            />
            <InitialContentPlugin initialContent={initialContent} />
            <KeyboardShortcutsPlugin />
            <ImagePlugin />
          </div>
        </div>
      </LexicalComposer>
    </div>
  );
}

// Plugin to handle content changes
function OnChangePlugin({
  onChange,
  outputFormat = 'html'
}: {
  onChange: (content: string | Json) => void;
  outputFormat?: 'html' | 'json';
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        if (outputFormat === 'json') {
          // Output Lexical's native JSON format with proper ImageNode serialization
          const editorStateJSON = editorState.toJSON();
          const jsonString = JSON.stringify(editorStateJSON);
          onChange(jsonString);
        } else {
          // Output HTML format (default)
          const htmlString = $generateHtmlFromNodes(editor, null);
          onChange(htmlString);
        }
      });
    });
  }, [editor, onChange, outputFormat]);

  return null;
}

// Plugin to handle custom image nodes
function ImagePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerNodeTransform(ImageNode, () => {
      // Handle any image node transformations if needed
    });
  }, [editor]);

  return null;
}

// Plugin for keyboard shortcuts
function KeyboardShortcutsPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const { ctrlKey, metaKey, shiftKey, altKey, key } = event;
      const isModifier = ctrlKey || metaKey;

      if (!isModifier) return;

      // Text formatting shortcuts
      if (key === 'b' && !shiftKey && !altKey) {
        event.preventDefault();
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
        return;
      }

      if (key === 'i' && !shiftKey && !altKey) {
        event.preventDefault();
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
        return;
      }

      if (key === 'u' && !shiftKey && !altKey) {
        event.preventDefault();
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
        return;
      }

      if (key === 'e' && !shiftKey && !altKey) {
        event.preventDefault();
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code');
        return;
      }

      // Shift + Ctrl shortcuts
      if (shiftKey) {
        switch (key) {
          case 'S':
            event.preventDefault();
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
            break;
          case 'Q':
            event.preventDefault();
            editor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                $setBlocksType(selection, () => $createQuoteNode());
              }
            });
            break;
          case 'L':
            event.preventDefault();
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left');
            break;
          case 'E':
            event.preventDefault();
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center');
            break;
          case 'R':
            event.preventDefault();
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right');
            break;
          case 'J':
            event.preventDefault();
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify');
            break;
          case 'Digit7':
          case '7':
            event.preventDefault();
            editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
            break;
          case 'Digit8':
          case '8':
            event.preventDefault();
            editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
            break;
        }
      }

      // Alt + Ctrl shortcuts for headings
      if (altKey) {
        switch (key) {
          case '0':
            event.preventDefault();
            editor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                $setBlocksType(selection, () => $createParagraphNode());
              }
            });
            break;
          case '1':
            event.preventDefault();
            editor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                $setBlocksType(selection, () => $createHeadingNode('h1'));
              }
            });
            break;
          case '2':
            event.preventDefault();
            editor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                $setBlocksType(selection, () => $createHeadingNode('h2'));
              }
            });
            break;
          case '3':
            event.preventDefault();
            editor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                $setBlocksType(selection, () => $createHeadingNode('h3'));
              }
            });
            break;
        }
      }

      // Clear formatting shortcut (Ctrl+\)
      if (key === '\\' && !shiftKey && !altKey) {
        event.preventDefault();
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            selection.formatText('bold', 0);
            selection.formatText('italic', 0);
            selection.formatText('underline', 0);
            selection.formatText('strikethrough', 0);
            selection.formatText('code', 0);
          }
        });
      }
    };

    const editorElement = editor.getRootElement();
    if (editorElement) {
      editorElement.addEventListener('keydown', handleKeyDown);
      return () => {
        editorElement.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [editor]);

  return null;
}

// Plugin to set initial content
function InitialContentPlugin({ initialContent }: { initialContent?: string | Json }) {
  const [editor] = useLexicalComposerContext();
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (initialContent && !hasInitialized) {
      editor.update(() => {
        try {
          // Try to parse as JSON first (Lexical's native format)
          if (typeof initialContent === 'string') {
            const parsed: unknown = JSON.parse(initialContent);
            // This is Lexical JSON format - validate it has the required structure
            if (isValidLexicalState(parsed)) {
              const editorState = editor.parseEditorState(parsed);
              editor.setEditorState(editorState);
              setHasInitialized(true);
              return;
            }
          } else if (initialContent && typeof initialContent === 'object') {
            // This is already parsed Lexical JSON - validate it
            if (isValidLexicalState(initialContent)) {
              const editorState = editor.parseEditorState(initialContent);
              editor.setEditorState(editorState);
              setHasInitialized(true);
              return;
            }
          }
        } catch (_error) {
          // If JSON parsing fails, fall back to HTML parsing
          console.log('Falling back to HTML parsing for initial content');
        }

        // Fallback to HTML parsing
        if (typeof initialContent === 'string') {
          const parser = new DOMParser();
          const dom = parser.parseFromString(initialContent, 'text/html');
          const nodes = $generateNodesFromDOM(editor, dom);
          const root = $getRoot();
          root.clear();
          root.append(...nodes);
        }
        setHasInitialized(true);
      });
    }
  }, [editor, initialContent, hasInitialized]);

  return null;
}

// Helper function to validate Lexical editor state
function isValidLexicalState(obj: unknown): obj is LexicalEditorState {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    'root' in obj &&
    obj.root !== null &&
    typeof obj.root === 'object' &&
    'children' in obj.root &&
    Array.isArray(obj.root.children)
  );
}
