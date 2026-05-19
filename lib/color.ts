/**
 * Stable color mapping from string id → HSL color.
 * Used to color-code employees in Calendar views.
 */
export function colorForId(id: string): { bg: string; fg: string; border: string } {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  const hue = h % 360;
  return {
    bg: `hsl(${hue} 78% 92%)`,
    fg: `hsl(${hue} 55% 28%)`,
    border: `hsl(${hue} 55% 60%)`,
  };
}
