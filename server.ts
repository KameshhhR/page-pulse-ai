import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import * as cheerio from "cheerio";
import PDFDocument from "pdfkit";

export const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory cache for reports
const reportCache = new Map<string, any>();

function calculateHealthScore(data: any) {
  let score = 100;
  const suggestions: string[] = [];

  // Performance
  if (data.responseTime > 2000) {
    score -= 15;
    suggestions.push("Slow Response Time: Server took more than 2 seconds to respond. Consider upgrading hosting or using a CDN.");
  } else if (data.responseTime > 800) {
    score -= 5;
    suggestions.push("Moderate Response Time: Optimize server performance or enable caching.");
  }

  // SEO
  if (!data.title || data.title.length < 10) {
    score -= 10;
    suggestions.push("Missing or Short Title: Add a descriptive page title (40-60 characters).");
  }
  
  if (!data.metaDescription || data.metaDescription.length < 50) {
    score -= 10;
    suggestions.push("Missing or Short Meta Description: Add a compelling meta description (150-160 characters).");
  }

  if (data.h1Count === 0) {
    score -= 10;
    suggestions.push("Missing H1 Tag: The page should have exactly one H1 tag summarizing its content.");
  } else if (data.h1Count > 1) {
    score -= 5;
    suggestions.push("Multiple H1 Tags: It's best practice to use only one H1 tag per page.");
  }

  // Accessibility
  if (data.imagesMissingAlt > 0) {
    score -= Math.min(15, data.imagesMissingAlt * 2);
    suggestions.push(`Missing Alt Text: ${data.imagesMissingAlt} image(s) lack 'alt' attributes. Add descriptive alt text for accessibility and SEO.`);
  }

  // Content
  if (data.wordCount < 300) {
    score -= 10;
    suggestions.push("Very Low Word Count: Thin content may struggle to rank. Aim for at least 300 words.");
  }

  return { score: Math.max(0, score), suggestions };
}

app.post("/api/analyze", async (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: "Invalid URL provided." });
  }

  let formattedUrl = url.trim();
  if (!/^https?:\/\//i.test(formattedUrl)) {
    formattedUrl = 'http://' + formattedUrl;
  }

  const startTime = Date.now();
  try {
    const response = await axios.get(formattedUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'PagePulseAI/1.0'
      },
      // Do not throw on 4xx/5xx to capture status codes
      validateStatus: () => true 
    });
    
    const responseTime = Date.now() - startTime;
    const statusCode = response.status;
    const contentType = response.headers['content-type'] || '';

    if (!contentType.includes('text/html')) {
      return res.status(400).json({ 
        error: "Non-HTML content detected.", 
        details: `Content-Type is ${contentType}. Only HTML pages are supported.`
      });
    }

    const html = response.data;
    const $ = cheerio.load(html);

    const title = $('title').text().trim();
    const metaDescription = $('meta[name="description"]').attr('content')?.trim() || '';
    const h1Count = $('h1').length;
    
    let imagesMissingAlt = 0;
    $('img').each((_, el) => {
      const alt = $(el).attr('alt');
      if (alt === undefined || alt.trim() === '') {
        imagesMissingAlt++;
      }
    });

    // Approximate word count (strip scripts/styles, get text, split by whitespace)
    $('script, style, noscript').remove();
    const textContent = $('body').text().replace(/\s+/g, ' ').trim();
    const wordCount = textContent ? textContent.split(' ').length : 0;

    const analysisData = {
      url: formattedUrl,
      statusCode,
      responseTime,
      title,
      metaDescription,
      h1Count,
      imagesMissingAlt,
      wordCount,
    };

    const { score, suggestions } = calculateHealthScore(analysisData);
    
    const finalResult = {
      ...analysisData,
      score,
      suggestions
    };

    // Cache the result for PDF generation
    reportCache.set(formattedUrl, finalResult);
    
    // Simple cache cleanup (keep max 100)
    if (reportCache.size > 100) {
      const firstKey = reportCache.keys().next().value;
      reportCache.delete(firstKey);
    }

    return res.json(finalResult);

  } catch (error: any) {
    if (error.code === 'ECONNABORTED') {
      return res.status(408).json({ error: "Request timed out after 10 seconds." });
    }
    return res.status(500).json({ error: "Failed to analyze URL.", details: error.message });
  }
});

app.get("/api/download-report", (req, res) => {
  const url = req.query.url as string;
  if (!url) {
    return res.status(400).json({ error: "URL query parameter is required." });
  }

  const data = reportCache.get(url);
  if (!data) {
    return res.status(404).json({ error: "Report not found. Please analyze the URL first." });
  }

  const doc = new PDFDocument({ margin: 50 });
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="PagePulse_Report.pdf"`);
  
  doc.pipe(res);
  
  // PDF Content
  doc.fontSize(24).font('Helvetica-Bold').text('Page Pulse AI', { align: 'center' });
  doc.fontSize(14).font('Helvetica').text('Website Health & SEO Analyzer', { align: 'center' });
  doc.moveDown(2);

  doc.fontSize(12).font('Helvetica-Bold').text(`URL: `, { continued: true }).font('Helvetica').text(data.url);
  doc.font('Helvetica-Bold').text(`Date: `, { continued: true }).font('Helvetica').text(new Date().toLocaleString());
  doc.moveDown(1);

  doc.fontSize(16).font('Helvetica-Bold').text(`Health Score: ${data.score}/100`);
  doc.moveDown(1);

  doc.fontSize(14).font('Helvetica-Bold').text('Analysis Results:');
  doc.moveDown(0.5);
  doc.fontSize(12);
  doc.font('Helvetica-Bold').text('HTTP Status Code: ', { continued: true }).font('Helvetica').text(data.statusCode.toString());
  doc.font('Helvetica-Bold').text('Response Time: ', { continued: true }).font('Helvetica').text(`${data.responseTime} ms`);
  doc.font('Helvetica-Bold').text('Page Title: ', { continued: true }).font('Helvetica').text(data.title || 'N/A');
  doc.font('Helvetica-Bold').text('Meta Description: ', { continued: true }).font('Helvetica').text(data.metaDescription || 'N/A');
  doc.font('Helvetica-Bold').text('H1 Count: ', { continued: true }).font('Helvetica').text(data.h1Count.toString());
  doc.font('Helvetica-Bold').text('Images Missing Alt Text: ', { continued: true }).font('Helvetica').text(data.imagesMissingAlt.toString());
  doc.font('Helvetica-Bold').text('Word Count: ', { continued: true }).font('Helvetica').text(data.wordCount.toString());
  doc.moveDown(1);

  if (data.suggestions && data.suggestions.length > 0) {
    doc.fontSize(14).font('Helvetica-Bold').text('AI Suggestions:');
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica');
    data.suggestions.forEach((suggestion: string, index: number) => {
      doc.text(`${index + 1}. ${suggestion}`);
    });
  } else {
    doc.fontSize(14).font('Helvetica-Bold').text('AI Suggestions:');
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').text('Great job! No critical issues found.');
  }

  doc.end();
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}
