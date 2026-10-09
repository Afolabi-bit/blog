import sharp from "sharp";
import fs from "fs";

const SVG_CONTENT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="noterverse-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fa7a18" />
      <stop offset="100%" stop-color="#ea580c" />
    </linearGradient>
  </defs>
  <circle cx="256" cy="256" r="248" fill="url(#noterverse-grad)" />
  <g fill="none" stroke="#ffffff" stroke-width="62" stroke-linecap="round" stroke-linejoin="round">
    <path d="M 167 355 L 167 157 L 345 355 L 345 157" />
  </g>
</svg>`;

async function makeIco(pngBuffers) {
  const count = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // icon type (ICO)
  header.writeUInt16LE(count, 4); // count of images

  let offset = 6 + count * 16;
  const dirEntries = [];
  for (const img of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(img.buffer.length, 8); // size
    entry.writeUInt32LE(offset, 12); // offset
    dirEntries.push(entry);
    offset += img.buffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...pngBuffers.map((b) => b.buffer)]);
}

async function run() {
  const svgBuffer = Buffer.from(SVG_CONTENT);

  // 1. Save SVG
  fs.writeFileSync("public/logo.svg", SVG_CONTENT, "utf-8");
  console.log("Saved public/logo.svg");

  // 2. 512x512 PNG logo
  const png512 = await sharp(svgBuffer).resize(512, 512).png().toBuffer();
  fs.writeFileSync("public/logo.png", png512);
  fs.writeFileSync("app/icon.png", png512);
  console.log("Saved public/logo.png & app/icon.png (512x512)");

  // 3. Apple Touch Icon 180x180
  const apple180 = await sharp(svgBuffer).resize(180, 180).png().toBuffer();
  fs.writeFileSync("app/apple-icon.png", apple180);
  console.log("Saved app/apple-icon.png (180x180)");

  // 4. Multi-resolution ICO (16x16, 32x32, 48x48)
  const p16 = await sharp(svgBuffer).resize(16, 16).png().toBuffer();
  const p32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer();
  const p48 = await sharp(svgBuffer).resize(48, 48).png().toBuffer();
  const icoBuffer = await makeIco([
    { width: 16, height: 16, buffer: p16 },
    { width: 32, height: 32, buffer: p32 },
    { width: 48, height: 48, buffer: p48 },
  ]);
  fs.writeFileSync("app/favicon.ico", icoBuffer);
  fs.writeFileSync("public/favicon.ico", icoBuffer);
  console.log("Saved app/favicon.ico & public/favicon.ico");

  // Clean up test images in scripts
  const testFiles = [
    "scripts/logo1.png",
    "scripts/logo2.png",
    "scripts/logo3.png",
    "scripts/logo4.png",
    "scripts/logo5.png",
    "scripts/logo6.png",
    "scripts/logo7.png",
    "scripts/logo8.png",
    "scripts/logo9.png",
    "scripts/logo10.png",
    "scripts/logo11.png",
    "scripts/logo12.png",
    "scripts/logoA.png",
    "scripts/logoB.png",
    "scripts/logoC.png",
    "scripts/logoD.png",
    "scripts/logoA_16.png",
    "scripts/logoA_32.png",
    "scripts/logo_symmetric.png",
    "scripts/logo_uniform.png",
    "scripts/logo_uniform2.png",
    "scripts/logo_editorial.png",
    "scripts/logo_uniform_16.png",
    "scripts/logo_uniform_32.png",
    "scripts/test_favicon.ico",
    "scripts/test_logo.mjs",
    "scripts/test_logo2.mjs",
    "scripts/test_logo3.mjs",
    "scripts/test_logo4.mjs",
    "scripts/test_symmetric.mjs",
    "scripts/test_uniform.mjs",
  ];
  for (const f of testFiles) {
    if (fs.existsSync(f)) {
      fs.unlinkSync(f);
    }
  }
  console.log("Cleaned temporary test files");
}

run().catch(console.error);
