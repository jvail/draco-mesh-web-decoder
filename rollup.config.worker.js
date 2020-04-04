import { terser } from "rollup-plugin-terser";

export default [
    {
        input: 'src/worker-script.js',
        output: [
            { file: `src/tmp/worker-script-bundle.js`, format: 'es', preferConst: true }
        ],
        plugins: [terser()]
    }
];
