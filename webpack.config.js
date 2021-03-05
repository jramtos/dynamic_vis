const path = require('path');

module.exports = {
  entry: {
    app: './src/index.js',
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: [/node_modules/],
        options: {
          presets: ['es2017'],
        },
      },
      {
        test: /\.(gif|svg|jpg|png)$/,
        loader: "file-loader",
      }
    ],
  },
  output: {
    filename: 'bundle.js',
    path: path.join(__dirname, './'),
  },
  plugins: [],
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development', // eslint-disable-line
};
