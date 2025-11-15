/**
 * Sentimark PDF Report Generator
 * Uses Playwright (headless Chromium) for high-fidelity PDF generation
 *
 * Performance Target: 5-8 seconds per PDF
 * Memory Usage: ~300-500MB per generation
 */

import { chromium, Browser, BrowserContext, Page } from 'playwright';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PDFReportContent, PDFReportMetadata, PDFReportRequest } from '@/INTERFACE_CONTRACTS';

interface PDFGeneratorOptions {
  headless?: boolean;
  timeout?: number;
  debug?: boolean;
}

export class PDFGenerator {
  private browser: Browser | null = null;
  private options: PDFGeneratorOptions;
  private static instance: PDFGenerator | null = null;

  private constructor(options: PDFGeneratorOptions = {}) {
    this.options = {
      headless: true,
      timeout: 30000, // 30 seconds max
      debug: process.env.NODE_ENV === 'development',
      ...options,
    };
  }

  /**
   * Singleton pattern for browser reuse
   */
  static async getInstance(): Promise<PDFGenerator> {
    if (!PDFGenerator.instance) {
      PDFGenerator.instance = new PDFGenerator();
      await PDFGenerator.instance.initialize();
    }
    return PDFGenerator.instance;
  }

  /**
   * Initialize Playwright browser (reusable)
   */
  private async initialize(): Promise<void> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: this.options.headless,
        args: [
          '--disable-blink-features=AutomationControlled',
          '--disable-dev-shm-usage',
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-web-security', // For local fonts/assets
        ],
      });

      if (this.options.debug) {
        console.log('[PDF Generator] Browser initialized');
      }
    }
  }

  /**
   * Generate PDF from report content
   * Returns: Buffer containing PDF data
   */
  async generateReport(
    request: PDFReportRequest,
    content: PDFReportContent
  ): Promise<Buffer> {
    const startTime = Date.now();

    await this.initialize();

    // Create isolated browser context for this generation
    const context = await this.browser!.newContext({
      viewport: { width: 1200, height: 1600 },
    });

    try {
      const page = await context.newPage();

      // Load HTML template with report content
      const html = await this.renderTemplate(content, request.includePerplexity);

      // Set content and wait for resources to load
      await page.setContent(html, {
        waitUntil: 'networkidle',
        timeout: this.options.timeout,
      });

      // Generate PDF with A4 dimensions
      const pdf = await page.pdf({
        format: 'A4',
        margin: {
          top: '20mm',
          bottom: '20mm',
          left: '15mm',
          right: '15mm',
        },
        scale: 1.0,
        printBackground: true,
        preferCSSPageSize: false,
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      if (this.options.debug) {
        console.log(`[PDF Generator] Generated in ${duration}ms`);
      }

      return Buffer.from(pdf);
    } finally {
      // Always close context to prevent memory leaks
      await context.close();
    }
  }

  /**
   * Render HTML template from PDFReportContent
   */
  private async renderTemplate(
    content: PDFReportContent,
    includePerplexity: boolean
  ): Promise<string> {
    // Load base template and styles
    const templatePath = path.join(process.cwd(), 'templates', 'report-template.html');
    const stylesPath = path.join(process.cwd(), 'templates', 'report-styles.css');

    let template = await fs.readFile(templatePath, 'utf-8');
    const styles = await fs.readFile(stylesPath, 'utf-8');

    // Replace template variables with actual content
    template = template
      // Cover page
      .replace('{{MARKET_QUESTION}}', this.escapeHtml(content.cover.marketQuestion))
      .replace('{{GENERATED_DATE}}', content.cover.generatedDate)

      // Executive Summary
      .replace('{{AI_PREDICTION}}', content.executiveSummary.aiPrediction)
      .replace('{{CONFIDENCE}}', content.executiveSummary.confidence.toString())
      .replace('{{KEY_INSIGHTS}}', this.renderKeyInsights(content.executiveSummary.keyInsights))
      .replace('{{RISK_LEVEL}}', content.executiveSummary.riskLevel.toUpperCase())
      .replace('{{RISK_CLASS}}', `risk-${content.executiveSummary.riskLevel}`)

      // Market Overview
      .replace('{{PRICE}}', content.marketOverview.price.toFixed(2))
      .replace('{{VOLUME}}', this.formatNumber(content.marketOverview.volume))
      .replace('{{LIQUIDITY}}', this.formatNumber(content.marketOverview.liquidity))
      .replace('{{MARKET_STATUS}}', content.marketOverview.active ? 'Active' : 'Closed')

      // Price Chart
      .replace('{{PRICE_CHART_IMAGE}}', content.priceChart.chartImageUrl)

      // Sentiment Analysis
      .replace('{{OVERALL_SENTIMENT}}', (content.sentimentAnalysis.overallSentiment * 100).toFixed(1))
      .replace('{{SENTIMENT_SOURCES}}', this.renderSentimentSources(content.sentimentAnalysis.sourceBreakdown))
      .replace('{{SENTIMENT_TREND_CHART}}', content.sentimentAnalysis.trendChart)

      // AI Predictions
      .replace('{{PREDICTED_OUTCOME}}', this.escapeHtml(content.aiPredictions.predictedOutcome))
      .replace('{{REASONING}}', this.escapeHtml(content.aiPredictions.reasoning))
      .replace('{{CONFIDENCE_ANALYSIS}}', this.escapeHtml(content.aiPredictions.confidenceAnalysis))

      // Risk Disclaimer
      .replace('{{RISK_FACTORS}}', this.renderRiskFactors(content.riskDisclaimer.riskFactors))
      .replace('{{LEGAL_DISCLAIMER}}', this.escapeHtml(content.riskDisclaimer.legalDisclaimer))
      .replace('{{CAVEATS}}', this.renderCaveats(content.riskDisclaimer.caveats))

      // Inject CSS styles
      .replace('{{STYLES}}', styles);

    // Conditionally include Perplexity sections
    if (includePerplexity && content.marketContext) {
      template = template
        .replace('{{MARKET_BACKGROUND}}', this.escapeHtml(content.marketContext.background))
        .replace('{{KEY_EVENTS}}', this.renderKeyEvents(content.marketContext.keyEvents))
        .replace('{{EXPERT_OPINIONS}}', this.renderExpertOpinions(content.marketContext.expertOpinions));
    } else {
      // Remove Perplexity sections
      template = template.replace(/<!-- PERPLEXITY_START -->.*?<!-- PERPLEXITY_END -->/gs, '');
    }

    if (includePerplexity && content.historicalComparison) {
      template = template
        .replace('{{SIMILAR_MARKETS}}', this.renderSimilarMarkets(content.historicalComparison.similarMarkets))
        .replace('{{PATTERNS}}', this.renderPatterns(content.historicalComparison.patterns));
    } else {
      // Remove historical comparison section
      template = template.replace(/<!-- HISTORICAL_START -->.*?<!-- HISTORICAL_END -->/gs, '');
    }

    return template;
  }

  /**
   * Helper rendering methods
   */
  private renderKeyInsights(insights: string[]): string {
    return insights.map(insight => `<li>${this.escapeHtml(insight)}</li>`).join('\n');
  }

  private renderSentimentSources(sources: Array<{ source: string; sentiment: number }>): string {
    return sources.map(s => `
      <tr>
        <td>${this.escapeHtml(s.source)}</td>
        <td class="sentiment-value">${(s.sentiment * 100).toFixed(1)}%</td>
      </tr>
    `).join('\n');
  }

  private renderRiskFactors(factors: string[]): string {
    return factors.map(factor => `<li>⚠ ${this.escapeHtml(factor)}</li>`).join('\n');
  }

  private renderCaveats(caveats: string[]): string {
    return caveats.map(caveat => `<li>${this.escapeHtml(caveat)}</li>`).join('\n');
  }

  private renderKeyEvents(events: string[]): string {
    return events.map(event => `<li>${this.escapeHtml(event)}</li>`).join('\n');
  }

  private renderExpertOpinions(opinions: string[]): string {
    return opinions.map(opinion => `<li>${this.escapeHtml(opinion)}</li>`).join('\n');
  }

  private renderSimilarMarkets(markets: string[]): string {
    return markets.map(market => `<li>${this.escapeHtml(market)}</li>`).join('\n');
  }

  private renderPatterns(patterns: string[]): string {
    return patterns.map(pattern => `<li>${this.escapeHtml(pattern)}</li>`).join('\n');
  }

  /**
   * Utility methods
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  private formatNumber(num: number): string {
    if (num >= 1_000_000) {
      return `$${(num / 1_000_000).toFixed(2)}M`;
    } else if (num >= 1_000) {
      return `$${(num / 1_000).toFixed(2)}K`;
    } else {
      return `$${num.toFixed(2)}`;
    }
  }

  /**
   * Cleanup resources
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      PDFGenerator.instance = null;

      if (this.options.debug) {
        console.log('[PDF Generator] Browser closed');
      }
    }
  }
}

/**
 * Convenience function for single-use generation
 */
export async function generatePDF(
  request: PDFReportRequest,
  content: PDFReportContent
): Promise<Buffer> {
  const generator = await PDFGenerator.getInstance();
  return generator.generateReport(request, content);
}
