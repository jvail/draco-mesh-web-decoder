import { terser } from 'rollup-plugin-terser';

export default args => ({
    input: 'src/index.js',
    output: [
        { file: `dist/index${args.configDebug ? '.debug': ''}.js`, format: 'es', preferConst: true }
    ],
    plugins: args.configDebug ? [] : [terser()]
});
