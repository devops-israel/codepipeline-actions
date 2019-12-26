const path = require('path');
const nodeExternals = require('webpack-node-externals');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ZipPlugin = require('zip-webpack-plugin');
module.exports = {
    target: 'node',
    externals: [nodeExternals()],
    entry: 'src/controller.ts',
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
            { from: 'src/__*.html', to: '.', flatten: true },
            { from: 'src/__*.json', to: '.', flatten: true },
            { from: 'src/__*.gif', to: '.', flatten: true },
            { from: 'src/__*.jpg', to: '.', flatten: true },
            { from: 'src/__*.jpeg', to: '.', flatten: true },
            { from: 'src/__*.pdf', to: '.', flatten: true },
            { from: 'src/__*.png', to: '.', flatten: true },
        ]),
        new ZipPlugin({
            filename: 'dist_slack_update.zip',
        }),
    ],
};
