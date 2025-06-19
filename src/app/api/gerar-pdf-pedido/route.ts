import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function POST(request: NextRequest) {
  try {
    // Agora esperamos mais informações para montar um cabeçalho rico
    const { htmlContent, pedidoId, dataPedido, clienteNome } = await request.json();

    if (!htmlContent || !pedidoId) {
      return NextResponse.json(
        { error: "Conteúdo HTML ou ID do pedido ausente." },
        { status: 400 }
      );
    }

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    
    // Novo template HTML, similar ao de relatórios
    const fullHtml = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Pedido #${pedidoId} - Porteira de Minas</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body { 
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            font-family: sans-serif;
          }
           .document-header {
            padding-bottom: 12px;
            margin-bottom: 24px;
            border-bottom: 1px solid #e5e7eb;
          }
          .document-title {
            font-size: 24px;
            font-weight: 600;
          }
          .document-subtitle {
            font-size: 14px;
            color: #4b5563;
          }
        </style>
      </head>
      <body>
        <div class="p-8">
          <div class="document-header">
            <h1 class="document-title">Detalhes do Pedido #${pedidoId}</h1>
            <p class="document-subtitle">
              Cliente: <strong>${clienteNome || 'N/A'}</strong> | 
              Data: <strong>${dataPedido ? new Date(dataPedido).toLocaleDateString("pt-BR") : 'N/A'}</strong>
            </p>
          </div>
          ${htmlContent}
        </div>
      </body>
      </html>
    `;
    
    await page.setContent(fullHtml, {
      waitUntil: 'networkidle0',
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '2cm',
        right: '1.5cm',
        bottom: '2cm',
        left: '1.5cm',
      },
       displayHeaderFooter: true,
       footerTemplate: `
         <div style="font-size: 9px; width: 100%; text-align: center; padding: 0 1.5cm;">
           <span class="pageNumber"></span> / <span class="totalPages"></span>
         </div>
       `,
       headerTemplate: `
         <div style="font-size: 9px; width: 100%; text-align: left; padding: 0 1.5cm;">
           Pedido #${pedidoId} - Porteira de Minas
         </div>
       `,
    });

    await browser.close();

    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set(
      'Content-Disposition',
      `attachment; filename="Pedido_${pedidoId}_${new Date().toISOString().split('T')[0]}.pdf"`
    );

    return new Response(pdfBuffer, {
      headers,
      status: 200,
    });
    
  } catch (error) {
    console.error('[API GERAR PDF PEDIDO] Erro:', error);
    return NextResponse.json(
      { error: 'Falha ao gerar o PDF do pedido.' },
      { status: 500 }
    );
  }
}