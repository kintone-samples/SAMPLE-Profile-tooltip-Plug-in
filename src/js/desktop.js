/*
MIT License
Copyright (c) 2018 Cybozu
https://github.com/kintone/SAMPLE-Profile-tooltip-Plug-in/blob/master/LICENSE
*/
(function(PLUGIN_ID) {
  'use strict';
  /* global tippy */

  // Get plug-in configuration settings
  const CONFIG = kintone.plugin.app.getConfig(PLUGIN_ID);
  if (!CONFIG) {
    return false;
  }
  // Get each setting
  const CONFIG_NAME = CONFIG.name;

  // Keys and titles of user data to display
  const INFOLIST = [
    {key: 'email', title: 'Email'},
    {key: 'phone', title: 'Phone'},
    {key: 'mobilePhone', title: 'Mobile Phone'},
    {key: 'timezone', title: 'Time Zone'}
  ];

  kintone.events.on('app.record.detail.show', function(event) {
    const record = event.record;
    const userFieldVal = record[CONFIG_NAME].value;
    if (userFieldVal.length === 0) {
      return event;
    }

    // Get the element of the specified User Selection field
    const targetField = kintone.app.record.getFieldElement(CONFIG_NAME);
    if (!targetField) {
      return event;
    }

    // Workaround: the inner markup of the User Selection field has changed over time,
    // so avoid relying on class names or specific tags such as <a>.
    // Each selected user is rendered as a list item, so target the <li> elements.
    // Fall back to <a> elements for older UIs that do not render a list.
    let targetUsers = targetField.querySelectorAll('li');
    if (targetUsers.length === 0) {
      targetUsers = targetField.querySelectorAll('a');
    }
    if (targetUsers.length === 0) {
      return event;
    }

    // Get the code (login name) from the user data
    const fieldValCodeList = userFieldVal.map(function(value) {
      return value.code;
    });

    const body = {'codes': fieldValCodeList};
    kintone.api(kintone.api.url('/v1/users', true), 'GET', body, function(resp) {
      const respUserData = resp.users;

      function createTableTag(userData) {
        let table = '<table class="Tooltip-table">';
        INFOLIST.forEach(function(userInfoType) {
          table += '<tr>'
                    + '  <td>' + userInfoType.title + '</td>'
                    + '  <td>: ' + userData[userInfoType.key] + '</td>'
                    + '</tr>';
        });
        table += '</table>';
        return table;
      }

      // Create the HTML to display in the tooltip for each element.
      // Match users by code in the order they are listed in the User Selection field,
      // so a user missing from the API response (e.g. a deleted user) doesn't shift the others.
      const htmlContainer = [];
      const tooltipTargets = [];
      targetUsers.forEach(function(element, index) {
        const userData = respUserData.find(function(user) {
          return user.code === fieldValCodeList[index];
        });
        if (!userData) {
          return;
        }
        // Add an identifier to each node
        element.setAttribute('data-template', htmlContainer.length);
        htmlContainer.push(createTableTag(userData));
        tooltipTargets.push(element);
      });

      if (tooltipTargets.length === 0) {
        return;
      }

      tippy(tooltipTargets, {
        arrow: true,
        arrowType: 'round',
        animation: 'scale',
        interactive: true,
        placement: 'right',
        content: function(reference) {
          return htmlContainer[reference.getAttribute('data-template')];
        }
      });
    }, function(error) {
      // error
      console.log(error);
    });
    return event;
  });
})(kintone.$PLUGIN_ID);
