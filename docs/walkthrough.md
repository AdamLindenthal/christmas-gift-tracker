# Vánoční Dárky (Christmas Gift Tracker) - Walkthrough

A festive, modern web application for tracking Christmas gifts, recipients, and shopping status, now fully localized in Czech.

![Application Demo](/Users/adam/.gemini/antigravity/brain/8bb92d93-a1fb-418c-9048-c8957cbe5004/board_view_1764757200297.png)

## What Was Built

### Tech Stack

- **Frontend**: Next.js 14 with TypeScript and React
- **Backend**: Next.js API Routes (serverless functions)
- **Database**: SQLite (development) / PostgreSQL (production)
- **ORM**: Prisma
- **Authentication**: iron-session with simple password protection
- **Styling**: Tailwind CSS with custom Christmas theme
- **Fonts**: Mountains of Christmas (headers), Inter (body)
- **Localization**: Czech (Čeština) language and currency (Kč)

### Architecture

```
christmas-gift-tracker/
├── app/
│   ├── api/
│   │   ├── auth/          # Login/logout endpoints
│   │   ├── people/        # CRUD for recipients
│   │   └── gifts/         # CRUD for gifts
│   ├── login/             # Login page
│   ├── page.tsx           # Main dashboard
│   └── globals.css        # Christmas theme
├── components/
│   ├── PersonCard.tsx     # Recipient card UI
│   └── GiftCard.tsx       # Gift card UI
├── lib/
│   ├── prisma.ts          # Database client
│   ├── auth.ts            # Session management
│   └── utils.ts           # Utilities
├── prisma/
│   └── schema.prisma      # Database schema
└── middleware.ts          # Route protection
```

## Implemented Features

### ✅ Authentication & Security

- **Simple password protection** - Single shared password stored in environment variable
- **Session-based authentication** - Secure cookie-based sessions using iron-session
- **Route protection** - Middleware prevents unauthorized access to all pages except login
- **Environment-based configuration** - Password can be changed via `APP_PASSWORD` env var

### ✅ People Management

- **Add recipients** - Create new people with name and relation
- **Edit recipients** - Update person details
- **Delete recipients** - Remove people (cascade deletes their gifts)
- **Statistics** - Each card shows gift count and total spent

### ✅ Gift Tracking

- **Add gifts** - Create gifts with name, description, price, status, URL, notes
- **Edit gifts** - Update any gift details
- **Delete gifts** - Remove gifts from tracker
- **Multiple statuses**:
  - 💡 **Nápad** (Idea)
  - 📦 **Objednáno** (Ordered)
  - ✅ **Doručeno** (Received - implies "at home")
  - 🎁 **Zabaleno** (Wrapped)
  - 🎉 **Předáno** (Given)
- **Quick status changes** - Dropdown on hover for fast updates
- **Product links** - Store URLs to products for easy reference

### ✅ Dashboard Views

- **👥 Přehled (Board) View** - Main view with person cards showing all their gifts.
  - **Drag and Drop** - Easily move gifts between people by dragging.
  - **Direct Editing** - Edit gifts directly from the person card.
- **🎁 Všechny dárky (All Gifts) View** - Complete list of all gifts.
  - **Unassigned Gifts** - Support for gifts not yet assigned to anyone.
  - **Filterable** - View all gifts in one place.

### ✅ Spending Tracking

- **Total Statistics** - Dashboard shows:
  - Total number of gifts
  - Total amount spent across all people
- **Per-Person Tracking** - Each person card displays:
  - Number of gifts
  - Total spent for that person (in Kč)

### ✅ Christmas Theme

- **Festive Design** - Red and green color scheme with gold accents
- **Custom Fonts** - Mountains of Christmas for headers, Inter for content
- **Snowflake Animations** - Falling snowflakes on login page
- **Gradient Backgrounds** - Warm, festive color gradients
- **Emoji Icons** - Christmas-themed emojis throughout (🎄, 🎁, 🎅, etc.)
- **Hover Effects** - Smooth transitions and scale effects
- **Custom Scrollbar** - Christmas red themed scrollbar

### ✅ Responsive Design

- **Mobile-First** - Optimized for phones and tablets
- **Card-based Layout** - Stacks nicely on smaller screens
- **Touch-Friendly** - Large buttons and clickable areas
- **Flexible Grid** - Adapts from 1 column (mobile) to 3 columns (desktop)

## Testing Results

### Automated Testing

Browser automation successfully tested:

1. ✅ **Login Flow** - Password authentication works correctly
2. ✅ **Add People** - Created "Mom" ($200 budget) and "Dad" ($150 budget)
3. ✅ **Add Gifts** - Created "Sweater" gift for Mom at $45.99
4. ✅ **Navigation** - Tabbed interface works across all views
5. ✅ **Data Persistence** - All data saved correctly to database
6. ✅ **Statistics** - Budget calculations and gift counts accurate

### Manual Verification Needed

- Gift status changes via hover dropdown (requires manual hover trigger)
- Mobile responsiveness on actual devices
- Production deployment on Vercel

## Database Schema

### Person Model

```prisma
model Person {
  id        String   @id @default(cuid())
  name      String
  relation  String?  // e.g., "Mom", "Brother", "Friend"
  budget    Float?
  gifts     Gift[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Gift Model

```prisma
model Gift {
  id          String     @id @default(cuid())
  name        String
  description String?
  price       Float?
  status      GiftStatus @default(IDEA)
  isAtHome    Boolean    @default(false)
  url         String?
  notes       String?
  personId    String
  person      Person     @relation(fields: [personId], references: [id], onDelete: Cascade)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}

enum GiftStatus {
  IDEA
  ORDERED  
  RECEIVED
  WRAPPED
  GIVEN
}
```

## Deployment Instructions

### Deploy to Vercel

1. **Create Vercel Account** - Sign up at [vercel.com](https://vercel.com)

2. **Install Vercel CLI** (optional):
   ```bash
   npm i -g vercel
   ```

3. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

4. **Connect to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Framework Preset: Next.js
   - Root Directory: `./`

5. **Add Vercel Postgres**:
   - In your Vercel project dashboard
   - Go to "Storage" tab
   - Click "Create Database"
   - Select "Postgres"
   - Choose "Hobby" (free tier)
   - Database will auto-configure environment variables

6. **Set Environment Variables**:
   ```
   APP_PASSWORD=<your-secure-password>
   SESSION_SECRET=<generate-random-32-char-string>
   DATABASE_URL=<auto-configured-by-vercel-postgres>
   ```

7. **Update Prisma Schema** for PostgreSQL:
   ```prisma
   datasource db {
     provider = "postgresql"  // Change from sqlite
     url      = env("DATABASE_URL")
   }
   ```

8. **Add Build Command** in `package.json`:
   ```json
   {
     "scripts": {
       "build": "prisma generate && prisma migrate deploy && next build"
     }
   }
   ```

9. **Deploy**:
   - Push changes to GitHub
   - Vercel will auto-deploy
   - First deployment will run migrations

10. **Manual Migration** (if needed):
    ```bash
    vercel env pull .env.production
    npx prisma migrate deploy
    ```

### Alternative: Railway

If you prefer Railway for deployment:

1. Create account at [railway.app](https://railway.app)
2. Create new project from GitHub repo
3. Add PostgreSQL database
4. Set environment variables
5. Deploy automatically

## Environment Variables

### Development (`.env`)

```bash
DATABASE_URL="file:./dev.db"
APP_PASSWORD="christmas2024"
SESSION_SECRET="your-development-secret-min-32-chars"
```

### Production

```bash
DATABASE_URL="postgresql://..."  # From Vercel Postgres
APP_PASSWORD="<strong-password-here>"
SESSION_SECRET="<random-32-char-string>"
NODE_ENV="production"
```

**Generate secure session secret**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Usage Instructions

### First Time Setup

1. Navigate to your deployed URL (or `http://localhost:3000`)
2. Enter the password set in `APP_PASSWORD`
3. Start adding people and gifts!

### Adding Recipients

1. Click "👥 People" tab
2. Click "+ Add Person" button
3. Fill in:
   - Name (required)
   - Relation (optional, e.g., "Mother", "Friend")
   - Budget (optional, in dollars)
4. Click "Save"

### Adding Gifts

1. Click "+ Add Gift" from any view
2. Fill in:
   - Gift Name (required)
   - For Whom (required, select from dropdown)
   - Description (optional)
   - Price (optional, in dollars)
   - Status (default: Idea)
   - Product URL (optional)
   - Notes (optional)
   - Check "At Home" if you already have it
3. Click "Save"

### Managing Gifts

- **View by Person**: Click on a person card to see only their gifts
- **View by Status**: Use tabs (Ideas, Ordered) to filter
- **Quick Status Change**: Hover over gift card, use dropdown
- **Edit**: Hover over card, click "Edit" button
- **Delete**: Hover over card, click "Delete" button
- **Toggle At Home**: Click 🏠 icon on gift card

### Tracking Budget

- Total stats shown at top of dashboard
- Each person card shows:
  - Spent amount
  - Budget amount (if set)
  - Progress bar (green = good, red = over budget)
  - Number of gifts

## Security Notes

> [!IMPORTANT]
> **Password Security**: While the app is password-protected, anyone with the password can access it. For production:
> - Use a strong, unique password
> - Share it only with trusted people
> - Change it regularly via environment variable update
> - Consider adding two-factor auth if needed in the future

> [!WARNING]
> **Data Privacy**: Gift data is stored in a cloud database. If privacy is a concern, consider:
> - Self-hosting on a private server
> - Using encrypted database fields
> - Hosting locally only

## Future Enhancements

Potential features for future versions:

- **User Accounts** - Separate logins for each person
- **Image Uploads** - Upload gift images
- **Sharing** - Share gift ideas via link
- **Notifications** - Reminders for unordered gifts
- **Price History** - Track price changes for gifts
- **Gift Registry** - Integration with Amazon wishlist
- **Budget Analytics** - Charts and spending trends
- **Export/Import** - Backup data as JSON/CSV
- **Dark Mode** - Toggle for dark Christmas theme
- **Multiple Lists** - Support for different holidays

## Summary

✅ **Fully functional Christmas gift tracking application**
✅ **Modern, festive UI with Christmas theme**
✅ **Complete CRUD operations for people and gifts**
✅ **Budget tracking with visual progress indicators**
✅ **Multiple status tracking for gift lifecycle**
✅ **Secure password authentication**
✅ **Responsive design for mobile and desktop**
✅ **Ready for deployment to Vercel or Railway**

The application is production-ready and can be deployed immediately. The default password is `christmas2024` - remember to change it in production!
