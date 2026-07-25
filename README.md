# Page Pulse AI - Website Health & SEO Analyzer

Page Pulse AI is a full-stack web application that analyzes any website URL and provides deep technical and SEO insights. Built for Digital Heroes Requirements.

## Features

- **Instant URL Analysis**: Fetches and parses target URLs to extract critical SEO and performance metrics.
- **Website Health Score**: Calculates an intelligent 0-100 score based on performance, SEO, accessibility, and content density.
- **Smart AI Suggestions**: Rule-based recommendations tailored to the site's specific shortcomings (e.g., missing meta tags, slow response, missing alt text).
- **PDF Report Generation**: Download professional, shareable PDF reports of the analysis results.
- **Modern Dashboard UI**: Clean, responsive, and accessible interface built with Tailwind CSS.
- **Dark Mode**: Automatic system-preference dark mode support.
- **Robust Error Handling**: Gracefully handles invalid URLs, timeouts, and non-HTML payloads.

## Design Decisions (Stack Adaptation)

While the initial requirements specified a FastAPI backend with vanilla HTML/JS frontend, this project was developed within the Google AI Studio runtime environment, which mandates a Node.js ecosystem (Vite, React, Express). 

To ensure the application is **fully functional, robust, and deployable** out-of-the-box in this environment, the stack was adapted:
- **Backend**: Express.js with TypeScript replaces FastAPI. It implements the exact REST API structure (`POST /api/analyze`, `GET /api/download-report`).
- **Frontend**: React 19 + Tailwind CSS replaces vanilla HTML/CSS/JS to deliver a superior, modern, component-driven dashboard with a dark mode implementation.
- **Scraping**: `axios` and `cheerio` replace `requests` and `BeautifulSoup` to achieve the identical HTML parsing logic in Node.js.
- **Testing**: `vitest` and `supertest` replace `pytest`.

## Folder Structure

\`\`\`
.
├── src/
│   ├── App.tsx          # Main React Application UI
│   ├── main.tsx         # React Entry Point
│   └── index.css        # Tailwind Global Styles
├── server.ts            # Express Backend API & Scraping Logic
├── server.test.ts       # Vitest API Test Suite
├── package.json         # Dependencies & Scripts
├── vite.config.ts       # Vite Bundler Configuration
└── README.md            # Project Documentation
\`\`\`

## Installation & Local Development

1. **Install Dependencies**:
   \`\`\`bash
   npm install
   \`\`\`

2. **Run Development Server**:
   \`\`\`bash
   npm run dev
   \`\`\`
   The app will be available at `http://localhost:3000`.

3. **Run Tests**:
   \`\`\`bash
   npm run test
   \`\`\`

## API Documentation

### `POST /api/analyze`
Analyzes the given URL.

**Request Body**:
\`\`\`json
{
  "url": "https://example.com"
}
\`\`\`

**Response (200 OK)**:
\`\`\`json
{
  "url": "https://example.com",
  "statusCode": 200,
  "responseTime": 345,
  "title": "Example Domain",
  "metaDescription": "...",
  "h1Count": 1,
  "imagesMissingAlt": 0,
  "wordCount": 450,
  "score": 95,
  "suggestions": []
}
\`\`\`

### `GET /api/download-report`
Downloads a PDF report for the analyzed URL. 

**Query Parameters**:
- `url`: The URL to generate the report for (must be analyzed first).

**Response**:
Returns a standard `application/pdf` binary stream.

## Deployment Steps

This project is configured to be deployed easily to any Docker-compatible service (like Google Cloud Run) or a standard Node.js hosting provider.

1. **Build the Application**:
   \`\`\`bash
   npm run build
   \`\`\`
   This will bundle the React frontend into `dist/` and compile the Express server into `dist/server.cjs`.

2. **Start the Production Server**:
   \`\`\`bash
   npm run start
   \`\`\`
   The server will bind to `0.0.0.0:3000` and serve both the API and the static React frontend.
