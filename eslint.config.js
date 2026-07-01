// @see https://github.com/stefanobartoletti/eslint-config

import config from '@antfu/eslint-config'

export default config({
    ignores: [
        'public/*',
    ],
    lessOpinionated: true,
    stylistic: {
        indent: 4,
    },
    jsonc: {
        overrides: {
            'jsonc/indent': ['error', 2],
        },
    },
    typescript: true,
    formatters: true,
}, [
    {
        // General
        rules: {
            // https://github.com/antfu/eslint-plugin-antfu/blob/main/src/rules/if-newline.md
            'antfu/if-newline': 'off',
            // https://github.com/antfu/eslint-plugin-antfu/blob/main/src/rules/top-level-function.md
            'antfu/top-level-function': 'error',
            // https://eslint.org/docs/latest/rules/prefer-const
            'prefer-const': 'off',
            // https://eslint.org/docs/latest/rules/curly
            'curly': ['error', 'all'], // default ["multi-or-nest", "consistent"]

            // https://eslint.style/rules/js/function-call-spacing
            'style/function-call-spacing': ['error', 'never'],
            // https://eslint.style/rules/js/max-statements-per-line
            'style/max-statements-per-line': ['error', {max: 1}],
            // https://eslint.style/rules/js/brace-style

            // https://eslint.style/rules/js/brace-style
            'style/brace-style': ['error', '1tbs', {allowSingleLine: false}],
            // https://eslint.style/rules/js/arrow-parens
            'style/arrow-parens': ['error', 'as-needed', {requireForBlockBody: false}],

            // https://github.com/eslint-community/eslint-plugin-n/blob/master/docs/rules/prefer-global/process.md
            'node/prefer-global/process': 'off',
            // https://github.com/eslint-community/eslint-plugin-n/blob/master/docs/rules/prefer-global/buffer.md
            'node/prefer-global/buffer': 'off',

            'unused-imports/no-unused-vars': 'off',

            'ts/no-unused-expressions': 'off',
            'unicorn/consistent-function-scoping': 'off',
            'regexp/no-obscure-range': 'off',
            'eslint-comments/no-unlimited-disable': 'off',

            'pnpm/json-enforce-catalog': 'off',

            'e18e/prefer-static-regex': 'off',
        },
    },
])
