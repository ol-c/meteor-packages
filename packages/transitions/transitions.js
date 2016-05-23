transition = function transition(templateName, data, transition) {
  if (templateName) {
    if (specialTemplates[templateName.split(' ')[0]]) {
      specialTemplates[templateName.split(' ')[0]](templateName, data, transition);
    }
    else {
      goToNextTemplate(templateName, data, transition);
    }
  }
}

var mainTemplates = [];

var templateInstancesUpdated = new ReactiveVar(Date.now());

var currentTemplateIndex = 0;

var goingBack = false;

//  go to previous template and adjust index
function goToPrevTemplate(transition) {
  function goBack() {
    templateInstancesUpdated.set(Date.now());
    currentTemplateIndex = Math.max(0, currentTemplateIndex - 1);
    //  timeout for transition removal to avoid jitter back
    Meteor.setTimeout(function() {
      $(document.body).attr('transition', 'none');
    });
  }
  if (currentTemplateIndex > 0) {
    goingBack = true;
    $(document.body).attr('transition', transition || "none");
    if (transition) {
      $(document.body).one('animationend webkitAnimationEnd oAnimationEnd MSAnimationEnd', function () {
        if (goingBack) {
          goBack();
          goingBack = false;
        }
      });
    }
    else {
      goBack();
    }
  }
}

//  add template to list of templates and update template list accordingly
function goToNextTemplate(name, data, transition) {
  while (mainTemplates.length > currentTemplateIndex+1) {
    mainTemplates.pop();
  }
  $(document.body).attr('transition', transition || "none");
  mainTemplates.push({name:name, data:data});

  currentTemplateIndex = mainTemplates.length - 1;
  templateInstancesUpdated.set(Date.now());
}

Template.registerHelper("mainRenderedTemplates", function () {
  templateInstancesUpdated.get();
  return mainTemplates;
});

Template.registerHelper("mainTemplateVisible", function (index) {
  //  only render the last 2 templates
  return currentTemplateIndex >= index && currentTemplateIndex - 2 < index;
})

Template.registerHelper("previousTemplate", function () {
  templateInstancesUpdated.get();
  if (currentTemplateIndex > 0) {
    return mainTemplates[currentTemplateIndex-1].name;
  }
  return undefined;
});

Template.registerHelper("breadcrumbs", function () {
  templateInstancesUpdated.get();
  var breadcrumbs = [];
  for (var i=0; i<=currentTemplateIndex; i++) {
    breadcrumbs.push({
      name : mainTemplates[i].name,
      numBack : mainTemplates.length - i
    });
  }
  return breadcrumbs;
});

Template.body.events({
  'tap'  : function (event, template) {
    var tappedIndex = $(event.target).closest('.main-template-container').prevAll('.main-template-container').size();
    if (tappedIndex !== currentTemplateIndex) {
      transition('back ' + (currentTemplateIndex - tappedIndex));
    }
  }
});

var specialTemplates = {
  back : function (name, data, transition) {
    goToPrevTemplate(transition);
  },
  blank : function (name, data, transition) {
    currentTemplateIndex = 0;
    while (mainTemplates.length > 0) {
      mainTemplates.shift();
    }
    templateInstancesUpdated.set(Date.now());
  }
}

Template.transitioner.events({
  'tap' : function (event, template) {
    //  don't double transition
    Meteor.setTimeout(function () {
      if (!event.transitioning) {
        event.transitioning = true;
        transition(template.data.template, template.data.data, template.data.transition);
      }
    });
  }
});