const
    path = require('path'),
    argv = require('yargs').argv,
    MiniCssExtractPlugin = require('mini-css-extract-plugin'),
    HtmlWebpackPlugin = require('html-webpack-plugin'),
    isDevelopment = argv.mode === 'development',
    distPath = path.join(__dirname, '/dist')

const config = {
    entry: {
        main: './src/js/bomtable.js'
    },
    output: {
        filename: 'bomtable.min.js',
        path: distPath
    },
    module: {
        rules: [{
            test: /\.html$/,
            use: 'html-loader'
        }, {
            test: /\.js$/,
            exclude: /node_modules/,
            use: [{
                loader: 'babel-loader',
                options: {
                    presets: [
                        "@babel/preset-env"
                    ]
                }
            }]
        }, {
            test: /\.scss$/,
            exclude: /node_modules/,
            use: [
                isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
                {
                    loader: 'css-loader',
                },
                'sass-loader',
                'resolve-url-loader'
            ]
        }, {
            test: /\.svg$/,
            loader: 'svg-url-loader'
        }]
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: '[name].css',
            chunkFilename: '[id].css'
        }),
        new HtmlWebpackPlugin({
            template: './index.html'
        }),
    ],

    devServer: {
        contentBase: distPath,
        port: 83,
        compress: true,
        open: true
    }
};

module.exports = config;