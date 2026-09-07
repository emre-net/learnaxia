const fs = require('fs');
const path = require('path');

// 1x1 transparent PNG buffer
const transparentPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

const targetPath = path.join(__dirname, 'assets', 'images', 'transparent-pixel.png');
fs.writeFileSync(targetPath, transparentPng);
console.log('Transparent pixel created at ' + targetPath);
