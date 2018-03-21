module.exports = {
  dav_id: {
    presence: {
      allowEmpty: false
    },
    type: 'string'
  },
  need_id: {
    presence: {
      allowEmpty: false
    },
    type: 'string'
  },
  expires_at: {
    numericality: {
      greaterThanOrEqualTo: Date.now() - 60000
    }
  },
  price: {
    presence: {
      allowEmpty: false
    },
    type: 'string'
  },
  price_type: {
    presence: {
      allowEmpty: false
    },
    type: 'string'
  },
  price_description: {
    presence: {
      allowEmpty: false
    },
    type: 'string'
  },
  time_to_pickup: {
    presence: true,
    numericality: {
      greaterThan: 0
    }
  },
  time_to_dropoff: {
    presence: true,
    numericality: {
      greaterThan: 0
    }
  },
  insured: {
    type: 'boolean'
  },
  ip_protection_level: {
    numericality: {
      onlyInteger: true,
      strict: true,
      lessThanOrEqualTo: 69,
      greaterThanOrEqualTo: 54
    }
  },
  drone_contact: {
    type: 'string'
  },
  drone_manufacturer: {
    type: 'string'
  },
  drone_model: {
    type: 'string'
  },
  ttl: {
    numericality: {
      onlyInteger: true,
      strict: true
    }
  }
};

