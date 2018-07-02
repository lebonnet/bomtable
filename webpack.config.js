const path = require('path'),
    argv = require('yargs').argv,
    MiniCssExtractPlugin = require('mini-css-extract-plugin'),
    UglifyJsPlugin = require('uglifyjs-webpack-plugin'),
    HtmlWebpackPlugin = require('html-webpack-plugin'),

    isDevelopment = argv.mode === 'development',
    distPath = path.join(__dirname, '/dist');

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
                    presets: ['env']
                }
            }]
        }, {
            test: /\.scss$/,
            exclude: /node_modules/,
            use: [
                isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
                {
                    loader: 'css-loader',
                    options: {
                        minimize: !isDevelopment
                    }
                },
                'sass-loader',
                'resolve-url-loader'
            ]
        }]
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: '[name].css',
            chunkFilename: '[id].css'
        }),
        new HtmlWebpackPlugin({
            template: './index.html'
        })
    ],
    optimization: !isDevelopment ? {
        minimizer: [
            new UglifyJsPlugin({
                parallel: true,
                sourceMap: false,
                uglifyOptions: {
                    ecma: 6,
                    compress: {
                        drop_console: true,
                    },
                    output: {
                        comments: false,
                        beautify: false,
                    }
                }
            }),
        ],
    } : {},
    devServer: {
        contentBase: distPath,
        port: 9000,
        compress: true,
        open: true
    }
};

module.exports = config;