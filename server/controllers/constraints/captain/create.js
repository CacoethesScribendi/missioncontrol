module.exports = {
  dav_id: {
    presence: {
      allowEmpty: false
    },
    type: 'string'
  },
  notification_url: {
    presence: true,
    url: {
      allowLocal: true
    }
  }
};
