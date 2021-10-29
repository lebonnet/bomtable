const path = require('path'),
    { DefinePlugin } = require('webpack'),
    argv = require('yargs').argv,
    MiniCssExtractPlugin = require('mini-css-extract-plugin'),
    HtmlWebpackPlugin = require('html-webpack-plugin'),
    TerserPlugin = require('terser-webpack-plugin'),
    isDevelopment = argv.mode === 'development',
    distPath = path.join(__dirname, '/dist'),
    { version } = require('./package.json')

const config = {
    entry: {
        main: './src/js/bomtable.js',
    },
    output: {
        filename: 'bomtable.min.js',
        path: distPath,
    },
    module: {
        rules: [
            {
                test: /\.html$/,
                use: 'html-loader',
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-env'],
                        },
                    },
                ],
            },
            {
                test: /\.scss$/,
                exclude: /node_modules/,
                use: [
                    isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader',
                    },
                    {
                        loader: 'resolve-url-loader',
                    },
                    {
                        loader: 'sass-loader',
                        options: {
                            sourceMap: true,
                        },
                    },
                ],
            },
            {
                test: /\.svg$/,
                type: 'asset/inline',
                use: 'svgo-loader',
            },
        ],
    },
    plugins: [
        new DefinePlugin({
            VERSION: JSON.stringify(version),
        }),
        new MiniCssExtractPlugin({
            filename: '[name].css',
            chunkFilename: '[id].css',
        }),
        new HtmlWebpackPlugin({
            template: './index.html',
            scriptLoading: 'blocking',
        }),
    ],
    optimization: {
        minimize: !isDevelopment,
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    compress: {
                        drop_console: true,
                    },
                },
            }),
        ],
    },
    devServer: {
        static: {
            directory: distPath,
        },
        port: 83,
        compress: true,
        open: true,
    },
}

module.exports = config
