const fs = require('fs');
const path = require('path');
const svg2ttf = require('svg2ttf');
const ttf2woff = require('ttf2woff');

const resourcesDir = path.join(__dirname, 'resources');
if (!fs.existsSync(resourcesDir)) {
    fs.mkdirSync(resourcesDir, { recursive: true });
}

function polarToFont(cx, cy, r, angleDeg) {
    const rad = (angleDeg - 90) * Math.PI / 180.0;
    return {
        x: cx + (r * Math.cos(rad)),
        y: cy - (r * Math.sin(rad)) // Invert Y for font coordinate space
    };
}

function describeFontArcRing(cx, cy, rOuter, rInner, pct) {
    if (pct <= 0) return describeFontCircle(cx, cy, rOuter) + " " + describeFontCircle(cx, cy, rOuter - 50, true);
    if (pct >= 100) return describeFontCircle(cx, cy, rOuter) + " " + describeFontCircle(cx, cy, rInner, true);
    
    const endAngle = (pct / 100) * 360;
    const pStart = polarToFont(cx, cy, rOuter, 0);
    const pEndOuter = polarToFont(cx, cy, rOuter, endAngle);
    const pEndInner = polarToFont(cx, cy, rInner, endAngle);
    const pStartInner = polarToFont(cx, cy, rInner, 0);
    
    const largeArc = endAngle > 180 ? 1 : 0;
    // In font space (Y up), visual clockwise arc from 0 to endAngle uses sweep=0
    return `M ${pStart.x.toFixed(2)} ${pStart.y.toFixed(2)} ` +
           `A ${rOuter} ${rOuter} 0 ${largeArc} 0 ${pEndOuter.x.toFixed(2)} ${pEndOuter.y.toFixed(2)} ` +
           `L ${pEndInner.x.toFixed(2)} ${pEndInner.y.toFixed(2)} ` +
           `A ${rInner} ${rInner} 0 ${largeArc} 1 ${pStartInner.x.toFixed(2)} ${pStartInner.y.toFixed(2)} Z`;
}

function describeFontPie(cx, cy, r, pct) {
    if (pct <= 0) return describeFontCircle(cx, cy, r) + " " + describeFontCircle(cx, cy, r - 50, true);
    if (pct >= 100) return describeFontCircle(cx, cy, r);
    
    const endAngle = (pct / 100) * 360;
    const pStart = polarToFont(cx, cy, r, 0);
    const pEnd = polarToFont(cx, cy, r, endAngle);
    const largeArc = endAngle > 180 ? 1 : 0;
    
    return `M ${cx} ${cy} L ${pStart.x.toFixed(2)} ${pStart.y.toFixed(2)} ` +
           `A ${r} ${r} 0 ${largeArc} 0 ${pEnd.x.toFixed(2)} ${pEnd.y.toFixed(2)} Z`;
}

function describeFontCircle(cx, cy, r, ccw = false) {
    const sweep = ccw ? 0 : 1;
    return `M ${cx} ${cy + r} A ${r} ${r} 0 1 ${sweep} ${cx} ${cy - r} A ${r} ${r} 0 1 ${sweep} ${cx} ${cy + r} Z`;
}

const geminiPath = "M 500 750 C 500 500 750 300 1000 300 C 750 300 500 100 500 -150 C 500 100 250 300 0 300 C 250 300 500 500 500 750 Z";

const fontFile = "./resources/myicons-v8.woff";

const iconsConfig = {
    "myagy-gemini": { "description": "Official Monochrome Gemini Logo", "default": { "fontPath": fontFile, "fontCharacter": "\ue900" } }
};

let glyphsXml = `<glyph glyph-name="gemini" unicode="&#xe900;" horiz-adv-x="1000" d="${geminiPath}" />\n`;

let uRingCode = 0xe901;
for (let i = 0; i <= 100; i += 5) {
    const hex = uRingCode.toString(16).toUpperCase();
    const pathD = describeFontArcRing(500, 300, 350, 230, i);
    glyphsXml += `<glyph glyph-name="ring-${i}" unicode="&#x${hex};" horiz-adv-x="1000" d="${pathD}" />\n`;
    iconsConfig[`myagy-ring-${i}`] = {
        "description": `Ring Chart ${i}%`,
        "default": {
            "fontPath": fontFile,
            "fontCharacter": String.fromCharCode(uRingCode)
        }
    };
    uRingCode++;
}

let uPieCode = 0xea00;
for (let i = 0; i <= 100; i += 5) {
    const hex = uPieCode.toString(16).toUpperCase();
    const pathD = describeFontPie(500, 300, 350, i);
    glyphsXml += `<glyph glyph-name="pie-${i}" unicode="&#x${hex};" horiz-adv-x="1000" d="${pathD}" />\n`;
    iconsConfig[`myagy-pie-${i}`] = {
        "description": `Pie Chart ${i}%`,
        "default": {
            "fontPath": fontFile,
            "fontCharacter": String.fromCharCode(uPieCode)
        }
    };
    uPieCode++;
}

const svgFont = `<?xml version="1.0" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns="http://www.w3.org/2000/svg">
<defs>
  <font id="myicons" horiz-adv-x="1000">
    <font-face units-per-em="1000" ascent="800" descent="-200" />
    <missing-glyph horiz-adv-x="500" />
    ${glyphsXml}
  </font>
</defs>
</svg>`;

const ttf = svg2ttf(svgFont, {});
const woff = ttf2woff(new Uint8Array(ttf.buffer));

fs.writeFileSync(path.join(resourcesDir, 'myicons-v8.woff'), Buffer.from(woff.buffer));
fs.writeFileSync(path.join(__dirname, 'generated_font_icons_config.json'), JSON.stringify(iconsConfig, null, 2));
console.log('Successfully generated full chart WOFF font with single-char unicode fontCharacter!');
