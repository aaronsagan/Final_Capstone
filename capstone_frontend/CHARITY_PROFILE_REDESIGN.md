# Charity Profile Page Redesign - Complete Documentation

## Overview
Complete redesign and refactoring of the Charity Profile page with improved UX, accessibility, and component architecture.

---

## 🎯 What Was Changed

### **Files Created**
1. **`src/components/charity/ProfileHeader.tsx`** - Cover photo, logo, name, and action buttons
2. **`src/components/charity/ProfileStats.tsx`** - Stats cards with icons
3. **`src/components/charity/ProfileTabs.tsx`** - Tab navigation (About/Updates/Campaigns/Gallery)
4. **`src/components/charity/ProfileSidebar.tsx`** - Contact info, quick actions, and insights
5. **`src/components/charity/ActionBar.tsx`** - Sticky action bar (mobile bottom, desktop top-right)

### **Files Modified**
1. **`src/pages/charity/CharityProfilePage.tsx`** - Refactored to use new component architecture

---

## ✨ Key Features Implemented

### 1. **Navigation & Breadcrumbs**
- ✅ "Back to Updates" button in top-left of cover photo
- ✅ Keyboard accessible with proper `aria-label`
- ✅ Smooth hover effects with shadow and translate

### 2. **Profile Header**
- ✅ Full-width cover image (260px desktop, 160px mobile)
- ✅ Dark gradient overlay for text contrast (WCAG AA compliant)
- ✅ Circular logo overlapping cover with 4px ring border
- ✅ Logo has hover scale effect
- ✅ Charity name (H1), verified badge, tagline, and location
- ✅ Action buttons: Edit Profile (primary orange), Share, More (dropdown)
- ✅ All buttons have focus rings and hover effects

### 3. **Stats Cards**
- ✅ 4 stats: Total Raised, Active Campaigns, Followers, Updates
- ✅ Color-coded icons with background tints
- ✅ Hover effects: shadow + translate
- ✅ Responsive: 2 columns mobile, 4 columns desktop

### 4. **Tab Navigation**
- ✅ 4 tabs: About, Updates, Campaigns, Gallery
- ✅ Sticky tab bar at top with `role="tablist"`
- ✅ Proper `aria-selected` and `aria-controls` attributes
- ✅ Keyboard navigable

**About Tab:**
- Mission, Vision, About Us, Organization Info cards
- Each card has subtle hover shadow

**Updates Tab:**
- Shows up to 5 recent updates
- Empty state with "Post Your First Update" CTA
- "View All Updates" button at bottom
- Click to navigate to full Updates page

**Campaigns Tab:**
- Grid layout (1 column mobile, 2 columns desktop)
- Progress bars showing goal completion
- Empty state with "Create Your First Campaign" CTA
- Click to view individual campaign

**Gallery Tab:**
- Placeholder for future feature

### 5. **Sidebar** (Desktop: 4-col, Mobile: Full width)
- **Contact Information Card:**
  - Clickable email (`mailto:`), phone (`tel:`), website
  - Hover effects on links with icon scale
  - Copy-able address

- **Quick Actions Card:**
  - Post Update, Create Campaign, Edit Profile buttons
  - Hover shadow + translate effects

- **Insights Card:**
  - Total Likes, Comments, Posts
  - Color-coded icons

### 6. **Sticky Action Bar**
- **Desktop:** Fixed top-right corner in floating card
- **Mobile:** Fixed bottom bar with 3 buttons
- **Always accessible** scroll position
- Proper z-index layering

### 7. **Layout & Responsiveness**
- **Desktop:** 12-column grid (8 cols main, 4 cols sidebar)
- **Tablet:** Single column, stats stay horizontal if space allows
- **Mobile:** Vertical stack, sticky action bar on bottom
- Bottom padding to prevent content hiding under action bar

---

## 🎨 Design Improvements

### Color System
- Primary orange: `#F2A024` (for Edit Profile button)
- Stats color-coded: Green (raised), Primary (campaigns), Blue (followers), Purple (updates)
- Focus rings: Indigo `ring-indigo-500`
- Consistent use of `text-muted-foreground` for secondary text

### Hover & Focus States
- All interactive elements: `hover:shadow-lg hover:-translate-y-0.5 transition-all duration-150`
- Focus rings: `focus:ring-2 focus:ring-offset-2`
- Logo: `hover:scale-105`
- Links: `hover:underline hover:text-primary`

### Typography
- H1: Charity name (text-2xl lg:text-3xl)
- H2: Section headings (text-xl)
- H3: Card titles (text-lg font-bold)
- Consistent use of `font-medium` and `font-semibold`

### Spacing
- Container padding: `px-4 lg:px-8`
- Card padding: `p-4` or `p-6`
- Grid gaps: `gap-4` or `gap-6`
- Section spacing: `space-y-6`

---

## ♿ Accessibility Features

1. **Keyboard Navigation:**
   - All buttons and links are focusable
   - Tabs support arrow key navigation
   - Focus indicators on all interactive elements

2. **ARIA Labels:**
   - `aria-label` on icon-only buttons
   - `role="tablist"`, `role="tab"`, `role="tabpanel"`
   - `aria-selected`, `aria-controls` on tabs

3. **Color Contrast:**
   - Dark overlay on cover ensures text readability
   - Meets WCAG AA standards

4. **Alt Text:**
   - All images have descriptive `alt` attributes
   - Avatar fallbacks show charity acronym

5. **Screen Reader Support:**
   - Semantic HTML structure
   - Proper heading hierarchy
   - Descriptive button text

---

## 📱 Responsive Behavior

### Desktop (lg: 1024px+)
- 12-column grid layout
- Floating action bar top-right
- 4-column stats row
- Sidebar visible

### Tablet (md: 768px-1023px)
- Single column layout
- Stats remain horizontal
- Sidebar moves below content
- Bottom action bar

### Mobile (< 768px)
- Vertical stacking
- 2-column stats
- Sticky bottom action bar
- Reduced padding

---

## 🔧 Technical Implementation

### Component Props

**ProfileHeader:**
```typescript
{
  charity: CharityData;
  logoUrl: string | null;
  coverUrl: string | null;
  onEdit: () => void;
  onShare: () => void;
  onBack: () => void;
}
```

**ProfileStats:**
```typescript
{
  stats: {
    totalRaised: number;
    campaigns: number;
    followers: number;
    updates: number;
  };
  formatCurrency: (amount: number) => string;
}
```

**ProfileTabs:**
```typescript
{
  charity: CharityData;
  recentUpdates: Update[];
  campaigns: Campaign[];
  formatDate: (date: string) => string;
  getTimeAgo: (date: string) => string;
  buildStorageUrl: (path: string) => string;
  formatCurrency: (amount: number) => string;
}
```

**ProfileSidebar:**
```typescript
{
  charity: CharityData;
  insights?: {
    totalLikes: number;
    totalComments: number;
    totalPosts: number;
  };
  onEdit: () => void;
  onPostUpdate: () => void;
  onCreateCampaign: () => void;
}
```

**ActionBar:**
```typescript
{
  onEdit: () => void;
  onPostUpdate: () => void;
  onCreateCampaign: () => void;
}
```

### Data Transformations

The page transforms backend data to match component interfaces:
- Stats aggregation from multiple sources
- Campaign data mapping (`current_amount` → `amountRaised`, etc.)
- Insights calculation from stats

---

## 🧪 Testing Checklist

### Visual Testing
- [ ] Header: Logo overlaps cover correctly
- [ ] Header: Name and info are left-aligned
- [ ] Header: Action buttons visible and aligned right
- [ ] Stats: 4 cards with correct icons and colors
- [ ] Stats: Hover effects work (shadow + translate)
- [ ] Tabs: Switch content correctly
- [ ] Sidebar: Contact links clickable
- [ ] Action Bar: Visible on desktop (top-right) and mobile (bottom)

### Functional Testing
- [ ] Back button navigates to `/charity/updates`
- [ ] Edit Profile button navigates to `/charity/organization/manage`
- [ ] Share button triggers share functionality
- [ ] Tabs are keyboard navigable (Tab key + Arrow keys)
- [ ] Update cards navigate to Updates page
- [ ] Campaign cards navigate to individual campaign
- [ ] Contact email/phone/website links work
- [ ] Empty states show correct CTAs

### Responsive Testing
- [ ] Desktop (1024px+): 2-column layout, floating action bar
- [ ] Tablet (768px): Single column, stats horizontal
- [ ] Mobile (< 768px): Vertical stack, bottom action bar, 2-col stats
- [ ] Action bar doesn't overlap content (pb-20 on mobile)

### Accessibility Testing
- [ ] All buttons focusable with Tab key
- [ ] Focus indicators visible
- [ ] Screen reader announces tabs correctly
- [ ] Images have alt text
- [ ] Color contrast passes WCAG AA
- [ ] Keyboard-only navigation works

### Performance Testing
- [ ] Images lazy-load (if large gallery)
- [ ] No layout shift on load
- [ ] Smooth transitions (no jank)

---

## 🔌 Backend Requirements

### Current Endpoints Used
```
GET /api/charities/{id} - Charity profile data
GET /api/charity/stats - Stats data
GET /api/charities/{id}/updates - Recent updates
GET /api/charities/{id}/campaigns - Campaigns
```

### Data Structure Expected

**Charity:**
```json
{
  "id": 1,
  "name": "Charity Name",
  "acronym": "CN",
  "mission": "...",
  "vision": "...",
  "description": "...",
  "tagline": "...",
  "logo_path": "path/to/logo.png",
  "cover_image": "path/to/cover.jpg",
  "is_verified": true,
  "email": "contact@charity.org",
  "phone": "+1234567890",
  "website": "https://charity.org",
  "address": "123 Street, City",
  "municipality": "City",
  "province": "Province",
  "registration_number": "REG-12345",
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Stats:**
```json
{
  "total_received": 50000,
  "total_campaigns": 5,
  "total_followers": 150,
  "total_updates": 25
}
```

### Optional Backend Enhancements
1. Add `total_likes` and `total_comments` to stats endpoint
2. Add `is_owner` boolean to charity response for permission checks
3. Consolidate into single endpoint: `GET /api/charity/profile`

---

## 🚀 Commands to Run

### Development
```bash
# Frontend
cd capstone_frontend
npm run dev

# Backend
cd capstone_backend
php artisan serve
```

### Deployment
```bash
# Build frontend
npm run build

# No database migrations required
```

---

## 📝 Design Rationale

### Why Component-Based Architecture?
- **Maintainability:** Smaller, focused components are easier to update
- **Reusability:** Components can be used in other pages (e.g., public profile)
- **Testability:** Each component can be tested in isolation
- **Performance:** Easier to optimize individual components

### Why Sticky Action Bar?
- **Always accessible:** Users don't need to scroll to top for actions
- **Mobile-first:** Bottom bar is thumb-friendly on mobile
- **Desktop efficiency:** Top-right placement doesn't interfere with content

### Why Tab Navigation?
- **Information hierarchy:** Separates different content types
- **Reduced scroll:** Users can jump to specific sections
- **Scalability:** Easy to add new sections (e.g., Gallery)

### Why 8-4 Column Grid?
- **Content priority:** Main content gets more space
- **Sidebar utility:** Quick actions and contact always visible
- **Balance:** Not too cramped, not too sparse

---

## 🐛 Known Limitations

1. **Insights Data:** `totalLikes` and `totalComments` currently hardcoded to 0 (backend doesn't provide these yet)
2. **Gallery Tab:** Placeholder only - feature not implemented
3. **Image Upload:** Uses existing flow, no inline preview in this redesign
4. **Update Previews:** Limited to 5, doesn't support pagination

---

## 🔮 Future Enhancements

1. **Gallery Implementation:**
   - Image grid with lightbox
   - Upload interface
   - Image categorization

2. **Analytics Dashboard:**
   - Engagement charts
   - Donor demographics
   - Campaign performance

3. **Social Features:**
   - Share to social media
   - Embed codes
   - QR code generation

4. **Advanced Insights:**
   - Time-based analytics
   - Follower growth graphs
   - Engagement rate trends

---

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify backend is running (`php artisan serve`)
3. Clear browser cache and localStorage
4. Check network tab for failed API calls

For questions about this implementation, refer to the component source code - each file has clear prop types and inline comments.

---

**Last Updated:** 2025-01-21  
**Version:** 1.0.0  
**Author:** Cascade AI Assistant
