/*
MIT License
Copyright (c) 2018 Cybozu
https://github.com/kintone/SAMPLE-Profile-tooltip-Plug-in/blob/master/LICENSE
*/
jQuery.noConflict();
(function($, PLUGIN_ID) {
  'use strict';
  // Get configuration settings
  const CONF = kintone.plugin.app.getConfig(PLUGIN_ID);
  const $form = $('.js-submit-settings');
  const $cancelButton = $('.js-cancel-button');
  const $name = $('select[name="js-select-name-field"]');

  function escapeHtml(htmlstr) {
    return htmlstr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function setDropDown() {
    // Retrieve field information, then set drop-down
    return kintone.app.getFormFields().then((resp) => {
      for (const key in resp) {
        if (!resp.hasOwnProperty(key)) {
          continue;
        }
        const field = resp[key];
        if (field.type !== 'USER_SELECT') {
          continue;
        }
        const $option = $('<option>');
        $option.attr('value', field.code);
        $option.text(escapeHtml(field.label));
        $name.append($option.clone());
      }
      // Set default values
      $name.val(CONF.name);
    }).catch((err) => {
      return alert('Failed to retrieve field(s) information');
    });
  }

  // Set drop-down list
  setDropDown();

  // Set input values when 'Save' button is clicked
  $form.on('submit', function(e) {
    e.preventDefault();
    const config = {};
    const name = $name.val();

    config.name = name;

    kintone.plugin.app.setConfig(config, function() {
      alert('The plug-in settings have been saved. Please update the app!');
      window.location.href = '/k/admin/app/flow?app=' + kintone.app.getId();
    });
  });
  // Process when 'Cancel' is clicked
  $cancelButton.click(function() {
    window.location.href = '/k/admin/app/' + kintone.app.getId() + '/plugin/';
  });
})(jQuery, kintone.$PLUGIN_ID);
