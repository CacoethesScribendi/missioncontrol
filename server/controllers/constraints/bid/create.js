module.exports = {
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
};
