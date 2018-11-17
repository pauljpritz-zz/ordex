const IPFS = require('ipfs');
const OrbitDB = require('orbit-db');

const ipfsOptions = {
  EXPERIMENTAL: {
    pubsub: true
  }
};
const ipfs = new IPFS(ipfsOptions);
ipfs.on('error', (e) => console.error(e));

module.exports = function (name) {
  return new Promise((res) => {
    ipfs.on('ready', async () => {
      const orbitdb = new OrbitDB(ipfs);

      const db = await orbitdb.docs(`chainhack.ordex.${name}`);
      await db.load();
      res(db);
    });
  });
};
