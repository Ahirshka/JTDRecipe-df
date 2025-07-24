# Just The Damn Recipe

A modern recipe sharing platform that cuts through the fluff and gets straight to the recipes. No life stories, no endless scrolling - just the damn recipe.

## Features

- 🍳 **Clean Recipe Display** - Ingredients and instructions without the clutter
- 👥 **User Authentication** - Secure registration and login system
- 📝 **Recipe Submission** - Easy-to-use recipe submission form
- 🛡️ **Admin Moderation** - Professional moderation dashboard for recipe approval
- 📧 **Email Integration** - Email verification and password reset functionality
- 🔍 **Search & Categories** - Find recipes by category or search terms
- 📱 **Responsive Design** - Works perfectly on all devices
- ⚡ **Fast Performance** - Built with Next.js for optimal speed

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: PostgreSQL (Neon)
- **Email**: Resend
- **Authentication**: Custom JWT-based auth
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- PostgreSQL database (Neon recommended)
- Resend account for email

### Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/yourusername/JTDRecipe-lc.git
cd JTDRecipe-lc
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
\`\`\`bash
cp .env.example .env.local
\`\`\`

Fill in your environment variables:
\`\`\`env
DATABASE_URL="your_neon_database_url"
RESEND_API_KEY="your_resend_api_key"
FROM_EMAIL="contact@justthedamnrecipe.net"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
JWT_SECRET="your_jwt_secret"
\`\`\`

4. Set up the database:
\`\`\`bash
# Run the database setup script
npm run setup-db
\`\`\`

5. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

Visit `http://localhost:3000` to see the application.

## Database Setup

The application uses PostgreSQL with the following main tables:
- `users` - User accounts and authentication
- `recipes` - Recipe data and metadata
- `recipe_ingredients` - Recipe ingredients with amounts
- `recipe_instructions` - Step-by-step cooking instructions
- `recipe_tags` - Recipe tags for categorization
- `email_tokens` - Email verification and password reset tokens

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

1. Build the application:
\`\`\`bash
npm run build
\`\`\`

2. Start the production server:
\`\`\`bash
npm start
\`\`\`

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `RESEND_API_KEY` | Resend API key for emails | `re_xxxxxxxxxx` |
| `FROM_EMAIL` | Email address for sending emails | `contact@yourdomain.com` |
| `NEXT_PUBLIC_APP_URL` | Public URL of your application | `https://yourdomain.com` |
| `JWT_SECRET` | Secret for JWT token signing | `your-secret-key` |

## API Routes

- `/api/auth/*` - Authentication endpoints
- `/api/recipes` - Recipe CRUD operations
- `/api/admin/*` - Admin and moderation endpoints
- `/api/test/*` - Testing and health check endpoints

## Testing

### Recipe Submission
Visit `/test-recipe-submission` to submit test recipes.

### Admin Panel
Visit `/admin` to access the moderation dashboard (requires admin role).

### Email Testing
Visit `/test-email-system` to test email functionality.

### Deployment Testing
Visit `/test-deployment` to run comprehensive system tests.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email contact@justthedamnrecipe.net or create an issue on GitHub.
