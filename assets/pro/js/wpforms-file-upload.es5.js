(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
(function ($) {
  /**
   * All connections are slow by default.
   *
   * @since 1.6.2
   *
   * @type {boolean|null}
   */
  var isSlow = null;

  /**
   * Previously submitted data.
   *
   * @since 1.7.1
   *
   * @type {Array}
   */
  var submittedValues = [];

  /**
   * Default settings for our speed test.
   *
   * @since 1.6.2
   *
   * @type {{maxTime: number, payloadSize: number}}
   */
  var speedTestSettings = {
    maxTime: 3000,
    // Max time (ms) it should take to be considered a 'fast connection'.
    payloadSize: 100 * 1024 // Payload size.
  };

  /**
   * Create a random payload for the speed test.
   *
   * @since 1.6.2
   *
   * @returns {string} Random payload.
   */
  function getPayload() {
    var data = '';
    for (var i = 0; i < speedTestSettings.payloadSize; ++i) {
      data += String.fromCharCode(Math.round(Math.random() * 36 + 64));
    }
    return data;
  }

  /**
   * Run speed tests and flag the clients as slow or not. If a connection
   * is slow it would let the backend know and the backend most likely
   * would disable parallel uploads and would set smaller chunk sizes.
   *
   * @since 1.6.2
   *
   * @param {Function} next Function to call when the speed detection is done.
   */
  function speedTest(next) {
    if (null !== isSlow) {
      setTimeout(next);
      return;
    }
    var data = getPayload();
    var start = new Date();
    wp.ajax.post({
      action: 'wpforms_file_upload_speed_test',
      data: data
    }).then(function () {
      var delta = new Date() - start;
      isSlow = delta >= speedTestSettings.maxTime;
      next();
    }).fail(function () {
      isSlow = true;
      next();
    });
  }

  /**
   * Toggle loading message above submit button.
   *
   * @since 1.5.6
   *
   * @param {object} $form jQuery form element.
   *
   * @returns {Function} event handler function.
   */
  function toggleLoadingMessage($form) {
    return function () {
      if ($form.find('.wpforms-uploading-in-progress-alert').length) {
        return;
      }
      $form.find('.wpforms-submit-container').before("<div class=\"wpforms-error-alert wpforms-uploading-in-progress-alert\">\n\t\t\t\t\t\t".concat(window.wpforms_file_upload.loading_message, "\n\t\t\t\t\t</div>"));
    };
  }

  /**
   * Is a field loading?
   *
   * @since 1.7.6
   *
   * @param {object} dz Dropzone object.
   *
   * @returns {boolean} true if the field is loading.
   */
  function uploadInProgress(dz) {
    return dz.loading > 0 || dz.getFilesWithStatus('error').length > 0;
  }

  /**
   * Is at least one field loading?
   *
   * @since 1.7.6
   *
   * @returns {boolean} true if at least one field is loading.
   */
  function anyUploadsInProgress() {
    var anyUploadsInProgress = false;
    window.wpforms.dropzones.some(function (dz) {
      if (uploadInProgress(dz)) {
        anyUploadsInProgress = true;
        return true;
      }
    });
    return anyUploadsInProgress;
  }

  /**
   * Disable submit button when we are sending files to the server.
   *
   * @since 1.5.6
   *
   * @param {object} dz Dropzone object.
   */
  function toggleSubmit(dz) {
    var $form = jQuery(dz.element).closest('form'),
      $btn = $form.find('.wpforms-submit'),
      $btnNext = $form.find('.wpforms-page-next:visible'),
      handler = toggleLoadingMessage($form),
      disabled = uploadInProgress(dz);

    // For multi-pages layout.
    if ($form.find('.wpforms-page-indicator').length !== 0 && $btnNext.length !== 0) {
      $btn = $btnNext;
    }
    if (disabled === Boolean($btn.prop('disabled'))) {
      return;
    }
    if (disabled) {
      $btn.prop('disabled', true);
      if (!$form.find('.wpforms-submit-overlay').length && $btn.attr('type') === 'submit') {
        $btn.parent().addClass('wpforms-submit-overlay-container');
        $btn.parent().append('<div class="wpforms-submit-overlay"></div>');
        $form.find('.wpforms-submit-overlay').css({
          width: "".concat($btn.outerWidth(), "px"),
          height: "".concat($btn.parent().outerHeight(), "px")
        });
        $form.find('.wpforms-submit-overlay').on('click', handler);
      }
      return;
    }
    if (anyUploadsInProgress()) {
      return;
    }
    $btn.prop('disabled', false);
    $form.find('.wpforms-submit-overlay').off('click', handler);
    $form.find('.wpforms-submit-overlay').remove();
    $btn.parent().removeClass('wpforms-submit-overlay-container');
    if ($form.find('.wpforms-uploading-in-progress-alert').length) {
      $form.find('.wpforms-uploading-in-progress-alert').remove();
    }
  }

  /**
   * Try to parse JSON or return false.
   *
   * @since 1.5.6
   *
   * @param {string} str JSON string candidate.
   *
   * @returns {*} Parse object or false.
   */
  function parseJSON(str) {
    try {
      return JSON.parse(str);
    } catch (e) {
      return false;
    }
  }

  /**
   * Leave only objects with length.
   *
   * @since 1.5.6
   *
   * @param {object} el Any array.
   *
   * @returns {bool} Has length more than 0 or no.
   */
  function onlyWithLength(el) {
    return el.length > 0;
  }

  /**
   * Leave only positive elements.
   *
   * @since 1.5.6
   *
   * @param {*} el Any element.
   *
   * @returns {*} Filter only positive.
   */
  function onlyPositive(el) {
    return el;
  }

  /**
   * Get xhr.
   *
   * @since 1.5.6
   *
   * @param {object} el Object with xhr property.
   *
   * @returns {*} Get XHR.
   */
  function getXHR(el) {
    return el.chunkResponse || el.xhr;
  }

  /**
   * Get response text.
   *
   * @since 1.5.6
   *
   * @param {object} el Xhr object.
   *
   * @returns {object} Response text.
   */
  function getResponseText(el) {
    return typeof el === 'string' ? el : el.responseText;
  }

  /**
   * Get data.
   *
   * @since 1.5.6
   *
   * @param {object} el Object with data property.
   *
   * @returns {object} Data.
   */
  function getData(el) {
    return el.data;
  }

  /**
   * Get value from files.
   *
   * @since 1.5.6
   *
   * @param {object} files Dropzone files.
   *
   * @returns {object} Prepared value.
   */
  function getValue(files) {
    return files.map(getXHR).filter(onlyPositive).map(getResponseText).filter(onlyWithLength).map(parseJSON).filter(onlyPositive).map(getData);
  }

  /**
   * Sending event higher order function.
   *
   * @since 1.5.6
   * @since 1.5.6.1 Added special processing of a file that is larger than server's post_max_size.
   *
   * @param {object} dz Dropzone object.
   * @param {object} data Adding data to request.
   *
   * @returns {Function} Handler function.
   */
  function sending(dz, data) {
    return function (file, xhr, formData) {
      /*
       * We should not allow sending a file, that exceeds server post_max_size.
       * With this "hack" we redefine the default send functionality
       * to prevent only this object from sending a request at all.
       * The file that generated that error should be marked as rejected,
       * so Dropzone will silently ignore it.
       *
       * If Chunks are enabled the file size will never exceed (by a PHP constraint) the
       * postMaxSize. This block shouldn't be removed nonetheless until the "modern" upload is completely
       * deprecated and removed.
       */
      if (file.size > this.dataTransfer.postMaxSize) {
        xhr.send = function () {};
        file.accepted = false;
        file.processing = false;
        file.status = 'rejected';
        file.previewElement.classList.add('dz-error');
        file.previewElement.classList.add('dz-complete');
        return;
      }
      Object.keys(data).forEach(function (key) {
        formData.append(key, data[key]);
      });
    };
  }

  /**
   * Convert files to input value.
   *
   * @since 1.5.6
   * @since 1.7.1 Added the dz argument.
   *
   * @param {object} files Files list.
   * @param {object} dz Dropzone object.
   *
   * @returns {string} Converted value.
   */
  function convertFilesToValue(files, dz) {
    if (!submittedValues[dz.dataTransfer.formId] || !submittedValues[dz.dataTransfer.formId][dz.dataTransfer.fieldId]) {
      return files.length ? JSON.stringify(files) : '';
    }
    files.push.apply(files, submittedValues[dz.dataTransfer.formId][dz.dataTransfer.fieldId]);
    return JSON.stringify(files);
  }

  /**
   * Get input element.
   *
   * @since 1.7.1
   *
   * @param {object} dz Dropzone object.
   *
   * @returns {jQuery} Hidden input element.
   */
  function getInput(dz) {
    return jQuery(dz.element).parents('.wpforms-field-file-upload').find('input[name=' + dz.dataTransfer.name + ']');
  }

  /**
   * Update value in input.
   *
   * @since 1.5.6
   *
   * @param {object} dz Dropzone object.
   */
  function updateInputValue(dz) {
    var $input = getInput(dz);
    $input.val(convertFilesToValue(getValue(dz.files), dz)).trigger('input');
    if (typeof jQuery.fn.valid !== 'undefined') {
      $input.valid();
    }
  }

  /**
   * Complete event higher order function.
   *
   * @deprecated 1.6.2
   *
   * @since 1.5.6
   *
   * @param {object} dz Dropzone object.
   *
   * @returns {Function} Handler function.
   */
  function complete(dz) {
    return function () {
      dz.loading = dz.loading || 0;
      dz.loading--;
      dz.loading = Math.max(dz.loading - 1, 0);
      toggleSubmit(dz);
      updateInputValue(dz);
    };
  }

  /**
   * Add an error message to the current file.
   *
   * @since 1.6.2
   *
   * @param {object} file         File object.
   * @param {string} errorMessage Error message
   */
  function addErrorMessage(file, errorMessage) {
    if (file.isErrorNotUploadedDisplayed) {
      return;
    }
    var span = document.createElement('span');
    span.innerText = errorMessage.toString();
    span.setAttribute('data-dz-errormessage', '');
    file.previewElement.querySelector('.dz-error-message').appendChild(span);
  }

  /**
   * Confirm the upload to the server.
   *
   * The confirmation is needed in order to let PHP know
   * that all the chunks have been uploaded.
   *
   * @since 1.6.2
   *
   * @param {object} dz Dropzone object.
   *
   * @returns {Function} Handler function.
   */
  function confirmChunksFinishUpload(dz) {
    return function confirm(file) {
      if (!file.retries) {
        file.retries = 0;
      }
      if ('error' === file.status) {
        return;
      }

      /**
       * Retry finalize function.
       *
       * @since 1.6.2
       */
      function retry() {
        file.retries++;
        if (file.retries === 3) {
          addErrorMessage(file, window.wpforms_file_upload.errors.file_not_uploaded);
          return;
        }
        setTimeout(function () {
          confirm(file);
        }, 5000 * file.retries);
      }

      /**
       * Fail handler for ajax request.
       *
       * @since 1.6.2
       *
       * @param {object} response Response from the server
       */
      function fail(response) {
        var hasSpecificError = response.responseJSON && response.responseJSON.success === false && response.responseJSON.data;
        if (hasSpecificError) {
          addErrorMessage(file, response.responseJSON.data);
        } else {
          retry();
        }
      }

      /**
       * Handler for ajax request.
       *
       * @since 1.6.2
       *
       * @param {object} response Response from the server
       */
      function complete(response) {
        file.chunkResponse = JSON.stringify({
          data: response
        });
        dz.loading = dz.loading || 0;
        dz.loading--;
        dz.loading = Math.max(dz.loading, 0);
        toggleSubmit(dz);
        updateInputValue(dz);
      }
      wp.ajax.post(jQuery.extend({
        action: 'wpforms_file_chunks_uploaded',
        form_id: dz.dataTransfer.formId,
        field_id: dz.dataTransfer.fieldId,
        name: file.name
      }, dz.options.params.call(dz, null, null, {
        file: file,
        index: 0
      }))).then(complete).fail(fail);

      // Move to upload the next file, if any.
      dz.processQueue();
    };
  }

  /**
   * Toggle showing empty message.
   *
   * @since 1.5.6
   *
   * @param {object} dz Dropzone object.
   */
  function toggleMessage(dz) {
    setTimeout(function () {
      var validFiles = dz.files.filter(function (file) {
        return file.accepted;
      });
      if (validFiles.length >= dz.options.maxFiles) {
        dz.element.querySelector('.dz-message').classList.add('hide');
      } else {
        dz.element.querySelector('.dz-message').classList.remove('hide');
      }
    }, 0);
  }

  /**
   * Toggle error message if total size more than limit.
   * Runs for each file.
   *
   * @since 1.5.6
   *
   * @param {object} file Current file.
   * @param {object} dz   Dropzone object.
   */
  function validatePostMaxSizeError(file, dz) {
    setTimeout(function () {
      if (file.size >= dz.dataTransfer.postMaxSize) {
        var errorMessage = window.wpforms_file_upload.errors.post_max_size;
        if (!file.isErrorNotUploadedDisplayed) {
          file.isErrorNotUploadedDisplayed = true;
          errorMessage = window.wpforms_file_upload.errors.file_not_uploaded + ' ' + errorMessage;
          addErrorMessage(file, errorMessage);
        }
      }
    }, 1);
  }

  /**
   * Start File Upload.
   *
   * This would do the initial request to start a file upload. No chunk
   * is uploaded at this stage, instead all the information related to the
   * file are send to the server waiting for an authorization.
   *
   * If the server authorizes the client would start uploading the chunks.
   *
   * @since 1.6.2
   *
   * @param {object} dz   Dropzone object.
   * @param {object} file Current file.
   */
  function initFileUpload(dz, file) {
    wp.ajax.post(jQuery.extend({
      action: 'wpforms_upload_chunk_init',
      form_id: dz.dataTransfer.formId,
      field_id: dz.dataTransfer.fieldId,
      name: file.name,
      slow: isSlow
    }, dz.options.params.call(dz, null, null, {
      file: file,
      index: 0
    }))).then(function (response) {
      // File upload has been authorized.

      for (var key in response) {
        dz.options[key] = response[key];
      }
      if (response.dzchunksize) {
        dz.options.chunkSize = parseInt(response.dzchunksize, 10);
        file.upload.totalChunkCount = Math.ceil(file.size / dz.options.chunkSize);
      }
      dz.processQueue();
    }).fail(function (response) {
      file.status = 'error';
      if (!file.xhr) {
        var errorMessage = window.wpforms_file_upload.errors.file_not_uploaded + ' ' + window.wpforms_file_upload.errors.default_error;
        file.previewElement.classList.add('dz-processing', 'dz-error', 'dz-complete');
        file.previewElement.closest('.wpforms-field').classList.add('wpforms-has-error');
        addErrorMessage(file, errorMessage);
      }
      dz.processQueue();
    });
  }

  /**
   * Validate the file when it was added in the dropzone.
   *
   * @since 1.5.6
   *
   * @param {object} dz Dropzone object.
   *
   * @returns {Function} Handler function.
   */
  function addedFile(dz) {
    return function (file) {
      if (file.size >= dz.dataTransfer.postMaxSize) {
        validatePostMaxSizeError(file, dz);
      } else {
        speedTest(function () {
          initFileUpload(dz, file);
        });
      }
      dz.loading = dz.loading || 0;
      dz.loading++;
      toggleSubmit(dz);
      toggleMessage(dz);
    };
  }

  /**
   * Send an AJAX request to remove file from the server.
   *
   * @since 1.5.6
   *
   * @param {string} file File name.
   * @param {object} dz Dropzone object.
   */
  function removeFromServer(file, dz) {
    wp.ajax.post({
      action: 'wpforms_remove_file',
      file: file,
      form_id: dz.dataTransfer.formId,
      field_id: dz.dataTransfer.fieldId
    });
  }

  /**
   * Init the file removal on server when user removed it on front-end.
   *
   * @since 1.5.6
   *
   * @param {object} dz Dropzone object.
   *
   * @returns {Function} Handler function.
   */
  function removedFile(dz) {
    return function (file) {
      toggleMessage(dz);
      var json = file.chunkResponse || (file.xhr || {}).responseText;
      if (json) {
        var object = parseJSON(json);
        if (object && object.data && object.data.file) {
          removeFromServer(object.data.file, dz);
        }
      }

      // Remove submitted value.
      if (Object.prototype.hasOwnProperty.call(file, 'isDefault') && file.isDefault) {
        submittedValues[dz.dataTransfer.formId][dz.dataTransfer.fieldId].splice(file.index, 1);
        dz.options.maxFiles++;
        removeFromServer(file.file, dz);
      }
      updateInputValue(dz);
      dz.loading = dz.loading || 0;
      dz.loading--;
      dz.loading = Math.max(dz.loading, 0);
      toggleSubmit(dz);
    };
  }

  /**
   * Process any error that was fired per each file.
   * There might be several errors per file, in that case - display "not uploaded" text only once.
   *
   * @since 1.5.6.1
   *
   * @param {object} dz Dropzone object.
   *
   * @returns {Function} Handler function.
   */
  function error(dz) {
    return function (file, errorMessage) {
      if (file.isErrorNotUploadedDisplayed) {
        return;
      }
      if (_typeof(errorMessage) === 'object') {
        errorMessage = Object.prototype.hasOwnProperty.call(errorMessage, 'data') && typeof errorMessage.data === 'string' ? errorMessage.data : '';
      }
      errorMessage = errorMessage !== '0' ? errorMessage : '';
      file.isErrorNotUploadedDisplayed = true;
      file.previewElement.querySelectorAll('[data-dz-errormessage]')[0].textContent = window.wpforms_file_upload.errors.file_not_uploaded + ' ' + errorMessage;
    };
  }

  /**
   * Preset previously submitted files to the dropzone.
   *
   * @since 1.7.1
   *
   * @param {object} dz Dropzone object.
   */
  function presetSubmittedData(dz) {
    var files = parseJSON(getInput(dz).val());
    if (!files || !files.length) {
      return;
    }
    submittedValues[dz.dataTransfer.formId] = [];

    // We do deep cloning an object to be sure that data is passed without links.
    submittedValues[dz.dataTransfer.formId][dz.dataTransfer.fieldId] = JSON.parse(JSON.stringify(files));
    files.forEach(function (file, index) {
      file.isDefault = true;
      file.index = index;
      if (file.type.match(/image.*/)) {
        dz.displayExistingFile(file, file.url);
        return;
      }
      dz.emit('addedfile', file);
      dz.emit('complete', file);
    });
    dz.options.maxFiles = dz.options.maxFiles - files.length;
  }

  /**
   * Dropzone.js init for each field.
   *
   * @since 1.5.6
   *
   * @param {object} $el WPForms uploader DOM element.
   *
   * @returns {object} Dropzone object.
   */
  function dropZoneInit($el) {
    if ($el.dropzone) {
      return $el.dropzone;
    }
    var formId = parseInt($el.dataset.formId, 10);
    var fieldId = parseInt($el.dataset.fieldId, 10) || 0;
    var maxFiles = parseInt($el.dataset.maxFileNumber, 10);
    var acceptedFiles = $el.dataset.extensions.split(',').map(function (el) {
      return '.' + el;
    }).join(',');

    // Configure and modify Dropzone library.
    var dz = new window.Dropzone($el, {
      url: window.wpforms_file_upload.url,
      addRemoveLinks: true,
      chunking: true,
      forceChunking: true,
      retryChunks: true,
      chunkSize: parseInt($el.dataset.fileChunkSize, 10),
      paramName: $el.dataset.inputName,
      parallelChunkUploads: !!($el.dataset.parallelUploads || '').match(/^true$/i),
      parallelUploads: parseInt($el.dataset.maxParallelUploads, 10),
      autoProcessQueue: false,
      maxFilesize: (parseInt($el.dataset.maxSize, 10) / (1024 * 1024)).toFixed(2),
      maxFiles: maxFiles,
      acceptedFiles: acceptedFiles,
      dictMaxFilesExceeded: window.wpforms_file_upload.errors.file_limit.replace('{fileLimit}', maxFiles),
      dictInvalidFileType: window.wpforms_file_upload.errors.file_extension,
      dictFileTooBig: window.wpforms_file_upload.errors.file_size
    });

    // Custom variables.
    dz.dataTransfer = {
      postMaxSize: $el.dataset.maxSize,
      name: $el.dataset.inputName,
      formId: formId,
      fieldId: fieldId
    };
    presetSubmittedData(dz);

    // Process events.
    dz.on('sending', sending(dz, {
      action: 'wpforms_upload_chunk',
      form_id: formId,
      field_id: fieldId
    }));
    dz.on('addedfile', addedFile(dz));
    dz.on('removedfile', removedFile(dz));
    dz.on('complete', confirmChunksFinishUpload(dz));
    dz.on('error', error(dz));
    return dz;
  }

  /**
   * Hidden Dropzone input focus event handler.
   *
   * @since 1.8.1
   */
  function dropzoneInputFocus() {
    $(this).prev('.wpforms-uploader').addClass('wpforms-focus');
  }

  /**
   * Hidden Dropzone input blur event handler.
   *
   * @since 1.8.1
   */
  function dropzoneInputBlur() {
    $(this).prev('.wpforms-uploader').removeClass('wpforms-focus');
  }

  /**
   * Hidden Dropzone input blur event handler.
   *
   * @since 1.8.1
   *
   * @param {object} e Event object.
   */
  function dropzoneInputKeypress(e) {
    e.preventDefault();
    if (e.keyCode !== 13) {
      return;
    }
    $(this).prev('.wpforms-uploader').trigger('click');
  }

  /**
   * Hidden Dropzone input blur event handler.
   *
   * @since 1.8.1
   */
  function dropzoneClick() {
    $(this).next('.dropzone-input').trigger('focus');
  }

  /**
   * Events.
   *
   * @since 1.8.1
   */
  function events() {
    $('.dropzone-input').on('focus', dropzoneInputFocus).on('blur', dropzoneInputBlur).on('keypress', dropzoneInputKeypress);
    $('.wpforms-uploader').on('click', dropzoneClick);
  }

  /**
   * DOMContentLoaded handler.
   *
   * @since 1.5.6
   */
  function ready() {
    window.wpforms = window.wpforms || {};
    window.wpforms.dropzones = [].slice.call(document.querySelectorAll('.wpforms-uploader')).map(dropZoneInit);
    events();
  }

  /**
   * Modern File Upload engine.
   *
   * @since 1.6.0
   */
  var wpformsModernFileUpload = {
    /**
     * Start the initialization.
     *
     * @since 1.6.0
     */
    init: function init() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ready);
      } else {
        ready();
      }
    }
  };

  // Call init and save in global variable.
  wpformsModernFileUpload.init();
  window.wpformsModernFileUpload = wpformsModernFileUpload;
})(jQuery);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyIkIiwiaXNTbG93Iiwic3VibWl0dGVkVmFsdWVzIiwic3BlZWRUZXN0U2V0dGluZ3MiLCJtYXhUaW1lIiwicGF5bG9hZFNpemUiLCJnZXRQYXlsb2FkIiwiZGF0YSIsImkiLCJTdHJpbmciLCJmcm9tQ2hhckNvZGUiLCJNYXRoIiwicm91bmQiLCJyYW5kb20iLCJzcGVlZFRlc3QiLCJuZXh0Iiwic2V0VGltZW91dCIsInN0YXJ0IiwiRGF0ZSIsIndwIiwiYWpheCIsInBvc3QiLCJhY3Rpb24iLCJ0aGVuIiwiZGVsdGEiLCJmYWlsIiwidG9nZ2xlTG9hZGluZ01lc3NhZ2UiLCIkZm9ybSIsImZpbmQiLCJsZW5ndGgiLCJiZWZvcmUiLCJ3aW5kb3ciLCJ3cGZvcm1zX2ZpbGVfdXBsb2FkIiwibG9hZGluZ19tZXNzYWdlIiwidXBsb2FkSW5Qcm9ncmVzcyIsImR6IiwibG9hZGluZyIsImdldEZpbGVzV2l0aFN0YXR1cyIsImFueVVwbG9hZHNJblByb2dyZXNzIiwid3Bmb3JtcyIsImRyb3B6b25lcyIsInNvbWUiLCJ0b2dnbGVTdWJtaXQiLCJqUXVlcnkiLCJlbGVtZW50IiwiY2xvc2VzdCIsIiRidG4iLCIkYnRuTmV4dCIsImhhbmRsZXIiLCJkaXNhYmxlZCIsIkJvb2xlYW4iLCJwcm9wIiwiYXR0ciIsInBhcmVudCIsImFkZENsYXNzIiwiYXBwZW5kIiwiY3NzIiwid2lkdGgiLCJvdXRlcldpZHRoIiwiaGVpZ2h0Iiwib3V0ZXJIZWlnaHQiLCJvbiIsIm9mZiIsInJlbW92ZSIsInJlbW92ZUNsYXNzIiwicGFyc2VKU09OIiwic3RyIiwiSlNPTiIsInBhcnNlIiwiZSIsIm9ubHlXaXRoTGVuZ3RoIiwiZWwiLCJvbmx5UG9zaXRpdmUiLCJnZXRYSFIiLCJjaHVua1Jlc3BvbnNlIiwieGhyIiwiZ2V0UmVzcG9uc2VUZXh0IiwicmVzcG9uc2VUZXh0IiwiZ2V0RGF0YSIsImdldFZhbHVlIiwiZmlsZXMiLCJtYXAiLCJmaWx0ZXIiLCJzZW5kaW5nIiwiZmlsZSIsImZvcm1EYXRhIiwic2l6ZSIsImRhdGFUcmFuc2ZlciIsInBvc3RNYXhTaXplIiwic2VuZCIsImFjY2VwdGVkIiwicHJvY2Vzc2luZyIsInN0YXR1cyIsInByZXZpZXdFbGVtZW50IiwiY2xhc3NMaXN0IiwiYWRkIiwiT2JqZWN0Iiwia2V5cyIsImZvckVhY2giLCJrZXkiLCJjb252ZXJ0RmlsZXNUb1ZhbHVlIiwiZm9ybUlkIiwiZmllbGRJZCIsInN0cmluZ2lmeSIsInB1c2giLCJhcHBseSIsImdldElucHV0IiwicGFyZW50cyIsIm5hbWUiLCJ1cGRhdGVJbnB1dFZhbHVlIiwiJGlucHV0IiwidmFsIiwidHJpZ2dlciIsImZuIiwidmFsaWQiLCJjb21wbGV0ZSIsIm1heCIsImFkZEVycm9yTWVzc2FnZSIsImVycm9yTWVzc2FnZSIsImlzRXJyb3JOb3RVcGxvYWRlZERpc3BsYXllZCIsInNwYW4iLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJpbm5lclRleHQiLCJ0b1N0cmluZyIsInNldEF0dHJpYnV0ZSIsInF1ZXJ5U2VsZWN0b3IiLCJhcHBlbmRDaGlsZCIsImNvbmZpcm1DaHVua3NGaW5pc2hVcGxvYWQiLCJjb25maXJtIiwicmV0cmllcyIsInJldHJ5IiwiZXJyb3JzIiwiZmlsZV9ub3RfdXBsb2FkZWQiLCJyZXNwb25zZSIsImhhc1NwZWNpZmljRXJyb3IiLCJyZXNwb25zZUpTT04iLCJzdWNjZXNzIiwiZXh0ZW5kIiwiZm9ybV9pZCIsImZpZWxkX2lkIiwib3B0aW9ucyIsInBhcmFtcyIsImNhbGwiLCJpbmRleCIsInByb2Nlc3NRdWV1ZSIsInRvZ2dsZU1lc3NhZ2UiLCJ2YWxpZEZpbGVzIiwibWF4RmlsZXMiLCJ2YWxpZGF0ZVBvc3RNYXhTaXplRXJyb3IiLCJwb3N0X21heF9zaXplIiwiaW5pdEZpbGVVcGxvYWQiLCJzbG93IiwiZHpjaHVua3NpemUiLCJjaHVua1NpemUiLCJwYXJzZUludCIsInVwbG9hZCIsInRvdGFsQ2h1bmtDb3VudCIsImNlaWwiLCJkZWZhdWx0X2Vycm9yIiwiYWRkZWRGaWxlIiwicmVtb3ZlRnJvbVNlcnZlciIsInJlbW92ZWRGaWxlIiwianNvbiIsIm9iamVjdCIsInByb3RvdHlwZSIsImhhc093blByb3BlcnR5IiwiaXNEZWZhdWx0Iiwic3BsaWNlIiwiZXJyb3IiLCJxdWVyeVNlbGVjdG9yQWxsIiwidGV4dENvbnRlbnQiLCJwcmVzZXRTdWJtaXR0ZWREYXRhIiwidHlwZSIsIm1hdGNoIiwiZGlzcGxheUV4aXN0aW5nRmlsZSIsInVybCIsImVtaXQiLCJkcm9wWm9uZUluaXQiLCIkZWwiLCJkcm9wem9uZSIsImRhdGFzZXQiLCJtYXhGaWxlTnVtYmVyIiwiYWNjZXB0ZWRGaWxlcyIsImV4dGVuc2lvbnMiLCJzcGxpdCIsImpvaW4iLCJEcm9wem9uZSIsImFkZFJlbW92ZUxpbmtzIiwiY2h1bmtpbmciLCJmb3JjZUNodW5raW5nIiwicmV0cnlDaHVua3MiLCJmaWxlQ2h1bmtTaXplIiwicGFyYW1OYW1lIiwiaW5wdXROYW1lIiwicGFyYWxsZWxDaHVua1VwbG9hZHMiLCJwYXJhbGxlbFVwbG9hZHMiLCJtYXhQYXJhbGxlbFVwbG9hZHMiLCJhdXRvUHJvY2Vzc1F1ZXVlIiwibWF4RmlsZXNpemUiLCJtYXhTaXplIiwidG9GaXhlZCIsImRpY3RNYXhGaWxlc0V4Y2VlZGVkIiwiZmlsZV9saW1pdCIsInJlcGxhY2UiLCJkaWN0SW52YWxpZEZpbGVUeXBlIiwiZmlsZV9leHRlbnNpb24iLCJkaWN0RmlsZVRvb0JpZyIsImZpbGVfc2l6ZSIsImRyb3B6b25lSW5wdXRGb2N1cyIsInByZXYiLCJkcm9wem9uZUlucHV0Qmx1ciIsImRyb3B6b25lSW5wdXRLZXlwcmVzcyIsInByZXZlbnREZWZhdWx0Iiwia2V5Q29kZSIsImRyb3B6b25lQ2xpY2siLCJldmVudHMiLCJyZWFkeSIsInNsaWNlIiwid3Bmb3Jtc01vZGVybkZpbGVVcGxvYWQiLCJpbml0IiwicmVhZHlTdGF0ZSIsImFkZEV2ZW50TGlzdGVuZXIiXSwic291cmNlcyI6WyJmYWtlXzM0ZmEyMTgzLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuKCBmdW5jdGlvbiggJCApIHtcblxuXHQvKipcblx0ICogQWxsIGNvbm5lY3Rpb25zIGFyZSBzbG93IGJ5IGRlZmF1bHQuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjYuMlxuXHQgKlxuXHQgKiBAdHlwZSB7Ym9vbGVhbnxudWxsfVxuXHQgKi9cblx0dmFyIGlzU2xvdyA9IG51bGw7XG5cblx0LyoqXG5cdCAqIFByZXZpb3VzbHkgc3VibWl0dGVkIGRhdGEuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjcuMVxuXHQgKlxuXHQgKiBAdHlwZSB7QXJyYXl9XG5cdCAqL1xuXHR2YXIgc3VibWl0dGVkVmFsdWVzID0gW107XG5cblx0LyoqXG5cdCAqIERlZmF1bHQgc2V0dGluZ3MgZm9yIG91ciBzcGVlZCB0ZXN0LlxuXHQgKlxuXHQgKiBAc2luY2UgMS42LjJcblx0ICpcblx0ICogQHR5cGUge3ttYXhUaW1lOiBudW1iZXIsIHBheWxvYWRTaXplOiBudW1iZXJ9fVxuXHQgKi9cblx0dmFyIHNwZWVkVGVzdFNldHRpbmdzID0ge1xuXHRcdG1heFRpbWU6IDMwMDAsIC8vIE1heCB0aW1lIChtcykgaXQgc2hvdWxkIHRha2UgdG8gYmUgY29uc2lkZXJlZCBhICdmYXN0IGNvbm5lY3Rpb24nLlxuXHRcdHBheWxvYWRTaXplOiAxMDAgKiAxMDI0LCAvLyBQYXlsb2FkIHNpemUuXG5cdH07XG5cblx0LyoqXG5cdCAqIENyZWF0ZSBhIHJhbmRvbSBwYXlsb2FkIGZvciB0aGUgc3BlZWQgdGVzdC5cblx0ICpcblx0ICogQHNpbmNlIDEuNi4yXG5cdCAqXG5cdCAqIEByZXR1cm5zIHtzdHJpbmd9IFJhbmRvbSBwYXlsb2FkLlxuXHQgKi9cblx0ZnVuY3Rpb24gZ2V0UGF5bG9hZCgpIHtcblxuXHRcdHZhciBkYXRhID0gJyc7XG5cblx0XHRmb3IgKCB2YXIgaSA9IDA7IGkgPCBzcGVlZFRlc3RTZXR0aW5ncy5wYXlsb2FkU2l6ZTsgKytpICkge1xuXHRcdFx0ZGF0YSArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKCBNYXRoLnJvdW5kKCBNYXRoLnJhbmRvbSgpICogMzYgKyA2NCApICk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGRhdGE7XG5cdH1cblxuXHQvKipcblx0ICogUnVuIHNwZWVkIHRlc3RzIGFuZCBmbGFnIHRoZSBjbGllbnRzIGFzIHNsb3cgb3Igbm90LiBJZiBhIGNvbm5lY3Rpb25cblx0ICogaXMgc2xvdyBpdCB3b3VsZCBsZXQgdGhlIGJhY2tlbmQga25vdyBhbmQgdGhlIGJhY2tlbmQgbW9zdCBsaWtlbHlcblx0ICogd291bGQgZGlzYWJsZSBwYXJhbGxlbCB1cGxvYWRzIGFuZCB3b3VsZCBzZXQgc21hbGxlciBjaHVuayBzaXplcy5cblx0ICpcblx0ICogQHNpbmNlIDEuNi4yXG5cdCAqXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IG5leHQgRnVuY3Rpb24gdG8gY2FsbCB3aGVuIHRoZSBzcGVlZCBkZXRlY3Rpb24gaXMgZG9uZS5cblx0ICovXG5cdGZ1bmN0aW9uIHNwZWVkVGVzdCggbmV4dCApIHtcblxuXHRcdGlmICggbnVsbCAhPT0gaXNTbG93ICkge1xuXHRcdFx0c2V0VGltZW91dCggbmV4dCApO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHZhciBkYXRhICA9IGdldFBheWxvYWQoKTtcblx0XHR2YXIgc3RhcnQgPSBuZXcgRGF0ZTtcblxuXHRcdHdwLmFqYXgucG9zdCgge1xuXHRcdFx0YWN0aW9uOiAnd3Bmb3Jtc19maWxlX3VwbG9hZF9zcGVlZF90ZXN0Jyxcblx0XHRcdGRhdGE6IGRhdGEsXG5cdFx0fSApLnRoZW4oIGZ1bmN0aW9uKCkge1xuXG5cdFx0XHR2YXIgZGVsdGEgPSBuZXcgRGF0ZSAtIHN0YXJ0O1xuXG5cdFx0XHRpc1Nsb3cgPSBkZWx0YSA+PSBzcGVlZFRlc3RTZXR0aW5ncy5tYXhUaW1lO1xuXG5cdFx0XHRuZXh0KCk7XG5cdFx0fSApLmZhaWwoIGZ1bmN0aW9uKCkge1xuXG5cdFx0XHRpc1Nsb3cgPSB0cnVlO1xuXG5cdFx0XHRuZXh0KCk7XG5cdFx0fSApO1xuXHR9XG5cblx0LyoqXG5cdCAqIFRvZ2dsZSBsb2FkaW5nIG1lc3NhZ2UgYWJvdmUgc3VibWl0IGJ1dHRvbi5cblx0ICpcblx0ICogQHNpbmNlIDEuNS42XG5cdCAqXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSAkZm9ybSBqUXVlcnkgZm9ybSBlbGVtZW50LlxuXHQgKlxuXHQgKiBAcmV0dXJucyB7RnVuY3Rpb259IGV2ZW50IGhhbmRsZXIgZnVuY3Rpb24uXG5cdCAqL1xuXHRmdW5jdGlvbiB0b2dnbGVMb2FkaW5nTWVzc2FnZSggJGZvcm0gKSB7XG5cblx0XHRyZXR1cm4gZnVuY3Rpb24oKSB7XG5cblx0XHRcdGlmICggJGZvcm0uZmluZCggJy53cGZvcm1zLXVwbG9hZGluZy1pbi1wcm9ncmVzcy1hbGVydCcgKS5sZW5ndGggKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0JGZvcm0uZmluZCggJy53cGZvcm1zLXN1Ym1pdC1jb250YWluZXInIClcblx0XHRcdFx0LmJlZm9yZShcblx0XHRcdFx0XHRgPGRpdiBjbGFzcz1cIndwZm9ybXMtZXJyb3ItYWxlcnQgd3Bmb3Jtcy11cGxvYWRpbmctaW4tcHJvZ3Jlc3MtYWxlcnRcIj5cblx0XHRcdFx0XHRcdCR7d2luZG93LndwZm9ybXNfZmlsZV91cGxvYWQubG9hZGluZ19tZXNzYWdlfVxuXHRcdFx0XHRcdDwvZGl2PmBcblx0XHRcdFx0KTtcblx0XHR9O1xuXHR9XG5cblx0LyoqXG5cdCAqIElzIGEgZmllbGQgbG9hZGluZz9cblx0ICpcblx0ICogQHNpbmNlIDEuNy42XG5cdCAqXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBkeiBEcm9wem9uZSBvYmplY3QuXG5cdCAqXG5cdCAqIEByZXR1cm5zIHtib29sZWFufSB0cnVlIGlmIHRoZSBmaWVsZCBpcyBsb2FkaW5nLlxuXHQgKi9cblx0ZnVuY3Rpb24gdXBsb2FkSW5Qcm9ncmVzcyggZHogKSB7XG5cblx0XHRyZXR1cm4gZHoubG9hZGluZyA+IDAgfHwgZHouZ2V0RmlsZXNXaXRoU3RhdHVzKCAnZXJyb3InICkubGVuZ3RoID4gMDtcblx0fVxuXG5cdC8qKlxuXHQgKiBJcyBhdCBsZWFzdCBvbmUgZmllbGQgbG9hZGluZz9cblx0ICpcblx0ICogQHNpbmNlIDEuNy42XG5cdCAqXG5cdCAqIEByZXR1cm5zIHtib29sZWFufSB0cnVlIGlmIGF0IGxlYXN0IG9uZSBmaWVsZCBpcyBsb2FkaW5nLlxuXHQgKi9cblx0ZnVuY3Rpb24gYW55VXBsb2Fkc0luUHJvZ3Jlc3MoKSB7XG5cblx0XHR2YXIgYW55VXBsb2Fkc0luUHJvZ3Jlc3MgPSBmYWxzZTtcblxuXHRcdHdpbmRvdy53cGZvcm1zLmRyb3B6b25lcy5zb21lKCBmdW5jdGlvbiggZHogKSB7XG5cblx0XHRcdGlmICggdXBsb2FkSW5Qcm9ncmVzcyggZHogKSApIHtcblx0XHRcdFx0YW55VXBsb2Fkc0luUHJvZ3Jlc3MgPSB0cnVlO1xuXG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXHRcdH0gKTtcblxuXHRcdHJldHVybiBhbnlVcGxvYWRzSW5Qcm9ncmVzcztcblx0fVxuXG5cdC8qKlxuXHQgKiBEaXNhYmxlIHN1Ym1pdCBidXR0b24gd2hlbiB3ZSBhcmUgc2VuZGluZyBmaWxlcyB0byB0aGUgc2VydmVyLlxuXHQgKlxuXHQgKiBAc2luY2UgMS41LjZcblx0ICpcblx0ICogQHBhcmFtIHtvYmplY3R9IGR6IERyb3B6b25lIG9iamVjdC5cblx0ICovXG5cdGZ1bmN0aW9uIHRvZ2dsZVN1Ym1pdCggZHogKSB7XG5cblx0XHR2YXIgJGZvcm0gICAgPSBqUXVlcnkoIGR6LmVsZW1lbnQgKS5jbG9zZXN0KCAnZm9ybScgKSxcblx0XHRcdCRidG4gICAgID0gJGZvcm0uZmluZCggJy53cGZvcm1zLXN1Ym1pdCcgKSxcblx0XHRcdCRidG5OZXh0ID0gJGZvcm0uZmluZCggJy53cGZvcm1zLXBhZ2UtbmV4dDp2aXNpYmxlJyApLFxuXHRcdFx0aGFuZGxlciAgPSB0b2dnbGVMb2FkaW5nTWVzc2FnZSggJGZvcm0gKSxcblx0XHRcdGRpc2FibGVkID0gdXBsb2FkSW5Qcm9ncmVzcyggZHogKTtcblxuXHRcdC8vIEZvciBtdWx0aS1wYWdlcyBsYXlvdXQuXG5cdFx0aWYgKCAkZm9ybS5maW5kKCAnLndwZm9ybXMtcGFnZS1pbmRpY2F0b3InICkubGVuZ3RoICE9PSAwICYmICRidG5OZXh0Lmxlbmd0aCAhPT0gMCApIHtcblx0XHRcdCRidG4gPSAkYnRuTmV4dDtcblx0XHR9XG5cblx0XHRpZiAoIGRpc2FibGVkID09PSBCb29sZWFuKCAkYnRuLnByb3AoICdkaXNhYmxlZCcgKSApICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmICggZGlzYWJsZWQgKSB7XG5cdFx0XHQkYnRuLnByb3AoICdkaXNhYmxlZCcsIHRydWUgKTtcblx0XHRcdGlmICggISAkZm9ybS5maW5kKCAnLndwZm9ybXMtc3VibWl0LW92ZXJsYXknICkubGVuZ3RoICYmICRidG4uYXR0ciggJ3R5cGUnICkgPT09ICdzdWJtaXQnICkge1xuXHRcdFx0XHQkYnRuLnBhcmVudCgpLmFkZENsYXNzKCAnd3Bmb3Jtcy1zdWJtaXQtb3ZlcmxheS1jb250YWluZXInICk7XG5cdFx0XHRcdCRidG4ucGFyZW50KCkuYXBwZW5kKCAnPGRpdiBjbGFzcz1cIndwZm9ybXMtc3VibWl0LW92ZXJsYXlcIj48L2Rpdj4nICk7XG5cdFx0XHRcdCRmb3JtLmZpbmQoICcud3Bmb3Jtcy1zdWJtaXQtb3ZlcmxheScgKS5jc3MoIHtcblx0XHRcdFx0XHR3aWR0aDogYCR7JGJ0bi5vdXRlcldpZHRoKCl9cHhgLFxuXHRcdFx0XHRcdGhlaWdodDogYCR7JGJ0bi5wYXJlbnQoKS5vdXRlckhlaWdodCgpfXB4YCxcblx0XHRcdFx0fSApO1xuXHRcdFx0XHQkZm9ybS5maW5kKCAnLndwZm9ybXMtc3VibWl0LW92ZXJsYXknICkub24oICdjbGljaycsIGhhbmRsZXIgKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmICggYW55VXBsb2Fkc0luUHJvZ3Jlc3MoKSApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQkYnRuLnByb3AoICdkaXNhYmxlZCcsIGZhbHNlICk7XG5cdFx0JGZvcm0uZmluZCggJy53cGZvcm1zLXN1Ym1pdC1vdmVybGF5JyApLm9mZiggJ2NsaWNrJywgaGFuZGxlciApO1xuXHRcdCRmb3JtLmZpbmQoICcud3Bmb3Jtcy1zdWJtaXQtb3ZlcmxheScgKS5yZW1vdmUoKTtcblx0XHQkYnRuLnBhcmVudCgpLnJlbW92ZUNsYXNzKCAnd3Bmb3Jtcy1zdWJtaXQtb3ZlcmxheS1jb250YWluZXInICk7XG5cdFx0aWYgKCAkZm9ybS5maW5kKCAnLndwZm9ybXMtdXBsb2FkaW5nLWluLXByb2dyZXNzLWFsZXJ0JyApLmxlbmd0aCApIHtcblx0XHRcdCRmb3JtLmZpbmQoICcud3Bmb3Jtcy11cGxvYWRpbmctaW4tcHJvZ3Jlc3MtYWxlcnQnICkucmVtb3ZlKCk7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIFRyeSB0byBwYXJzZSBKU09OIG9yIHJldHVybiBmYWxzZS5cblx0ICpcblx0ICogQHNpbmNlIDEuNS42XG5cdCAqXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBzdHIgSlNPTiBzdHJpbmcgY2FuZGlkYXRlLlxuXHQgKlxuXHQgKiBAcmV0dXJucyB7Kn0gUGFyc2Ugb2JqZWN0IG9yIGZhbHNlLlxuXHQgKi9cblx0ZnVuY3Rpb24gcGFyc2VKU09OKCBzdHIgKSB7XG5cdFx0dHJ5IHtcblx0XHRcdHJldHVybiBKU09OLnBhcnNlKCBzdHIgKTtcblx0XHR9IGNhdGNoICggZSApIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogTGVhdmUgb25seSBvYmplY3RzIHdpdGggbGVuZ3RoLlxuXHQgKlxuXHQgKiBAc2luY2UgMS41LjZcblx0ICpcblx0ICogQHBhcmFtIHtvYmplY3R9IGVsIEFueSBhcnJheS5cblx0ICpcblx0ICogQHJldHVybnMge2Jvb2x9IEhhcyBsZW5ndGggbW9yZSB0aGFuIDAgb3Igbm8uXG5cdCAqL1xuXHRmdW5jdGlvbiBvbmx5V2l0aExlbmd0aCggZWwgKSB7XG5cdFx0cmV0dXJuIGVsLmxlbmd0aCA+IDA7XG5cdH1cblxuXHQvKipcblx0ICogTGVhdmUgb25seSBwb3NpdGl2ZSBlbGVtZW50cy5cblx0ICpcblx0ICogQHNpbmNlIDEuNS42XG5cdCAqXG5cdCAqIEBwYXJhbSB7Kn0gZWwgQW55IGVsZW1lbnQuXG5cdCAqXG5cdCAqIEByZXR1cm5zIHsqfSBGaWx0ZXIgb25seSBwb3NpdGl2ZS5cblx0ICovXG5cdGZ1bmN0aW9uIG9ubHlQb3NpdGl2ZSggZWwgKSB7XG5cdFx0cmV0dXJuIGVsO1xuXHR9XG5cblx0LyoqXG5cdCAqIEdldCB4aHIuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjUuNlxuXHQgKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gZWwgT2JqZWN0IHdpdGggeGhyIHByb3BlcnR5LlxuXHQgKlxuXHQgKiBAcmV0dXJucyB7Kn0gR2V0IFhIUi5cblx0ICovXG5cdGZ1bmN0aW9uIGdldFhIUiggZWwgKSB7XG5cdFx0cmV0dXJuIGVsLmNodW5rUmVzcG9uc2UgfHwgZWwueGhyO1xuXHR9XG5cblx0LyoqXG5cdCAqIEdldCByZXNwb25zZSB0ZXh0LlxuXHQgKlxuXHQgKiBAc2luY2UgMS41LjZcblx0ICpcblx0ICogQHBhcmFtIHtvYmplY3R9IGVsIFhociBvYmplY3QuXG5cdCAqXG5cdCAqIEByZXR1cm5zIHtvYmplY3R9IFJlc3BvbnNlIHRleHQuXG5cdCAqL1xuXHRmdW5jdGlvbiBnZXRSZXNwb25zZVRleHQoIGVsICkge1xuXHRcdHJldHVybiB0eXBlb2YgZWwgPT09ICdzdHJpbmcnID8gZWwgOiBlbC5yZXNwb25zZVRleHQ7XG5cdH1cblxuXHQvKipcblx0ICogR2V0IGRhdGEuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjUuNlxuXHQgKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gZWwgT2JqZWN0IHdpdGggZGF0YSBwcm9wZXJ0eS5cblx0ICpcblx0ICogQHJldHVybnMge29iamVjdH0gRGF0YS5cblx0ICovXG5cdGZ1bmN0aW9uIGdldERhdGEoIGVsICkge1xuXHRcdHJldHVybiBlbC5kYXRhO1xuXHR9XG5cblx0LyoqXG5cdCAqIEdldCB2YWx1ZSBmcm9tIGZpbGVzLlxuXHQgKlxuXHQgKiBAc2luY2UgMS41LjZcblx0ICpcblx0ICogQHBhcmFtIHtvYmplY3R9IGZpbGVzIERyb3B6b25lIGZpbGVzLlxuXHQgKlxuXHQgKiBAcmV0dXJucyB7b2JqZWN0fSBQcmVwYXJlZCB2YWx1ZS5cblx0ICovXG5cdGZ1bmN0aW9uIGdldFZhbHVlKCBmaWxlcyApIHtcblx0XHRyZXR1cm4gZmlsZXNcblx0XHRcdC5tYXAoIGdldFhIUiApXG5cdFx0XHQuZmlsdGVyKCBvbmx5UG9zaXRpdmUgKVxuXHRcdFx0Lm1hcCggZ2V0UmVzcG9uc2VUZXh0IClcblx0XHRcdC5maWx0ZXIoIG9ubHlXaXRoTGVuZ3RoIClcblx0XHRcdC5tYXAoIHBhcnNlSlNPTiApXG5cdFx0XHQuZmlsdGVyKCBvbmx5UG9zaXRpdmUgKVxuXHRcdFx0Lm1hcCggZ2V0RGF0YSApO1xuXHR9XG5cblx0LyoqXG5cdCAqIFNlbmRpbmcgZXZlbnQgaGlnaGVyIG9yZGVyIGZ1bmN0aW9uLlxuXHQgKlxuXHQgKiBAc2luY2UgMS41LjZcblx0ICogQHNpbmNlIDEuNS42LjEgQWRkZWQgc3BlY2lhbCBwcm9jZXNzaW5nIG9mIGEgZmlsZSB0aGF0IGlzIGxhcmdlciB0aGFuIHNlcnZlcidzIHBvc3RfbWF4X3NpemUuXG5cdCAqXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBkeiBEcm9wem9uZSBvYmplY3QuXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBkYXRhIEFkZGluZyBkYXRhIHRvIHJlcXVlc3QuXG5cdCAqXG5cdCAqIEByZXR1cm5zIHtGdW5jdGlvbn0gSGFuZGxlciBmdW5jdGlvbi5cblx0ICovXG5cdGZ1bmN0aW9uIHNlbmRpbmcoIGR6LCBkYXRhICkge1xuXG5cdFx0cmV0dXJuIGZ1bmN0aW9uKCBmaWxlLCB4aHIsIGZvcm1EYXRhICkge1xuXG5cdFx0XHQvKlxuXHRcdFx0ICogV2Ugc2hvdWxkIG5vdCBhbGxvdyBzZW5kaW5nIGEgZmlsZSwgdGhhdCBleGNlZWRzIHNlcnZlciBwb3N0X21heF9zaXplLlxuXHRcdFx0ICogV2l0aCB0aGlzIFwiaGFja1wiIHdlIHJlZGVmaW5lIHRoZSBkZWZhdWx0IHNlbmQgZnVuY3Rpb25hbGl0eVxuXHRcdFx0ICogdG8gcHJldmVudCBvbmx5IHRoaXMgb2JqZWN0IGZyb20gc2VuZGluZyBhIHJlcXVlc3QgYXQgYWxsLlxuXHRcdFx0ICogVGhlIGZpbGUgdGhhdCBnZW5lcmF0ZWQgdGhhdCBlcnJvciBzaG91bGQgYmUgbWFya2VkIGFzIHJlamVjdGVkLFxuXHRcdFx0ICogc28gRHJvcHpvbmUgd2lsbCBzaWxlbnRseSBpZ25vcmUgaXQuXG5cdFx0XHQgKlxuXHRcdFx0ICogSWYgQ2h1bmtzIGFyZSBlbmFibGVkIHRoZSBmaWxlIHNpemUgd2lsbCBuZXZlciBleGNlZWQgKGJ5IGEgUEhQIGNvbnN0cmFpbnQpIHRoZVxuXHRcdFx0ICogcG9zdE1heFNpemUuIFRoaXMgYmxvY2sgc2hvdWxkbid0IGJlIHJlbW92ZWQgbm9uZXRoZWxlc3MgdW50aWwgdGhlIFwibW9kZXJuXCIgdXBsb2FkIGlzIGNvbXBsZXRlbHlcblx0XHRcdCAqIGRlcHJlY2F0ZWQgYW5kIHJlbW92ZWQuXG5cdFx0XHQgKi9cblx0XHRcdGlmICggZmlsZS5zaXplID4gdGhpcy5kYXRhVHJhbnNmZXIucG9zdE1heFNpemUgKSB7XG5cdFx0XHRcdHhoci5zZW5kID0gZnVuY3Rpb24oKSB7fTtcblxuXHRcdFx0XHRmaWxlLmFjY2VwdGVkID0gZmFsc2U7XG5cdFx0XHRcdGZpbGUucHJvY2Vzc2luZyA9IGZhbHNlO1xuXHRcdFx0XHRmaWxlLnN0YXR1cyA9ICdyZWplY3RlZCc7XG5cdFx0XHRcdGZpbGUucHJldmlld0VsZW1lbnQuY2xhc3NMaXN0LmFkZCggJ2R6LWVycm9yJyApO1xuXHRcdFx0XHRmaWxlLnByZXZpZXdFbGVtZW50LmNsYXNzTGlzdC5hZGQoICdkei1jb21wbGV0ZScgKTtcblxuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdE9iamVjdC5rZXlzKCBkYXRhICkuZm9yRWFjaCggZnVuY3Rpb24oIGtleSApIHtcblx0XHRcdFx0Zm9ybURhdGEuYXBwZW5kKCBrZXksIGRhdGFba2V5XSApO1xuXHRcdFx0fSApO1xuXHRcdH07XG5cdH1cblxuXHQvKipcblx0ICogQ29udmVydCBmaWxlcyB0byBpbnB1dCB2YWx1ZS5cblx0ICpcblx0ICogQHNpbmNlIDEuNS42XG5cdCAqIEBzaW5jZSAxLjcuMSBBZGRlZCB0aGUgZHogYXJndW1lbnQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBmaWxlcyBGaWxlcyBsaXN0LlxuXHQgKiBAcGFyYW0ge29iamVjdH0gZHogRHJvcHpvbmUgb2JqZWN0LlxuXHQgKlxuXHQgKiBAcmV0dXJucyB7c3RyaW5nfSBDb252ZXJ0ZWQgdmFsdWUuXG5cdCAqL1xuXHRmdW5jdGlvbiBjb252ZXJ0RmlsZXNUb1ZhbHVlKCBmaWxlcywgZHogKSB7XG5cblx0XHRpZiAoICEgc3VibWl0dGVkVmFsdWVzWyBkei5kYXRhVHJhbnNmZXIuZm9ybUlkIF0gfHwgISBzdWJtaXR0ZWRWYWx1ZXNbIGR6LmRhdGFUcmFuc2Zlci5mb3JtSWQgXVsgZHouZGF0YVRyYW5zZmVyLmZpZWxkSWQgXSApIHtcblx0XHRcdHJldHVybiBmaWxlcy5sZW5ndGggPyBKU09OLnN0cmluZ2lmeSggZmlsZXMgKSA6ICcnO1xuXHRcdH1cblxuXHRcdGZpbGVzLnB1c2guYXBwbHkoIGZpbGVzLCBzdWJtaXR0ZWRWYWx1ZXNbIGR6LmRhdGFUcmFuc2Zlci5mb3JtSWQgXVsgZHouZGF0YVRyYW5zZmVyLmZpZWxkSWQgXSApO1xuXG5cdFx0cmV0dXJuIEpTT04uc3RyaW5naWZ5KCBmaWxlcyApO1xuXHR9XG5cblx0LyoqXG5cdCAqIEdldCBpbnB1dCBlbGVtZW50LlxuXHQgKlxuXHQgKiBAc2luY2UgMS43LjFcblx0ICpcblx0ICogQHBhcmFtIHtvYmplY3R9IGR6IERyb3B6b25lIG9iamVjdC5cblx0ICpcblx0ICogQHJldHVybnMge2pRdWVyeX0gSGlkZGVuIGlucHV0IGVsZW1lbnQuXG5cdCAqL1xuXHRmdW5jdGlvbiBnZXRJbnB1dCggZHogKSB7XG5cblx0XHRyZXR1cm4galF1ZXJ5KCBkei5lbGVtZW50ICkucGFyZW50cyggJy53cGZvcm1zLWZpZWxkLWZpbGUtdXBsb2FkJyApLmZpbmQoICdpbnB1dFtuYW1lPScgKyBkei5kYXRhVHJhbnNmZXIubmFtZSArICddJyApO1xuXHR9XG5cblx0LyoqXG5cdCAqIFVwZGF0ZSB2YWx1ZSBpbiBpbnB1dC5cblx0ICpcblx0ICogQHNpbmNlIDEuNS42XG5cdCAqXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBkeiBEcm9wem9uZSBvYmplY3QuXG5cdCAqL1xuXHRmdW5jdGlvbiB1cGRhdGVJbnB1dFZhbHVlKCBkeiApIHtcblxuXHRcdHZhciAkaW5wdXQgPSBnZXRJbnB1dCggZHogKTtcblxuXHRcdCRpbnB1dC52YWwoIGNvbnZlcnRGaWxlc1RvVmFsdWUoIGdldFZhbHVlKCBkei5maWxlcyApLCBkeiApICkudHJpZ2dlciggJ2lucHV0JyApO1xuXG5cdFx0aWYgKCB0eXBlb2YgalF1ZXJ5LmZuLnZhbGlkICE9PSAndW5kZWZpbmVkJyApIHtcblx0XHRcdCRpbnB1dC52YWxpZCgpO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBDb21wbGV0ZSBldmVudCBoaWdoZXIgb3JkZXIgZnVuY3Rpb24uXG5cdCAqXG5cdCAqIEBkZXByZWNhdGVkIDEuNi4yXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjUuNlxuXHQgKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gZHogRHJvcHpvbmUgb2JqZWN0LlxuXHQgKlxuXHQgKiBAcmV0dXJucyB7RnVuY3Rpb259IEhhbmRsZXIgZnVuY3Rpb24uXG5cdCAqL1xuXHRmdW5jdGlvbiBjb21wbGV0ZSggZHogKSB7XG5cblx0XHRyZXR1cm4gZnVuY3Rpb24oKSB7XG5cdFx0XHRkei5sb2FkaW5nID0gZHoubG9hZGluZyB8fCAwO1xuXHRcdFx0ZHoubG9hZGluZy0tO1xuXHRcdFx0ZHoubG9hZGluZyA9IE1hdGgubWF4KCBkei5sb2FkaW5nIC0gMSwgMCApO1xuXHRcdFx0dG9nZ2xlU3VibWl0KCBkeiApO1xuXHRcdFx0dXBkYXRlSW5wdXRWYWx1ZSggZHogKTtcblx0XHR9O1xuXHR9XG5cblx0LyoqXG5cdCAqIEFkZCBhbiBlcnJvciBtZXNzYWdlIHRvIHRoZSBjdXJyZW50IGZpbGUuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjYuMlxuXHQgKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gZmlsZSAgICAgICAgIEZpbGUgb2JqZWN0LlxuXHQgKiBAcGFyYW0ge3N0cmluZ30gZXJyb3JNZXNzYWdlIEVycm9yIG1lc3NhZ2Vcblx0ICovXG5cdGZ1bmN0aW9uIGFkZEVycm9yTWVzc2FnZSggZmlsZSwgZXJyb3JNZXNzYWdlICkge1xuXG5cdFx0aWYgKCBmaWxlLmlzRXJyb3JOb3RVcGxvYWRlZERpc3BsYXllZCApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR2YXIgc3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdzcGFuJyApO1xuXHRcdHNwYW4uaW5uZXJUZXh0ID0gZXJyb3JNZXNzYWdlLnRvU3RyaW5nKCk7XG5cdFx0c3Bhbi5zZXRBdHRyaWJ1dGUoICdkYXRhLWR6LWVycm9ybWVzc2FnZScsICcnICk7XG5cblx0XHRmaWxlLnByZXZpZXdFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoICcuZHotZXJyb3ItbWVzc2FnZScgKS5hcHBlbmRDaGlsZCggc3BhbiApO1xuXHR9XG5cblx0LyoqXG5cdCAqIENvbmZpcm0gdGhlIHVwbG9hZCB0byB0aGUgc2VydmVyLlxuXHQgKlxuXHQgKiBUaGUgY29uZmlybWF0aW9uIGlzIG5lZWRlZCBpbiBvcmRlciB0byBsZXQgUEhQIGtub3dcblx0ICogdGhhdCBhbGwgdGhlIGNodW5rcyBoYXZlIGJlZW4gdXBsb2FkZWQuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjYuMlxuXHQgKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gZHogRHJvcHpvbmUgb2JqZWN0LlxuXHQgKlxuXHQgKiBAcmV0dXJucyB7RnVuY3Rpb259IEhhbmRsZXIgZnVuY3Rpb24uXG5cdCAqL1xuXHRmdW5jdGlvbiBjb25maXJtQ2h1bmtzRmluaXNoVXBsb2FkKCBkeiApIHtcblxuXHRcdHJldHVybiBmdW5jdGlvbiBjb25maXJtKCBmaWxlICkge1xuXG5cdFx0XHRpZiAoICEgZmlsZS5yZXRyaWVzICkge1xuXHRcdFx0XHRmaWxlLnJldHJpZXMgPSAwO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoICdlcnJvcicgPT09IGZpbGUuc3RhdHVzICkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdC8qKlxuXHRcdFx0ICogUmV0cnkgZmluYWxpemUgZnVuY3Rpb24uXG5cdFx0XHQgKlxuXHRcdFx0ICogQHNpbmNlIDEuNi4yXG5cdFx0XHQgKi9cblx0XHRcdGZ1bmN0aW9uIHJldHJ5KCkge1xuXHRcdFx0XHRmaWxlLnJldHJpZXMrKztcblxuXHRcdFx0XHRpZiAoIGZpbGUucmV0cmllcyA9PT0gMyApIHtcblx0XHRcdFx0XHRhZGRFcnJvck1lc3NhZ2UoIGZpbGUsIHdpbmRvdy53cGZvcm1zX2ZpbGVfdXBsb2FkLmVycm9ycy5maWxlX25vdF91cGxvYWRlZCApO1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHNldFRpbWVvdXQoIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdGNvbmZpcm0oIGZpbGUgKTtcblx0XHRcdFx0fSwgNTAwMCAqIGZpbGUucmV0cmllcyApO1xuXHRcdFx0fVxuXG5cdFx0XHQvKipcblx0XHRcdCAqIEZhaWwgaGFuZGxlciBmb3IgYWpheCByZXF1ZXN0LlxuXHRcdFx0ICpcblx0XHRcdCAqIEBzaW5jZSAxLjYuMlxuXHRcdFx0ICpcblx0XHRcdCAqIEBwYXJhbSB7b2JqZWN0fSByZXNwb25zZSBSZXNwb25zZSBmcm9tIHRoZSBzZXJ2ZXJcblx0XHRcdCAqL1xuXHRcdFx0ZnVuY3Rpb24gZmFpbCggcmVzcG9uc2UgKSB7XG5cblx0XHRcdFx0dmFyIGhhc1NwZWNpZmljRXJyb3IgPVx0cmVzcG9uc2UucmVzcG9uc2VKU09OICYmXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHJlc3BvbnNlLnJlc3BvbnNlSlNPTi5zdWNjZXNzID09PSBmYWxzZSAmJlxuXHRcdFx0XHRcdFx0XHRcdFx0XHRyZXNwb25zZS5yZXNwb25zZUpTT04uZGF0YTtcblxuXHRcdFx0XHRpZiAoIGhhc1NwZWNpZmljRXJyb3IgKSB7XG5cdFx0XHRcdFx0YWRkRXJyb3JNZXNzYWdlKCBmaWxlLCByZXNwb25zZS5yZXNwb25zZUpTT04uZGF0YSApO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJldHJ5KCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0LyoqXG5cdFx0XHQgKiBIYW5kbGVyIGZvciBhamF4IHJlcXVlc3QuXG5cdFx0XHQgKlxuXHRcdFx0ICogQHNpbmNlIDEuNi4yXG5cdFx0XHQgKlxuXHRcdFx0ICogQHBhcmFtIHtvYmplY3R9IHJlc3BvbnNlIFJlc3BvbnNlIGZyb20gdGhlIHNlcnZlclxuXHRcdFx0ICovXG5cdFx0XHRmdW5jdGlvbiBjb21wbGV0ZSggcmVzcG9uc2UgKSB7XG5cblx0XHRcdFx0ZmlsZS5jaHVua1Jlc3BvbnNlID0gSlNPTi5zdHJpbmdpZnkoIHsgZGF0YTogcmVzcG9uc2UgfSApO1xuXHRcdFx0XHRkei5sb2FkaW5nID0gZHoubG9hZGluZyB8fCAwO1xuXHRcdFx0XHRkei5sb2FkaW5nLS07XG5cdFx0XHRcdGR6LmxvYWRpbmcgPSBNYXRoLm1heCggZHoubG9hZGluZywgMCApO1xuXG5cdFx0XHRcdHRvZ2dsZVN1Ym1pdCggZHogKTtcblx0XHRcdFx0dXBkYXRlSW5wdXRWYWx1ZSggZHogKTtcblx0XHRcdH1cblxuXHRcdFx0d3AuYWpheC5wb3N0KCBqUXVlcnkuZXh0ZW5kKFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0YWN0aW9uOiAnd3Bmb3Jtc19maWxlX2NodW5rc191cGxvYWRlZCcsXG5cdFx0XHRcdFx0Zm9ybV9pZDogZHouZGF0YVRyYW5zZmVyLmZvcm1JZCxcblx0XHRcdFx0XHRmaWVsZF9pZDogZHouZGF0YVRyYW5zZmVyLmZpZWxkSWQsXG5cdFx0XHRcdFx0bmFtZTogZmlsZS5uYW1lLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRkei5vcHRpb25zLnBhcmFtcy5jYWxsKCBkeiwgbnVsbCwgbnVsbCwge2ZpbGU6IGZpbGUsIGluZGV4OiAwfSApXG5cdFx0XHQpICkudGhlbiggY29tcGxldGUgKS5mYWlsKCBmYWlsICk7XG5cblx0XHRcdC8vIE1vdmUgdG8gdXBsb2FkIHRoZSBuZXh0IGZpbGUsIGlmIGFueS5cblx0XHRcdGR6LnByb2Nlc3NRdWV1ZSgpO1xuXHRcdH07XG5cdH1cblxuXHQvKipcblx0ICogVG9nZ2xlIHNob3dpbmcgZW1wdHkgbWVzc2FnZS5cblx0ICpcblx0ICogQHNpbmNlIDEuNS42XG5cdCAqXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBkeiBEcm9wem9uZSBvYmplY3QuXG5cdCAqL1xuXHRmdW5jdGlvbiB0b2dnbGVNZXNzYWdlKCBkeiApIHtcblxuXHRcdHNldFRpbWVvdXQoIGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIHZhbGlkRmlsZXMgPSBkei5maWxlcy5maWx0ZXIoIGZ1bmN0aW9uKCBmaWxlICkge1xuXHRcdFx0XHRyZXR1cm4gZmlsZS5hY2NlcHRlZDtcblx0XHRcdH0gKTtcblxuXHRcdFx0aWYgKCB2YWxpZEZpbGVzLmxlbmd0aCA+PSBkei5vcHRpb25zLm1heEZpbGVzICkge1xuXHRcdFx0XHRkei5lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoICcuZHotbWVzc2FnZScgKS5jbGFzc0xpc3QuYWRkKCAnaGlkZScgKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGR6LmVsZW1lbnQucXVlcnlTZWxlY3RvciggJy5kei1tZXNzYWdlJyApLmNsYXNzTGlzdC5yZW1vdmUoICdoaWRlJyApO1xuXHRcdFx0fVxuXHRcdH0sIDAgKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBUb2dnbGUgZXJyb3IgbWVzc2FnZSBpZiB0b3RhbCBzaXplIG1vcmUgdGhhbiBsaW1pdC5cblx0ICogUnVucyBmb3IgZWFjaCBmaWxlLlxuXHQgKlxuXHQgKiBAc2luY2UgMS41LjZcblx0ICpcblx0ICogQHBhcmFtIHtvYmplY3R9IGZpbGUgQ3VycmVudCBmaWxlLlxuXHQgKiBAcGFyYW0ge29iamVjdH0gZHogICBEcm9wem9uZSBvYmplY3QuXG5cdCAqL1xuXHRmdW5jdGlvbiB2YWxpZGF0ZVBvc3RNYXhTaXplRXJyb3IoIGZpbGUsIGR6ICkge1xuXG5cdFx0c2V0VGltZW91dCggZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAoIGZpbGUuc2l6ZSA+PSBkei5kYXRhVHJhbnNmZXIucG9zdE1heFNpemUgKSB7XG5cdFx0XHRcdHZhciBlcnJvck1lc3NhZ2UgPSB3aW5kb3cud3Bmb3Jtc19maWxlX3VwbG9hZC5lcnJvcnMucG9zdF9tYXhfc2l6ZTtcblx0XHRcdFx0aWYgKCAhIGZpbGUuaXNFcnJvck5vdFVwbG9hZGVkRGlzcGxheWVkICkge1xuXHRcdFx0XHRcdGZpbGUuaXNFcnJvck5vdFVwbG9hZGVkRGlzcGxheWVkID0gdHJ1ZTtcblx0XHRcdFx0XHRlcnJvck1lc3NhZ2UgPSB3aW5kb3cud3Bmb3Jtc19maWxlX3VwbG9hZC5lcnJvcnMuZmlsZV9ub3RfdXBsb2FkZWQgKyAnICcgKyBlcnJvck1lc3NhZ2U7XG5cdFx0XHRcdFx0YWRkRXJyb3JNZXNzYWdlKCBmaWxlLCBlcnJvck1lc3NhZ2UgKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0sIDEgKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBTdGFydCBGaWxlIFVwbG9hZC5cblx0ICpcblx0ICogVGhpcyB3b3VsZCBkbyB0aGUgaW5pdGlhbCByZXF1ZXN0IHRvIHN0YXJ0IGEgZmlsZSB1cGxvYWQuIE5vIGNodW5rXG5cdCAqIGlzIHVwbG9hZGVkIGF0IHRoaXMgc3RhZ2UsIGluc3RlYWQgYWxsIHRoZSBpbmZvcm1hdGlvbiByZWxhdGVkIHRvIHRoZVxuXHQgKiBmaWxlIGFyZSBzZW5kIHRvIHRoZSBzZXJ2ZXIgd2FpdGluZyBmb3IgYW4gYXV0aG9yaXphdGlvbi5cblx0ICpcblx0ICogSWYgdGhlIHNlcnZlciBhdXRob3JpemVzIHRoZSBjbGllbnQgd291bGQgc3RhcnQgdXBsb2FkaW5nIHRoZSBjaHVua3MuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjYuMlxuXHQgKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gZHogICBEcm9wem9uZSBvYmplY3QuXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBmaWxlIEN1cnJlbnQgZmlsZS5cblx0ICovXG5cdGZ1bmN0aW9uIGluaXRGaWxlVXBsb2FkKCBkeiwgZmlsZSApIHtcblxuXHRcdHdwLmFqYXgucG9zdCggalF1ZXJ5LmV4dGVuZChcblx0XHRcdHtcblx0XHRcdFx0YWN0aW9uIDogJ3dwZm9ybXNfdXBsb2FkX2NodW5rX2luaXQnLFxuXHRcdFx0XHRmb3JtX2lkOiBkei5kYXRhVHJhbnNmZXIuZm9ybUlkLFxuXHRcdFx0XHRmaWVsZF9pZDogZHouZGF0YVRyYW5zZmVyLmZpZWxkSWQsXG5cdFx0XHRcdG5hbWU6IGZpbGUubmFtZSxcblx0XHRcdFx0c2xvdzogaXNTbG93LFxuXHRcdFx0fSxcblx0XHRcdGR6Lm9wdGlvbnMucGFyYW1zLmNhbGwoIGR6LCBudWxsLCBudWxsLCB7ZmlsZTogZmlsZSwgaW5kZXg6IDB9IClcblx0XHQpICkudGhlbiggZnVuY3Rpb24oIHJlc3BvbnNlICkge1xuXG5cdFx0XHQvLyBGaWxlIHVwbG9hZCBoYXMgYmVlbiBhdXRob3JpemVkLlxuXG5cdFx0XHRmb3IgKCB2YXIga2V5IGluIHJlc3BvbnNlICkge1xuXHRcdFx0XHRkei5vcHRpb25zWyBrZXkgXSA9IHJlc3BvbnNlWyBrZXkgXTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCByZXNwb25zZS5kemNodW5rc2l6ZSApIHtcblx0XHRcdFx0ZHoub3B0aW9ucy5jaHVua1NpemUgPSBwYXJzZUludCggcmVzcG9uc2UuZHpjaHVua3NpemUsIDEwICk7XG5cdFx0XHRcdGZpbGUudXBsb2FkLnRvdGFsQ2h1bmtDb3VudCA9IE1hdGguY2VpbCggZmlsZS5zaXplIC8gZHoub3B0aW9ucy5jaHVua1NpemUgKTtcblx0XHRcdH1cblxuXHRcdFx0ZHoucHJvY2Vzc1F1ZXVlKCk7XG5cdFx0fSApLmZhaWwoIGZ1bmN0aW9uKCByZXNwb25zZSApIHtcblxuXHRcdFx0ZmlsZS5zdGF0dXMgPSAnZXJyb3InO1xuXG5cdFx0XHRpZiAoICEgZmlsZS54aHIgKSB7XG5cdFx0XHRcdHZhciBlcnJvck1lc3NhZ2UgPSB3aW5kb3cud3Bmb3Jtc19maWxlX3VwbG9hZC5lcnJvcnMuZmlsZV9ub3RfdXBsb2FkZWQgKyAnICcgKyB3aW5kb3cud3Bmb3Jtc19maWxlX3VwbG9hZC5lcnJvcnMuZGVmYXVsdF9lcnJvcjtcblxuXHRcdFx0XHRmaWxlLnByZXZpZXdFbGVtZW50LmNsYXNzTGlzdC5hZGQoICdkei1wcm9jZXNzaW5nJywgJ2R6LWVycm9yJywgJ2R6LWNvbXBsZXRlJyApO1xuXHRcdFx0XHRmaWxlLnByZXZpZXdFbGVtZW50LmNsb3Nlc3QoICcud3Bmb3Jtcy1maWVsZCcgKS5jbGFzc0xpc3QuYWRkKCAnd3Bmb3Jtcy1oYXMtZXJyb3InICk7XG5cdFx0XHRcdGFkZEVycm9yTWVzc2FnZSggZmlsZSwgZXJyb3JNZXNzYWdlICk7XG5cdFx0XHR9XG5cblx0XHRcdGR6LnByb2Nlc3NRdWV1ZSgpO1xuXHRcdH0gKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBWYWxpZGF0ZSB0aGUgZmlsZSB3aGVuIGl0IHdhcyBhZGRlZCBpbiB0aGUgZHJvcHpvbmUuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjUuNlxuXHQgKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gZHogRHJvcHpvbmUgb2JqZWN0LlxuXHQgKlxuXHQgKiBAcmV0dXJucyB7RnVuY3Rpb259IEhhbmRsZXIgZnVuY3Rpb24uXG5cdCAqL1xuXHRmdW5jdGlvbiBhZGRlZEZpbGUoIGR6ICkge1xuXG5cdFx0cmV0dXJuIGZ1bmN0aW9uKCBmaWxlICkge1xuXG5cdFx0XHRpZiAoIGZpbGUuc2l6ZSA+PSBkei5kYXRhVHJhbnNmZXIucG9zdE1heFNpemUgKSB7XG5cdFx0XHRcdHZhbGlkYXRlUG9zdE1heFNpemVFcnJvciggZmlsZSwgZHogKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHNwZWVkVGVzdCggZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0aW5pdEZpbGVVcGxvYWQoIGR6LCBmaWxlICk7XG5cdFx0XHRcdH0gKTtcblx0XHRcdH1cblxuXHRcdFx0ZHoubG9hZGluZyA9IGR6LmxvYWRpbmcgfHwgMDtcblx0XHRcdGR6LmxvYWRpbmcrKztcblx0XHRcdHRvZ2dsZVN1Ym1pdCggZHogKTtcblxuXHRcdFx0dG9nZ2xlTWVzc2FnZSggZHogKTtcblx0XHR9O1xuXHR9XG5cblx0LyoqXG5cdCAqIFNlbmQgYW4gQUpBWCByZXF1ZXN0IHRvIHJlbW92ZSBmaWxlIGZyb20gdGhlIHNlcnZlci5cblx0ICpcblx0ICogQHNpbmNlIDEuNS42XG5cdCAqXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBmaWxlIEZpbGUgbmFtZS5cblx0ICogQHBhcmFtIHtvYmplY3R9IGR6IERyb3B6b25lIG9iamVjdC5cblx0ICovXG5cdGZ1bmN0aW9uIHJlbW92ZUZyb21TZXJ2ZXIoIGZpbGUsIGR6ICkge1xuXG5cdFx0d3AuYWpheC5wb3N0KCB7XG5cdFx0XHRhY3Rpb246ICd3cGZvcm1zX3JlbW92ZV9maWxlJyxcblx0XHRcdGZpbGU6IGZpbGUsXG5cdFx0XHRmb3JtX2lkOiBkei5kYXRhVHJhbnNmZXIuZm9ybUlkLFxuXHRcdFx0ZmllbGRfaWQ6IGR6LmRhdGFUcmFuc2Zlci5maWVsZElkLFxuXHRcdH0gKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBJbml0IHRoZSBmaWxlIHJlbW92YWwgb24gc2VydmVyIHdoZW4gdXNlciByZW1vdmVkIGl0IG9uIGZyb250LWVuZC5cblx0ICpcblx0ICogQHNpbmNlIDEuNS42XG5cdCAqXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBkeiBEcm9wem9uZSBvYmplY3QuXG5cdCAqXG5cdCAqIEByZXR1cm5zIHtGdW5jdGlvbn0gSGFuZGxlciBmdW5jdGlvbi5cblx0ICovXG5cdGZ1bmN0aW9uIHJlbW92ZWRGaWxlKCBkeiApIHtcblxuXHRcdHJldHVybiBmdW5jdGlvbiggZmlsZSApIHtcblx0XHRcdHRvZ2dsZU1lc3NhZ2UoIGR6ICk7XG5cblx0XHRcdHZhciBqc29uID0gZmlsZS5jaHVua1Jlc3BvbnNlIHx8ICggZmlsZS54aHIgfHwge30gKS5yZXNwb25zZVRleHQ7XG5cblx0XHRcdGlmICgganNvbiApIHtcblx0XHRcdFx0dmFyIG9iamVjdCA9IHBhcnNlSlNPTigganNvbiApO1xuXG5cdFx0XHRcdGlmICggb2JqZWN0ICYmIG9iamVjdC5kYXRhICYmIG9iamVjdC5kYXRhLmZpbGUgKSB7XG5cdFx0XHRcdFx0cmVtb3ZlRnJvbVNlcnZlciggb2JqZWN0LmRhdGEuZmlsZSwgZHogKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQvLyBSZW1vdmUgc3VibWl0dGVkIHZhbHVlLlxuXHRcdFx0aWYgKCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoIGZpbGUsICdpc0RlZmF1bHQnICkgJiYgZmlsZS5pc0RlZmF1bHQgKSB7XG5cdFx0XHRcdHN1Ym1pdHRlZFZhbHVlc1sgZHouZGF0YVRyYW5zZmVyLmZvcm1JZCBdWyBkei5kYXRhVHJhbnNmZXIuZmllbGRJZCBdLnNwbGljZSggZmlsZS5pbmRleCwgMSApO1xuXHRcdFx0XHRkei5vcHRpb25zLm1heEZpbGVzKys7XG5cdFx0XHRcdHJlbW92ZUZyb21TZXJ2ZXIoIGZpbGUuZmlsZSwgZHogKTtcblx0XHRcdH1cblxuXHRcdFx0dXBkYXRlSW5wdXRWYWx1ZSggZHogKTtcblxuXHRcdFx0ZHoubG9hZGluZyA9IGR6LmxvYWRpbmcgfHwgMDtcblx0XHRcdGR6LmxvYWRpbmctLTtcblx0XHRcdGR6LmxvYWRpbmcgPSBNYXRoLm1heCggZHoubG9hZGluZywgMCApO1xuXG5cdFx0XHR0b2dnbGVTdWJtaXQoIGR6ICk7XG5cdFx0fTtcblx0fVxuXG5cdC8qKlxuXHQgKiBQcm9jZXNzIGFueSBlcnJvciB0aGF0IHdhcyBmaXJlZCBwZXIgZWFjaCBmaWxlLlxuXHQgKiBUaGVyZSBtaWdodCBiZSBzZXZlcmFsIGVycm9ycyBwZXIgZmlsZSwgaW4gdGhhdCBjYXNlIC0gZGlzcGxheSBcIm5vdCB1cGxvYWRlZFwiIHRleHQgb25seSBvbmNlLlxuXHQgKlxuXHQgKiBAc2luY2UgMS41LjYuMVxuXHQgKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gZHogRHJvcHpvbmUgb2JqZWN0LlxuXHQgKlxuXHQgKiBAcmV0dXJucyB7RnVuY3Rpb259IEhhbmRsZXIgZnVuY3Rpb24uXG5cdCAqL1xuXHRmdW5jdGlvbiBlcnJvciggZHogKSB7XG5cblx0XHRyZXR1cm4gZnVuY3Rpb24oIGZpbGUsIGVycm9yTWVzc2FnZSApIHtcblxuXHRcdFx0aWYgKCBmaWxlLmlzRXJyb3JOb3RVcGxvYWRlZERpc3BsYXllZCApIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIHR5cGVvZiBlcnJvck1lc3NhZ2UgPT09ICdvYmplY3QnICkge1xuXHRcdFx0XHRlcnJvck1lc3NhZ2UgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoIGVycm9yTWVzc2FnZSwgJ2RhdGEnICkgJiYgdHlwZW9mIGVycm9yTWVzc2FnZS5kYXRhID09PSAnc3RyaW5nJyA/IGVycm9yTWVzc2FnZS5kYXRhIDogJyc7XG5cdFx0XHR9XG5cblx0XHRcdGVycm9yTWVzc2FnZSA9IGVycm9yTWVzc2FnZSAhPT0gJzAnID8gZXJyb3JNZXNzYWdlIDogJyc7XG5cblx0XHRcdGZpbGUuaXNFcnJvck5vdFVwbG9hZGVkRGlzcGxheWVkID0gdHJ1ZTtcblx0XHRcdGZpbGUucHJldmlld0VsZW1lbnQucXVlcnlTZWxlY3RvckFsbCggJ1tkYXRhLWR6LWVycm9ybWVzc2FnZV0nIClbMF0udGV4dENvbnRlbnQgPSB3aW5kb3cud3Bmb3Jtc19maWxlX3VwbG9hZC5lcnJvcnMuZmlsZV9ub3RfdXBsb2FkZWQgKyAnICcgKyBlcnJvck1lc3NhZ2U7XG5cdFx0fTtcblx0fVxuXG5cdC8qKlxuXHQgKiBQcmVzZXQgcHJldmlvdXNseSBzdWJtaXR0ZWQgZmlsZXMgdG8gdGhlIGRyb3B6b25lLlxuXHQgKlxuXHQgKiBAc2luY2UgMS43LjFcblx0ICpcblx0ICogQHBhcmFtIHtvYmplY3R9IGR6IERyb3B6b25lIG9iamVjdC5cblx0ICovXG5cdGZ1bmN0aW9uIHByZXNldFN1Ym1pdHRlZERhdGEoIGR6ICkge1xuXG5cdFx0dmFyIGZpbGVzID0gcGFyc2VKU09OKCBnZXRJbnB1dCggZHogKS52YWwoKSApO1xuXG5cdFx0aWYgKCAhIGZpbGVzIHx8ICEgZmlsZXMubGVuZ3RoICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHN1Ym1pdHRlZFZhbHVlc1tkei5kYXRhVHJhbnNmZXIuZm9ybUlkXSA9IFtdO1xuXG5cdFx0Ly8gV2UgZG8gZGVlcCBjbG9uaW5nIGFuIG9iamVjdCB0byBiZSBzdXJlIHRoYXQgZGF0YSBpcyBwYXNzZWQgd2l0aG91dCBsaW5rcy5cblx0XHRzdWJtaXR0ZWRWYWx1ZXNbZHouZGF0YVRyYW5zZmVyLmZvcm1JZF1bZHouZGF0YVRyYW5zZmVyLmZpZWxkSWRdID0gSlNPTi5wYXJzZSggSlNPTi5zdHJpbmdpZnkoIGZpbGVzICkgKTtcblxuXHRcdGZpbGVzLmZvckVhY2goIGZ1bmN0aW9uKCBmaWxlLCBpbmRleCApIHtcblxuXHRcdFx0ZmlsZS5pc0RlZmF1bHQgPSB0cnVlO1xuXHRcdFx0ZmlsZS5pbmRleCA9IGluZGV4O1xuXG5cdFx0XHRpZiAoIGZpbGUudHlwZS5tYXRjaCggL2ltYWdlLiovICkgKSB7XG5cdFx0XHRcdGR6LmRpc3BsYXlFeGlzdGluZ0ZpbGUoIGZpbGUsIGZpbGUudXJsICk7XG5cblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRkei5lbWl0KCAnYWRkZWRmaWxlJywgZmlsZSApO1xuXHRcdFx0ZHouZW1pdCggJ2NvbXBsZXRlJywgZmlsZSApO1xuXHRcdH0gKTtcblxuXHRcdGR6Lm9wdGlvbnMubWF4RmlsZXMgPSBkei5vcHRpb25zLm1heEZpbGVzIC0gZmlsZXMubGVuZ3RoO1xuXHR9XG5cblx0LyoqXG5cdCAqIERyb3B6b25lLmpzIGluaXQgZm9yIGVhY2ggZmllbGQuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjUuNlxuXHQgKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gJGVsIFdQRm9ybXMgdXBsb2FkZXIgRE9NIGVsZW1lbnQuXG5cdCAqXG5cdCAqIEByZXR1cm5zIHtvYmplY3R9IERyb3B6b25lIG9iamVjdC5cblx0ICovXG5cdGZ1bmN0aW9uIGRyb3Bab25lSW5pdCggJGVsICkge1xuXG5cdFx0aWYgKCAkZWwuZHJvcHpvbmUgKSB7XG5cdFx0XHRyZXR1cm4gJGVsLmRyb3B6b25lO1xuXHRcdH1cblxuXHRcdHZhciBmb3JtSWQgPSBwYXJzZUludCggJGVsLmRhdGFzZXQuZm9ybUlkLCAxMCApO1xuXHRcdHZhciBmaWVsZElkID0gcGFyc2VJbnQoICRlbC5kYXRhc2V0LmZpZWxkSWQsIDEwICkgfHwgMDtcblx0XHR2YXIgbWF4RmlsZXMgPSBwYXJzZUludCggJGVsLmRhdGFzZXQubWF4RmlsZU51bWJlciwgMTAgKTtcblxuXHRcdHZhciBhY2NlcHRlZEZpbGVzID0gJGVsLmRhdGFzZXQuZXh0ZW5zaW9ucy5zcGxpdCggJywnICkubWFwKCBmdW5jdGlvbiggZWwgKSB7XG5cdFx0XHRyZXR1cm4gJy4nICsgZWw7XG5cdFx0fSApLmpvaW4oICcsJyApO1xuXG5cdFx0Ly8gQ29uZmlndXJlIGFuZCBtb2RpZnkgRHJvcHpvbmUgbGlicmFyeS5cblx0XHR2YXIgZHogPSBuZXcgd2luZG93LkRyb3B6b25lKCAkZWwsIHtcblx0XHRcdHVybDogd2luZG93LndwZm9ybXNfZmlsZV91cGxvYWQudXJsLFxuXHRcdFx0YWRkUmVtb3ZlTGlua3M6IHRydWUsXG5cdFx0XHRjaHVua2luZzogdHJ1ZSxcblx0XHRcdGZvcmNlQ2h1bmtpbmc6IHRydWUsXG5cdFx0XHRyZXRyeUNodW5rczogdHJ1ZSxcblx0XHRcdGNodW5rU2l6ZTogcGFyc2VJbnQoICRlbC5kYXRhc2V0LmZpbGVDaHVua1NpemUsIDEwICksXG5cdFx0XHRwYXJhbU5hbWU6ICRlbC5kYXRhc2V0LmlucHV0TmFtZSxcblx0XHRcdHBhcmFsbGVsQ2h1bmtVcGxvYWRzOiAhISAoICRlbC5kYXRhc2V0LnBhcmFsbGVsVXBsb2FkcyB8fCAnJyApLm1hdGNoKCAvXnRydWUkL2kgKSxcblx0XHRcdHBhcmFsbGVsVXBsb2FkczogcGFyc2VJbnQoICRlbC5kYXRhc2V0Lm1heFBhcmFsbGVsVXBsb2FkcywgMTAgKSxcblx0XHRcdGF1dG9Qcm9jZXNzUXVldWU6IGZhbHNlLFxuXHRcdFx0bWF4RmlsZXNpemU6ICggcGFyc2VJbnQoICRlbC5kYXRhc2V0Lm1heFNpemUsIDEwICkgLyAoIDEwMjQgKiAxMDI0ICkgKS50b0ZpeGVkKCAyICksXG5cdFx0XHRtYXhGaWxlczogbWF4RmlsZXMsXG5cdFx0XHRhY2NlcHRlZEZpbGVzOiBhY2NlcHRlZEZpbGVzLFxuXHRcdFx0ZGljdE1heEZpbGVzRXhjZWVkZWQ6IHdpbmRvdy53cGZvcm1zX2ZpbGVfdXBsb2FkLmVycm9ycy5maWxlX2xpbWl0LnJlcGxhY2UoICd7ZmlsZUxpbWl0fScsIG1heEZpbGVzICksXG5cdFx0XHRkaWN0SW52YWxpZEZpbGVUeXBlOiB3aW5kb3cud3Bmb3Jtc19maWxlX3VwbG9hZC5lcnJvcnMuZmlsZV9leHRlbnNpb24sXG5cdFx0XHRkaWN0RmlsZVRvb0JpZzogd2luZG93LndwZm9ybXNfZmlsZV91cGxvYWQuZXJyb3JzLmZpbGVfc2l6ZSxcblx0XHR9ICk7XG5cblx0XHQvLyBDdXN0b20gdmFyaWFibGVzLlxuXHRcdGR6LmRhdGFUcmFuc2ZlciA9IHtcblx0XHRcdHBvc3RNYXhTaXplOiAkZWwuZGF0YXNldC5tYXhTaXplLFxuXHRcdFx0bmFtZTogJGVsLmRhdGFzZXQuaW5wdXROYW1lLFxuXHRcdFx0Zm9ybUlkOiBmb3JtSWQsXG5cdFx0XHRmaWVsZElkOiBmaWVsZElkLFxuXHRcdH07XG5cblx0XHRwcmVzZXRTdWJtaXR0ZWREYXRhKCBkeiApO1xuXG5cdFx0Ly8gUHJvY2VzcyBldmVudHMuXG5cdFx0ZHoub24oICdzZW5kaW5nJywgc2VuZGluZyggZHosIHtcblx0XHRcdGFjdGlvbjogJ3dwZm9ybXNfdXBsb2FkX2NodW5rJyxcblx0XHRcdGZvcm1faWQ6IGZvcm1JZCxcblx0XHRcdGZpZWxkX2lkOiBmaWVsZElkLFxuXHRcdH0gKSApO1xuXHRcdGR6Lm9uKCAnYWRkZWRmaWxlJywgYWRkZWRGaWxlKCBkeiApICk7XG5cdFx0ZHoub24oICdyZW1vdmVkZmlsZScsIHJlbW92ZWRGaWxlKCBkeiApICk7XG5cdFx0ZHoub24oICdjb21wbGV0ZScsIGNvbmZpcm1DaHVua3NGaW5pc2hVcGxvYWQoIGR6ICkgKTtcblx0XHRkei5vbiggJ2Vycm9yJywgZXJyb3IoIGR6ICkgKTtcblxuXHRcdHJldHVybiBkejtcblx0fVxuXG5cdC8qKlxuXHQgKiBIaWRkZW4gRHJvcHpvbmUgaW5wdXQgZm9jdXMgZXZlbnQgaGFuZGxlci5cblx0ICpcblx0ICogQHNpbmNlIDEuOC4xXG5cdCAqL1xuXHRmdW5jdGlvbiBkcm9wem9uZUlucHV0Rm9jdXMoKSB7XG5cblx0XHQkKCB0aGlzICkucHJldiggJy53cGZvcm1zLXVwbG9hZGVyJyApLmFkZENsYXNzKCAnd3Bmb3Jtcy1mb2N1cycgKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBIaWRkZW4gRHJvcHpvbmUgaW5wdXQgYmx1ciBldmVudCBoYW5kbGVyLlxuXHQgKlxuXHQgKiBAc2luY2UgMS44LjFcblx0ICovXG5cdGZ1bmN0aW9uIGRyb3B6b25lSW5wdXRCbHVyKCkge1xuXG5cdFx0JCggdGhpcyApLnByZXYoICcud3Bmb3Jtcy11cGxvYWRlcicgKS5yZW1vdmVDbGFzcyggJ3dwZm9ybXMtZm9jdXMnICk7XG5cdH1cblxuXHQvKipcblx0ICogSGlkZGVuIERyb3B6b25lIGlucHV0IGJsdXIgZXZlbnQgaGFuZGxlci5cblx0ICpcblx0ICogQHNpbmNlIDEuOC4xXG5cdCAqXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBlIEV2ZW50IG9iamVjdC5cblx0ICovXG5cdGZ1bmN0aW9uIGRyb3B6b25lSW5wdXRLZXlwcmVzcyggZSApIHtcblxuXHRcdGUucHJldmVudERlZmF1bHQoKTtcblxuXHRcdGlmICggZS5rZXlDb2RlICE9PSAxMyApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQkKCB0aGlzICkucHJldiggJy53cGZvcm1zLXVwbG9hZGVyJyApLnRyaWdnZXIoICdjbGljaycgKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBIaWRkZW4gRHJvcHpvbmUgaW5wdXQgYmx1ciBldmVudCBoYW5kbGVyLlxuXHQgKlxuXHQgKiBAc2luY2UgMS44LjFcblx0ICovXG5cdGZ1bmN0aW9uIGRyb3B6b25lQ2xpY2soKSB7XG5cblx0XHQkKCB0aGlzICkubmV4dCggJy5kcm9wem9uZS1pbnB1dCcgKS50cmlnZ2VyKCAnZm9jdXMnICk7XG5cdH1cblxuXHQvKipcblx0ICogRXZlbnRzLlxuXHQgKlxuXHQgKiBAc2luY2UgMS44LjFcblx0ICovXG5cdGZ1bmN0aW9uIGV2ZW50cygpIHtcblxuXHRcdCQoICcuZHJvcHpvbmUtaW5wdXQnIClcblx0XHRcdC5vbiggJ2ZvY3VzJywgZHJvcHpvbmVJbnB1dEZvY3VzIClcblx0XHRcdC5vbiggJ2JsdXInLCBkcm9wem9uZUlucHV0Qmx1ciApXG5cdFx0XHQub24oICdrZXlwcmVzcycsIGRyb3B6b25lSW5wdXRLZXlwcmVzcyApO1xuXG5cdFx0JCggJy53cGZvcm1zLXVwbG9hZGVyJyApXG5cdFx0XHQub24oICdjbGljaycsIGRyb3B6b25lQ2xpY2sgKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBET01Db250ZW50TG9hZGVkIGhhbmRsZXIuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjUuNlxuXHQgKi9cblx0ZnVuY3Rpb24gcmVhZHkoKSB7XG5cblx0XHR3aW5kb3cud3Bmb3JtcyA9IHdpbmRvdy53cGZvcm1zIHx8IHt9O1xuXHRcdHdpbmRvdy53cGZvcm1zLmRyb3B6b25lcyA9IFtdLnNsaWNlLmNhbGwoIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoICcud3Bmb3Jtcy11cGxvYWRlcicgKSApLm1hcCggZHJvcFpvbmVJbml0ICk7XG5cblx0XHRldmVudHMoKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBNb2Rlcm4gRmlsZSBVcGxvYWQgZW5naW5lLlxuXHQgKlxuXHQgKiBAc2luY2UgMS42LjBcblx0ICovXG5cdHZhciB3cGZvcm1zTW9kZXJuRmlsZVVwbG9hZCA9IHtcblxuXHRcdC8qKlxuXHRcdCAqIFN0YXJ0IHRoZSBpbml0aWFsaXphdGlvbi5cblx0XHQgKlxuXHRcdCAqIEBzaW5jZSAxLjYuMFxuXHRcdCAqL1xuXHRcdGluaXQ6IGZ1bmN0aW9uKCkge1xuXG5cdFx0XHRpZiAoIGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdsb2FkaW5nJyApIHtcblx0XHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lciggJ0RPTUNvbnRlbnRMb2FkZWQnLCByZWFkeSApO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmVhZHkoKTtcblx0XHRcdH1cblx0XHR9LFxuXHR9O1xuXG5cdC8vIENhbGwgaW5pdCBhbmQgc2F2ZSBpbiBnbG9iYWwgdmFyaWFibGUuXG5cdHdwZm9ybXNNb2Rlcm5GaWxlVXBsb2FkLmluaXQoKTtcblx0d2luZG93LndwZm9ybXNNb2Rlcm5GaWxlVXBsb2FkID0gd3Bmb3Jtc01vZGVybkZpbGVVcGxvYWQ7XG5cbn0oIGpRdWVyeSApICk7XG4iXSwibWFwcGluZ3MiOiJBQUFBLFlBQVk7O0FBQUM7QUFFWCxXQUFVQSxDQUFDLEVBQUc7RUFFZjtBQUNEO0FBQ0E7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
},{}]},{},[1])