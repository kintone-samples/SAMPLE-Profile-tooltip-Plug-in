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

      // Build the tooltip content as DOM elements (not an HTML string),
      // so user data is inserted as text and never interpreted as HTML.
      function createTable(userData) {
        const table = document.createElement('table');
        table.className = 'Tooltip-table';
        INFOLIST.forEach(function(userInfoType) {
          const tr = document.createElement('tr');
          const titleCell = document.createElement('td');
          const valueCell = document.createElement('td');
          titleCell.textContent = userInfoType.title;
          valueCell.textContent = ': ' + userData[userInfoType.key];
          tr.appendChild(titleCell);
          tr.appendChild(valueCell);
          table.appendChild(tr);
        });
        return table;
      }

      // Attach a tooltip to each user element.
      // Match users by code in the order they are listed in the User Selection field,
      // so a user missing from the API response (e.g. a deleted user) doesn't shift the others.
      targetUsers.forEach(function(element, index) {
        const userData = respUserData.find(function(user) {
          return user.code === fieldValCodeList[index];
        });
        if (!userData) {
          return;
        }
        tippy(element, {
          content: createTable(userData),
          arrow: tippy.roundArrow,
          animation: 'scale',
          interactive: true,
          placement: 'right',
          // Append to <body> so the tooltip isn't clipped by the field's container
          appendTo: function() {
            return document.body;
          }
        });
      });
    }, function(error) {
      // error
      console.log(error);
    });
    return event;
  });
})(kintone.$PLUGIN_ID);
