import { readFile } from 'node:fs/promises';
import { inflateSync } from 'node:zlib';
import { resolve } from 'node:path';

const projectRoot = resolve(new URL('..', import.meta.url).pathname);
const manifestPath = resolve(projectRoot, 'public/assets/manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

if (!manifest || !Array.isArray(manifest.assets)) {
  throw new Error('Asset manifest must contain an assets array.');
}

const ids = new Set();
const paths = new Set();
let bytes = 0;
for (const asset of manifest.assets) {
  if (!asset || typeof asset.id !== 'string' || typeof asset.path !== 'string') {
    throw new Error('Asset manifest contains an invalid asset entry.');
  }
  if (ids.has(asset.id)) throw new Error(`Duplicate asset ID: ${asset.id}`);
  if (paths.has(asset.path)) throw new Error(`Duplicate asset path: ${asset.path}`);
  ids.add(asset.id);
  paths.add(asset.path);

  const path = resolve(projectRoot, 'public', asset.path);
  if (!asset.path.startsWith('assets/') || !path.startsWith(resolve(projectRoot, 'public/assets/')) || !asset.path.endsWith('.png')) {
    throw new Error(`Asset ${asset.id} has an unsafe or unsupported path: ${asset.path}`);
  }

  const data = await readFile(path).catch(() => null);
  if (!data) throw new Error(`Missing asset file for ${asset.id}: ${asset.path}`);
  bytes += data.byteLength;
  const png = decodePng(data, asset.id);
  const expected = asset.technical;
  if (expected && (png.width !== expected.width || png.height !== expected.height)) {
    throw new Error(
      `Asset ${asset.id} dimensions ${png.width}x${png.height} do not match ` +
      `manifest ${expected.width}x${expected.height}.`,
    );
  }
  if (expected?.alpha && !png.hasAlpha) {
    throw new Error(`Asset ${asset.id} is required to contain an alpha channel.`);
  }
  if (expected?.alpha && !png.hasTransparentPixel) {
    throw new Error(`Asset ${asset.id} is required to contain transparent pixels.`);
  }
  if (expected?.alpha && png.borderAlphaMax !== 0) {
    throw new Error(`Asset ${asset.id} has non-transparent pixels on its image border.`);
  }
}

console.log(`Verified ${manifest.assets.length} manifest PNGs (${bytes} bytes) with exact dimensions and alpha bounds.`);

function decodePng(data, id) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (!data.subarray(0, 8).equals(signature)) throw new Error(`Asset ${id} is not a PNG.`);

  let offset = 8;
  let header = null;
  const imageData = [];
  while (offset + 12 <= data.length) {
    const length = data.readUInt32BE(offset);
    const type = data.toString('ascii', offset + 4, offset + 8);
    const chunkStart = offset + 8;
    const chunkEnd = chunkStart + length;
    if (chunkEnd + 4 > data.length) throw new Error(`Asset ${id} contains a truncated PNG chunk.`);
    const chunk = data.subarray(chunkStart, chunkEnd);
    if (type === 'IHDR') {
      if (length !== 13) throw new Error(`Asset ${id} has an invalid PNG header.`);
      header = {
        width: chunk.readUInt32BE(0),
        height: chunk.readUInt32BE(4),
        bitDepth: chunk[8],
        colorType: chunk[9],
        compression: chunk[10],
        filter: chunk[11],
        interlace: chunk[12],
      };
    } else if (type === 'IDAT') {
      imageData.push(chunk);
    } else if (type === 'IEND') {
      break;
    }
    offset = chunkEnd + 4;
  }
  if (!header || imageData.length === 0 || header.width === 0 || header.height === 0) {
    throw new Error(`Asset ${id} is missing readable PNG image data.`);
  }
  if (header.compression !== 0 || header.filter !== 0 || header.interlace !== 0 || header.bitDepth !== 8) {
    throw new Error(`Asset ${id} uses an unsupported PNG encoding.`);
  }

  const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[header.colorType];
  if (!channels) throw new Error(`Asset ${id} uses a palette or unsupported PNG color type.`);
  const rowBytes = header.width * channels;
  const raw = inflateSync(Buffer.concat(imageData));
  const expectedBytes = header.height * (rowBytes + 1);
  if (raw.length !== expectedBytes) throw new Error(`Asset ${id} has incomplete PNG scanlines.`);

  let previous = Buffer.alloc(rowBytes);
  let borderAlphaMax = 0;
  let hasTransparentPixel = false;
  for (let y = 0; y < header.height; y += 1) {
    const filter = raw[y * (rowBytes + 1)];
    const encoded = raw.subarray(y * (rowBytes + 1) + 1, (y + 1) * (rowBytes + 1));
    const row = unfilter(encoded, previous, filter, channels);
    for (let x = 0; x < header.width; x += 1) {
      const alpha = header.colorType === 6 ? row[x * 4 + 3]
        : header.colorType === 4 ? row[x * 2 + 1] : 255;
      if (alpha < 255) hasTransparentPixel = true;
      if (x === 0 || y === 0 || x === header.width - 1 || y === header.height - 1) {
        borderAlphaMax = Math.max(borderAlphaMax, alpha);
      }
    }
    previous = row;
  }
  return {
    width: header.width,
    height: header.height,
    hasAlpha: header.colorType === 4 || header.colorType === 6,
    hasTransparentPixel,
    borderAlphaMax,
  };
}

function unfilter(encoded, previous, filter, bytesPerPixel) {
  const row = Buffer.alloc(encoded.length);
  for (let index = 0; index < encoded.length; index += 1) {
    const left = index >= bytesPerPixel ? row[index - bytesPerPixel] : 0;
    const up = previous[index] ?? 0;
    const upperLeft = index >= bytesPerPixel ? (previous[index - bytesPerPixel] ?? 0) : 0;
    const value = encoded[index];
    if (filter === 0) row[index] = value;
    else if (filter === 1) row[index] = (value + left) & 0xff;
    else if (filter === 2) row[index] = (value + up) & 0xff;
    else if (filter === 3) row[index] = (value + Math.floor((left + up) / 2)) & 0xff;
    else if (filter === 4) row[index] = (value + paeth(left, up, upperLeft)) & 0xff;
    else throw new Error(`Unsupported PNG filter ${filter}.`);
  }
  return row;
}

function paeth(left, up, upperLeft) {
  const estimate = left + up - upperLeft;
  const leftDistance = Math.abs(estimate - left);
  const upDistance = Math.abs(estimate - up);
  const upperLeftDistance = Math.abs(estimate - upperLeft);
  if (leftDistance <= upDistance && leftDistance <= upperLeftDistance) return left;
  if (upDistance <= upperLeftDistance) return up;
  return upperLeft;
}
