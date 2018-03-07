const needTypes = require('../../../config/needTypes');

module.exports = {
  need_type: {
    presence: true,
    inclusion: {
      within: needTypes
    }
  },
  dav_id: {
    presence: {
      allowEmpty: false
    },
    type: 'string'
  },
  'region.longitude': {
    presence: true,
    numericality: {
      lessThanOrEqualTo: 180,
      greaterThanOrEqualTo: -180
    }
  },
  'region.latitude': {
    presence: true,
    numericality: {
      lessThanOrEqualTo: 90,
      greaterThanOrEqualTo: -90
    }
  },
  'region.radius': {
    presence: true,
    numericality: {
      greaterThan: 0
    }
  }
};
