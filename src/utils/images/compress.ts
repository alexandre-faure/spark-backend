import sharp from 'sharp';

const MAX_DIMENSION = 1024; // pixels
const MAX_SIZE_KB = 3 * 1024; // 3MB

export async function compressToTargetSize(
    inputBuffer: Buffer,
    format: 'jpeg' | 'png' = 'jpeg',
    targetKB: number = MAX_SIZE_KB,
): Promise<Buffer> {
    const metadata = await sharp(inputBuffer).metadata();
    const maxDimension = Math.max(metadata.width || 0, metadata.height || 0);
    const resizeFactor = maxDimension > MAX_DIMENSION ? MAX_DIMENSION / maxDimension : 1;

    const resizedBuffer = await sharp(inputBuffer)
        .resize({
            width: Math.round((metadata.width || 0) * resizeFactor),
            height: Math.round((metadata.height || 0) * resizeFactor),
            fit: 'inside',
            withoutEnlargement: true,
        })
        .toBuffer();

    let quality = 90;
    let compressed: Buffer = resizedBuffer;

    while (quality > 10) {
        compressed = await sharp(resizedBuffer)
            .toFormat(format, { quality })
            .toBuffer();

        if (compressed.length / 1024 <= targetKB) break;
        quality -= 5;
    }

    return compressed;
}
