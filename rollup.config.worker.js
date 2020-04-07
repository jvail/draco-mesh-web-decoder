import { terser } from 'rollup-plugin-terser';

export default [
    {
        input: 'src/worker-script.js',
        output: [
            { file: `src/tmp/worker-script.min.js`, format: 'es', preferConst: true }
        ],
        plugins: [terser({ output: { quote_style: 1 } })]
    }
];
