// src/app/api/produto/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Corrigido para importação nomeada
import path from 'path';
import { writeFile, stat, mkdir } from 'fs/promises';

interface ErrorResponse {
  error: string;
  details?: string;
}

// Função para garantir que o diretório de upload exista
async function ensureUploadDirExists() {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  try {
    await stat(uploadDir);
  } catch (e: any) {
    if (e.code === 'ENOENT') {
      console.log(`Criando diretório de uploads: ${uploadDir}`);
      await mkdir(uploadDir, { recursive: true });
    } else {
      console.error("Erro ao verificar/criar diretório de uploads:", e);
      throw e; 
    }
  }
  return uploadDir;
}

export async function POST(request: NextRequest) {
  console.log("====== [APP ROUTER - POST /api/produto] Adicionando produto ======");
  try {
    const formData = await request.formData();

    const nome = formData.get('nome') as string | null;
    const categoria = formData.get('categoria') as string | null;
    const quantidadeStr = formData.get('quantidade') as string | null;
    const precoStr = formData.get('preco') as string | null;
    const fornecedor = formData.get('fornecedor') as string | null;
    // Espera o arquivo com a chave "imageFile"
    const imageFile = formData.get('imageFile') as File | null; 
    console.log("[API POST /produto] Conteúdo do formData para imageFile:", imageFile ? imageFile.name : "Nenhum arquivo recebido como imageFile");


    if (!nome) {
      return NextResponse.json<ErrorResponse>({ error: 'Campo "nome" é obrigatório.' }, { status: 400 });
    }

    const quantidade = quantidadeStr ? parseInt(quantidadeStr, 10) : 0;
    const preco = precoStr ? parseFloat(precoStr) : 0.0;

    if (isNaN(quantidade)) {
        return NextResponse.json<ErrorResponse>({ error: '"quantidade" deve ser um número válido.' }, { status: 400 });
    }
    if (isNaN(preco)) {
        return NextResponse.json<ErrorResponse>({ error: '"preco" deve ser um número válido.' }, { status: 400 });
    }
    
    let imageUrl: string | undefined = undefined;

    if (imageFile) { // Este bloco só será executado se imageFile não for null
      console.log("[API POST /produto] Processando arquivo de imagem:", imageFile.name);
      const uploadDir = await ensureUploadDirExists();
      const filename = `${Date.now()}_${imageFile.name.replace(/\s+/g, '_')}`;
      const filePath = path.join(uploadDir, filename);
      
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      await writeFile(filePath, buffer);
      console.log(`[API POST /produto] Arquivo salvo em: ${filePath}`);
      imageUrl = `/uploads/${filename}`; 
    } else {
      console.log("[API POST /produto] Nenhum arquivo de imagem (imageFile) foi recebido ou processado.");
    }

    // No seu schema.prisma, o campo é 'image'
    const novoProdutoData: any = {
      nome,
      categoria: categoria || undefined, // Permite que seja opcional
      quantidade,
      preco,
      fornecedor: fornecedor || undefined, // Permite que seja opcional
      // data_entrada: new Date(), // Se você tiver este campo no schema e quiser defini-lo aqui
    };

    if (imageUrl) {
      novoProdutoData.image = imageUrl; // Atribui ao campo 'image' do modelo Prisma
    } else {
      // Se não houver imagem, você pode querer definir um valor padrão ou deixar como null
      // dependendo da configuração do seu banco (ex: "nao_informado" como string ou null)
      // Se o campo 'image' no Prisma é opcional (String?), não definir aqui resultará em NULL.
      // Se o seu DB tem um default "nao_informado", ele será usado se Prisma não enviar valor.
      // Para forçar "nao_informado" se nenhuma imagem for enviada:
      // novoProdutoData.image = "nao_informado"; 
      // Mas é melhor deixar como null (omitindo) se for opcional e não houver imagem.
    }

    const novoProduto = await prisma.produto.create({
      data: novoProdutoData,
    });

    return NextResponse.json(novoProduto, { status: 201 });

  } catch (error: unknown) {
    console.error('[API POST /produto] Erro ao adicionar produto:', error);
    let errorMessage = 'Erro desconhecido ao adicionar produto.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json<ErrorResponse>(
      { error: 'Falha ao adicionar produto ao banco de dados.', details: errorMessage },
      { status: 500 }
    );
  }
}

// ... (Sua função GET existente) ...
export async function GET(request: NextRequest) {
// ... (código da função GET que já está funcionando) ...
  console.log("====== [APP ROUTER - GET /api/produto] Buscando produtos ======");
  try {
    const produtos = await prisma.produto.findMany({
      orderBy: [ 
        { id: "desc" },
        { nome: "asc" },
        { categoria: "asc" },
        { quantidade: "asc" },
        { preco: "asc" },
        { data_entrada: "asc" }, 
        { image: "asc" }      
      ],
    });
    return NextResponse.json(produtos, { status: 200 });
  } catch (error: unknown) {
    console.error('[API GET /produto] Erro ao buscar produtos:', error);
    let errorMessage = 'Erro desconhecido ao buscar produtos.';
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
        errorMessage = error.message; 
    } else if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json<ErrorResponse>(
      { error: 'Falha ao buscar produtos do banco de dados.', details: errorMessage },
      { status: 500 }
    );
  }
}