'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Article, ArticleInsert, ArticleUpdate, ArticleStatus } from '@/lib/types/articles';
import { createArticleSchema, updateArticleSchema } from '@/lib/validations/articles';
import { ZodError } from 'zod';
import { LexicalEditor } from '@/components/shared/articles/lexical-editor';
import { DateTimeInput } from '@/components/ui/datetime-input';
import { ImageUpload } from '@/components/shared/image-upload';
import slugify from 'slugify';
import { ArrowLeft, Save } from 'lucide-react';

interface ArticleFormProps {
  mode: 'create' | 'edit';
  article?: Article;
  onSubmit: (data: ArticleInsert | ArticleUpdate) => Promise<void>;
  isSubmitting: boolean;
  userRole?: 'writer' | 'head-writer' | 'admin';
  backUrl?: string;
}

export function ArticleForm({
  mode,
  article,
  onSubmit,
  isSubmitting,
  userRole = 'admin',
  backUrl
}: ArticleFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<ArticleInsert | ArticleUpdate>(() => {
    if (mode === 'edit' && article) {
      return {
        id: article.id,
        title: article.title,
        content: article.content,
        cover_image_url: article.cover_image_url,
        authored_by: article.authored_by,
        slug: article.slug,
        status: article.status,
        published_at: article.published_at
      } as ArticleUpdate;
    } else {
      return {
        title: '',
        content: {},
        cover_image_url: '',
        authored_by: '',
        slug: '',
        status: 'review',
        published_at: null
      } as ArticleInsert;
    }
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editorContent, setEditorContent] = useState<string>('');

  // Form initialization
  useEffect(() => {
    if (mode === 'edit' && article) {
      setFormData({
        id: article.id,
        title: article.title,
        content: article.content || {},
        cover_image_url: article.cover_image_url,
        authored_by: article.authored_by,
        status: article.status,
        published_at: article.published_at || null
      });
      setEditorContent(article.content ? JSON.stringify(article.content) : '');
    } else {
      setFormData({
        title: '',
        content: {},
        cover_image_url: '',
        authored_by: '',
        slug: '',
        status: 'review',
        published_at: null
      } as ArticleInsert);
      setEditorContent('');
    }
    setErrors({});
  }, [mode, article]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      // Generate slug from title
      const title = formData.title?.trim() || 'untitled';
      const slug = slugify(title, {
        lower: true,
        strict: true,
        remove: /[*+~.()'"!:@]/g
      });

      // Parse editor content as JSON (Lexical JSON format)
      let parsedContent;
      try {
        parsedContent = JSON.parse(editorContent);
      } catch {
        // Fallback to HTML string if JSON parsing fails
        parsedContent = { html: editorContent };
      }

      const submitData = {
        ...formData,
        content: parsedContent, // Use parsed JSON content
        slug: slug
      };

      const schema = mode === 'create' ? createArticleSchema : updateArticleSchema;
      const validatedData = schema.parse(submitData);

      await onSubmit(validatedData);

      // Navigate back after successful submission
      if (backUrl) {
        router.push(backUrl);
      } else {
        router.back();
      }
    } catch (error) {
      if (error instanceof ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((issue) => {
          if (issue.path) {
            newErrors[issue.path[0] as string] = issue.message;
          }
        });
        setErrors(newErrors);
        toast.error('Please fix the validation errors');
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An unexpected error occurred');
      }
    }
  };

  const handleBack = () => {
    if (backUrl) {
      router.push(backUrl);
    } else {
      router.back();
    }
  };

  const isWriter = userRole === 'writer';
  const canEditStatus = userRole === 'admin' || userRole === 'head-writer';
  const canEditAuthor =
    userRole === 'admin' ||
    userRole === 'head-writer' ||
    (userRole === 'writer' && mode === 'create');

  return (
    <div className="w-full">
      {/* Header */}
      <Button variant="ghost" size="sm" onClick={handleBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="mt-4 flex items-center justify-between">
        <div className="mb-4 flex items-center space-x-4">
          <div>
            <h1 className="text-2xl font-bold">
              {mode === 'create' ? 'Create New Article' : 'Edit Article'}
            </h1>
            <p className="text-muted-foreground">
              {mode === 'create'
                ? 'Write and publish a new article'
                : `Editing: ${article?.title || 'Article'}`}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleBack}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="article-form"
            disabled={isSubmitting}
            className="min-w-[100px]"
          >
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {mode === 'create' ? 'Create' : 'Update'}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Writer-specific message */}
      {isWriter && article?.status !== 'draft' && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            You can only edit articles with "Draft" status. This article is currently in
            &quot;{getStatusLabel(article?.status || '')}&quot; status.
          </p>
        </div>
      )}

      <form id="article-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Title */}
            <Card>
              <CardHeader>
                <CardTitle>Article Title</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter article title"
                    className={errors.title ? 'border-red-500' : ''}
                  />
                  {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Content Editor */}
            <Card>
              <CardHeader>
                <CardTitle>Article Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <LexicalEditor
                    initialContent={editorContent}
                    onChange={(content) => {
                      setEditorContent(
                        typeof content === 'string' ? content : JSON.stringify(content)
                      );
                      setFormData((prev) => ({ ...prev, content }));
                    }}
                    className="min-h-[500px]"
                    articleId={article?.id}
                    enableAutoSave={mode === 'edit' && !!article?.id}
                    outputFormat="json"
                  />
                  {errors.content && <p className="text-sm text-red-500">{errors.content}</p>}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Article Details */}
            <Card>
              <CardHeader>
                <CardTitle>Article Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Author */}
                <div className="space-y-2">
                  <Label htmlFor="authored_by">Author *</Label>
                  <Input
                    id="authored_by"
                    value={formData.authored_by}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, authored_by: e.target.value }))
                    }
                    placeholder="Enter author name"
                    disabled={!canEditAuthor}
                    className={errors.authored_by ? 'border-red-500' : ''}
                  />
                  {errors.authored_by && (
                    <p className="text-sm text-red-500">{errors.authored_by}</p>
                  )}
                </div>

                {/* Status */}
                {canEditStatus && (
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => {
                        const newStatus = value as ArticleStatus;
                        setFormData((prev) => {
                          const newData = { ...prev, status: newStatus };
                          
                          // If changing to published and no published_at is set, set it to now
                          if (newStatus === 'published' && !prev.published_at) {
                            newData.published_at = new Date().toISOString();
                          }
                          
                          return newData;
                        });
                      }}
                    >
                      <SelectTrigger className={errors.status ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="review">Review</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                        <SelectItem value="featured">Featured</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.status && <p className="text-sm text-red-500">{errors.status}</p>}
                  </div>
                )}

                {/* Published Date */}
                {canEditStatus && formData.status && ['featured', 'published'].includes(formData.status) && (
                  <DateTimeInput
                    id="published_at"
                    label="Publish Date & Time"
                    value={formData.published_at}
                    onChange={(utcIsoString) =>
                      setFormData((prev) => ({
                        ...prev,
                        published_at: utcIsoString
                      }))
                    }
                    error={errors.published_at}
                    helpText={
                      formData.status === 'published' 
                        ? 'When this article was/will be published'
                        : 'When this article should be published'
                    }
                    required={formData.status === 'published'}
                  />
                )}
              </CardContent>
            </Card>

            {/* Cover Image */}
            <Card>
              <CardHeader>
                <CardTitle>Cover Image</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ImageUpload
                  onUpload={(url) => setFormData((prev) => ({ ...prev, cover_image_url: url }))}
                  onRemove={() => setFormData((prev) => ({ ...prev, cover_image_url: '' }))}
                  preset="ARTICLE_COVER"
                  currentImageUrl={formData.cover_image_url}
                  placeholder="Upload article cover image"
                  description="Upload a cover image for your article (16:9 aspect ratio recommended)"
                  required={false}
                  error={errors.cover_image_url}
                />
              </CardContent>
            </Card>

            {/* Article Info */}
            {mode === 'edit' && article && (
              <Card>
                <CardHeader>
                  <CardTitle>Article Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{new Date(article.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span>{new Date(article.updated_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Slug:</span>
                    <span className="font-mono text-xs">{article.slug}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'review':
      return 'Review';
    case 'published':
      return 'Published';
    case 'archived':
      return 'Archived';
    case 'featured':
      return 'Featured';
    default:
      return status;
  }
}
