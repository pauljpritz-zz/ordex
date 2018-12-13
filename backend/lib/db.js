const IPFS = require('ipfs');
const OrbitDB = require('orbit-db');

const ipfsOptions = {
  EXPERIMENTAL: {
    pubsub: true
  }
};
const ipfs = new IPFS(ipfsOptions);
let orbitdb = null;
ipfs.on('error', (e) => console.error(e));

module.exports = function (name, dbType) {
  return new Promise((res) => {
    ipfs.on('ready', async () => {
      if (!orbitdb) {
        orbitdb = new OrbitDB(ipfs);
      }

      const dbName = `chainhack.ordex.${name}`;
      let db = null;
      if (dbType === 'kvstore') {
        db = await orbitdb.kvstore(dbName)
      } else {
        db = await orbitdb.docs(dbName);
      }
      await db.load();
      res(db);
    });
  });
};
