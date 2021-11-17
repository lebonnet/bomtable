const path = require('path'),
    argv = require('yargs').argv,
    MiniCssExtractPlugin = require('mini-css-extract-plugin'),
    HtmlWebpackPlugin = require('html-webpack-plugin'),
    isDevelopment = argv.mode === 'development',
    distPath = path.join(__dirname, '/dist')

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
                test: /\.html$/i,
                loader: 'html-loader',
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
        new MiniCssExtractPlugin({
            filename: '[name].css',
            chunkFilename: '[id].css',
        }),
        new HtmlWebpackPlugin({
            template: './index.html',
            scriptLoading: 'blocking',
        }),
    ],
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
