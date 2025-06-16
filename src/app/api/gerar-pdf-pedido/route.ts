import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function POST(request: NextRequest) {
  try {
    const { htmlContent, pedidoId } = await request.json();

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
    
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0',
    });

    // Configurações melhoradas para o PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '1.5cm',
        right: '1.5cm',
        bottom: '1.5cm',
        left: '1.5cm',
      },
      displayHeaderFooter: false, // Desativamos porque já temos cabeçalho no HTML
      preferCSSPageSize: true,    // Respeita melhor os tamanhos CSS
    });

    await browser.close();

    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set(
      'Content-Disposition',
      `attachment; filename="Pedido_${pedidoId}_${new Date().toISOString().split('T')[0]}.pdf"`
    );

    return new Response(Buffer.from(pdfBuffer), {
      headers,
      status: 200,
    });

  } catch (error) {
    console.error('[API GERAR PDF] Erro:', error);
    return NextResponse.json(
      { error: 'Falha ao gerar o PDF. Verifique os logs do servidor.' },
      { status: 500 }
    );
  }
}