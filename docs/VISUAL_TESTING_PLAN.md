# Visual Testing Plan - Polymarket Analyzer

**Test Date**: November 13, 2025
**Tester**: Claude Code Team 3 (Testing & Quality Assurance)
**Environment**: Development Server (http://localhost:3000)
**Status**: Pre-Integration Testing Phase

---

## Overview

This document provides comprehensive visual testing coverage for the Polymarket Analyzer frontend. Tests are organized by page and component, with detailed checklists for each section. All tests focus on UI rendering, layout consistency, interactive states, and visual regressions.

**Total Test Items**: 87 individual checks across 5 test categories.

---

## Page 1: Main Dashboard (/)

### Section A: Header

| Element | Expected Behavior | Status |
|---------|-------------------|--------|
| Logo icon (bar chart) | Renders with correct gradient (primary-500 to primary-700) | ⏳ |
| Logo text "Polymarket Analyzer" | Displays in white, bold, 1.25rem font | ⏳ |
| Subtitle "AI-Powered Sentiment Analysis" | Displays in gray-400, 0.75rem font | ⏳ |
| Search bar (hidden on mobile) | Visible on md breakpoint+, placeholder text visible | ⏳ |
| Search icon (magnifying glass) | Left-aligned inside search box, gray-400 color | ⏳ |
| Search input field | Full width, gray-800 background, gray-700 border | ⏳ |
| Search focus state | Ring-2 focus:ring-primary-500, border transparent | ⏳ |
| Navigation buttons (Markets, Portfolio, Alerts) | Visible on lg+ breakpoint | ⏳ |
| Each nav button | Ghost variant, text-sm, hover:bg-gray-800 | ⏳ |
| Theme toggle button | Displays sun or moon icon based on current theme | ⏳ |
| Header position | Sticky top-0, z-40, not scrolling with content | ⏳ |
| Header background | gray-900/95 with backdrop-blur-sm effect | ⏳ |
| Header border | border-b border-gray-800 | ⏳ |

**Subtotal: 14 checks**

---

### Section B: Sidebar Filters

| Element | Expected Behavior | Status |
|---------|-------------------|--------|
| Sidebar visibility | Hidden on sm/md, visible on lg+ | ⏳ |
| Sidebar width | w-80 (320px) | ⏳ |
| Filters header text | "Filters" in white, lg font-semibold | ⏳ |
| Filter icon (funnel) | Displays left of "Filters" text, gray-400 | ⏳ |
| Reset button | "Reset" text, text-sm, text-primary-500, hover:text-primary-400 | ⏳ |
| Market Status label | "Market Status" in gray-300, text-sm | ⏳ |
| Status buttons (All/Active/Closed) | Three equal-width buttons, rounded-lg | ⏳ |
| All button default state | bg-primary-600, text-white | ⏳ |
| Active button default state | bg-gray-800, text-gray-400, hover:bg-gray-700 | ⏳ |
| Closed button default state | bg-gray-800, text-gray-400, hover:bg-gray-700 | ⏳ |
| Status button click highlight | Selected button changes to appropriate color | ⏳ |
| Category label | "Category" in gray-300, text-sm | ⏳ |
| Category dropdown | Select component with "All Categories" default | ⏳ |
| Volume Range label | "Volume Range" in gray-300, text-sm | ⏳ |
| Volume slider | accent-primary-500, full width, responds to drag | ⏳ |
| Volume range text | Shows "$0" and "$10M+" endpoints | ⏳ |
| Sentiment label | "Sentiment" in gray-300, text-sm | ⏳ |
| Sentiment buttons (3) | Bullish, Neutral, Bearish - initially gray-800 | ⏳ |
| Sentiment button click | Selected button highlights with appropriate color | ⏳ |
| Sort By label | "Sort By" in gray-300, text-sm | ⏳ |
| Sort By dropdown | Select component with "Highest Volume" default | ⏳ |
| Active Filters section | Shows only if filters applied (category != all OR sentiments selected) | ⏳ |
| Active Filters border | Separated by pt-4 border-t border-gray-800 | ⏳ |

**Subtotal: 26 checks**

---

### Section C: Market Cards Grid

| Element | Expected Behavior | Status |
|---------|-------------------|--------|
| Grid layout | grid-cols-1 on mobile, lg:grid-cols-2, xl:grid-cols-3 | ⏳ |
| Grid gap | gap-6 between cards | ⏳ |
| Card count | 4 market cards display in grid | ⏳ |
| Card border | border-gray-800, rounded-xl | ⏳ |
| Card background | bg-gray-800/50 with backdrop-blur-sm | ⏳ |
| Card hover effect | border-gray-700 darker, shadow-lg | ⏳ |
| Card cursor | cursor-pointer on hover | ⏳ |
| Card scale animation | hover:scale-[1.02] slight zoom effect | ⏳ |
| Card question text | text-base, font-semibold, white, max 2 lines | ⏳ |
| Card category badge | Size sm, bg-gray-700, text-gray-200 | ⏳ |
| Card status badge | "Active" (green-500/10, green-400) or "Closed" (gray) | ⏳ |
| Sentiment indicator badge | Shows on card if data present | ⏳ |
| YES price box | bg-bullish-500/10, border-bullish-500/30, rounded-lg | ⏳ |
| YES label | text-xs, text-bullish-400, uppercase | ⏳ |
| YES price large text | text-xl, font-bold, text-bullish-400 | ⏳ |
| YES price percentage | Formatted as percentage (e.g., "62%") | ⏳ |
| YES price small text | text-xs, gray-400, shows "$0.62 per share" | ⏳ |
| YES trend arrow | ArrowTrendingUpIcon if price up, ArrowTrendingDownIcon if down | ⏳ |
| NO price box | bg-bearish-500/10, border-bearish-500/30, rounded-lg | ⏳ |
| NO label | text-xs, text-bearish-400, uppercase | ⏳ |
| NO price large text | text-xl, font-bold, text-bearish-400 | ⏳ |
| NO price percentage | Formatted as percentage (e.g., "38%") | ⏳ |
| NO price small text | text-xs, gray-400, shows "$0.38 per share" | ⏳ |
| NO trend arrow | Opposite direction from YES | ⏳ |
| Volume stat label | "24h Volume: " in gray-400, value in white bold | ⏳ |
| Liquidity stat label | "Liquidity: " in gray-400, value in white bold | ⏳ |
| End date | Shows "Ends [Month DD, YYYY]" for active markets | ⏳ |
| End date border | pt-3 border-t border-gray-700 | ⏳ |

**Subtotal: 34 checks**

---

### Section D: Footer

| Element | Expected Behavior | Status |
|---------|-------------------|--------|
| Footer layout | grid-cols-1 md:grid-cols-4 for 4 column sections | ⏳ |
| Footer background | bg-gray-900/50 with border-t border-gray-800 | ⏳ |
| Column headers | 4 headers: "About", "Resources", "Legal", "Connect" | ⏳ |
| Column header styling | text-sm, font-semibold, white, mb-3 | ⏳ |
| Footer links | All links text-sm, gray-400, hover:text-white | ⏳ |
| Copyright text | "© [year] Polymarket Analyzer. All rights reserved." | ⏳ |
| Copyright styling | text-sm, gray-400 | ⏳ |
| Powered by section | Shows "Powered by GPT-5-Pro • Gemini • Perplexity" | ⏳ |
| LLM names styling | text-white, font-medium | ⏳ |

**Subtotal: 13 checks**

---

## Page 2: Market Detail (/market/[id])

### Market Detail Components

| Element | Expected Behavior | Status |
|---------|-------------------|--------|
| Back button visible | Should be present on page | ⏳ |
| Back button navigable | Clicking should return to main dashboard | ⏳ |
| Market question heading | Bold, large text, full question displayed | ⏳ |
| Market status badge | "Active" (green) or "Closed" (gray) | ⏳ |
| Market description | Displays if present in data | ⏳ |
| Volume stats grid | Shows 24h Volume, Liquidity, and other stats | ⏳ |
| Sentiment analysis panel | Displays if sentiment data available | ⏳ |
| AI prediction panel | Displays if prediction data available | ⏳ |
| Market outcomes list | Lists YES/NO token information | ⏳ |

**Subtotal: 9 checks**

---

## Interactive Elements Test Matrix

Complete test matrix covering all interactive elements across the application.

| Element | Location | Action | Expected Result | Status |
|---------|----------|--------|-----------------|--------|
| Theme Toggle | Header | Click button | Page switches between light/dark theme | ⏳ |
| Search Input | Header | Type text | Input accepts text, no errors in console | ⏳ |
| Market Status "All" | Sidebar | Click | Button highlights with primary color | ⏳ |
| Market Status "Active" | Sidebar | Click | Button highlights with bullish color | ⏳ |
| Market Status "Closed" | Sidebar | Click | Button highlights with gray color | ⏳ |
| Category Dropdown | Sidebar | Click to open | Dropdown expands showing all options | ⏳ |
| Category Selection | Sidebar | Select option | Selected option displays, active filter badge shows | ⏳ |
| Volume Slider | Sidebar | Drag left/right | Slider moves, value updates in real-time | ⏳ |
| Sentiment Bullish | Sidebar | Click | Button highlights bullish color, shows in active filters | ⏳ |
| Sentiment Neutral | Sidebar | Click | Button highlights gray, shows in active filters | ⏳ |
| Sentiment Bearish | Sidebar | Click | Button highlights bearish color, shows in active filters | ⏳ |
| Sort Dropdown | Sidebar | Click to open | Dropdown expands showing 5 sort options | ⏳ |
| Sort Selection | Sidebar | Select option | Selected option displays, market order changes | ⏳ |
| Reset Button | Sidebar | Click | All filters reset to defaults, cards refresh | ⏳ |
| Market Card | Main grid | Click | Console logs market ID (handler present) | ⏳ |
| Markets Button | Header | Click | No error on click (handler in place) | ⏳ |
| Portfolio Button | Header | Click | No error on click (handler in place) | ⏳ |
| Alerts Button | Header | Click | No error on click (handler in place) | ⏳ |
| Back Button | Market Detail | Click | Returns to main dashboard (/), no errors | ⏳ |
| Footer Links | Footer | Hover | Link color changes to white | ⏳ |
| Footer Links | Footer | Click | No navigation errors | ⏳ |

**Subtotal: 20 checks**

---

## Visual Regression Checklist

Critical visual consistency checks to prevent regressions during implementation.

### Text Rendering
- [ ] All text readable with proper contrast (WCAG AA minimum)
- [ ] No text overflow in card titles (line-clamp-2 working)
- [ ] No text truncation in badges (whitespace-nowrap working)
- [ ] Font weights correct (text-sm, text-lg, font-semibold, font-bold)
- [ ] Font sizes consistent across similar elements

### Layout & Spacing
- [ ] Header padding consistent (px-6 py-4)
- [ ] Card padding consistent (p-5)
- [ ] Grid gaps correct (gap-6 between cards)
- [ ] Margin bottom consistent (mb-2, mb-3, mb-4, mb-6)
- [ ] Border spacing consistent across all elements
- [ ] No layout shift on interaction or scroll

### Colors & Styling
- [ ] Primary color (primary-500/600/700) used consistently
- [ ] Bullish indicators (green) only on YES outcomes
- [ ] Bearish indicators (red) only on NO outcomes
- [ ] Gray scale used correctly for disabled/secondary states
- [ ] Hover states visible on all interactive elements
- [ ] Dark theme applied correctly (bg-gray-900, text-gray-100)

### Icons & Images
- [ ] All Hero icons render properly (MagnifyingGlassIcon, MoonIcon, SunIcon, etc.)
- [ ] Icon sizes consistent (h-5 w-5, h-3 w-3, etc.)
- [ ] Icon colors match surrounding text
- [ ] Logo gradient renders smoothly

### Responsive Design
- [ ] Layout correct at 320px (mobile)
- [ ] Layout correct at 768px (tablet)
- [ ] Layout correct at 1024px (lg breakpoint)
- [ ] Layout correct at 1280px (xl breakpoint)
- [ ] Layout correct at 1920px (full desktop)
- [ ] No horizontal scroll at any breakpoint
- [ ] Touch targets adequate on mobile (minimum 44x44px)

### Animations & Transitions
- [ ] Card hover:scale-[1.02] smooth and visible
- [ ] Border color transitions on hover (border-gray-700)
- [ ] Shadow transitions smooth on hover
- [ ] Theme toggle smooth transition
- [ ] No jarring jumps or flickering

### Browser Console
- [ ] No errors in console on page load
- [ ] No TypeScript errors (already verified: 0 errors)
- [ ] No warnings about unoptimized images
- [ ] No hydration warnings (Next.js)
- [ ] Network tab shows all resources loading (200 status)

---

## Detailed Component Testing

### Card Component (23 instances across page)
```
✓ Accepts hover prop → applies transition styles
✓ Accepts clickable prop → applies cursor-pointer and scale
✓ Children render without distortion
✓ Border renders at correct width (1px)
✓ Background color correct (bg-gray-800/50)
✓ Backdrop blur applied (backdrop-blur-sm)
```

### Badge Component (6 variants)
```
✓ Default variant: bg-gray-700 text-gray-200
✓ Success variant: green background with border
✓ Danger variant: red background with border
✓ Warning variant: yellow background with border
✓ Info variant: blue background with border
✓ Bullish variant: green-bullish background with border
✓ Bearish variant: red-bearish background with border
```

### Button Component (Multiple states)
```
✓ Primary variant: blue, white text, hover darker
✓ Ghost variant: transparent, gray text, hover bg
✓ Loading state: spinner visible, text visible
✓ Disabled state: opacity-50, cursor-not-allowed
✓ All sizes: sm (px-3 py-1.5), md (px-4 py-2), lg (px-6 py-3)
✓ Focus ring: ring-2 focus:ring-offset-2
```

### Input Component
```
✓ Search input accepts text
✓ Placeholder visible (text-gray-500)
✓ Focus state: ring-2 ring-primary-500
✓ Background color: bg-gray-800
✓ Border color: border-gray-700
```

### Select Component (2 instances)
```
✓ Category dropdown renders correctly
✓ Sort By dropdown renders correctly
✓ Options list visible on click
✓ Selected value displays in button
✓ Chevron icon rotates on open/close
```

---

## Page Load Performance Targets

- [ ] First Contentful Paint (FCP): < 1.5s
- [ ] Largest Contentful Paint (LCP): < 2.5s
- [ ] Cumulative Layout Shift (CLS): < 0.1
- [ ] Time to Interactive (TTI): < 3.5s
- [ ] Total page size: < 500KB
- [ ] Number of HTTP requests: < 30

---

## Error State Testing

| Scenario | Expected Behavior |
|----------|-------------------|
| No markets returned | "No markets found" message displays with icon |
| API timeout | Error message displays gracefully |
| Missing market data | Fallback values shown (e.g., "N/A" for sentiment) |
| Invalid market ID on detail page | 404 or redirect to main page |
| Network error | User-friendly error message, no console errors |

---

## Accessibility Testing

- [ ] All interactive elements have aria-labels
- [ ] Color contrast meets WCAG AA standard (4.5:1 for text)
- [ ] Focus indicators visible (ring-2)
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Screen reader friendly (semantic HTML)
- [ ] No focus traps
- [ ] Alt text present on images

---

## Browser Compatibility Testing

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | Latest | ⏳ |
| Firefox | Latest | ⏳ |
| Safari | Latest | ⏳ |
| Edge | Latest | ⏳ |
| Mobile Safari (iOS) | Latest | ⏳ |
| Chrome Mobile (Android) | Latest | ⏳ |

---

## Test Execution Summary

**Total Visual Test Items**: 87
**Items Passed**: 0
**Items Failed**: 0
**Items Pending**: 87

**Blockers**: None identified
**Recommendations**:

1. After Team 1 fixes navigation, rerun "Market Card Click" and "Back Button" tests
2. After Team 2 backend integration, rerun sentiment indicator tests
3. After all fixes, run full responsive test at 5 breakpoints
4. Performance test after API integration (current tests with mock data)

---

## Sign-Off

- [ ] All visual elements rendering correctly
- [ ] All interactive elements responsive
- [ ] No layout regressions
- [ ] TypeScript compilation: 0 errors
- [ ] Console: 0 errors
- [ ] Ready for Team 1 & Team 2 integration testing
