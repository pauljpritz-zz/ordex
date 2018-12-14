# OrDex backend

The OrDex backend requires NodeJS >= 8.

## Getting started

```
npm install
npm run dev
```

## Deploying

We recommend using [PM2][pm2] for deployment.
The deployment should be as simple as running

```
pm2 start bin/ordex.js
pm2 startup
```

[pm2]: https://pm2.io/doc/en/runtime/overview