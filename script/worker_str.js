fs = require('fs')
// base64 too big - but could not figure out how to avoid errors due to unescaped strings
const worker = Buffer.from(fs.readFileSync('src/tmp/worker-script.min.js')).toString('base64');
fs.writeFileSync('src/tmp/import-worker.js', `
const worker = "${worker}";\n
export default worker;\n
`);
