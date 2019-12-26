const path = require('path');
const nodeExternals = require('webpack-node-externals');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ZipPlugin = require('zip-webpack-plugin');
module.exports = {
    target: 'node',
    externals: [nodeExternals()],
    entry: 'src/index.ts',
    resolve: {
        extensions: ['.ts'],
        alias: {
            src: path.resolve('src'),
        },
    },
    module: {
        rules: [
            {
                test: /\.(ts)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'ts-loader',
                },
            },
        ],
    },
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'dist'),
        libraryTarget: 'commonjs2', // fixes index.handler is not a function
    },
    plugins: [
        new CopyWebpackPlugin([
            { from: 'src/.*.html', to: '.', flatten: true },
            { from: 'src/.*.json', to: '.', flatten: true },
            { from: 'src/*.gif', to: '.', flatten: true },
            { from: 'src/*.jpg', to: '.', flatten: true },
            { from: 'src/*.jpeg', to: '.', flatten: true },
            { from: 'src/*.pdf', to: '.', flatten: true },
            { from: 'src/*.png', to: '.', flatten: true },
        ]),
        new ZipPlugin({
            filename: 'dist_codepipeline_auto.zip',
        }),
    ],
};
