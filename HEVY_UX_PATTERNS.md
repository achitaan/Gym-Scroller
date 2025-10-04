# Hevy-Inspired Fitness Tracking App - UX Patterns

## Overview
This application recreates Hevy's core UX patterns using modern Next.js 15, React 19, Radix UI, and Tailwind CSS. Each component and page follows Hevy's mobile-first, data-driven design philosophy.

## Core UX Patterns from Hevy

### 1. **Bottom Navigation (Navbar)**
- **Pattern**: Fixed bottom navigation bar for quick access to main sections
- **Implementation**: `/components/Navbar.tsx`
- **Hevy Inspiration**: Mobile-first approach with always-accessible navigation (Home, History, Profile)
- **Features**:
  - Sticky positioning keeps navigation always visible
  - Active state indication with blue accent color
  - Icon + label for clarity

### 2. **Home Dashboard**
- **Pattern**: Quick overview with user stats, active streak, and today's workout
- **Implementation**: `/app/page.tsx`
- **Hevy Inspiration**: Immediate visibility of key metrics and current workout status
- **Features**:
  - User avatar with initials
  - Quick stats row (streak, workouts, volume)
  - Today's workout card with progress
  - Floating action button (FAB) for starting new workouts

### 3. **Workout Cards**
- **Pattern**: Clean cards with key metrics for quick scanning
- **Implementation**: `/components/WorkoutCard.tsx`
- **Hevy Inspiration**: Scannable workout summaries with essential info (date, duration, volume, sets)
- **Features**:
  - Rounded corners (rounded-2xl)
  - Soft shadows for depth
  - Badge indicators for status
  - Exercise preview chips

### 4. **Exercise List with Accordion**
- **Pattern**: Expandable exercise list with inline set editing
- **Implementation**: `/components/ExerciseItem.tsx`
- **Hevy Inspiration**: Space-efficient design that reveals details on demand
- **Features**:
  - Accordion-based expansion (Radix UI)
  - Inline editable inputs for reps and weight
  - Checkbox for set completion
  - Visual category badges

### 5. **Workout Detail View**
- **Pattern**: Live workout tracking with progress bar and rest timer
- **Implementation**: `/app/workout/[id]/page.tsx`
- **Hevy Inspiration**: Focus on the current workout with minimal distractions
- **Features**:
  - Progress bar showing completion percentage
  - Rest timer between sets (automatic start on set completion)
  - Finish workout button with summary modal
  - Real-time set updates

### 6. **Workout History**
- **Pattern**: List of previous sessions sorted by date with expandable details
- **Implementation**: `/app/history/page.tsx`
- **Hevy Inspiration**: Easy review of past workouts grouped by date
- **Features**:
  - Date-grouped workout list
  - Filter tabs (All, Week, Month)
  - Reusable WorkoutCard components
  - Empty state messaging

### 7. **Profile & Stats**
- **Pattern**: Personal stats overview with visual progress charts
- **Implementation**: `/app/profile/page.tsx`
- **Hevy Inspiration**: Data visualization for tracking long-term progress
- **Features**:
  - User profile header with avatar
  - Stats overview cards
  - Volume chart using Recharts
  - Theme toggle (light/dark mode)
  - Tabbed interface (Stats/Settings)

### 8. **Stats Cards**
- **Pattern**: Data-driven cards with clear typography hierarchy
- **Implementation**: `/components/StatsCard.tsx`
- **Hevy Inspiration**: Minimal but expressive data presentation
- **Features**:
  - Large value display
  - Icon indicators
  - Trend arrows (up/down/neutral)
  - Optional subtitles

## Design System

### Colors
- **Primary Accent**: Blue (#2563eb) - CTAs and active states
- **Success**: Green - Positive trends and completion
- **Warning/Streak**: Orange - Streak indicators
- **Neutral**: Gray scale - Background and text hierarchy

### Typography
- **Font**: Geist (modern, clean, highly legible)
- **Hierarchy**: Bold headers (2xl-3xl), medium body (text-sm/base), small metadata (text-xs)

### Spacing & Layout
- **Rounded Corners**: rounded-2xl for cards, rounded-lg for inputs
- **Padding**: Consistent 6-unit padding (px-6 py-6)
- **Gaps**: grid gap-3/gap-4 for visual breathing room

### Animations
- **Accordion**: Smooth expand/collapse with height transitions
- **Hover**: Subtle shadow lift on cards
- **Transitions**: 200ms duration for state changes

## Component Architecture

### Modular Components
1. **WorkoutCard** - Workout summary display
2. **ExerciseItem** - Exercise with expandable sets
3. **StatsCard** - Metric display
4. **Navbar** - Bottom navigation
5. **ProfileStats** - Chart visualization

### Page Structure
1. **Home** (`/app/page.tsx`) - Dashboard with today's workout
2. **Workout Detail** (`/app/workout/[id]/page.tsx`) - Live workout tracking
3. **History** (`/app/history/page.tsx`) - Past workouts list
4. **Profile** (`/app/profile/page.tsx`) - User stats and settings

### Data Layer
- **Types**: `/lib/hevy-types.ts` - TypeScript interfaces
- **Mock Data**: `/lib/mock-data.ts` - Sample workout data
- **Utilities**: Volume calculation, workout grouping

## Key Differences from Original Hevy

While inspired by Hevy's UX patterns, this implementation:
- Uses **original visual design** (no proprietary assets)
- Implements **ShadCN/Radix UI aesthetic**
- Focuses on **core workout tracking** (excludes social features)
- Uses **mock data** for demonstration
- Emphasizes **accessibility** and **dark mode** support

## Future Enhancements

To make this production-ready:
1. Connect to real backend API
2. Add workout templates and routine builder
3. Implement exercise library with search
4. Add PR (personal record) tracking
5. Include workout analytics and insights
6. Add social features (if desired)
7. Implement user authentication
8. Add data persistence with database

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **Components**: Radix UI primitives
- **Icons**: Lucide React
- **Charts**: Recharts
- **Fonts**: Geist (Sans & Mono)
- **Theme**: next-themes for dark mode

---

This implementation demonstrates how to build a modern, Hevy-inspired fitness app using contemporary web technologies while respecting original design principles and focusing on user experience.
