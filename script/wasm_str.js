fs = require('fs')
const wasm = Buffer.from(fs.readFileSync('src/draco-build/draco_decoder.wasm')).toString('base64');
fs.writeFileSync('src/tmp/import-wasm.js', `
const wasm = "${wasm}";\n
export default wasm;\n
`);