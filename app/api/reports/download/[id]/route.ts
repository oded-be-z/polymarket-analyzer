/**
 * Sentimark PDF Report Download Endpoint
 * GET /api/reports/download/{reportId}
 *
 * Streams PDF report to user
 * For production: redirect to Azure Blob Storage URL
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, ErrorCode } from '@/INTERFACE_CONTRACTS';
import * as fs from 'fs/promises';
import * as path from 'path';

// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic';


interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const reportId = params.id;

    if (!reportId) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: ErrorCode.INVALID_INPUT,
          message: 'Report ID is required',
        },
        timestamp: new Date().toISOString(),
      }, { status: 400 });
    }

    // TODO: For production, redirect to Azure Blob Storage URL
    // return NextResponse.redirect(blobStorageUrl);

    // For MVP, stream from filesystem
    const reportsDir = path.join(process.cwd(), 'tmp', 'reports');

    try {
      const files = await fs.readdir(reportsDir);
      const reportFile = files.find(f => f.startsWith(`report_${reportId}_`));

      if (!reportFile) {
        return NextResponse.json<ApiResponse<null>>({
          success: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: 'Report not found or has expired',
          },
          timestamp: new Date().toISOString(),
        }, { status: 404 });
      }

      // Read PDF file
      const filepath = path.join(reportsDir, reportFile);
      const pdfBuffer = await fs.readFile(filepath);

      // Extract market ID from filename or use default
      const filename = `sentimark_report_${reportId}.pdf`;

      // Stream PDF to user
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': pdfBuffer.length.toString(),
          'Cache-Control': 'private, max-age=3600', // Cache for 1 hour
          'X-Report-ID': reportId,
        },
      });

    } catch (error) {
      console.error('[Report Download] File read error:', error);

      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: ErrorCode.NOT_FOUND,
          message: 'Report not found or has expired',
        },
        timestamp: new Date().toISOString(),
      }, { status: 404 });
    }

  } catch (error) {
    console.error('[Report Download] Error:', error);

    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to download report',
      },
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
