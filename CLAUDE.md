# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a DB (database/lead) request form application for insurance sales representatives. The application is a multi-step form that collects order information, validates applicant details, sends confirmation emails, and stores submissions in Supabase.

**Tech Stack**: React + Vite, shadcn-ui components, Tailwind CSS, Express.js backend, Nodemailer for email, Supabase for data persistence.

## Development Commands

### Frontend Development
```bash
npm run dev           # Start Vite dev server on port 8080
npm run build         # Production build
npm run build:dev     # Development build with --mode development
npm run preview       # Preview production build
npm run lint          # Run ESLint
```

### Backend Development
```bash
npm run start:server  # Start Express server with nodemon on port 3001
```

### Full Stack Development
For local development, you need to run both frontend and backend:
1. Terminal 1: `npm run start:server` (Express API server)
2. Terminal 2: `npm run dev` (Vite frontend dev server)

## Architecture

### Application Flow
The application follows a 3-step wizard pattern managed in `src/pages/Index.jsx`:

1. **Step 1 - Product Selection** (`CheckboxGridPage.jsx`)
   - Users select DB products by company type (A, B), product variant, and region
   - Products are organized in accordion panels with checkboxes for each region
   - Selected items appear in a summary sidebar (desktop) or bottom sheet (mobile)
   - Quantity can be adjusted directly in the summary

2. **Step 2 - Applicant Form** (`ApplicantForm` component in `Index.jsx`)
   - Progressive form validation with animated field reveal
   - Fields appear sequentially as previous fields are validated
   - Form fields: name (Korean only), affiliation (dropdown), phone (010- prefix forced), email
   - Displays order summary with editable quantities

3. **Step 3 - Confirmation** (`OrderConfirmationPage` component in `Index.jsx`)
   - Success message after submission
   - Option to restart and create a new order

### State Management
- Local React state (`useState`) manages form steps, selections, and applicant data
- No external state management library (Redux, Zustand, etc.)
- State flows: `Index.jsx` → passes props down → child components → callbacks back up

### Form Validation
Progressive validation implemented in `ApplicantForm`:
- **Name**: Korean characters only (blocks English), required
- **Phone**: Forced `010-` prefix, numeric only, format `010-XXXX-XXXX`
- **Email**: Standard email regex, blocks Korean characters
- Fields reveal sequentially only after previous field validates

### Backend API (`api/send-email.js`)

Main Express server that handles:

**Endpoints**:
- `POST /api/send-email` - Submit order, save to Supabase, send emails
- `DELETE /api/submissions/:id` - Delete a submission and its order items
- `POST /api/submissions/bulk-delete` - Bulk delete submissions
- `PATCH /api/submissions/:id/status` - Update submission status (pending/confirmed/completed)
- `GET /api/submissions/aggregation` - Get aggregated submission data

**Email Flow**:
1. Saves submission to Supabase (if configured)
2. Sends email to admin(s) with order details
3. Sends confirmation email to applicant
4. Continues even if email fails (prioritizes data persistence)

**Database Schema**:
- `submissions` table: name, affiliation, phone, email, items_summary, total_amount, status
- `order_items` table: submission_id (FK), db_type, product_name, region, quantity, unit_price, total_price

### Component Structure

**UI Components** (`src/components/ui/`):
- shadcn-ui components (50+ components from Radix UI)
- Customized with Tailwind CSS via `cn()` utility
- Key components used: Button, Input, Select, Label, Card, Checkbox, Accordion, AlertDialog, Toast

**Page Components** (`src/pages/`):
- `Index.jsx` - Main wizard orchestrator
- `CheckboxGridPage.jsx` - Product selection grid
- `HistoryPage.jsx` - (appears unused in main flow)
- `OrderConfirmationPage.jsx` - (embedded in Index.jsx, separate file may be legacy)
- `AdminDashboard.jsx` - (admin functionality)

### Styling System
- **Tailwind CSS** for utility classes
- **CSS Variables** for theming in `src/index.css`
- **Framer Motion** for animations (form field reveals, sidebar slide-ins)
- **Responsive Design**: Mobile-first with `lg:` breakpoint for desktop layouts

## Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Backend Email (Nodemailer)
SENDER_EMAIL=your-gmail@gmail.com
SENDER_APP_PASSWORD=your-gmail-app-password
RECIPIENT_EMAIL=admin@company.com  # Comma-separated for multiple recipients

# Backend Supabase (Service Role)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Frontend Supabase (Client Access)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Frontend API URL (optional, auto-detected)
VITE_API_BASE_URL=http://localhost:3001  # For production: your deployed API URL
```

**Important Notes**:
- Frontend env vars MUST be prefixed with `VITE_`
- Gmail requires "App Password" (2FA must be enabled): https://myaccount.google.com/apppasswords
- Supabase can be skipped for email-only operation (app will log warnings but continue)
- `RECIPIENT_EMAIL` supports comma-separated multiple recipients

## Key Product Rules

**Minimum Order Quantities**:
- All DB products require minimum 5 units per order
- Can be combined across regions/products to meet minimum

**Company Types**:
- **A업체**: Single product type "[보장분석] 일반" at 80,000원
- **B업체**: 7 product variants with different prices (50,000원 - 90,000원)

**Regions**: 8 regions available for all products:
- 서울/인천/경기, 대전/충청, 광주/전남, 전북, 대구/경북, 부산/울산/경남, 강원, 제주

**A/S (After-Service) Rules**:
- Different refund/replacement rules for each company type
- Documented in `CheckboxGridPage.jsx` info sections
- A업체 has special "장기부재 AS" conditions (2 calls/day for 2 days)

## File Organization Conventions

- **Pages**: `src/pages/*.jsx` - Route-level components
- **UI Components**: `src/components/ui/*.jsx` - shadcn-ui primitives
- **Styles**: `src/index.css` - Global styles, `src/styles.css` - Additional utilities
- **API Routes**: `api/*.js` - Express endpoints (Vercel serverless functions)
- **API Utilities**: `api/lib/*.js` - Shared backend utilities (Supabase client, aggregation logic)

## Common Development Tasks

### Adding a New Product Type
1. Update `companyTypes` object in `CheckboxGridPage.jsx`
2. Add new type with: `name`, `price`, `description`
3. A/S rules section will automatically include it in the accordion

### Modifying Email Templates
1. Edit `adminMailOptions` and `applicantMailOptions` in `api/send-email.js`
2. Both use HTML templates with inline styles
3. Test with real email addresses (check spam folder)

### Adding Form Validation
1. Update `validateField()` function in `ApplicantForm` component
2. Add validation logic for the specific field name
3. Update error state handling in `handleInputChange()`

### Testing Email Flow Locally
1. Set up Gmail App Password: Google Account → Security → 2-Step Verification → App Passwords
2. Configure `.env` with `SENDER_EMAIL` and `SENDER_APP_PASSWORD`
3. Start backend: `npm run start:server`
4. Submit test order through frontend
5. Check both admin and applicant email addresses

### Debugging API Issues
- Backend logs appear in the terminal running `npm run start:server`
- Check for "✅" success indicators or "⚠️" warnings in server logs
- API base URL resolution is logged on server start
- Supabase connection status logged on server initialization

## Import Aliases

The project uses path aliases configured in `vite.config.js`:
- `@/*` → `src/*` (e.g., `@/components/ui/button`)
- `lib/*` → `lib/*` (root-level lib directory)

## Deployment Notes

**Vercel Deployment** (Current Setup):
- Frontend and backend deployed as single Vercel project
- API routes in `api/` folder become serverless functions
- Environment variables must be configured in Vercel dashboard
- CORS configured for production domain: `https://db-request-ext.vercel.app`

**Frontend-Backend Communication**:
- `resolveApiBaseUrl()` function in `Index.jsx` auto-detects environment
- Development: `http://localhost:3001`
- Production: Uses `window.location.origin` or `VITE_API_BASE_URL`

## Critical Code Patterns

### Phone Number Input Enforcement
The phone input uses controlled component pattern with forced prefix:
```javascript
if (!value.startsWith('010-')) {
  setApplicant(prev => ({ ...prev }));
  return;
}
```
Do not remove the `010-` prefix logic - it's a business requirement.

### Email Sending Error Handling
The API continues even if email fails (data persistence prioritized):
```javascript
try {
  await Promise.all([sendAdminMail, sendApplicantMail]);
  res.status(200).send('Success');
} catch (error) {
  res.status(200).send('Saved (email failed)');
}
```
This ensures orders are recorded even with email server issues.

### Selection State Management
Uses dual state for selections:
- `selections` object: Tracks checkbox state by key `${dbType}-${typeName}-${region}`
- `selectedItems` array: Tracks actual order items with quantities and totals

Keep these synchronized when modifying selection logic.

## Browser Compatibility

- Target: Modern browsers (ES2020+)
- Mobile-first responsive design with Tailwind breakpoints
- Tested on iOS Safari, Chrome, Android Chrome
- Uses Framer Motion for animations (requires JS enabled)

## Known Limitations

- No authentication/authorization system
- No client-side routing beyond the 3-step wizard
- Admin dashboard exists but is not integrated into main flow
- History page exists but is not actively used
- Email delivery depends on Gmail SMTP (consider SendGrid/Postmark for production)
