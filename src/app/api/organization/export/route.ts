// src/app/api/organization/export/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { auditService } from '@/services/audit.service';

export const dynamic = 'force-dynamic';

interface ContactWithCompany {
  id: string;
  firstName: string;
  lastName: string | null; 
  phone: string | null;
  email: string | null;
  createdAt: Date;
  company: {
    name: string;
  } | null;
}


function sanitizeCsvField(value: string | null | undefined): string {
  if (value === null || value === undefined) return '';
  
  let cleaned = value.trim().replace(/[\n\r]+/g, ' ');

  cleaned = cleaned.replace(/"/g, '""');

  if (['=', '+', '-', '@'].some(char => cleaned.startsWith(char))) {
    cleaned = `'${cleaned}`;
  }

  return cleaned;
}

export async function GET(): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse('Пользователь не авторизован', { status: 401 });
    }

    const { id: authorId, role, organizationId } = session.user;

    try {
      await auditService.enforceOwner({ id: authorId, role, organizationId }, 'EXPORT_CUSTOMERS_BASE');
    } catch (authError: unknown) {
      const message = authError instanceof Error ? authError.message : 'Доступ запрещен';
      return new NextResponse(message, { status: 403 });
    }

    const DELIMITER = ';';
    const csvHeader = `Имя${DELIMITER}Фамилия${DELIMITER}Телефон${DELIMITER}Email${DELIMITER}Компания${DELIMITER}Дата создания\n`;

    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(encoder.encode('\uFEFF' + csvHeader));

          const CHUNK_SIZE = 500;
          let lastId: string | undefined = undefined;
          let keepReading = true;
          let totalExportedCount = 0;

          while (keepReading) {
            const contacts: ContactWithCompany[] = await prisma.contact.findMany({
              take: CHUNK_SIZE,
              skip: lastId ? 1 : 0,
              cursor: lastId ? { id: lastId } : undefined,
              where: { organizationId },
              include: {
                company: { select: { name: true } },
              },
              orderBy: { id: 'asc' }, 
            });

            if (contacts.length === 0) {
              keepReading = false;
              break;
            }

            let chunkLines = '';
            for (const contact of contacts) {
              const firstName = sanitizeCsvField(contact.firstName);
              const lastName = sanitizeCsvField(contact.lastName);
              const phone = sanitizeCsvField(contact.phone);
              const email = sanitizeCsvField(contact.email);
              const companyName = sanitizeCsvField(contact.company?.name);
              const createdAt = contact.createdAt ? contact.createdAt.toISOString() : new Date().toISOString();

              chunkLines += `"${firstName}"${DELIMITER}"${lastName}"${DELIMITER}"${phone}"${DELIMITER}"${email}"${DELIMITER}"${companyName}"${DELIMITER}"${createdAt}"\n`;
            }

            controller.enqueue(encoder.encode(chunkLines));
            
            totalExportedCount += contacts.length;
            lastId = contacts[contacts.length - 1].id;

            if (contacts.length < CHUNK_SIZE) {
              keepReading = false;
            }
          }

          await auditService.log({
            organizationId,
            authorId, 
            action: 'EXPORT_DATABASE_SUCCESS',
            metadata: {
              recordsExported: totalExportedCount,
              format: 'CSV',
            },
          });

          controller.close();
        } catch (streamError) {
          console.error(' ❌ [CRM_EXPORT_STREAM_ERROR] Критическая ошибка внутри генерации потока CSV:', streamError);
          controller.error(streamError);
        }
      }
    });

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="crm_export_contacts_${new Date().toISOString().slice(0, 10)}.csv"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error(' ❌ [CRM_EXPORT_CRITICAL_ERROR] Непредвиденная системная ошибка при экспорте базы:', error);
    return new NextResponse('Внутренняя ошибка сервера при генерации экспорта', { status: 500 });
  }
}
