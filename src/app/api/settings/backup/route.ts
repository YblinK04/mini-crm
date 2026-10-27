import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { auth } from '@/lib/auth';

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
    const user = decodeURIComponent(url.username);
    const password = decodeURIComponent(url.password);
    const host = url.hostname;
    const port = url.port || '5432';
    const dbName = decodeURIComponent(url.pathname.slice(1));

    const pgDump = spawn(
      'pg_dump',
      ['-h', host, '-p', port, '-U', user, '-d', dbName, '-F', 'p', '--no-owner', '--no-privileges'],
      { env: { ...process.env, PGPASSWORD: password } }
    );

    const killTimer = setTimeout(() => {
      console.warn('[BACKUP_TIMEOUT] Killing pg_dump after 5 min');
      pgDump.kill('SIGTERM');
    }, 5 * 60 * 1000);

    let isClosed = false;

    const stream = new ReadableStream({
      start(controller) {
        pgDump.stdout.on('data', (chunk: Buffer) => {
          controller.enqueue(new Uint8Array(chunk));
        });

        pgDump.stderr.on('data', (err: Buffer) => {
          console.error('[PG_DUMP_STDERR]', err.toString().trim());
        });

        pgDump.on('error', (err) => {
          clearTimeout(killTimer);
          if (!isClosed) {
            isClosed = true;
            console.error('[PG_DUMP_SPAWN_ERROR]', err);
            controller.error(err);
          }
        });

        pgDump.on('close', (code) => {
          clearTimeout(killTimer);
          if (isClosed) return;
          isClosed = true;

          if (code === 0) {
            controller.close();
          } else {
            console.error(`[PG_DUMP_FAILED] exited with code ${code}`);
            controller.error(new Error(`pg_dump exited with code ${code}`));
          }
        });
      },
      cancel() {
        clearTimeout(killTimer);
        pgDump.kill('SIGTERM');
      },
    });

    const date = new Date().toISOString().split('T')[0];

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="realcrm-backup-${date}.sql"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[BACKUP_INIT_ERROR]', error);
    return NextResponse.json({ error: 'Failed to init backup' }, { status: 500 });
  }
}