import { terser } from 'rollup-plugin-terser';

export default args => ({
    input: 'src/worker-script.js',
    output: [
        { file: `src/tmp/worker-script.${args.configDebug ? 'debug' : 'min' }.js`, format: 'es', preferConst: true }
    ],
    plugins: args.configDebug ? [] : [terser({ output: { quote_style: 1 } })]

});
