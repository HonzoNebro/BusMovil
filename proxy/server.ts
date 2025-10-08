import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();

app.use((_, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  next();
});

app.use(
  '/urbanos',
  createProxyMiddleware({
    target: 'http://77.224.241.76/urbanos',
    changeOrigin: true,
    pathRewrite: { '^/urbanos': '' }
  })
);

app.listen(3001, () => console.log('Proxy listo en http://localhost:3001'));
