import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function POST(request: NextRequest) {
  try {
    // Recebe o conteúdo HTML e o período do corpo da requisição
    const { htmlContent, periodo } = await request.json();

    if (!htmlContent) {
      return NextResponse.json(
        { error: "Conteúdo HTML ausente." },
        { status: 400 }
      );
    }

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    
    // Template HTML que será usado para gerar o PDF, agora com um cabeçalho para o período
    const fullHtml = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Relatório Financeiro - Porteira de Minas</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body { 
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            font-family: sans-serif;
          }
          .report-header {
            padding-bottom: 12px;
            margin-bottom: 24px;
            border-bottom: 1px solid #e5e7eb;
          }
          .report-title {
            font-size: 24px;
            font-weight: 600;
          }
          .report-period {
            font-size: 14px;
            color: #4b5563;
          }
        </style>
      </head>
      <body>
        <div class="p-8">
          <div class="report-header">
            <h1 class="report-title">Relatório Financeiro</h1>
            <p class="report-period">Período de Análise: <strong>${periodo || 'N/A'}</strong></p>
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
           Relatório Porteira de Minas - Gerado em: <span class="date"></span>
         </div>
       `,
    });

    await browser.close();

    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set(
      'Content-Disposition',
      `attachment; filename="Relatorio_Porteira_de_Minas_${new Date().toISOString().split('T')[0]}.pdf"`
    );

    return new Response(pdfBuffer, {
      headers,
      status: 200,
    });

  } catch (error) {
    console.error('[API GERAR PDF RELATORIO] Erro:', error);
    let errorMessage = 'Falha ao gerar o PDF.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}