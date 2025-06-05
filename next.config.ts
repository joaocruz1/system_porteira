import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
    remotePatterns: [
      {
        protocol: 'https', // Ou 'http' se for o caso
        hostname: 'wrqkc1gxttp78mqe.public.blob.vercel-storage.com',
        port: '', // Deixe em branco se não houver porta específica (geralmente para https é 443, http é 80)
        pathname: '/produtos/**', // Seja específico sobre o caminho se possível, ou use '/**' para permitir qualquer caminho nesse hostname
      },
      // Você pode adicionar outros remotePatterns aqui para outros domínios
    ],
  },
  
};

export default nextConfig;
