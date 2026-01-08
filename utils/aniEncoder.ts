import { Frame, Point, GridData } from '../types';
import { createCurByteArray } from './curEncoder';

// Helper to write string to Uint8Array (for RIFF tags)
const writeString = (view: DataView, offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
    }
};

interface FrameWithGrid extends Omit<Frame, 'layers'> {
    grid: GridData;
}

export const generateAniFile = (frames: FrameWithGrid[], hotspot: Point, name: string = "Cursor"): Blob => {
    // Pre-generate all CUR files (ICON chunks)
    const iconChunks = frames.map(f => createCurByteArray(f.grid, hotspot));

    // Calculate Sizes
    // ANI Header (anih) is 36 bytes + 8 bytes chunk header
    const anihSize = 36; 
    const anihChunkSize = 8 + anihSize;

    // INFO List (Metadata)
    // INAM (Title) + IART (Artist)
    const title = name + "\0";
    const artist = "CursorCraft AI\0";
    // Pad to even bytes if needed
    const pad = (n: number) => (n % 2 !== 0 ? n + 1 : n);
    
    const inamSize = pad(title.length);
    const iartSize = pad(artist.length);
    const infoListContentSize = 4 + (8 + inamSize) + (8 + iartSize); // "INFO" + INAM chunk + IART chunk
    const infoListChunkSize = 8 + infoListContentSize;

    // Rate Chunk (rate) - 4 bytes per frame (jiffies = 1/60th sec)
    const rateSize = frames.length * 4;
    const rateChunkSize = 8 + rateSize;

    // Sequence Chunk (seq) - 4 bytes per frame index
    const seqSize = frames.length * 4;
    const seqChunkSize = 8 + seqSize;

    // Fram List (fram) - Contains all icon chunks
    // Each icon chunk in 'fram' list is: "icon" + <size> + <data> + <padding>
    let framListContentSize = 4; // "fram"
    iconChunks.forEach(chunk => {
        framListContentSize += 8 + pad(chunk.length);
    });
    const framListChunkSize = 8 + framListContentSize;

    // Total RIFF Size
    const riffSize = 4 + infoListChunkSize + anihChunkSize + rateChunkSize + seqChunkSize + framListChunkSize;
    // RIFF Header: "RIFF" + <totalSize> + "ACON"

    const buffer = new Uint8Array(8 + riffSize);
    const view = new DataView(buffer.buffer);
    let offset = 0;

    // 1. RIFF Header
    writeString(view, offset, "RIFF"); offset += 4;
    view.setUint32(offset, riffSize, true); offset += 4;
    writeString(view, offset, "ACON"); offset += 4;

    // 2. INFO List
    writeString(view, offset, "LIST"); offset += 4;
    view.setUint32(offset, infoListContentSize, true); offset += 4;
    writeString(view, offset, "INFO"); offset += 4;
    
    // INAM
    writeString(view, offset, "INAM"); offset += 4;
    view.setUint32(offset, title.length, true); offset += 4;
    writeString(view, offset, title); offset += inamSize;

    // IART
    writeString(view, offset, "IART"); offset += 4;
    view.setUint32(offset, artist.length, true); offset += 4;
    writeString(view, offset, artist); offset += iartSize;

    // 3. ANI Header (anih)
    writeString(view, offset, "anih"); offset += 4;
    view.setUint32(offset, anihSize, true); offset += 4;
    
    // Struct ANIHeader
    view.setUint32(offset, 36, true); offset += 4; // cbSize
    view.setUint32(offset, frames.length, true); offset += 4; // nFrames
    view.setUint32(offset, frames.length, true); offset += 4; // nSteps
    view.setUint32(offset, 0, true); offset += 4; // cx (0 = default)
    view.setUint32(offset, 0, true); offset += 4; // cy
    view.setUint32(offset, 32, true); offset += 4; // bitCount
    view.setUint32(offset, 1, true); offset += 4; // planes
    // JifRate (default rate in jiffies, 1 jiffy = 1/60 sec approx 16.6ms)
    // We assume first frame duration as default, but we provide 'rate' chunk anyway.
    const defaultJiffies = Math.floor(frames[0].duration / 16.666);
    view.setUint32(offset, defaultJiffies, true); offset += 4; 
    view.setUint32(offset, 1, true); offset += 4; // flags (1 = AF_ICON)

    // 4. Rate Chunk (rate)
    writeString(view, offset, "rate"); offset += 4;
    view.setUint32(offset, rateSize, true); offset += 4;
    frames.forEach(f => {
        const jiffies = Math.max(1, Math.floor(f.duration / 16.666));
        view.setUint32(offset, jiffies, true); offset += 4;
    });

    // 5. Sequence Chunk (seq)
    writeString(view, offset, "seq "); offset += 4;
    view.setUint32(offset, seqSize, true); offset += 4;
    frames.forEach((_, idx) => {
        view.setUint32(offset, idx, true); offset += 4;
    });

    // 6. Fram List (fram)
    writeString(view, offset, "LIST"); offset += 4;
    view.setUint32(offset, framListContentSize, true); offset += 4;
    writeString(view, offset, "fram"); offset += 4;

    iconChunks.forEach(chunk => {
        writeString(view, offset, "icon"); offset += 4;
        view.setUint32(offset, chunk.length, true); offset += 4;
        buffer.set(chunk, offset);
        offset += pad(chunk.length);
    });

    return new Blob([buffer], { type: 'application/octet-stream' });
};
