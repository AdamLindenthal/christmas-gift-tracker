# Christmas Gift Tracker - Implementation Plan

A festive, modern web application for tracking Christmas gifts, recipients, budgets, and shopping status for a couple.

## User Review Required

> [!IMPORTANT]
> **Tech Stack Selection**
> Given your preference for Java but deployment constraints, I'm proposing:
> - **Frontend**: Next.js 14 (React) with TypeScript
> - **Backend**: Next.js API Routes (serverless functions)
> - **Database**: PostgreSQL (hosted on Vercel Postgres or Supabase free tier)
> - **Deployment**: Vercel (free tier with database included)
> 
> **Alternative**: If you prefer Java, we could use Spring Boot with a lightweight H2/PostgreSQL database and deploy to Railway/Render, but this would be more complex. Let me know if you'd prefer this approach.

> [!IMPORTANT]
> **Authentication Strategy**
> For simple access control without user management, I propose:
> - Single shared password stored as an environment variable
> - Session-based authentication using cookies
> - No user accounts, just one password both of you share
> - Password can be changed via environment variable update
> 
> **Alternative**: Could use a simple username/password combo (e.g., "adam" and "wife") if you want separate tracking of who added what. Which approach do you prefer?

> [!WARNING]
> **Data Privacy**
> While the app will be password-protected, the data will be stored in a cloud database. If you have concerns about privacy for gift data, we can add encryption, but this adds complexity.

## Proposed Changes

### Tech Stack & Architecture

**Framework & Language**
- Next.js 14 with App Router for modern React development
- TypeScript for type safety
- Responsive design using CSS modules and Tailwind CSS (for rapid styling)

**Database & ORM**
- PostgreSQL for persistent storage
- Prisma ORM for type-safe database access
- Database schema with tables: People, Gifts, GiftStatus enum

**Authentication**
- Simple password protection using Next.js middleware
- Cookie-based sessions with iron-session
- Environment variable for password configuration

**Deployment**
- Vercel for hosting (free tier)
- Vercel Postgres for database (free tier: 256MB storage, 60 hours compute/month)
- Environment variables for secrets

---

### Database Schema

#### [NEW] [schema.prisma](file:///Users/adam/.gemini/antigravity/scratch/christmas-gift-tracker/prisma/schema.prisma)

```prisma
model Person {
  id        String   @id @default(cuid())
  name      String
  relation  String?  // e.g., "Mom", "Brother", "Friend"
  budget    Decimal? @db.Decimal(10, 2)
  gifts     Gift[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Gift {
  id          String     @id @default(cuid())
  name        String
  description String?
  price       Decimal?   @db.Decimal(10, 2)
  status      GiftStatus @default(IDEA)
  isAtHome    Boolean    @default(false)
  url         String?    // Link to product
  notes       String?
  personId    String
  person      Person     @relation(fields: [personId], references: [id], onDelete: Cascade)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}

enum GiftStatus {
  IDEA       // Just an idea
  ORDERED    // Ordered, on the way
  RECEIVED   // Received but not wrapped
  WRAPPED    // Ready to give
  GIVEN      // Already given
}
```

---

### Application Structure

#### [NEW] [Project Root](file:///Users/adam/.gemini/antigravity/scratch/christmas-gift-tracker/)

```
christmas-gift-tracker/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   └── logout/route.ts
│   │   ├── people/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   └── gifts/
│   │       ├── route.ts
│   │       └── [id]/route.ts
│   ├── login/
│   │   └── page.tsx
│   ├── layout.tsx
│   └── page.tsx (main dashboard)
├── components/
│   ├── PersonCard.tsx
│   ├── GiftCard.tsx
│   ├── AddPersonModal.tsx
│   ├── AddGiftModal.tsx
│   ├── BudgetSummary.tsx
│   └── Header.tsx
├── lib/
│   ├── prisma.ts (database client)
│   ├── auth.ts (session management)
│   └── utils.ts
├── middleware.ts (auth protection)
├── prisma/
│   └── schema.prisma
└── public/
    └── (Christmas-themed assets)
```

---

### Core Features Implementation

#### Authentication & Access Control

Implement simple password protection without user management:
- Login page with single password field
- Middleware to protect all routes except `/login`
- Session stored in encrypted cookie
- Logout functionality

#### People Management

CRUD operations for gift recipients:
- List all people with budget summary
- Add new person with name, relation, optional budget
- Edit person details
- Delete person (cascade delete gifts)
- Visual cards showing: name, relation, total spent vs budget, gift count

#### Gift Tracking

Comprehensive gift management:
- List gifts filtered by person or status
- Add gift with: name, description, price, status, person
- Edit gift details including status transitions
- Toggle "is at home" flag
- Delete gifts
- Visual indicators for status (icons/colors)
- Running total of spending per person

#### Dashboard Views

#### Dashboard Views
- **Main View**: Person cards showing ALL gifts for that person.
  - Drag and drop gifts between people.
  - Direct gift editing from the card.
- **All Gifts View**: Simple list of all gifts (including unassigned).
  - Support for "Unassigned" gifts (nullable personId).
  - Filterable by status.

#### [MODIFY] [schema.prisma](file:///Users/adam/data/notes/christmas-gift-tracker/prisma/schema.prisma)
Make `personId` nullable to support unassigned gifts.

```prisma
model Gift {
  // ...
  personId    String?
  person      Person?    @relation(fields: [personId], references: [id], onDelete: SetNull)
  // ...
}
```

---

### UI/UX Design

#### Christmas Theme

Festive, playful design elements:
- Color palette: Reds, greens, gold accents on warm backgrounds
- Snowflake decorations and animations
- Christmas iconography (gifts, trees, ornaments)
- Festive fonts (e.g., "Mountains of Christmas" for headers, "Inter" for body)
- Subtle animations (hover effects, transitions)
- Dark mode support with cozy, warm tones

#### Responsive Design

Mobile-first approach:
- Card-based layouts that stack on mobile
- Touch-friendly buttons and interactions
- Bottom navigation on mobile, side navigation on desktop
- Responsive modals and forms

#### Key Pages

1. **Login Page**: Simple password field with festive background
2. **Dashboard**: Overview of all people and budget summary
3. **People View**: Grid of person cards with add button
4. **Gifts View**: Filterable list/grid of gifts
5. **Budget View**: Visual spending breakdown (charts optional)

---

### API Design

RESTful API endpoints using Next.js API routes:

**Authentication**
- `POST /api/auth/login` - Validate password, create session
- `POST /api/auth/logout` - Destroy session

**People**
- `GET /api/people` - List all people with gift counts and totals
- `POST /api/people` - Create new person
- `GET /api/people/[id]` - Get person details with gifts
- `PUT /api/people/[id]` - Update person
- `DELETE /api/people/[id]` - Delete person

**Gifts**
- `GET /api/gifts?personId=&status=` - List gifts with filters
- `POST /api/gifts` - Create new gift
- `GET /api/gifts/[id]` - Get gift details
- `PUT /api/gifts/[id]` - Update gift
- `DELETE /api/gifts/[id]` - Delete gift

## Verification Plan

### Automated Tests

```bash
# Build verification
npm run build

# Type checking
npm run type-check

# Database migration test
npx prisma migrate dev
npx prisma studio # Visual verification of schema
```

### Manual Verification

**Local Testing**
1. Start dev server and verify login protection
2. Test CRUD operations for people and gifts
3. Verify budget calculations and data persistence
4. Test mobile responsiveness in browser dev tools
5. Verify Christmas theme and animations

**Deployment Testing**
1. Deploy to Vercel
2. Set up database and run migrations
3. Configure environment variable for password
4. Test access from mobile device and desktop
5. Verify data persists across sessions
6. Share URL with you to confirm access control works

**Feature Validation**
- [ ] Can add/edit/delete people
- [ ] Can add/edit/delete gifts for each person
- [ ] Budget tracking shows correct totals
- [ ] Status transitions work correctly
- [ ] "At home" toggle functions
- [ ] Filters work (by person, by status)
- [ ] Mobile layout is usable
- [ ] Password protection prevents unauthorized access
- [ ] Data persists after logout/login
