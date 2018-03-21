module.exports = {
  id: {
    presence: {
      allowEmpty: false
    },
    type: 'string'
  },
  ttl: {
    numericality: {
      onlyInteger: true,
      strict: true
    }
  },
  bid_id: {
    presence: {
      allowEmpty: false
    }
  },
  dav_id: {
    presence: {
      allowEmpty: false
    },
    type: 'string'
  },
  latitude: {
    presence: true,
    numericality: {
      lessThanOrEqualTo: 90,
      greaterThanOrEqualTo: -90
    }
  },
  longitude: {
    presence: true,
    numericality: {
      lessThanOrEqualTo: 180,
      greaterThanOrEqualTo: -180
    }
  }
};
