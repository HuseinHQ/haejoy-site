// Font choices for FONT_DISPLAY / FONT_BODY in .env. Key = @fontsource package name, value = CSS family.
// Adding one: npm i @fontsource/<key>, then add its weights to the @imports in src/styles/global.css.
export const fonts = {
  nunito: "Nunito",
  fredoka: "Fredoka",
  "plus-jakarta-sans": "Plus Jakarta Sans",
  outfit: "Outfit",
  manrope: "Manrope",
  inter: "Inter",
} as const;
