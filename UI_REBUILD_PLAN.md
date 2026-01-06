# UI/UX Rebuild Plan - World-Class Digital Menu System

## Design Philosophy
- **Mobile-first**: Phones are primary device
- **Calm & Minimal**: Content-first, no visual noise
- **Background-agnostic**: Works on ANY theme background
- **World-class**: Apple/Stripe/Michelin-level quality

---

## 1. LANDING PAGE (`/home`) - Complete Rebuild

### Current Problems:
- Heavy accordion boxes
- Multiple competing elements
- Boxed containers that block background
- Cluttered layout

### New Design:
```
┌─────────────────────────┐
│   [Logo/Name]           │
│   (minimal, centered)   │
│                         │
│   ┌─────────────────┐   │
│   │  [Menu Button]  │   │ ← PRIMARY ACTION
│   │  (premium, may  │   │
│   │   have subtle   │   │
│   │   food image)   │   │
│   └─────────────────┘   │
│                         │
│   [Optional: subtle     │
│    promotion hint]      │
│                         │
│   [Minimal footer:      │
│    Contact icons only]  │
└─────────────────────────┘
```

### Components:
1. **Premium Menu Entry Button**
   - Large, elegant button
   - Optional: Subtle food image as background layer
   - Soft overlay/blur if image used
   - Text always readable
   - No heavy containers

2. **Supporting Content** (if enabled):
   - Promotions: Single line hint, no boxes
   - Contact: Minimal icons in footer (no boxes)
   - Loyalty: Hidden by default, minimal link
   - Reviews: Google Reviews link only (no writing)

---

## 2. CUSTOM CONTENT EDITOR - Rebuild

### Remove:
- Review writing section (business owners don't write reviews)
- Heavy boxed containers
- Complex accordions

### New Structure:
- Simple, mobile-first forms
- Clear sections with minimal styling
- Google Reviews: Link input only
- Promotions: Simple list, no heavy cards
- Contact: Clean form fields
- Loyalty: Simple toggle + benefits list

---

## 3. MENU PAGE - Clean Overlays

### Current Problems:
- Heavy boxes on items
- Text blocked by containers
- Cluttered overlays

### New Design:
- Text sits directly on background
- Minimal borders/shadows only
- No heavy containers
- Clear typography hierarchy
- Mobile-optimized spacing

---

## 4. ADMIN DASHBOARD - Content Section Rebuild

### New Design:
- Mobile-first forms
- Clear section separation
- No visual clutter
- Simple, readable inputs
- Designed for phone use

---

## Implementation Order:
1. Landing Page (home/page.tsx)
2. Custom Content Editor
3. Menu Page overlays (if needed)
4. Admin Dashboard content section

---

## Key Rules:
✅ NO background modifications
✅ NO heavy boxes/containers
✅ NO competing elements
✅ Mobile-first always
✅ Text must be readable on any background
✅ Minimal animations (purpose-driven only)




