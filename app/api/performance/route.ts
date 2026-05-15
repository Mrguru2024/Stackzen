import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/db';
import { performanceMetrics } from '@/lib/db/schema';
import { desc, and, gte, lte, eq } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const componentName = searchParams.get('componentName');
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');
    const metricType = searchParams.get('metricType');
    const format = searchParams.get('format') || 'json';

    const conditions = [];
    if (componentName) {
      conditions.push(eq(performanceMetrics.componentName, componentName));
    }
    if (startTime) {
      conditions.push(gte(performanceMetrics.timestamp, new Date(startTime)));
    }
    if (endTime) {
      conditions.push(lte(performanceMetrics.timestamp, new Date(endTime)));
    }
    if (metricType) {
      conditions.push(eq(performanceMetrics.metricName, metricType));
    }

    const base = db.select().from(performanceMetrics);
    const filtered = conditions.length > 0 ? base.where(and(...conditions)) : base;
    const metrics = await filtered.orderBy(desc(performanceMetrics.timestamp)).limit(1000);

    // Format response based on requested format
    if (format === 'csv') {
      const headers = ['timestamp', 'componentName', 'metricName', 'value'];
      const csvContent = [
        headers.join(','),
        ...metrics.map(metric =>
          [
            metric.timestamp.toISOString(),
            metric.componentName,
            metric.metricName,
            metric.value,
          ].join(',')
        ),
      ].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename=performance-metrics.csv',
        },
      });
    }

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { componentName, metricName, value } = body;

    if (!componentName || !metricName || value === undefined) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const metric = await db
      .insert(performanceMetrics)
      .values({
        componentName,
        metricName,
        value,
        timestamp: new Date(),
      })
      .returning();

    return NextResponse.json(metric[0]);
  } catch (error) {
    console.error('Error recording performance metric:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
