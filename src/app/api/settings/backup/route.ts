import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { spawn } from 'child_process';

export const runtime = 'nodejs'; 

export async function GET(): Promise<Response> {
  const session = await auth();
  
  if (!session?.user?.organizationId || !['OWNER', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return NextResponse.json({ error: 'DB URL not configured' }, { status: 500 });
  }

  try {
    const url = new URL(dbUrl);
    const user = url.username;
    const password = url.password;
    const host = url.hostname;
    const port = url.port || '5432';
    const dbName = url.pathname.slice(1);

    const dump = spawn('pg_dump', ['-h', host, '-p', port, '-U', user, '-d', dbName, '-F', 'p'], {
      env: { ...process.env, PGPASSWORD: password },
    });
    const stream = new ReadableStream({
      start(controller) {
        dump.stdout.on('data', (chunk) => controller.enqueue(chunk));
        dump.stdout.on('end', () => controller.close());
        dump.stderr.on('data', (err) => console.error('[PG_DUMP_STDERR]', err.toString()));
        dump.on('error', (err) => {
          console.error('[PG_DUMP_ERROR]', err);
          controller.error(err);
        });
      },
      cancel() {
        dump.kill(); 
      }
    });

    const date = new Date().toISOString().split('T')[0];
  
    return new Response(stream, {
      headers: {
        'Content-Type': 'application/sql',
        'Content-Disposition': `attachment; filename="realcrm-backup-${date}.sql"`,
      },
    });
  } catch (error) {
    console.error('[BACKUP_ERROR]', error);
    return NextResponse.json({ error: 'Failed to create backup' }, { status: 500 });
  }
}