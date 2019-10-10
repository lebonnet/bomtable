const
    path = require('path'),
    argv = require('yargs').argv,
    MiniCssExtractPlugin = require('mini-css-extract-plugin'),
    UglifyJsPlugin = require('uglifyjs-webpack-plugin'),
    HtmlWebpackPlugin = require('html-webpack-plugin'),
    isDevelopment = argv.mode === 'development',
    distPath = path.join(__dirname, '/dist'),

    WebpackVersionFilePlugin = require('webpack-version-file-plugin'),
    execa = require('execa'),

    gitHash = execa.sync('git', ['rev-parse', '--short', 'HEAD']).stdout;

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
                    // options: {
                    //     minimize: !isDevelopment
                    // }
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
        }),
        new WebpackVersionFilePlugin({
            packageFile: path.join(__dirname, 'package.json'),
            template: path.join(__dirname, 'version.ejs'),
            outputFile: path.join(__dirname, 'version.json'),
            extras: {
                'githash': gitHash
            }
        }),
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
        port: 83,
        compress: true,
        open: true
    }
};

module.exports = config;