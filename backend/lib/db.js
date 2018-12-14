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

exports.createDB = function (name, dbType) {
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

exports.createAllDBs = function (suffix) {
  return Promise.all([
    exports.createDB(`offers-${suffix}`),
    exports.createDB(`transactions-${suffix}`),
    exports.createDB(`message-${suffix}`, 'kvstore'),
    exports.createDB(`locks-${suffix}`, 'kvstore'),
  ]).then((dbArray) => {
    return {
      offers: dbArray[0],
      transactions: dbArray[1],
      messages: dbArray[2],
      locks: dbArray[3],
    };
  });
};
