import type { MetadataRoute } from "next";

/** Ícones em alta resolução para "Adicionar à tela inicial" (a tela de abertura usa o de 512px). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Meu PetTube",
    short_name: "Meu PetTube",
    description: "Vídeos para quem ama pets",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#FFFFFF",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
