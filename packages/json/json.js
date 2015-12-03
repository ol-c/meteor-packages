Template.json.helpers({
  is : function (type) {
    var data = Template.instance().data;
    if (Array.isArray(data)) {
      return type == 'array';
    }
    else return typeof data === type;
  },
  keys : function () {
    return Object.keys(Template.instance().data);
  },
  fromKey : function (key) {
    return Template.instance().data[key];
  },
  type : function () {
    var data = Template.instance().data;
    if (Array.isArray(data)) {
      return 'array';
    }
    else return typeof data;
  }
})