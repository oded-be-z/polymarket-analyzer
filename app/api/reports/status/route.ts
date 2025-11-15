/**
 * Sentimark PDF Report Status Endpoint
 * GET /api/reports/status?reportId={id}
 *
 * Returns the generation status of a PDF report
 * Used for polling async report generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { PDFReportMetadata, ApiResponse, ErrorCode } from '@/INTERFACE_CONTRACTS';
import * as fs from 'fs/promises';
import * as path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('reportId');

    if (!reportId) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: ErrorCode.INVALID_INPUT,
          message: 'reportId query parameter is required',
        },
        timestamp: new Date().toISOString(),
      }, { status: 400 });
    }

    // TODO: For MVP, check file system
    // TODO: For production, check database + Azure Blob Storage
    const reportsDir = path.join(process.cwd(), 'tmp', 'reports');

    try {
      const files = await fs.readdir(reportsDir);
      const reportFile = files.find(f => f.startsWith(`report_${reportId}_`));

      if (!reportFile) {
        return NextResponse.json<ApiResponse<null>>({
          success: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: 'Report not found',
          },
          timestamp: new Date().toISOString(),
        }, { status: 404 });
      }

      // Get file stats
      const filepath = path.join(reportsDir, reportFile);
      const stats = await fs.stat(filepath);

      // Build metadata response
      const metadata: PDFReportMetadata = {
        reportId,
        marketId: 'unknown', // TODO: Store in database
        userId: 'unknown', // TODO: Store in database
        generatedAt: stats.birthtime.toISOString(),
        status: 'completed',
        downloadUrl: `/api/reports/download/${reportId}`,
        expiresAt: new Date(stats.birthtime.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        pageCount: 10,
        fileSize: stats.size,
      };

      return NextResponse.json<ApiResponse<PDFReportMetadata>>({
        success: true,
        data: metadata,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: ErrorCode.NOT_FOUND,
          message: 'Report not found',
        },
        timestamp: new Date().toISOString(),
      }, { status: 404 });
    }

  } catch (error) {
    console.error('[Report Status] Error:', error);

    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to retrieve report status',
      },
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
