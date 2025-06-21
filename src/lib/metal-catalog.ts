export interface CatalogVariation {
  id: string;
  color: string;
}

export interface CatalogItem {
  id: string
  name: string
  category: string
  capacity?: string
  dimensions?: string
  minimumOrder: number
  description: string
  features: string[]
  variations: CatalogVariation[]
  basePrice: number
  setupFee?: number
  material: string
  weight?: string
  image?: string
}

export const METALASER_CATALOG: CatalogItem[] = [
  {
    id: "thermal-cup-473ml",
    name: "Copo Térmico (473ml)",
    category: "Copos e Canecas",
    capacity: "473ml",
    minimumOrder: 1,
    description: "Copo térmico de alta qualidade, perfeito para manter suas bebidas na temperatura ideal.",
    features: ["Sem pedido mínimo", "Personalizável com sua arte/logo", "Isolamento térmico", "Dupla parede"],
    variations: [
      { id: "var-copo-termico-azul", color: "Azul" },
      { id: "var-copo-termico-branco", color: "Branco" },
      { id: "var-copo-termico-preto", color: "Preto" },
      { id: "var-copo-termico-rosa", color: "Rosa" },
      { id: "var-copo-termico-laranja", color: "Laranja" },
      { id: "var-copo-termico-ciano", color: "Ciano" },
      { id: "var-copo-termico-roxo", color: "Roxo" },
      { id: "var-copo-termico-vermelho", color: "Vermelho" },
      { id: "var-copo-termico-verde", color: "Verde" },
    ],
    basePrice: 45.9,
    setupFee: 25.0,
    material: "Aço Inoxidável",
    weight: "350g",
    image: "uploads/copo-termico-473.png"
  },
  {
    id: "thermal-cup-speaker-473ml",
    name: "Copo Térmico com Caixa de Som WOW (473ml)",
    category: "Copos e Canecas",
    capacity: "473ml",
    minimumOrder: 1,
    description: "Copo térmico inovador com caixa de som integrada.",
    features: ["Sem pedido mínimo", "Personalizável com sua arte/logo", "Caixa de som integrada", "Bluetooth 5.0"],
    variations: [
        { id: "var-copo-som-preto", color: "Preto" },
        { id: "var-copo-som-branco", color: "Branco" }
    ],
    basePrice: 89.9,
    setupFee: 35.0,
    material: "Aço Inoxidável + Eletrônicos",
    weight: "450g",
    image: "uploads/copo-termico-caixa-473.png"
  },
  {
    id: "thermal-cuia-350ml",
    name: "Cuia Térmica com Tampa (350ml)",
    category: "Copos e Canecas",
    capacity: "350ml",
    minimumOrder: 1,
    description: "Cuia térmica tradicional com tampa, ideal para chimarrão.",
    features: ["Sem pedido mínimo", "Personalizável com sua arte/logo", "Vem com tampa", "Formato tradicional"],
    variations: [
        { id: "var-cuia-verde", color: "Verde" },
        { id: "var-cuia-preto", color: "Preto" },
        { id: "var-cuia-prata", color: "Prata" }
    ],
    basePrice: 38.9,
    setupFee: 20.0,
    material: "Aço Inoxidável",
    weight: "280g",
    image: "uploads/copo-termico-cuia-350.png"
  },
  {
    id: "thermal-mug-450ml",
    name: "Caneca Térmica com Tampa (450ml)",
    category: "Copos e Canecas",
    capacity: "450ml",
    minimumOrder: 1,
    description: "Caneca térmica com tampa, perfeita para café e chá.",
    features: ["Sem pedido mínimo", "Personalizável com sua arte/logo", "Vem com tampa", "Alça ergonômica"],
    variations: [
        { id: "var-caneca-termica-branca", color: "Branco" },
        { id: "var-caneca-termica-preta", color: "Preto" },
        { id: "var-caneca-termica-azul", color: "Azul" },
        { id: "var-caneca-termica-vermelha", color: "Vermelho" }
    ],
    basePrice: 42.9,
    setupFee: 22.0,
    material: "Aço Inoxidável",
    weight: "320g",
    image: "uploads/caneca-termica-450.png"
  },
  {
    id: "large-thermal-cup-1200ml",
    name: "Copão Térmico (1200ml)",
    category: "Copos e Canecas",
    capacity: "1200ml",
    minimumOrder: 1,
    description: "Copo térmico de grande capacidade para quem precisa de mais hidratação.",
    features: ["Sem pedido mínimo", "Personalizável com sua arte/logo", "Grande capacidade", "Canudo incluso"],
    variations: [
        { id: "var-copao-1200-preto", color: "Preto" },
        { id: "var-copao-1200-branco", color: "Branco" },
        { id: "var-copao-1200-azul", color: "Azul" }
    ],
    basePrice: 65.9,
    setupFee: 30.0,
    material: "Aço Inoxidável",
    weight: "520g",
    image: "uploads/copao-termico-1200.png"
  },
  {
    id: "tiffany-thermal-cup-1200ml",
    name: "Copão Térmico Tiffany (1200ml)",
    category: "Copos e Canecas",
    capacity: "1200ml",
    minimumOrder: 1,
    description: "Copo térmico estilo Tiffany com design elegante.",
    features: ["Sem pedido mínimo", "Personalizável com sua arte/logo", "Design elegante", "Acabamento premium"],
    variations: [
        { id: "var-tiffany-azul", color: "Azul Tiffany" },
        { id: "var-tiffany-rosa", color: "Rosa" },
        { id: "var-tiffany-dourado", color: "Dourado" }
    ],
    basePrice: 72.9,
    setupFee: 35.0,
    material: "Aço Inoxidável Premium",
    weight: "550g",
    image: "uploads/copao-termico-tiffany-1200.png"
  },
  {
    id: "temperature-display-bottle-500ml",
    name: "Garrafa Squeeze com Display de Temperatura (500ml)",
    category: "Garrafas e Squeezes",
    capacity: "500ml",
    minimumOrder: 1,
    description: "Squeeze inovador com display que mostra a temperatura da bebida.",
    features: ["Sem pedido mínimo", "Personalizável com sua arte/logo", "Display de temperatura", "LED integrado"],
    variations: [
        { id: "var-squeeze-temp-preto", color: "Preto" },
        { id: "var-squeeze-temp-branco", color: "Branco" },
        { id: "var-squeeze-temp-vermelho", color: "Vermelho" },
        { id: "var-squeeze-temp-azul", color: "Azul" }
    ],
    basePrice: 95.9,
    setupFee: 40.0,
    material: "Aço Inoxidável + Display LED",
    weight: "380g",
    image: "uploads/garrafa-squeeze-temperatura-500.png"
  },
  {
    id: "thermal-squeeze-800ml",
    name: "Garrafa Squeeze Térmica (800ml)",
    category: "Garrafas e Squeezes",
    capacity: "800ml",
    minimumOrder: 1,
    description: "Squeeze térmico de capacidade média, ideal para atividades físicas.",
    features: ["Sem pedido mínimo", "Personalizável com sua arte/logo", "Isolamento térmico", "Bico esportivo"],
    variations: [
      { id: "var-squeeze-800-azul", color: "Azul" },
      { id: "var-squeeze-800-verde", color: "Verde" },
      { id: "var-squeeze-800-preto", color: "Preto" },
      { id: "var-squeeze-800-branco", color: "Branco" }
    ],
    basePrice: 52.9,
    setupFee: 25.0,
    material: "Aço Inoxidável",
    weight: "420g",
    image: "uploads/garrada-squeeze-termica-800.png"
  },
  {
    id: "thermal-squeeze-1l",
    name: "Garrafa Squeeze Térmica (1 Litro)",
    category: "Garrafas e Squeezes",
    capacity: "1 Litro",
    minimumOrder: 1,
    description: "Squeeze térmico de grande capacidade.",
    features: ["Sem pedido mínimo", "Personalizável com sua arte/logo", "Grande capacidade", "Alça de transporte"],
    variations: [
      { id: "var-squeeze-1l-preto", color: "Preto" },
      { id: "var-squeeze-1l-azul", color: "Azul" },
      { id: "var-squeeze-1l-verde", color: "Verde" }
    ],
    basePrice: 58.9,
    setupFee: 28.0,
    material: "Aço Inoxidável",
    weight: "480g",
    image: "uploads/garrafa-squeeze-termica-1000.png"
  },
  {
    id: "thermal-bottle-1200ml",
    name: "Garrafa Térmica (1.2 Litros)",
    category: "Garrafas e Squeezes",
    capacity: "1.2 Litros",
    minimumOrder: 1,
    description: "Garrafa térmica de alta capacidade para uso prolongado.",
    features: ["Sem pedido mínimo", "Personalizável com sua arte/logo", "Alta capacidade", "Isolamento 24h"],
    variations: [
      { id: "var-garrafa-1-2l-preto", color: "Preto" },
      { id: "var-garrafa-1-2l-prata", color: "Prata" },
      { id: "var-garrafa-1-2l-azul", color: "Azul" }
    ],
    basePrice: 68.9,
    setupFee: 32.0,
    material: "Aço Inoxidável",
    weight: "580g",
    image: "uploads/garrafa-termica-1200.png"
  },
  {
    id: "quick-flip-bottle-800ml",
    name: "Garrafa Térmica Quick Flip (800ml)",
    category: "Garrafas e Squeezes",
    capacity: "800ml",
    minimumOrder: 1,
    description: "Garrafa térmica com sistema de abertura rápida.",
    features: ["Sem pedido mínimo", "Personalizável com sua arte/logo", "Abertura rápida", "Sistema flip"],
    variations: [
      { id: "var-quickflip-preto", color: "Preto" },
      { id: "var-quickflip-branco", color: "Branco" },
      { id: "var-quickflip-azul", color: "Azul" }
    ],
    basePrice: 62.9,
    setupFee: 30.0,
    material: "Aço Inoxidável",
    weight: "450g",
    image: "uploads/garrafa-termica-quickflip-800.png"
  },
  {
    id: "veridiana-bottle-800ml",
    name: "Garrafa Térmica Veridiana (800ml)",
    category: "Garrafas e Squeezes",
    capacity: "800ml",
    minimumOrder: 1,
    description: "Garrafa térmica modelo Veridiana com design exclusivo.",
    features: ["Sem pedido mínimo", "Personalizável com sua arte/logo", "Design exclusivo", "Acabamento fosco"],
    variations: [
      { id: "var-veridiana-rosa", color: "Rosa" },
      { id: "var-veridiana-azul", color: "Azul" },
      { id: "var-veridiana-verde", color: "Verde" },
      { id: "var-veridiana-preto", color: "Preto" }
    ],
    basePrice: 59.9,
    setupFee: 28.0,
    material: "Aço Inoxidável",
    weight: "440g",
    image: "uploads/garrafa-termica-veridiana-800.png"
  },
  {
    id: "coffee-tea-bottle-950ml",
    name: "Garrafa Térmica Café/Chá (950ml)",
    category: "Garrafas e Squeezes",
    capacity: "950ml",
    minimumOrder: 1,
    description: "Garrafa térmica especialmente projetada para café e chá.",
    features: ["Sem pedido mínimo", "Personalizável com sua arte/logo", "Ideal para café/chá", "Boca larga"],
    variations: [
      { id: "var-cafe-marrom", color: "Marrom" },
      { id: "var-cafe-preto", color: "Preto" },
      { id: "var-cafe-dourado", color: "Dourado" }
    ],
    basePrice: 64.9,
    setupFee: 30.0,
    material: "Aço Inoxidável",
    weight: "490g",
    image : "uploads/garrafa-termica-cafe-950.png"
  },
  {
    id: "carabiner-keychain",
    name: "Chaveiro Mosquetão",
    category: "Chaveiros e Acessórios",
    minimumOrder: 50,
    description: "Chaveiro mosquetão resistente e prático.",
    features: ["Pedido mínimo 50 unidades", "Personalizável com sua arte/logo", "Material resistente", "Funcional"],
    variations: [
      { id: "var-mosquetao-prata", color: "Prata" },
      { id: "var-mosquetao-preto", color: "Preto" },
      { id: "var-mosquetao-azul", color: "Azul" }
    ],
    basePrice: 8.9,
    setupFee: 45.0,
    material: "Alumínio",
    weight: "15g",
    image: "uploads/chaveiro-mosquetao.png"
  },
  {
    id: "bottle-opener-keychain",
    name: "Chaveiro Abridor de Garrafa Metal",
    category: "Chaveiros e Acessórios",
    minimumOrder: 50,
    description: "Chaveiro abridor de garrafa em metal de alta qualidade.",
    features: ["Pedido mínimo 50 unidades", "Personalizável com sua arte/logo", "Metal de qualidade", "Funcional"],
    variations: [
      { id: "var-abridor-prata", color: "Prata" },
      { id: "var-abridor-preto", color: "Preto" },
      { id: "var-abridor-dourado", color: "Dourado" }
    ],
    basePrice: 12.9,
    setupFee: 50.0,
    material: "Aço Inoxidável",
    weight: "25g",
    image: "uploads/chaveiro-abridor.png"
  },
  {
    id: "metal-pen",
    name: "Caneta Metal",
    category: "Escritório",
    minimumOrder: 50,
    description: "Caneta em metal com acabamento premium.",
    features: ["Pedido mínimo 50 unidades", "Personalizável com sua arte/logo", "Acabamento premium", "Refil azul"],
    variations: [
      { id: "var-caneta-metal-prata", color: "Prata" },
      { id: "var-caneta-metal-preto", color: "Preto" },
      { id: "var-caneta-metal-azul", color: "Azul" },
      { id: "var-caneta-metal-dourado", color: "Dourado" }
    ],
    basePrice: 18.9,
    setupFee: 60.0,
    material: "Metal",
    weight: "35g",
    image: "uploads/caneta-metal.png"
  },
  {
    id: "anti-stress-pen",
    name: "Caneta Anti-Stress",
    category: "Escritório",
    minimumOrder: 50,
    description: "Caneta com função anti-stress integrada.",
    features: ["Pedido mínimo 50 unidades", "Personalizável com sua arte/logo", "Função anti-stress", "Multifuncional"],
    variations: [
      { id: "var-caneta-stress-azul", color: "Azul" },
      { id: "var-caneta-stress-verde", color: "Verde" },
      { id: "var-caneta-stress-vermelho", color: "Vermelho" },
      { id: "var-caneta-stress-preto", color: "Preto" }
    ],
    basePrice: 22.9,
    setupFee: 65.0,
    material: "Plástico + Metal",
    weight: "40g",
    image: "uploads/caneta-stresse.png"
  },
  {
    id: "stainless-penknife",
    name: "Canivete Inox com Clip e Trava",
    category: "Facas e Utensílios",
    minimumOrder: 1,
    description: "Canivete em aço inoxidável com clip e sistema de trava.",
    features: ["Sem pedido mínimo", "Personalizável com sua arte/logo", "Aço inoxidável", "Sistema de trava"],
    variations: [
      { id: "var-canivete-prata", color: "Prata" }
    ],
    basePrice: 35.9,
    setupFee: 20.0,
    material: "Aço Inoxidável",
    weight: "80g",
    image:"uploads/facainox-clip-trava.png"
  },
  {
    id: "knife-32cm",
    name: "Faca (32 cm)",
    category: "Facas e Utensílios",
    dimensions: "32 cm",
    minimumOrder: 1,
    description: "Faca de alta qualidade com 32 cm de comprimento.",
    features: ["Sem pedido mínimo", "Personalizável com sua arte/logo", "Alta qualidade", "Cabo ergonômico"],
    variations: [
        { id: "var-faca-32-natural", color: "Madeira Natural" }
    ],
    basePrice: 89.9,
    setupFee: 35.0,
    material: "Aço Carbono + Madeira",
    weight: "180g",
    image: "uploads/faca-32.png"
  },
  {
    id: "knife-30cm",
    name: "Faca (30 cm)",
    category: "Facas e Utensílios",
    dimensions: "30 cm",
    minimumOrder: 1,
    description: "Faca de alta qualidade com 30 cm de comprimento.",
    features: ["Sem pedido mínimo", "Personalizável com sua arte/logo", "Alta qualidade", "Cabo ergonômico"],
    variations: [
        { id: "var-faca-30-natural", color: "Madeira Natural" }
    ],
    basePrice: 79.9,
    setupFee: 32.0,
    material: "Aço Carbono + Madeira",
    weight: "160g",
    image: "uploads/faca-30.png"
  },
  {
    id: "knife-42cm",
    name: "Faca (42 cm)",
    category: "Facas e Utensílios",
    dimensions: "42 cm",
    minimumOrder: 1,
    description: "Faca de alta qualidade com 42 cm de comprimento.",
    features: ["Sem pedido mínimo", "Personalizável com sua arte/logo", "Alta qualidade", "Cabo ergonômico"],
    variations: [
        { id: "var-faca-42-natural", color: "Madeira Natural" }
    ],
    basePrice: 119.9,
    setupFee: 45.0,
    material: "Aço Carbono + Madeira",
    weight: "220g",
    image: "uploads/faca-42.png"
  },
  {
    id: "bbq-kit-2pc",
    name: "Kit Churrasco 2 Peças",
    category: "Kits e Conjuntos",
    minimumOrder: 1,
    description: "Kit completo para churrasco com 2 peças essenciais.",
    features: ["Sem pedido mínimo", "Personalizável com sua arte/logo", "Kit completo", "Estojo incluso"],
    variations: [
        { id: "var-kit-churrasco-natural", color: "Madeira Natural" }
    ],
    basePrice: 145.9,
    setupFee: 55.0,
    material: "Aço Inoxidável + Madeira",
    weight: "350g",
    image: "uploads/kit-churrasco-2.png"

  },
  {
    id: "tool-kit-12pc",
    name: "Kit Ferramentas 12 Peças",
    category: "Kits e Conjuntos",
    minimumOrder: 1,
    description: "Kit completo de ferramentas com 12 peças úteis.",
    features: ["Sem pedido mínimo", "Personalizável com sua arte/logo", "12 peças", "Estojo resistente"],
    variations: [
        { id: "var-kit-ferramentas-preto", color: "Preto" }
    ],
    basePrice: 189.9,
    setupFee: 75.0,
    material: "Aço + Plástico",
    weight: "580g",
    image: "uploads/kit-ferramenta-12.png"
  },
  {
    id: "agenda-2025",
    name: "Agenda 2025 com Caneta",
    category: "Escritório",
    minimumOrder: 1,
    description: "Agenda 2025 completa acompanhada de caneta.",
    features: ["Sem pedido mínimo", "Personalizável com sua arte/logo", "Inclui caneta", "Capa dura"],
    variations: [
      { id: "var-agenda-preto", color: "Preto" },
      { id: "var-agenda-azul", color: "Azul" },
      { id: "var-agenda-marrom", color: "Marrom" }
    ],
    basePrice: 45.9,
    setupFee: 25.0,
    material: "Couro Sintético",
    weight: "320g",
    image: "uploads/agenda-1caneta.png"
  },
  {
    id: "electronic-corkscrew",
    name: "Saca-Rolha Eletrônico",
    category: "Utensílios",
    minimumOrder: 1,
    description: "Saca-rolha eletrônico moderno e eficiente.",
    features: ["Sem pedido mínimo", "Personalizável com sua arte/logo", "Funcionamento eletrônico", "Recarregável"],
    variations: [
      { id: "var-saca-rolha-preto", color: "Preto" },
      { id: "var-saca-rolha-prata", color: "Prata" }
    ],
    basePrice: 125.9,
    setupFee: 50.0,
    material: "Aço Inoxidável + Eletrônicos",
    weight: "280g",
    image: "uploads/saca-rolha-el.png"
  },
  {
    id: "flashlight",
    name: "Lanterna",
    category: "Utensílios",
    minimumOrder: 1,
    description: "Lanterna resistente e de alta luminosidade.",
    features: ["Sem pedido mínimo", "Personalizável com sua arte/logo", "Alta luminosidade", "LED de longa duração"],
    variations: [
      { id: "var-lanterna-preto", color: "Preto" },
      { id: "var-lanterna-prata", color: "Prata" },
      { id: "var-lanterna-vermelho", color: "Vermelho" }
    ],
    basePrice: 38.9,
    setupFee: 20.0,
    material: "Alumínio",
    weight: "120g",
    image: "uploads/lanterna.png"
  },
  {
    id: "picanheira-gift-set",
    name: "Kit Presente Picanheira Personalizada",
    category: "Kits e Conjuntos",
    minimumOrder: 1,
    description: "Kit presente elegante com picanheira em caixa de madeira personalizada.",
    features: [
      "Caixa de madeira personalizada",
      "Forro de feltro",
      "Personalizável com sua arte/logo",
      "Presente premium",
    ],
    variations: [
      { id: "var-kit-picanheira-natural", color: "Madeira Natural" }
    ],
    basePrice: 165.9,
    setupFee: 65.0,
    material: "Aço Inoxidável + Madeira",
    weight: "450g",
    image: "uploads/kit-presente-picanheira-personalizada.png"
  },
  {
    id: "japanese-food-board",
    name: "Petisqueira Comida Japonesa Personalizada (Bambu)",
    category: "Tábuas e Pranchas",
    minimumOrder: 1,
    description: "Petisqueira elegante em bambu, ideal para comida japonesa.",
    features: ["Design elegante em bambu", "Personalizável com sua arte/logo", "Sustentável", "Compartimentos"],
    variations: [
      { id: "var-petisqueira-bambu", color: "Bambu Natural" }
    ],
    basePrice: 78.9,
    setupFee: 35.0,
    material: "Bambu",
    weight: "280g",
    image: "uploads/petisqueira.png"

  },
  {
    id: "snack-board-20x30",
    name: "Tábua de Lanche",
    category: "Tábuas e Pranchas",
    dimensions: "20 cm x 30 cm",
    minimumOrder: 1,
    description: "Tábua de petiscos em madeira de qualidade.",
    features: ["Personalizável com sua arte/logo", "Madeira de qualidade", "Acabamento premium", "Alça de couro"],
    variations: [
      { id: "var-tabua-lanche-natural", color: "Madeira Natural" }
    ],
    basePrice: 52.9,
    setupFee: 25.0,
    material: "Madeira Nobre",
    weight: "320g",
    image: "uploads/tabua-lanche.png"
  },
  {
    id: "large-cutting-board",
    name: "Tábua de Corte Grande",
    category: "Tábuas e Pranchas",
    dimensions: "92 cm x 23 cm",
    minimumOrder: 1,
    description: "Tábua de corte grande para uso profissional. Pode ter pequenas variações.",
    features: ["Uso profissional", "Pode ter pequenas variações", "Grande capacidade", "Madeira tratada"],
    variations: [
      { id: "var-tabua-grande-natural", color: "Madeira Natural" }
    ],
    basePrice: 145.9,
    setupFee: 55.0,
    material: "Madeira Tratada",
    weight: "1.2kg",
    image: "uploads/tabua-grande.png"
  },
  {
    id: "medium-cutting-board-42x42",
    name: "Tábua de Corte Média Quadrada",
    category: "Tábuas e Pranchas",
    dimensions: "42 cm x 42 cm",
    minimumOrder: 1,
    description: "Tábua de corte média quadrada, versátil para diversos usos.",
    features: ["Personalizável com sua arte/logo", "Formato quadrado", "Versátil", "Pés antiderrapantes"],
    variations: [
      { id: "var-tabua-media-42-natural", color: "Madeira Natural" }
    ],
    basePrice: 89.9,
    setupFee: 40.0,
    material: "Madeira Nobre",
    weight: "680g",
    image: "uploads/tabua-corte-media.png"
  },
  {
    id: "medium-cutting-board-37x50",
    name: "Tábua de Corte Média Retangular",
    category: "Tábuas e Pranchas",
    dimensions: "37 cm x 50 cm",
    minimumOrder: 1,
    description: "Tábua de corte média retangular, ideal para uso doméstico.",
    features: ["Personalizável com sua arte/logo", "Formato retangular", "Uso doméstico", "Sulco para líquidos"],
    variations: [
      { id: "var-tabua-media-50-natural", color: "Madeira Natural" }
    ],
    basePrice: 95.9,
    setupFee: 42.0,
    material: "Madeira Nobre",
    weight: "720g",
    image: "uploads/tabua-corte-media2.png"
  },
  {
    id: "medium-cutting-board-37x65",
    name: "Tábua de Corte Média Arte",
    category: "Tábuas e Pranchas",
    dimensions: "37 cm x 65 cm",
    minimumOrder: 1,
    description: "Tábua de corte média alongada, perfeita para carnes.",
    features: ["Personalizável com sua arte/logo", "Formato alongado", "Ideal para carnes", "Sulco para líquidos"],
    variations: [
      { id: "var-tabua-media-65-natural", color: "Madeira Natural" }
    ],
    basePrice: 108.9,
    setupFee: 45.0,
    material: "Madeira Nobre",
    weight: "850g",
    image: "uploads/tabua-media-arte.png"
  },
  {
    id: "premium-bbq-board",
    name: "Tábua Churrasco Premium",
    category: "Tábuas e Pranchas",
    dimensions: "37 cm x 65 cm",
    minimumOrder: 1,
    description: "Tábua premium especialmente projetada para churrasco.",
    features: ["Personalizável com sua arte/logo", "Design premium", "Especial para churrasco", "Acabamento especial"],
    variations: [
      { id: "var-tabua-premium-natural", color: "Madeira Natural" }
    ],
    basePrice: 125.9,
    setupFee: 50.0,
    material: "Madeira Premium",
    weight: "920g",
    image: "uploads/tabua-premium.png"
  },
  {
    id: "churrasco-corner-board",
    name: "Tábua Decorativa 'Cantinho do Churrasco'",
    category: "Tábuas e Pranchas",
    dimensions: "50 cm x 21 cm x 3 cm",
    minimumOrder: 1,
    description: "Tábua decorativa com design 'Cantinho do Churrasco'.",
    features: ["Design 'Cantinho do Churrasco'", "Decorativa", "Espessura 3 cm", "Ganchos para pendurar"],
    variations: [
      { id: "var-tabua-decorativa-natural", color: "Madeira Natural" }
    ],
    basePrice: 68.9,
    setupFee: 30.0,
    material: "Madeira Nobre",
    weight: "480g",
    image: "uploads/tabua-decorativa.png"
  },
]

export const CATEGORIES = [
  "Todos",
  "Copos e Canecas",
  "Garrafas e Squeezes",
  "Chaveiros e Acessórios",
  "Escritório",
  "Facas e Utensílios",
  "Kits e Conjuntos",
  "Tábuas e Pranchas",
  "Utensílios",
]