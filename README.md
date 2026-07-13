# Job Tracker

A premium, modern, and responsive client-side web application designed to help you track and manage your job applications. Styled in a high-contrast Vercel- and Linear-inspired dark mode aesthetic, it features robust status tracking, an active timeline logging engine, and direct Supabase database synchronization.

---

## 🚀 Key Features

* **Advanced Analytics Dashboard**: Track total opportunities, active pipelines, conversion rates, status distributions, and average target salaries.
* **Smart Data Table**: Real-time multi-criteria filtering (status, location, remote setup), sorting, full-text searching, and elegant client-side pagination.
* **Timeline Logging Engine**: Review a clear, visual chronology of every contact event, assessment, panel interview, and feedback point.
* **Supabase Integration**: Dual data-handling modes. Works seamlessly in **Local Storage mode** instantly, but connects dynamically to your own **Supabase DB** for durable cross-device synchronization with a single click.
* **Browser Extension Prep**: Exposes a clean, typed, globally-accessible insertion API (`window.JobTrackerAPI`) so custom content scripts can auto-insert applications directly from LinkedIn, Stripe, or Google Careers boards.
* **CSV Archiving**: Effortlessly export your entire pipeline or upload spreadsheet data to backup and restore your applications.

---

## 🛠️ Tech Stack

* **Frontend Framework**: React 19, TypeScript
* **Build Tooling**: Vite
* **Styling**: Tailwind CSS v4
* **Icons**: Lucide React
* **Animations**: Motion
* **Routing**: React Router DOM (Hash Routing configured for zero-setup hosting on GitHub Pages)

---

## 📁 Folder Structure

```
├── public/                  # Static assets and icons
├── src/
│   ├── components/
│   │   ├── ui/              # Reusable pixel-perfect atomic elements
│   │   │   ├── Badge.tsx    # Status pill renderers
│   │   │   ├── Button.tsx   # Premium tactile buttons
│   │   │   ├── Card.tsx     # Modern thin-bordered cards
│   │   │   └── FormElements.tsx # Custom inputs, select overlays, textareas
│   │   └── Layout.tsx       # Sidebar, sticky top nav, responsive shells
│   ├── lib/
│   │   ├── dbService.ts     # Data access layer, Supabase client, CSV, and extension API
│   │   └── mockData.ts      # 25+ rich, pre-loaded application records
│   ├── pages/
│   │   ├── Dashboard.tsx    # Key metrics, conversion progress, quick search table
│   │   ├── Applications.tsx # Comprehensive paginated data table
│   │   ├── ApplicationDetails.tsx # Detailed view, timeline manager, metadata editor
│   │   ├── AddApplication.tsx # Application creation wizard
│   │   └── Settings.tsx     # Credentials manager, database SQL instructions, CSV sync
│   ├── types/
│   │   └── index.ts         # TypeScript schema schemas and types
│   ├── App.tsx              # Application layout routes configuration
│   ├── index.css            # Global imports, Google Fonts, and custom scrollbars
│   └── main.tsx             # DOM boot entry point
├── supabase_schema.sql      # Complete SQL migration script
├── package.json             # Dependency configuration
└── vite.config.ts           # Vite compile parameters (relative base path enabled)
```

---

## ⚙️ Environment Variables

The application can read secret variables from your environment or configure them directly inside the in-app **Settings panel** to save them securely in local browser cache.

Copy `.env.example` to `.env` to configure your keys:

```env
# URL where your live applet is hosted
APP_URL="http://localhost:3000"
```

---

## ⚡ Setup & Development

### 1. Installation

Clone this repository and install dependencies:

```bash
npm install
```

### 2. Run Locally

Fire up the Vite development server on port 3000:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

### 3. Build & Compile

Produce a high-performance, minified static distribution in `dist/`:

```bash
npm run build
```

---

## ☁️ Connecting Supabase

### 1. Execute SQL Migration

Create an `applications` table in your Supabase SQL editor by running the script found in `supabase_schema.sql`. This sets up the columns, row-level security (RLS), and index triggers.

```sql
-- Create table and index
CREATE TABLE public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    remote VARCHAR(50) DEFAULT 'Remote',
    salary_min NUMERIC,
    salary_max NUMERIC,
    salary_text VARCHAR(255),
    source VARCHAR(255),
    job_url TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Saved',
    notes TEXT,
    applied_date DATE,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    timeline JSONB DEFAULT '[]'::jsonb
);
```

### 2. Plug in Credentials

In your Job Tracker, navigate to **Settings** and input:
1. **Supabase Project URL** (found in your Supabase dashboard under `Settings > API`)
2. **Supabase Anon Public Key** (found under the same tab)

Click **Connect Database**. Your data will instantly sync to your cloud database!

---

## 💻 Browser Extension Integration

If you want to build a chrome extension to auto-insert applications as you browse job posts, simply target the global API function exposed on the active tab's page scope:

```javascript
// Target the active web tab containing your Job Tracker
window.JobTrackerAPI.insertApplicationFromExtension({
  company: "OpenAI",
  position: "Research Engineer",
  salaryMin: 220000,
  salaryMax: 300000,
  location: "San Francisco, CA",
  remote: "Onsite",
  jobUrl: "https://openai.com/careers/research-engineer",
  source: "Company Website",
  notes: "Directly scraped from job board",
  status: "Saved"
});
```

---

## 🚢 Deploying to GitHub Pages

This app is 100% prepared for standard static hostings.

1. Ensure the `base` property in `vite.config.ts` matches your directory or relative targets (pre-configured to `"./"` for relative assets loading).
2. Run `npm run build` to output HTML/JS into `dist/`.
3. Upload or push the `dist/` directory contents to your `gh-pages` deployment branch. Hash Routing avoids any page refresh routing issues!
