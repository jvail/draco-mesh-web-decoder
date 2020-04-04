fs = require('fs')
const draco = fs.readFileSync('src/draco-build/draco_decoder.js').toString();
// ES6 export seems not to work properly in worker + emsdk
fs.writeFileSync('src/tmp/draco_decoder.js', `${draco}\nexport default DracoMeshWebDecoder;`);