# Articles Management System

This system provides a complete article management workflow with role-based permissions and Lexical rich text editing.

## Features

### 🎯 **Core Functionality**
- **Rich Text Editor**: Lexical-based editor with toolbar and image upload
- **Role-Based Access**: Different permissions for Writers, Head Writers, and Admins
- **Status Workflow**: Review → Revise → Approve → Publish
- **Publish Scheduling**: Set future publish dates for approved articles
- **Image Management**: Upload and manage cover images and inline images

### 👥 **User Roles & Permissions**

#### **Writers**
- ✅ Create new articles
- ✅ Edit articles with "Revise" status only
- ❌ Cannot change article status
- ❌ Cannot delete articles
- ❌ Cannot edit author information

#### **Head Writers**
- ✅ All Writer permissions
- ✅ Edit all article fields (title, content, author, status)
- ✅ Change article status (Review, Revise, Approve, Cancel)
- ✅ Set publish dates for approved articles
- ✅ Delete articles

#### **Admins**
- ✅ All Head Writer permissions
- ✅ Full system access
- ✅ Manage all articles regardless of status

### 📊 **Article Status Workflow**

```
Draft → Review → Revise → Approve → Published
  ↓       ↓        ↓        ↓         ↓
Create  Submit   Edit    Schedule   Live
```

1. **Review**: New articles start here
2. **Revise**: Articles that need changes (Writers can edit)
3. **Approve**: Articles ready for publication
4. **Published**: Live articles on the website
5. **Cancelled**: Articles that won't be published

### 🕒 **Publish Scheduling**

- Head Writers and Admins can set future publish dates
- Articles with "Approved" status and a past publish date are automatically published
- Use the `/api/publish-scheduler` endpoint to trigger the publish check

## Components

### **LexicalEditor**
- Rich text editing with toolbar
- Image upload integration
- HTML content generation
- Responsive design

### **ArticleModal**
- Create/Edit article form
- Role-based field restrictions
- Cover image upload
- Status management
- Publish date scheduling

### **ArticlesTable**
- Data table with search and pagination
- Status badges with color coding
- Action buttons (Edit, Delete, View)
- Role-based action restrictions

## API Endpoints

### **Publish Scheduler**
```
GET/POST /api/publish-scheduler
```
Triggers the automatic publishing of scheduled articles.

**Setup for Production:**
1. Set up a cron job to call this endpoint every few minutes
2. For Vercel: Use Vercel Cron Jobs
3. For other platforms: Use services like cron-job.org

## Database Schema

```sql
articles: {
  id: string (UUID)
  title: string
  content: Json (Lexical editor content)
  cover_image_url: string
  authored_by: string
  status: 'review' | 'approved' | 'revise' | 'cancelled' | 'published'
  published_at: string (ISO datetime)
  created_at: string
  updated_at: string
  slug: string (auto-generated from title)
}
```

## Usage Examples

### **Creating an Article**
```typescript
const articleData = {
  title: "My Article Title",
  content: { /* Lexical editor content */ },
  cover_image_url: "https://example.com/image.jpg",
  authored_by: "John Doe",
  status: "review",
  published_at: new Date().toISOString()
};
```

### **Scheduling Publication**
```typescript
// Set publish date for approved article
await updateArticle({
  id: articleId,
  status: "approved",
  published_at: "2024-12-25T10:00:00Z" // Christmas morning
});
```

## File Structure

```
src/
├── components/
│   ├── admin/articles/
│   │   ├── articles-modal.tsx          # Create/Edit modal
│   │   ├── articles-table-columns.tsx  # Table column definitions
│   │   └── index.ts                    # Exports
│   └── shared/articles/
│       ├── lexical-editor.tsx          # Rich text editor
│       └── index.ts                    # Exports
├── app/(protected)/
│   ├── admin/articles/page.tsx         # Admin articles page
│   ├── head-writer/articles/page.tsx   # Head writer articles page
│   └── writer/articles/page.tsx        # Writer articles page
├── lib/
│   ├── validations/articles.ts         # Zod schemas
│   └── utils/publish-scheduler.ts      # Auto-publish utility
└── services/articles.ts                # Database operations
```

## Setup Instructions

1. **Install Dependencies**: Lexical packages are already included
2. **Database**: Ensure the `articles` table exists with proper schema
3. **Cloudinary**: Set up for image uploads
4. **Cron Job**: Set up the publish scheduler endpoint
5. **Permissions**: Configure user roles in your auth system

## Recommendations for Status Triggering

### **Option 1: Cron Job (Recommended)**
- Set up a cron job to call `/api/publish-scheduler` every 5-15 minutes
- Most reliable for production environments
- Works with any hosting platform

### **Option 2: Database Triggers**
- Use PostgreSQL triggers to automatically update status
- More complex but eliminates the need for external cron jobs
- Requires database-level configuration

### **Option 3: Real-time Checks**
- Check for scheduled articles on page load
- Less reliable but simpler to implement
- Good for development/testing

### **Option 4: Webhook Integration**
- Use services like Zapier or IFTTT
- Good for non-technical users
- May have rate limits

## Troubleshooting

### **Common Issues**

1. **Images not uploading**: Check Cloudinary configuration
2. **Editor not loading**: Ensure all Lexical packages are installed
3. **Status not updating**: Verify database permissions
4. **Scheduling not working**: Check cron job setup and API endpoint

### **Development Tips**

- Use browser dev tools to inspect Lexical editor state
- Check network tab for API call errors
- Verify database constraints and foreign keys
- Test with different user roles

## Future Enhancements

- [ ] Article templates
- [ ] Bulk operations
- [ ] Article analytics
- [ ] SEO optimization
- [ ] Comment system
- [ ] Article categories/tags
- [ ] Draft auto-save
- [ ] Collaborative editing
