import { GridData, Point } from '../types';

// Convert hex color to [r, g, b]
const hexToRgb = (hex: string): [number, number, number] => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
};

// Generate the raw bytes for a CUR file structure
// This is needed because ANI files embed full CUR files (chunks) inside them.
export const createCurByteArray = (grid: GridData, hotspot: Point): Uint8Array => {
  const width = 32;
  const height = 32;
  
  // 1. File Header (6 bytes)
  // Reserved (2) | Type (2) | Count (2)
  const header = new Uint8Array([0, 0, 2, 0, 1, 0]);

  // 2. InfoHeader (40 bytes)
  const infoHeaderSize = 40;
  
  const bitmapHeader = new Uint8Array(40);
  const view = new DataView(bitmapHeader.buffer);
  view.setUint32(0, 40, true); // biSize
  view.setInt32(4, width, true); // biWidth
  view.setInt32(8, height * 2, true); // biHeight (double height for XOR+AND masks)
  view.setUint16(12, 1, true); // biPlanes
  view.setUint16(14, 32, true); // biBitCount (32 bit BGRA)
  view.setUint32(16, 0, true); // biCompression (BI_RGB)
  view.setUint32(20, width * height * 4, true); // biSizeImage (size of XOR mask)
  
  // 3. Pixel Data (XOR Mask) - Bottom-Up, BGRA
  const pixelData = new Uint8Array(width * height * 4);
  let offset = 0;
  for (let y = height - 1; y >= 0; y--) { // Bottom-up
    for (let x = 0; x < width; x++) {
      const color = grid[y][x];
      if (color) {
        const [r, g, b] = hexToRgb(color);
        pixelData[offset] = b;     // Blue
        pixelData[offset + 1] = g; // Green
        pixelData[offset + 2] = r; // Red
        pixelData[offset + 3] = 255; // Alpha
      } else {
        pixelData[offset] = 0;
        pixelData[offset + 1] = 0;
        pixelData[offset + 2] = 0;
        pixelData[offset + 3] = 0;
      }
      offset += 4;
    }
  }

  // 4. AND Mask (1 bit per pixel)
  // 32 pixels width = 32 bits = 4 bytes per row.
  const andMaskSize = (width * height) / 8;
  const andMask = new Uint8Array(andMaskSize).fill(0); 

  const imageSize = 40 + pixelData.length + andMask.length;

  // 5. Directory Entry (16 bytes)
  const dirEntry = new Uint8Array(16);
  const dirView = new DataView(dirEntry.buffer);
  dirView.setUint8(0, width); // Width
  dirView.setUint8(1, height); // Height
  dirView.setUint8(2, 0); // Color count
  dirView.setUint8(3, 0); // Reserved
  dirView.setUint16(4, hotspot.x, true); // Hotspot X
  dirView.setUint16(6, hotspot.y, true); // Hotspot Y
  dirView.setUint32(8, imageSize, true); // Bytes in resource
  dirView.setUint32(12, 6 + 16, true); // Offset to image data (Header + DirEntry)

  // Combine all parts into one Uint8Array
  const totalSize = header.length + dirEntry.length + bitmapHeader.length + pixelData.length + andMask.length;
  const result = new Uint8Array(totalSize);
  
  let pos = 0;
  [header, dirEntry, bitmapHeader, pixelData, andMask].forEach(part => {
      result.set(part, pos);
      pos += part.length;
  });

  return result;
};

// Create a binary .cur file blob
export const generateCurFile = (grid: GridData, hotspot: Point): Blob => {
  const bytes = createCurByteArray(grid, hotspot);
  return new Blob([bytes], { type: 'application/octet-stream' });
};
