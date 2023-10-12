/**
 * Simulates transparency over a white background and returns the resulting opaque color.
 * @param hexColor - The original color in hex format.
 * @param alpha - The transparency level (0 to 1).
 * @returns - The resulting opaque color in hex format.
 */
export function solidTransparentColor(hexColor: string, alpha: number): string {
  // Extract the RGB values from the hex color
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  // The RGB values of the white background
  const bgR = 255;
  const bgG = 255;
  const bgB = 255;

  // Calculate the blended color using the alpha compositing formula
  const blendedR = Math.round(alpha * r + (1 - alpha) * bgR);
  const blendedG = Math.round(alpha * g + (1 - alpha) * bgG);
  const blendedB = Math.round(alpha * b + (1 - alpha) * bgB);

  // Convert the blended RGB values back to hex format
  const hexR = blendedR.toString(16).padStart(2, '0');
  const hexG = blendedG.toString(16).padStart(2, '0');
  const hexB = blendedB.toString(16).padStart(2, '0');

  return `#${hexR}${hexG}${hexB}`;
}

export {};
