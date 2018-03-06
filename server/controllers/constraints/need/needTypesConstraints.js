const needTypes = require('../../../config/needTypes');

module.exports = {
  need_type: {
    presence: true,
    inclusion: {
      within: needTypes
    }
  },
  'region.center_longitude': {
    presence: true,
    numericality: {
      lessThanOrEqualTo: 180,
      greaterThanOrEqualTo: -180
    }
  },
  'region.center_latitude': {
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
