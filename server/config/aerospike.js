module.exports = {
  aerospikeConfig: () => {
    return {
      hosts: [{ addr: 'aerospike', port: 3000 }]
    };
  },
  aerospikeDBParams: () => {
    return {
      defaultNamespace: 'mc',
      defaultSet: 'registered_captains'
    };
  }
};
