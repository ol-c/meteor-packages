//  Extend template instances to get parent template
Blaze.TemplateInstance.prototype.parentTemplate = function (levels) {
  var view = Blaze.currentView.parentView.templateInstance();
};
