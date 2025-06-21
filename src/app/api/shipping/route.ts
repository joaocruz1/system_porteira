import { NextRequest, NextResponse } from 'next/server';

// Tabela de frete com faixas de peso (em kg)
const shippingRatesByRegion = {
  MG: [
    { upToKg: 1, price: 18.00 },
    { upToKg: 3, price: 22.50 },
    { upToKg: 5, price: 28.00 },
    { upToKg: 10, price: 35.00 },
    { upToKg: 999, price: 45.00 }, // Acima de 10kg
  ],
  SUDESTE: [ // SP, RJ, ES
    { upToKg: 1, price: 25.00 },
    { upToKg: 3, price: 30.00 },
    { upToKg: 5, price: 38.00 },
    { upToKg: 10, price: 48.00 },
    { upToKg: 999, price: 60.00 },
  ],
  SUL: [ // PR, SC, RS
    { upToKg: 1, price: 28.00 },
    { upToKg: 3, price: 34.00 },
    { upToKg: 5, price: 42.00 },
    { upToKg: 10, price: 55.00 },
    { upToKg: 999, price: 70.00 },
  ],
  CENTRO_OESTE: [ // GO, MT, MS, DF
    { upToKg: 1, price: 32.00 },
    { upToKg: 3, price: 40.00 },
    { upToKg: 5, price: 50.00 },
    { upToKg: 10, price: 65.00 },
    { upToKg: 999, price: 80.00 },
  ],
  NORDESTE: [ // BA, SE, AL, PE, PB, RN, CE, PI, MA
    { upToKg: 1, price: 40.00 },
    { upToKg: 3, price: 50.00 },
    { upToKg: 5, price: 62.00 },
    { upToKg: 10, price: 80.00 },
    { upToKg: 999, price: 100.00 },
  ],
  NORTE: [ // AC, AP, AM, PA, RO, RR, TO
    { upToKg: 1, price: 50.00 },
    { upToKg: 3, price: 65.00 },
    { upToKg: 5, price: 80.00 },
    { upToKg: 10, price: 100.00 },
    { upToKg: 999, price: 125.00 },
  ],
};

type Region = keyof typeof shippingRatesByRegion;

const getRegionByState = (state: string): Region => {
  if (state === "MG") return "MG";
  if (["SP", "RJ", "ES"].includes(state)) return "SUDESTE";
  if (["PR", "SC", "RS"].includes(state)) return "SUL";
  if (["GO", "MT", "MS", "DF"].includes(state)) return "CENTRO_OESTE";
  if (["BA", "SE", "AL", "PE", "PB", "RN", "CE", "PI", "MA"].includes(state)) return "NORDESTE";
  return "NORTE"; // Default for Northern states
};

// Mock function to simulate fetching state from CEP
// In a real application, you'd integrate with a CEP API (e.g., ViaCEP)
async function getStateFromCep(cep: string): Promise<string | null> {
  // Isso é um placeholder. Substitua por uma chamada de API real para um serviço de CEP.
  // Para demonstração, vamos retornar alguns estados codificados com base em padrões de CEP.
  // Em um aplicativo real, você usaria um serviço como ViaCEP:
  // const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
  // const data = await response.json();
  // return data.uf || null;

  if (cep.startsWith('37570')) return 'MG'; // CEP de Ouro Fino/MG
  if (cep.startsWith('01000') || cep.startsWith('02000')) return 'SP';
  if (cep.startsWith('20000') || cep.startsWith('21000')) return 'RJ';
  if (cep.startsWith('80000') || cep.startsWith('81000')) return 'PR';
  if (cep.startsWith('40000') || cep.startsWith('41000')) return 'BA';

  // Adicione mais mapeamentos de CEP para estados conforme necessário para testes
  // Ou melhor, implemente a chamada real à API ViaCEP ou outra.
  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
  const data = await response.json();

  if (response.ok && !data.erro) {
    return data.uf;
  }

  return null; // Estado não encontrado ou CEP inválido
}

export async function POST(req: NextRequest) {
  try {
    const { cepDestino, pesoKg } = await req.json();

    if (!cepDestino || typeof cepDestino !== 'string' || !pesoKg || typeof pesoKg !== 'string') {
      return NextResponse.json({ error: "CEP de destino e peso são obrigatórios e devem ser válidos." }, { status: 400 });
    }

    const cleanCep = cepDestino.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      return NextResponse.json({ error: "CEP inválido. Deve conter 8 dígitos." }, { status: 400 });
    }

    const totalWeight = parseFloat(pesoKg);
    if (isNaN(totalWeight) || totalWeight <= 0) {
      return NextResponse.json({ error: "Peso inválido. Deve ser um número positivo." }, { status: 400 });
    }

    const state = await getStateFromCep(cleanCep);

    if (!state) {
      return NextResponse.json({ error: "Não foi possível determinar o estado para o CEP informado." }, { status: 404 });
    }

    const region = getRegionByState(state);
    const rates = shippingRatesByRegion[region];

    const rate = rates.find(r => totalWeight <= r.upToKg);

    const shippingCost = rate ? rate.price : rates[rates.length - 1].price;

    return NextResponse.json({ shippingCost });

  } catch (error) {
    console.error("Erro no cálculo do frete:", error);
    return NextResponse.json({ error: "Erro interno no servidor ao calcular o frete.", details: (error as Error).message }, { status: 500 });
  }
}