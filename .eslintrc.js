module.exports = {
    root: true,
    rules: {
        curly: ['error', 'all'],
        'brace-style': ['error', '1tbs', { allowSingleLine: false }],
        'arrow-parens': [0],
        'prefer-const': 0,
        'no-irregular-whitespace': 0,
        'one-var': 0,
        // 'no-irregular-whitespace': 0,
        'quote-props': ['error', 'as-needed'],
        'object-shorthand': [
            'error',
            'always',
            { avoidQuotes: false },
        ],
    },
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: "module"
    }
}
