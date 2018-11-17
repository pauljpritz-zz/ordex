const IPFS = require('ipfs');
const OrbitDB = require('orbit-db');

module.exports = function (cb) {
  const ipfsOptions = {
    EXPERIMENTAL: {
      pubsub: true
    }
  };

  const ipfs = new IPFS(ipfsOptions);

  ipfs.on('error', (e) => console.error(e));
  ipfs.on('ready', async () => {
    const orbitdb = new OrbitDB(ipfs);

    const db = await orbitdb.docs('chainhack.ordex');
    await db.load();
    cb(db);
  });
};
