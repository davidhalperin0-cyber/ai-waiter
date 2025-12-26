# 🎨 Design Prompt for Admin Dashboard & Landing Page

## Project Context

You are designing a **world-class digital menu system** for restaurants. The system has two main user-facing interfaces:

1. **Admin Dashboard** - Where restaurant owners manage their menu, business info, and custom content
2. **Landing Page** - The first page customers see when scanning a QR code (before entering the menu)

---

## Current Technology Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Language:** TypeScript/React
- **Background System:** Theme-based backgrounds (selectable by business owners) - **DO NOT MODIFY**

---

## Design Philosophy

Design as a **world-class international digital menu product**. Think:

- **Apple** - Clean, intentional, premium
- **Stripe** - Professional, trustworthy, minimal
- **Michelin-level hospitality** - Elegant, refined, content-first

### Core Principles:

- **Mobile-first** - Phones are the primary device
- **Calm, minimal, content-first** - UI sits quietly on top of any background
- **No visual noise** - No heavy boxes, no aggressive animations
- **Clear hierarchy** - Users know exactly what to do
- **Premium feel** - Every interaction feels intentional and refined

---

## Interface 1: Admin Dashboard

### Purpose

Restaurant owners use this to:

- Manage menu items (add, edit, delete, reorder)
- Update business information (name, logo, template)
- Configure custom content (promotions, contact info, loyalty club, reviews)
- View QR codes and NFC links
- Manage subscription settings

### Current Structure (Tabs/Sections):

1. **Menu Management Tab**

   - List of menu items grouped by category
   - Add/Edit/Delete items
   - Reorder items
   - Image uploads
   - Price, description, ingredients, allergens
   - English translations (auto-translated)

2. **Business Settings Tab**

   - Business name
   - Logo upload
   - Template selection (visual theme)
   - Subscription info

3. **Custom Content Tab**

   - Promotions management
   - Contact information (phone, email, WhatsApp, Instagram, Facebook)
   - Loyalty club settings
   - Google Reviews link
   - Menu button background image

4. **QR Codes & NFC Tab**
   - QR code display
   - NFC setup instructions
   - Table ID management

### Design Requirements for Admin Dashboard:

#### Layout:

- **Mobile-first** - Must work perfectly on phones
- **Tab-based navigation** - Clear separation of responsibilities
- **Simple, readable forms** - No visual clutter
- **Clear action buttons** - Save, Cancel, Delete are obvious
- **Visual feedback** - Loading states, success/error messages

#### Typography:

- **Readable fonts** - System fonts preferred (system-ui, -apple-system)
- **Clear hierarchy** - Headings, labels, inputs are distinct
- **Adequate spacing** - Forms don't feel cramped

#### Forms:

- **Clean inputs** - Minimal borders, clear focus states
- **Logical grouping** - Related fields are visually grouped
- **Helpful labels** - Users know what each field does
- **Validation feedback** - Errors are clear and actionable

#### Buttons & Actions:

- **Primary actions** - Clear, prominent (Save, Add Item)
- **Secondary actions** - Subtle but accessible (Cancel, Edit)
- **Destructive actions** - Clear but not aggressive (Delete)
- **Hover states** - Subtle feedback, not jarring

#### Menu Item Cards:

- **Image preview** - Clear, properly sized
- **Edit/Delete actions** - Easy to find but not intrusive
- **Drag handles** - Clear indication items can be reordered
- **Status indicators** - If items can be enabled/disabled

#### Color Scheme:

- **Neutral base** - Works with any background
- **Subtle accents** - For interactive elements
- **High contrast** - Text is always readable
- **No heavy backgrounds** - UI sits on top of page background

#### Spacing & Rhythm:

- **Consistent padding** - Same spacing throughout
- **Visual breathing room** - Sections don't feel cramped
- **Logical grouping** - Related items are close, unrelated are separated

---

## Interface 2: Landing Page (Home Page)

### Purpose

The first page customers see when scanning a QR code. It's a **"Quick Gate"** - one clear action: **Enter the Menu**.

### Current Structure:

1. **Header** - Minimal, language toggle only
2. **Business Name/Logo** - Brand identity, visually dominant
3. **Menu Button** - Primary CTA, large, prominent
   - Optional: Background image with overlay
   - Text: "View Menu" / "צפה בתפריט"
4. **Contact Icons** - Secondary, minimal icons (Phone, Email, WhatsApp, Instagram, Facebook)
5. **Loyalty Club** - Optional, subtle link/button
6. **Google Reviews** - Optional, minimal text link

### Design Requirements for Landing Page:

#### Layout:

- **Vertical flow** - Eye flows naturally top to bottom
- **Centered content** - Everything is centered horizontally
- **Balanced spacing** - Not empty, not cluttered
- **Mobile-first** - Optimized for phone screens

#### Business Name:

- **Visually dominant** - Clearly the brand
- **Modern sans-serif** - System fonts (system-ui, -apple-system)
- **Medium/semi-bold weight** - Not too light, not too heavy
- **No boxes, no shadows** - Just clean text
- **Centered at top** - First thing users see

#### Menu Button:

- **Primary focal point** - Most prominent element
- **Large, calm, confident** - Feels premium, not aggressive
- **Optional background image** - Food image with subtle overlay
- **Text always readable** - White text if image, black if no image
- **Subtle hover effect** - Scale 1.01-1.02, not aggressive
- **Smooth entrance** - Fades in elegantly

#### Spacing:

- **Clear vertical rhythm** - Business name → Menu button → Icons
- **Balanced gaps** - `space-y-12` or similar (not too tight, not too loose)
- **Feels intentional** - Every element has purpose and placement

#### Contact Icons:

- **Secondary importance** - Below menu button
- **Even spacing** - Icons are evenly distributed
- **Minimal style** - Subtle backgrounds (bg-white/5), thin borders
- **Clean labels** - Small text below icons
- **Subtle hover** - Scale 1.08, not aggressive
- **No heavy containers** - Icons don't block background

#### Optional Elements (Loyalty, Reviews):

- **Clearly optional** - Feel like "More info"
- **Subtle styling** - Small text, low opacity
- **Below main content** - Don't compete with menu button

#### Animations:

- **Purpose-driven only** - Entrance animations, subtle hovers
- **Never decorative** - Every animation has a purpose
- **Performance-friendly** - Smooth 60fps
- **Staggered entrances** - Icons fade in with slight delays

#### Background:

- **Theme-based** - Selected by business owner
- **UI sits on top** - All elements work on any background
- **Text contrast** - White text with shadows/drop-shadows if needed
- **No heavy overlays** - Background is visible

---

## Critical Constraints

### DO NOT:

- ❌ Modify the background system
- ❌ Add heavy boxes or containers that block backgrounds
- ❌ Use aggressive animations
- ❌ Create visual clutter
- ❌ Break mobile experience
- ❌ Change routing or URLs
- ❌ Modify data structure or API calls

### DO:

- ✅ Design mobile-first
- ✅ Keep UI minimal and calm
- ✅ Ensure text is always readable
- ✅ Create clear visual hierarchy
- ✅ Make interactions feel premium
- ✅ Use system fonts
- ✅ Maintain consistent spacing
- ✅ Design for non-technical users

---

## Technical Implementation Notes

### Current File Structure:

- **Admin Dashboard:** `app/dashboard/page.tsx`
- **Landing Page:** `app/menu/[businessId]/[tableId]/home/page.tsx`
- **Theme Wrapper:** `components/themes/ThemeWrapper.tsx` (DO NOT MODIFY)

### Styling Approach:

- Use Tailwind CSS utility classes
- Prefer semantic spacing (space-y-12, gap-8, etc.)
- Use opacity for subtle effects (bg-white/5, text-white/50)
- Use system fonts: `fontFamily: 'system-ui, -apple-system, sans-serif'`

### Component Patterns:

- Use Framer Motion for animations: `<motion.button>`, `<motion.div>`
- Keep animations subtle: `scale: 1.01`, `opacity: 0 → 1`
- Use conditional rendering for optional content

### Responsive Design:

- Mobile-first breakpoints: `md:`, `lg:`
- Test on small screens (375px width)
- Ensure touch targets are at least 44x44px

---

## Expected Output

Provide:

1. **Detailed design specifications** for both interfaces
2. **Specific Tailwind CSS classes** for key elements
3. **Spacing recommendations** (padding, margins, gaps)
4. **Typography specifications** (sizes, weights, line-heights)
5. **Color recommendations** (opacity levels, contrast ratios)
6. **Animation specifications** (durations, easings, delays)
7. **Component structure** recommendations
8. **Mobile vs Desktop** differences (if any)

Focus on making both interfaces feel:

- **Premium** - World-class quality
- **Calm** - No visual noise
- **Intuitive** - Users know what to do
- **Mobile-first** - Perfect on phones
- **Content-first** - Content is king

---

## Questions to Consider

1. How can we make the admin dashboard feel less overwhelming for non-technical users?
2. What's the best way to group related form fields visually?
3. How can we make the landing page feel more premium without adding visual noise?
4. What's the optimal spacing between elements for a calm, balanced feel?
5. How can we ensure the UI works beautifully on any background theme?

---

**Remember:** This is a premium product. Every pixel matters. Design with intention.

