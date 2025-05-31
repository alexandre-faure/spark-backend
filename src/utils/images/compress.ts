import sharp from 'sharp';

const MAX_DIMENSION = 1024; // Maximum dimension for resizing
const MAX_SIZE_KB = 3 * 1024; // Maximum size in KB (3 MB)

export async function compressToTargetSize(
    inputFile: File,
    targetKB: number = MAX_SIZE_KB,
    format: 'jpeg' | 'png' = 'jpeg'
): Promise<Buffer> {
    const inputBuffer = await inputFile.arrayBuffer();
    const { width, height } = await sharp(inputBuffer).metadata();
    const maxDimension = Math.max(width, height);
    const resizeFactor = maxDimension > MAX_DIMENSION ? MAX_DIMENSION / maxDimension : 1;
    const resizedBuffer = await sharp(inputBuffer)
        .resize(Math.round(width * resizeFactor), Math.round(height * resizeFactor), {
            fit: 'inside',
            withoutEnlargement: true
        })
        .toBuffer();


    let quality = 90;
    let output: Buffer;

    while (quality > 10) {
        output = await sharp(resizedBuffer)[format]({ quality }).toBuffer();
        const sizeKB = output.length / 1024;

        if (sizeKB <= targetKB) break;
        quality -= 5;
    }

    return output!;
}
