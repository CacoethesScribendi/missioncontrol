module.exports = {
  aerospikeConfig: () => {
    return {
      hosts: [{addr: 'aerospike', port: 3000}]
    };
  },
  namespace: 'test'
};
