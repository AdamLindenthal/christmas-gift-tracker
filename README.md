# 🎄 Vánoční Dárky (Christmas Gift Tracker) 🎁

A festive, modern web application for tracking Christmas gifts, recipients, and shopping status, localized in Czech.

![Christmas Gift Tracker](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)

## Features

- 🎅 **Simple Authentication** - Password-protected access for you and your partner
- 👥 **People Management** - Track gifts for family and friends
- 🎁 **Gift Tracking** - Manage gift ideas, orders, and delivery status
- 💰 **Spending Tracking** - Track total spending per person (in Kč)
- 🇨🇿 **Czech Localization** - Fully localized interface and currency
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- ❄️ **Festive UI** - Christmas-themed design with snowflakes and holiday colors

## Quick Start

### Prerequisites

- Node.js 18+ installed
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   cd christmas-gift-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set your password:
   ```
   APP_PASSWORD=your-secure-password
   ```

4. **Set up the database**
   ```bash
   npx prisma migrate dev
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Deployment

### Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add Vercel Postgres database in the Storage tab
4. Set environment variables:
   - `APP_PASSWORD` - Your chosen password
   - `SESSION_SECRET` - Random 32+ character string
   - `DATABASE_URL` - Auto-configured by Vercel Postgres

5. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

6. Deploy!

See [walkthrough.md](./walkthrough.md) for detailed deployment instructions.

## Usage

### Default Password

The default password is `christmas2024`. Change this in your `.env` file!

### Adding People

1. Click the "+ Add Person" button
2. Enter name, relation (optional), and budget (optional)
3. Click Save

### Adding Gifts

1. Click "+ Add Gift"
2. Fill in gift details:
   - Name and recipient (required)
   - Price, description, product URL (optional)
   - Status: Idea → Ordered → Received → Wrapped → Given
   - Mark if the gift is at home
3. Click Save

### Tracking Budget

- View total spending at the top of the dashboard
- Each person card shows spent vs. budget
- Green progress bar = under budget
- Red progress bar = over budget

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: SQLite (development) / PostgreSQL (production)
- **ORM**: Prisma
- **Authentication**: iron-session
- **Styling**: Tailwind CSS
- **Fonts**: Mountains of Christmas, Inter

## Project Structure

```
christmas-gift-tracker/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── people/       # People CRUD
│   │   └── gifts/        # Gifts CRUD
│   ├── login/            # Login page
│   ├── page.tsx          # Main dashboard
│   └── globals.css       # Styles
├── components/            # React components
│   ├── PersonCard.tsx    # Person card component
│   └── GiftCard.tsx      # Gift card component
├── lib/                   # Utilities
│   ├── prisma.ts         # Prisma client
│   ├── auth.ts           # Session management
│   └── utils.ts          # Helper functions
├── prisma/
│   └── schema.prisma     # Database schema
└── middleware.ts          # Auth middleware
```

## Environment Variables

Create a `.env` file with:

```bash
# Database URL
DATABASE_URL="file:./dev.db"

# App Password (CHANGE THIS!)
APP_PASSWORD="your-secure-password"

# Session Secret (generate a random string)
SESSION_SECRET="your-random-32-char-secret"
```

Generate a secure session secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Development

```bash
# Run development server
npm run dev

# Generate Prisma client
npx prisma generate

# Create a migration
npx prisma migrate dev --name migration_name

# Open Prisma Studio
npx prisma studio

# Build for production
npm run build

# Start production server
npm start
```

## Security

> ⚠️ **Important**: This app uses a single shared password. While suitable for couples or families, it's not designed for multi-user scenarios with individual accounts.

- Store your password securely
- Use a strong, unique password
- Change the default password immediately
- Never commit `.env` to version control
- Use HTTPS in production (Vercel provides this automatically)

## License

MIT License - feel free to use this for your own Christmas gift tracking!

## Support

For issues or questions, please check the [walkthrough.md](./walkthrough.md) for detailed documentation.

---

Made with ❤️ for tracking Christmas joy 🎄🎁

**Default Password**: `christmas2024` (remember to change this!)
