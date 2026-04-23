import {
  CanvasTexture,
  Color,
  MeshStandardMaterial,
  NearestFilter,
  RepeatWrapping,
  SRGBColorSpace,
} from 'three';

export const palette = {
  safetyYellow: '#FFD700',
  cyan: '#52d6ff',
  uiDark: '#081118',
  asphalt: '#202225',
  wall: '#d7d0bd',
  wallTrim: '#8d8577',
  carpet: '#596067',
  ceiling: '#d8d5c9',
  metal: '#9aa0a3',
  ductDark: '#6c7478',
  returnRed: '#f06b65',
  supplyBlue: '#4db7ff',
  plastic: '#eef8ff',
  rubber: '#111418',
};

export const materials = {
  asphalt: new MeshStandardMaterial({ color: palette.asphalt, roughness: 0.92, metalness: 0.02 }),
  parkingStripe: new MeshStandardMaterial({ color: '#e8e7df', roughness: 0.65 }),
  concrete: new MeshStandardMaterial({ color: '#a8a39a', roughness: 0.82 }),
  wall: new MeshStandardMaterial({ color: palette.wall, roughness: 0.72 }),
  wallDark: new MeshStandardMaterial({ color: '#b7ad99', roughness: 0.8 }),
  baseboard: new MeshStandardMaterial({ color: palette.wallTrim, roughness: 0.68 }),
  carpet: new MeshStandardMaterial({ color: palette.carpet, roughness: 0.94 }),
  ceilingTile: new MeshStandardMaterial({ color: palette.ceiling, roughness: 0.86 }),
  ceilingGrid: new MeshStandardMaterial({ color: '#a4a299', roughness: 0.7, metalness: 0.1 }),
  fluorescent: new MeshStandardMaterial({
    color: '#f5fbff',
    emissive: '#bceaff',
    emissiveIntensity: 1.8,
    roughness: 0.25,
  }),
  glass: new MeshStandardMaterial({
    color: '#223444',
    roughness: 0.18,
    metalness: 0.05,
    transparent: true,
    opacity: 0.6,
  }),
  metal: new MeshStandardMaterial({ color: palette.metal, roughness: 0.48, metalness: 0.58 }),
  darkMetal: new MeshStandardMaterial({ color: '#2e3439', roughness: 0.55, metalness: 0.45 }),
  galvanized: new MeshStandardMaterial({ color: '#aeb5b8', roughness: 0.38, metalness: 0.74 }),
  ductDark: new MeshStandardMaterial({ color: palette.ductDark, roughness: 0.43, metalness: 0.62 }),
  rubber: new MeshStandardMaterial({ color: palette.rubber, roughness: 0.72 }),
  yellow: new MeshStandardMaterial({ color: palette.safetyYellow, roughness: 0.48 }),
  vanWhite: new MeshStandardMaterial({ color: '#f1f2eb', roughness: 0.5 }),
  supply: new MeshStandardMaterial({ color: '#d9e7ef', roughness: 0.42, metalness: 0.28 }),
  return: new MeshStandardMaterial({ color: '#c3c8c9', roughness: 0.48, metalness: 0.22 }),
  identifiedSupply: new MeshStandardMaterial({
    color: palette.supplyBlue,
    emissive: palette.supplyBlue,
    emissiveIntensity: 0.18,
    roughness: 0.38,
    metalness: 0.25,
  }),
  identifiedReturn: new MeshStandardMaterial({
    color: palette.returnRed,
    emissive: palette.returnRed,
    emissiveIntensity: 0.16,
    roughness: 0.38,
    metalness: 0.25,
  }),
  plastic: new MeshStandardMaterial({
    color: palette.plastic,
    transparent: true,
    opacity: 0.42,
    roughness: 0.22,
    metalness: 0.02,
  }),
  highlight: new MeshStandardMaterial({
    color: palette.safetyYellow,
    emissive: palette.safetyYellow,
    emissiveIntensity: 0.35,
    roughness: 0.4,
  }),
  hole: new MeshStandardMaterial({ color: '#101214', roughness: 0.85 }),
};

export function makeTextMaterial(text: string, width = 512, height = 256, options?: { background?: string; color?: string; subtitle?: string }) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return materials.wall;

  ctx.fillStyle = options?.background ?? 'rgba(255,255,255,0.02)';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = options?.color ?? palette.safetyYellow;
  ctx.font = `800 ${Math.floor(height * 0.18)}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  wrapText(ctx, text.toUpperCase(), width / 2, height * 0.44, width * 0.86, height * 0.18);
  if (options?.subtitle) {
    ctx.fillStyle = '#111';
    ctx.font = `700 ${Math.floor(height * 0.08)}px Arial, sans-serif`;
    ctx.fillText(options.subtitle.toUpperCase(), width / 2, height * 0.78);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = NearestFilter;
  texture.magFilter = NearestFilter;
  return new MeshStandardMaterial({ map: texture, transparent: true, roughness: 0.55 });
}

export function makeGridMaterial(color: string, lineColor: string, size = 64) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new MeshStandardMaterial({ color });
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(size, 0);
  ctx.moveTo(0, 0);
  ctx.lineTo(0, size);
  ctx.stroke();
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(8, 8);
  texture.colorSpace = SRGBColorSpace;
  return new MeshStandardMaterial({ map: texture, roughness: 0.84 });
}

export function cloneWithColor(material: MeshStandardMaterial, color: string): MeshStandardMaterial {
  const cloned = material.clone();
  cloned.color = new Color(color);
  return cloned;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = `${line}${word} `;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line.trim());
      line = `${word} `;
    } else {
      line = test;
    }
  }
  lines.push(line.trim());
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((entry, index) => ctx.fillText(entry, x, startY + index * lineHeight));
}
