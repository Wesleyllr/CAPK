import { Config } from "tailwindcss";
import tailwindConfig from "./tailwind.config"; // Caminho para o arquivo de configuração

export const getColor = (color: string) => {
  const colorPath = color.split('-');
  let colorValue = tailwindConfig.theme?.extend?.colors;

  // Navegar pelo caminho da cor
  colorPath.forEach((part) => {
    colorValue = colorValue?.[part];
  });

  return colorValue || "#000000"; // Retorna um valor padrão caso a cor não seja encontrada
};
