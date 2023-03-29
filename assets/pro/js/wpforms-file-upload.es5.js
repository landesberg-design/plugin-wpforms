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
      handler = toggleLoadingMessage($form),
      disabled = uploadInProgress(dz);
    if (disabled === Boolean($btn.prop('disabled'))) {
      return;
    }
    if (disabled) {
      $btn.prop('disabled', true);
      if (!$form.find('.wpforms-submit-overlay').length) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyIkIiwiaXNTbG93Iiwic3VibWl0dGVkVmFsdWVzIiwic3BlZWRUZXN0U2V0dGluZ3MiLCJtYXhUaW1lIiwicGF5bG9hZFNpemUiLCJnZXRQYXlsb2FkIiwiZGF0YSIsImkiLCJTdHJpbmciLCJmcm9tQ2hhckNvZGUiLCJNYXRoIiwicm91bmQiLCJyYW5kb20iLCJzcGVlZFRlc3QiLCJuZXh0Iiwic2V0VGltZW91dCIsInN0YXJ0IiwiRGF0ZSIsIndwIiwiYWpheCIsInBvc3QiLCJhY3Rpb24iLCJ0aGVuIiwiZGVsdGEiLCJmYWlsIiwidG9nZ2xlTG9hZGluZ01lc3NhZ2UiLCIkZm9ybSIsImZpbmQiLCJsZW5ndGgiLCJiZWZvcmUiLCJ3aW5kb3ciLCJ3cGZvcm1zX2ZpbGVfdXBsb2FkIiwibG9hZGluZ19tZXNzYWdlIiwidXBsb2FkSW5Qcm9ncmVzcyIsImR6IiwibG9hZGluZyIsImdldEZpbGVzV2l0aFN0YXR1cyIsImFueVVwbG9hZHNJblByb2dyZXNzIiwid3Bmb3JtcyIsImRyb3B6b25lcyIsInNvbWUiLCJ0b2dnbGVTdWJtaXQiLCJqUXVlcnkiLCJlbGVtZW50IiwiY2xvc2VzdCIsIiRidG4iLCJoYW5kbGVyIiwiZGlzYWJsZWQiLCJCb29sZWFuIiwicHJvcCIsInBhcmVudCIsImFkZENsYXNzIiwiYXBwZW5kIiwiY3NzIiwid2lkdGgiLCJvdXRlcldpZHRoIiwiaGVpZ2h0Iiwib3V0ZXJIZWlnaHQiLCJvbiIsIm9mZiIsInJlbW92ZSIsInJlbW92ZUNsYXNzIiwicGFyc2VKU09OIiwic3RyIiwiSlNPTiIsInBhcnNlIiwiZSIsIm9ubHlXaXRoTGVuZ3RoIiwiZWwiLCJvbmx5UG9zaXRpdmUiLCJnZXRYSFIiLCJjaHVua1Jlc3BvbnNlIiwieGhyIiwiZ2V0UmVzcG9uc2VUZXh0IiwicmVzcG9uc2VUZXh0IiwiZ2V0RGF0YSIsImdldFZhbHVlIiwiZmlsZXMiLCJtYXAiLCJmaWx0ZXIiLCJzZW5kaW5nIiwiZmlsZSIsImZvcm1EYXRhIiwic2l6ZSIsImRhdGFUcmFuc2ZlciIsInBvc3RNYXhTaXplIiwic2VuZCIsImFjY2VwdGVkIiwicHJvY2Vzc2luZyIsInN0YXR1cyIsInByZXZpZXdFbGVtZW50IiwiY2xhc3NMaXN0IiwiYWRkIiwiT2JqZWN0Iiwia2V5cyIsImZvckVhY2giLCJrZXkiLCJjb252ZXJ0RmlsZXNUb1ZhbHVlIiwiZm9ybUlkIiwiZmllbGRJZCIsInN0cmluZ2lmeSIsInB1c2giLCJhcHBseSIsImdldElucHV0IiwicGFyZW50cyIsIm5hbWUiLCJ1cGRhdGVJbnB1dFZhbHVlIiwiJGlucHV0IiwidmFsIiwidHJpZ2dlciIsImZuIiwidmFsaWQiLCJjb21wbGV0ZSIsIm1heCIsImFkZEVycm9yTWVzc2FnZSIsImVycm9yTWVzc2FnZSIsImlzRXJyb3JOb3RVcGxvYWRlZERpc3BsYXllZCIsInNwYW4iLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJpbm5lclRleHQiLCJ0b1N0cmluZyIsInNldEF0dHJpYnV0ZSIsInF1ZXJ5U2VsZWN0b3IiLCJhcHBlbmRDaGlsZCIsImNvbmZpcm1DaHVua3NGaW5pc2hVcGxvYWQiLCJjb25maXJtIiwicmV0cmllcyIsInJldHJ5IiwiZXJyb3JzIiwiZmlsZV9ub3RfdXBsb2FkZWQiLCJyZXNwb25zZSIsImhhc1NwZWNpZmljRXJyb3IiLCJyZXNwb25zZUpTT04iLCJzdWNjZXNzIiwiZXh0ZW5kIiwiZm9ybV9pZCIsImZpZWxkX2lkIiwib3B0aW9ucyIsInBhcmFtcyIsImNhbGwiLCJpbmRleCIsInByb2Nlc3NRdWV1ZSIsInRvZ2dsZU1lc3NhZ2UiLCJ2YWxpZEZpbGVzIiwibWF4RmlsZXMiLCJ2YWxpZGF0ZVBvc3RNYXhTaXplRXJyb3IiLCJwb3N0X21heF9zaXplIiwiaW5pdEZpbGVVcGxvYWQiLCJzbG93IiwiZHpjaHVua3NpemUiLCJjaHVua1NpemUiLCJwYXJzZUludCIsInVwbG9hZCIsInRvdGFsQ2h1bmtDb3VudCIsImNlaWwiLCJkZWZhdWx0X2Vycm9yIiwiYWRkZWRGaWxlIiwicmVtb3ZlRnJvbVNlcnZlciIsInJlbW92ZWRGaWxlIiwianNvbiIsIm9iamVjdCIsInByb3RvdHlwZSIsImhhc093blByb3BlcnR5IiwiaXNEZWZhdWx0Iiwic3BsaWNlIiwiZXJyb3IiLCJxdWVyeVNlbGVjdG9yQWxsIiwidGV4dENvbnRlbnQiLCJwcmVzZXRTdWJtaXR0ZWREYXRhIiwidHlwZSIsIm1hdGNoIiwiZGlzcGxheUV4aXN0aW5nRmlsZSIsInVybCIsImVtaXQiLCJkcm9wWm9uZUluaXQiLCIkZWwiLCJkcm9wem9uZSIsImRhdGFzZXQiLCJtYXhGaWxlTnVtYmVyIiwiYWNjZXB0ZWRGaWxlcyIsImV4dGVuc2lvbnMiLCJzcGxpdCIsImpvaW4iLCJEcm9wem9uZSIsImFkZFJlbW92ZUxpbmtzIiwiY2h1bmtpbmciLCJmb3JjZUNodW5raW5nIiwicmV0cnlDaHVua3MiLCJmaWxlQ2h1bmtTaXplIiwicGFyYW1OYW1lIiwiaW5wdXROYW1lIiwicGFyYWxsZWxDaHVua1VwbG9hZHMiLCJwYXJhbGxlbFVwbG9hZHMiLCJtYXhQYXJhbGxlbFVwbG9hZHMiLCJhdXRvUHJvY2Vzc1F1ZXVlIiwibWF4RmlsZXNpemUiLCJtYXhTaXplIiwidG9GaXhlZCIsImRpY3RNYXhGaWxlc0V4Y2VlZGVkIiwiZmlsZV9saW1pdCIsInJlcGxhY2UiLCJkaWN0SW52YWxpZEZpbGVUeXBlIiwiZmlsZV9leHRlbnNpb24iLCJkaWN0RmlsZVRvb0JpZyIsImZpbGVfc2l6ZSIsImRyb3B6b25lSW5wdXRGb2N1cyIsInByZXYiLCJkcm9wem9uZUlucHV0Qmx1ciIsImRyb3B6b25lSW5wdXRLZXlwcmVzcyIsInByZXZlbnREZWZhdWx0Iiwia2V5Q29kZSIsImRyb3B6b25lQ2xpY2siLCJldmVudHMiLCJyZWFkeSIsInNsaWNlIiwid3Bmb3Jtc01vZGVybkZpbGVVcGxvYWQiLCJpbml0IiwicmVhZHlTdGF0ZSIsImFkZEV2ZW50TGlzdGVuZXIiXSwic291cmNlcyI6WyJmYWtlXzkxMmI0MTIwLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuKCBmdW5jdGlvbiggJCApIHtcblxuXHQvKipcblx0ICogQWxsIGNvbm5lY3Rpb25zIGFyZSBzbG93IGJ5IGRlZmF1bHQuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjYuMlxuXHQgKlxuXHQgKiBAdHlwZSB7Ym9vbGVhbnxudWxsfVxuXHQgKi9cblx0dmFyIGlzU2xvdyA9IG51bGw7XG5cblx0LyoqXG5cdCAqIFByZXZpb3VzbHkgc3VibWl0dGVkIGRhdGEuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjcuMVxuXHQgKlxuXHQgKiBAdHlwZSB7QXJyYXl9XG5cdCAqL1xuXHR2YXIgc3VibWl0dGVkVmFsdWVzID0gW107XG5cblx0LyoqXG5cdCAqIERlZmF1bHQgc2V0dGluZ3MgZm9yIG91ciBzcGVlZCB0ZXN0LlxuXHQgKlxuXHQgKiBAc2luY2UgMS42LjJcblx0ICpcblx0ICogQHR5cGUge3ttYXhUaW1lOiBudW1iZXIsIHBheWxvYWRTaXplOiBudW1iZXJ9fVxuXHQgKi9cblx0dmFyIHNwZWVkVGVzdFNldHRpbmdzID0ge1xuXHRcdG1heFRpbWU6IDMwMDAsIC8vIE1heCB0aW1lIChtcykgaXQgc2hvdWxkIHRha2UgdG8gYmUgY29uc2lkZXJlZCBhICdmYXN0IGNvbm5lY3Rpb24nLlxuXHRcdHBheWxvYWRTaXplOiAxMDAgKiAxMDI0LCAvLyBQYXlsb2FkIHNpemUuXG5cdH07XG5cblx0LyoqXG5cdCAqIENyZWF0ZSBhIHJhbmRvbSBwYXlsb2FkIGZvciB0aGUgc3BlZWQgdGVzdC5cblx0ICpcblx0ICogQHNpbmNlIDEuNi4yXG5cdCAqXG5cdCAqIEByZXR1cm5zIHtzdHJpbmd9IFJhbmRvbSBwYXlsb2FkLlxuXHQgKi9cblx0ZnVuY3Rpb24gZ2V0UGF5bG9hZCgpIHtcblxuXHRcdHZhciBkYXRhID0gJyc7XG5cblx0XHRmb3IgKCB2YXIgaSA9IDA7IGkgPCBzcGVlZFRlc3RTZXR0aW5ncy5wYXlsb2FkU2l6ZTsgKytpICkge1xuXHRcdFx0ZGF0YSArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKCBNYXRoLnJvdW5kKCBNYXRoLnJhbmRvbSgpICogMzYgKyA2NCApICk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGRhdGE7XG5cdH1cblxuXHQvKipcblx0ICogUnVuIHNwZWVkIHRlc3RzIGFuZCBmbGFnIHRoZSBjbGllbnRzIGFzIHNsb3cgb3Igbm90LiBJZiBhIGNvbm5lY3Rpb25cblx0ICogaXMgc2xvdyBpdCB3b3VsZCBsZXQgdGhlIGJhY2tlbmQga25vdyBhbmQgdGhlIGJhY2tlbmQgbW9zdCBsaWtlbHlcblx0ICogd291bGQgZGlzYWJsZSBwYXJhbGxlbCB1cGxvYWRzIGFuZCB3b3VsZCBzZXQgc21hbGxlciBjaHVuayBzaXplcy5cblx0ICpcblx0ICogQHNpbmNlIDEuNi4yXG5cdCAqXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IG5leHQgRnVuY3Rpb24gdG8gY2FsbCB3aGVuIHRoZSBzcGVlZCBkZXRlY3Rpb24gaXMgZG9uZS5cblx0ICovXG5cdGZ1bmN0aW9uIHNwZWVkVGVzdCggbmV4dCApIHtcblxuXHRcdGlmICggbnVsbCAhPT0gaXNTbG93ICkge1xuXHRcdFx0c2V0VGltZW91dCggbmV4dCApO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHZhciBkYXRhICA9IGdldFBheWxvYWQoKTtcblx0XHR2YXIgc3RhcnQgPSBuZXcgRGF0ZTtcblxuXHRcdHdwLmFqYXgucG9zdCgge1xuXHRcdFx0YWN0aW9uOiAnd3Bmb3Jtc19maWxlX3VwbG9hZF9zcGVlZF90ZXN0Jyxcblx0XHRcdGRhdGE6IGRhdGEsXG5cdFx0fSApLnRoZW4oIGZ1bmN0aW9uKCkge1xuXG5cdFx0XHR2YXIgZGVsdGEgPSBuZXcgRGF0ZSAtIHN0YXJ0O1xuXG5cdFx0XHRpc1Nsb3cgPSBkZWx0YSA+PSBzcGVlZFRlc3RTZXR0aW5ncy5tYXhUaW1lO1xuXG5cdFx0XHRuZXh0KCk7XG5cdFx0fSApLmZhaWwoIGZ1bmN0aW9uKCkge1xuXG5cdFx0XHRpc1Nsb3cgPSB0cnVlO1xuXG5cdFx0XHRuZXh0KCk7XG5cdFx0fSApO1xuXHR9XG5cblx0LyoqXG5cdCAqIFRvZ2dsZSBsb2FkaW5nIG1lc3NhZ2UgYWJvdmUgc3VibWl0IGJ1dHRvbi5cblx0ICpcblx0ICogQHNpbmNlIDEuNS42XG5cdCAqXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSAkZm9ybSBqUXVlcnkgZm9ybSBlbGVtZW50LlxuXHQgKlxuXHQgKiBAcmV0dXJucyB7RnVuY3Rpb259IGV2ZW50IGhhbmRsZXIgZnVuY3Rpb24uXG5cdCAqL1xuXHRmdW5jdGlvbiB0b2dnbGVMb2FkaW5nTWVzc2FnZSggJGZvcm0gKSB7XG5cblx0XHRyZXR1cm4gZnVuY3Rpb24oKSB7XG5cblx0XHRcdGlmICggJGZvcm0uZmluZCggJy53cGZvcm1zLXVwbG9hZGluZy1pbi1wcm9ncmVzcy1hbGVydCcgKS5sZW5ndGggKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0JGZvcm0uZmluZCggJy53cGZvcm1zLXN1Ym1pdC1jb250YWluZXInIClcblx0XHRcdFx0LmJlZm9yZShcblx0XHRcdFx0XHRgPGRpdiBjbGFzcz1cIndwZm9ybXMtZXJyb3ItYWxlcnQgd3Bmb3Jtcy11cGxvYWRpbmctaW4tcHJvZ3Jlc3MtYWxlcnRcIj5cblx0XHRcdFx0XHRcdCR7d2luZG93LndwZm9ybXNfZmlsZV91cGxvYWQubG9hZGluZ19tZXNzYWdlfVxuXHRcdFx0XHRcdDwvZGl2PmBcblx0XHRcdFx0KTtcblx0XHR9O1xuXHR9XG5cblx0LyoqXG5cdCAqIElzIGEgZmllbGQgbG9hZGluZz9cblx0ICpcblx0ICogQHNpbmNlIDEuNy42XG5cdCAqXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBkeiBEcm9wem9uZSBvYmplY3QuXG5cdCAqXG5cdCAqIEByZXR1cm5zIHtib29sZWFufSB0cnVlIGlmIHRoZSBmaWVsZCBpcyBsb2FkaW5nLlxuXHQgKi9cblx0ZnVuY3Rpb24gdXBsb2FkSW5Qcm9ncmVzcyggZHogKSB7XG5cblx0XHRyZXR1cm4gZHoubG9hZGluZyA+IDAgfHwgZHouZ2V0RmlsZXNXaXRoU3RhdHVzKCAnZXJyb3InICkubGVuZ3RoID4gMDtcblx0fVxuXG5cdC8qKlxuXHQgKiBJcyBhdCBsZWFzdCBvbmUgZmllbGQgbG9hZGluZz9cblx0ICpcblx0ICogQHNpbmNlIDEuNy42XG5cdCAqXG5cdCAqIEByZXR1cm5zIHtib29sZWFufSB0cnVlIGlmIGF0IGxlYXN0IG9uZSBmaWVsZCBpcyBsb2FkaW5nLlxuXHQgKi9cblx0ZnVuY3Rpb24gYW55VXBsb2Fkc0luUHJvZ3Jlc3MoKSB7XG5cblx0XHR2YXIgYW55VXBsb2Fkc0luUHJvZ3Jlc3MgPSBmYWxzZTtcblxuXHRcdHdpbmRvdy53cGZvcm1zLmRyb3B6b25lcy5zb21lKCBmdW5jdGlvbiggZHogKSB7XG5cblx0XHRcdGlmICggdXBsb2FkSW5Qcm9ncmVzcyggZHogKSApIHtcblx0XHRcdFx0YW55VXBsb2Fkc0luUHJvZ3Jlc3MgPSB0cnVlO1xuXG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXHRcdH0gKTtcblxuXHRcdHJldHVybiBhbnlVcGxvYWRzSW5Qcm9ncmVzcztcblx0fVxuXG5cdC8qKlxuXHQgKiBEaXNhYmxlIHN1Ym1pdCBidXR0b24gd2hlbiB3ZSBhcmUgc2VuZGluZyBmaWxlcyB0byB0aGUgc2VydmVyLlxuXHQgKlxuXHQgKiBAc2luY2UgMS41LjZcblx0ICpcblx0ICogQHBhcmFtIHtvYmplY3R9IGR6IERyb3B6b25lIG9iamVjdC5cblx0ICovXG5cdGZ1bmN0aW9uIHRvZ2dsZVN1Ym1pdCggZHogKSB7XG5cblx0XHR2YXIgJGZvcm0gICAgPSBqUXVlcnkoIGR6LmVsZW1lbnQgKS5jbG9zZXN0KCAnZm9ybScgKSxcblx0XHRcdCRidG4gICAgID0gJGZvcm0uZmluZCggJy53cGZvcm1zLXN1Ym1pdCcgKSxcblx0XHRcdGhhbmRsZXIgID0gdG9nZ2xlTG9hZGluZ01lc3NhZ2UoICRmb3JtICksXG5cdFx0XHRkaXNhYmxlZCA9IHVwbG9hZEluUHJvZ3Jlc3MoIGR6ICk7XG5cblx0XHRpZiAoIGRpc2FibGVkID09PSBCb29sZWFuKCAkYnRuLnByb3AoICdkaXNhYmxlZCcgKSApICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmICggZGlzYWJsZWQgKSB7XG5cdFx0XHQkYnRuLnByb3AoICdkaXNhYmxlZCcsIHRydWUgKTtcblx0XHRcdGlmICggISAkZm9ybS5maW5kKCAnLndwZm9ybXMtc3VibWl0LW92ZXJsYXknICkubGVuZ3RoICkge1xuXHRcdFx0XHQkYnRuLnBhcmVudCgpLmFkZENsYXNzKCAnd3Bmb3Jtcy1zdWJtaXQtb3ZlcmxheS1jb250YWluZXInICk7XG5cdFx0XHRcdCRidG4ucGFyZW50KCkuYXBwZW5kKCAnPGRpdiBjbGFzcz1cIndwZm9ybXMtc3VibWl0LW92ZXJsYXlcIj48L2Rpdj4nICk7XG5cdFx0XHRcdCRmb3JtLmZpbmQoICcud3Bmb3Jtcy1zdWJtaXQtb3ZlcmxheScgKS5jc3MoIHtcblx0XHRcdFx0XHR3aWR0aDogYCR7JGJ0bi5vdXRlcldpZHRoKCl9cHhgLFxuXHRcdFx0XHRcdGhlaWdodDogYCR7JGJ0bi5wYXJlbnQoKS5vdXRlckhlaWdodCgpfXB4YCxcblx0XHRcdFx0fSApO1xuXHRcdFx0XHQkZm9ybS5maW5kKCAnLndwZm9ybXMtc3VibWl0LW92ZXJsYXknICkub24oICdjbGljaycsIGhhbmRsZXIgKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmICggYW55VXBsb2Fkc0luUHJvZ3Jlc3MoKSApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQkYnRuLnByb3AoICdkaXNhYmxlZCcsIGZhbHNlICk7XG5cdFx0JGZvcm0uZmluZCggJy53cGZvcm1zLXN1Ym1pdC1vdmVybGF5JyApLm9mZiggJ2NsaWNrJywgaGFuZGxlciApO1xuXHRcdCRmb3JtLmZpbmQoICcud3Bmb3Jtcy1zdWJtaXQtb3ZlcmxheScgKS5yZW1vdmUoKTtcblx0XHQkYnRuLnBhcmVudCgpLnJlbW92ZUNsYXNzKCAnd3Bmb3Jtcy1zdWJtaXQtb3ZlcmxheS1jb250YWluZXInICk7XG5cdFx0aWYgKCAkZm9ybS5maW5kKCAnLndwZm9ybXMtdXBsb2FkaW5nLWluLXByb2dyZXNzLWFsZXJ0JyApLmxlbmd0aCApIHtcblx0XHRcdCRmb3JtLmZpbmQoICcud3Bmb3Jtcy11cGxvYWRpbmctaW4tcHJvZ3Jlc3MtYWxlcnQnICkucmVtb3ZlKCk7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIFRyeSB0byBwYXJzZSBKU09OIG9yIHJldHVybiBmYWxzZS5cblx0ICpcblx0ICogQHNpbmNlIDEuNS42XG5cdCAqXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBzdHIgSlNPTiBzdHJpbmcgY2FuZGlkYXRlLlxuXHQgKlxuXHQgKiBAcmV0dXJucyB7Kn0gUGFyc2Ugb2JqZWN0IG9yIGZhbHNlLlxuXHQgKi9cblx0ZnVuY3Rpb24gcGFyc2VKU09OKCBzdHIgKSB7XG5cdFx0dHJ5IHtcblx0XHRcdHJldHVybiBKU09OLnBhcnNlKCBzdHIgKTtcblx0XHR9IGNhdGNoICggZSApIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogTGVhdmUgb25seSBvYmplY3RzIHdpdGggbGVuZ3RoLlxuXHQgKlxuXHQgKiBAc2luY2UgMS41LjZcblx0ICpcblx0ICogQHBhcmFtIHtvYmplY3R9IGVsIEFueSBhcnJheS5cblx0ICpcblx0ICogQHJldHVybnMge2Jvb2x9IEhhcyBsZW5ndGggbW9yZSB0aGFuIDAgb3Igbm8uXG5cdCAqL1xuXHRmdW5jdGlvbiBvbmx5V2l0aExlbmd0aCggZWwgKSB7XG5cdFx0cmV0dXJuIGVsLmxlbmd0aCA+IDA7XG5cdH1cblxuXHQvKipcblx0ICogTGVhdmUgb25seSBwb3NpdGl2ZSBlbGVtZW50cy5cblx0ICpcblx0ICogQHNpbmNlIDEuNS42XG5cdCAqXG5cdCAqIEBwYXJhbSB7Kn0gZWwgQW55IGVsZW1lbnQuXG5cdCAqXG5cdCAqIEByZXR1cm5zIHsqfSBGaWx0ZXIgb25seSBwb3NpdGl2ZS5cblx0ICovXG5cdGZ1bmN0aW9uIG9ubHlQb3NpdGl2ZSggZWwgKSB7XG5cdFx0cmV0dXJuIGVsO1xuXHR9XG5cblx0LyoqXG5cdCAqIEdldCB4aHIuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjUuNlxuXHQgKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gZWwgT2JqZWN0IHdpdGggeGhyIHByb3BlcnR5LlxuXHQgKlxuXHQgKiBAcmV0dXJucyB7Kn0gR2V0IFhIUi5cblx0ICovXG5cdGZ1bmN0aW9uIGdldFhIUiggZWwgKSB7XG5cdFx0cmV0dXJuIGVsLmNodW5rUmVzcG9uc2UgfHwgZWwueGhyO1xuXHR9XG5cblx0LyoqXG5cdCAqIEdldCByZXNwb25zZSB0ZXh0LlxuXHQgKlxuXHQgKiBAc2luY2UgMS41LjZcblx0ICpcblx0ICogQHBhcmFtIHtvYmplY3R9IGVsIFhociBvYmplY3QuXG5cdCAqXG5cdCAqIEByZXR1cm5zIHtvYmplY3R9IFJlc3BvbnNlIHRleHQuXG5cdCAqL1xuXHRmdW5jdGlvbiBnZXRSZXNwb25zZVRleHQoIGVsICkge1xuXHRcdHJldHVybiB0eXBlb2YgZWwgPT09ICdzdHJpbmcnID8gZWwgOiBlbC5yZXNwb25zZVRleHQ7XG5cdH1cblxuXHQvKipcblx0ICogR2V0IGRhdGEuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjUuNlxuXHQgKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gZWwgT2JqZWN0IHdpdGggZGF0YSBwcm9wZXJ0eS5cblx0ICpcblx0ICogQHJldHVybnMge29iamVjdH0gRGF0YS5cblx0ICovXG5cdGZ1bmN0aW9uIGdldERhdGEoIGVsICkge1xuXHRcdHJldHVybiBlbC5kYXRhO1xuXHR9XG5cblx0LyoqXG5cdCAqIEdldCB2YWx1ZSBmcm9tIGZpbGVzLlxuXHQgKlxuXHQgKiBAc2luY2UgMS41LjZcblx0ICpcblx0ICogQHBhcmFtIHtvYmplY3R9IGZpbGVzIERyb3B6b25lIGZpbGVzLlxuXHQgKlxuXHQgKiBAcmV0dXJucyB7b2JqZWN0fSBQcmVwYXJlZCB2YWx1ZS5cblx0ICovXG5cdGZ1bmN0aW9uIGdldFZhbHVlKCBmaWxlcyApIHtcblx0XHRyZXR1cm4gZmlsZXNcblx0XHRcdC5tYXAoIGdldFhIUiApXG5cdFx0XHQuZmlsdGVyKCBvbmx5UG9zaXRpdmUgKVxuXHRcdFx0Lm1hcCggZ2V0UmVzcG9uc2VUZXh0IClcblx0XHRcdC5maWx0ZXIoIG9ubHlXaXRoTGVuZ3RoIClcblx0XHRcdC5tYXAoIHBhcnNlSlNPTiApXG5cdFx0XHQuZmlsdGVyKCBvbmx5UG9zaXRpdmUgKVxuXHRcdFx0Lm1hcCggZ2V0RGF0YSApO1xuXHR9XG5cblx0LyoqXG5cdCAqIFNlbmRpbmcgZXZlbnQgaGlnaGVyIG9yZGVyIGZ1bmN0aW9uLlxuXHQgKlxuXHQgKiBAc2luY2UgMS41LjZcblx0ICogQHNpbmNlIDEuNS42LjEgQWRkZWQgc3BlY2lhbCBwcm9jZXNzaW5nIG9mIGEgZmlsZSB0aGF0IGlzIGxhcmdlciB0aGFuIHNlcnZlcidzIHBvc3RfbWF4X3NpemUuXG5cdCAqXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBkeiBEcm9wem9uZSBvYmplY3QuXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBkYXRhIEFkZGluZyBkYXRhIHRvIHJlcXVlc3QuXG5cdCAqXG5cdCAqIEByZXR1cm5zIHtGdW5jdGlvbn0gSGFuZGxlciBmdW5jdGlvbi5cblx0ICovXG5cdGZ1bmN0aW9uIHNlbmRpbmcoIGR6LCBkYXRhICkge1xuXG5cdFx0cmV0dXJuIGZ1bmN0aW9uKCBmaWxlLCB4aHIsIGZvcm1EYXRhICkge1xuXG5cdFx0XHQvKlxuXHRcdFx0ICogV2Ugc2hvdWxkIG5vdCBhbGxvdyBzZW5kaW5nIGEgZmlsZSwgdGhhdCBleGNlZWRzIHNlcnZlciBwb3N0X21heF9zaXplLlxuXHRcdFx0ICogV2l0aCB0aGlzIFwiaGFja1wiIHdlIHJlZGVmaW5lIHRoZSBkZWZhdWx0IHNlbmQgZnVuY3Rpb25hbGl0eVxuXHRcdFx0ICogdG8gcHJldmVudCBvbmx5IHRoaXMgb2JqZWN0IGZyb20gc2VuZGluZyBhIHJlcXVlc3QgYXQgYWxsLlxuXHRcdFx0ICogVGhlIGZpbGUgdGhhdCBnZW5lcmF0ZWQgdGhhdCBlcnJvciBzaG91bGQgYmUgbWFya2VkIGFzIHJlamVjdGVkLFxuXHRcdFx0ICogc28gRHJvcHpvbmUgd2lsbCBzaWxlbnRseSBpZ25vcmUgaXQuXG5cdFx0XHQgKlxuXHRcdFx0ICogSWYgQ2h1bmtzIGFyZSBlbmFibGVkIHRoZSBmaWxlIHNpemUgd2lsbCBuZXZlciBleGNlZWQgKGJ5IGEgUEhQIGNvbnN0cmFpbnQpIHRoZVxuXHRcdFx0ICogcG9zdE1heFNpemUuIFRoaXMgYmxvY2sgc2hvdWxkbid0IGJlIHJlbW92ZWQgbm9uZXRoZWxlc3MgdW50aWwgdGhlIFwibW9kZXJuXCIgdXBsb2FkIGlzIGNvbXBsZXRlbHlcblx0XHRcdCAqIGRlcHJlY2F0ZWQgYW5kIHJlbW92ZWQuXG5cdFx0XHQgKi9cblx0XHRcdGlmICggZmlsZS5zaXplID4gdGhpcy5kYXRhVHJhbnNmZXIucG9zdE1heFNpemUgKSB7XG5cdFx0XHRcdHhoci5zZW5kID0gZnVuY3Rpb24oKSB7fTtcblxuXHRcdFx0XHRmaWxlLmFjY2VwdGVkID0gZmFsc2U7XG5cdFx0XHRcdGZpbGUucHJvY2Vzc2luZyA9IGZhbHNlO1xuXHRcdFx0XHRmaWxlLnN0YXR1cyA9ICdyZWplY3RlZCc7XG5cdFx0XHRcdGZpbGUucHJldmlld0VsZW1lbnQuY2xhc3NMaXN0LmFkZCggJ2R6LWVycm9yJyApO1xuXHRcdFx0XHRmaWxlLnByZXZpZXdFbGVtZW50LmNsYXNzTGlzdC5hZGQoICdkei1jb21wbGV0ZScgKTtcblxuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdE9iamVjdC5rZXlzKCBkYXRhICkuZm9yRWFjaCggZnVuY3Rpb24oIGtleSApIHtcblx0XHRcdFx0Zm9ybURhdGEuYXBwZW5kKCBrZXksIGRhdGFba2V5XSApO1xuXHRcdFx0fSApO1xuXHRcdH07XG5cdH1cblxuXHQvKipcblx0ICogQ29udmVydCBmaWxlcyB0byBpbnB1dCB2YWx1ZS5cblx0ICpcblx0ICogQHNpbmNlIDEuNS42XG5cdCAqIEBzaW5jZSAxLjcuMSBBZGRlZCB0aGUgZHogYXJndW1lbnQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBmaWxlcyBGaWxlcyBsaXN0LlxuXHQgKiBAcGFyYW0ge29iamVjdH0gZHogRHJvcHpvbmUgb2JqZWN0LlxuXHQgKlxuXHQgKiBAcmV0dXJucyB7c3RyaW5nfSBDb252ZXJ0ZWQgdmFsdWUuXG5cdCAqL1xuXHRmdW5jdGlvbiBjb252ZXJ0RmlsZXNUb1ZhbHVlKCBmaWxlcywgZHogKSB7XG5cblx0XHRpZiAoICEgc3VibWl0dGVkVmFsdWVzWyBkei5kYXRhVHJhbnNmZXIuZm9ybUlkIF0gfHwgISBzdWJtaXR0ZWRWYWx1ZXNbIGR6LmRhdGFUcmFuc2Zlci5mb3JtSWQgXVsgZHouZGF0YVRyYW5zZmVyLmZpZWxkSWQgXSApIHtcblx0XHRcdHJldHVybiBmaWxlcy5sZW5ndGggPyBKU09OLnN0cmluZ2lmeSggZmlsZXMgKSA6ICcnO1xuXHRcdH1cblxuXHRcdGZpbGVzLnB1c2guYXBwbHkoIGZpbGVzLCBzdWJtaXR0ZWRWYWx1ZXNbIGR6LmRhdGFUcmFuc2Zlci5mb3JtSWQgXVsgZHouZGF0YVRyYW5zZmVyLmZpZWxkSWQgXSApO1xuXG5cdFx0cmV0dXJuIEpTT04uc3RyaW5naWZ5KCBmaWxlcyApO1xuXHR9XG5cblx0LyoqXG5cdCAqIEdldCBpbnB1dCBlbGVtZW50LlxuXHQgKlxuXHQgKiBAc2luY2UgMS43LjFcblx0ICpcblx0ICogQHBhcmFtIHtvYmplY3R9IGR6IERyb3B6b25lIG9iamVjdC5cblx0ICpcblx0ICogQHJldHVybnMge2pRdWVyeX0gSGlkZGVuIGlucHV0IGVsZW1lbnQuXG5cdCAqL1xuXHRmdW5jdGlvbiBnZXRJbnB1dCggZHogKSB7XG5cblx0XHRyZXR1cm4galF1ZXJ5KCBkei5lbGVtZW50ICkucGFyZW50cyggJy53cGZvcm1zLWZpZWxkLWZpbGUtdXBsb2FkJyApLmZpbmQoICdpbnB1dFtuYW1lPScgKyBkei5kYXRhVHJhbnNmZXIubmFtZSArICddJyApO1xuXHR9XG5cblx0LyoqXG5cdCAqIFVwZGF0ZSB2YWx1ZSBpbiBpbnB1dC5cblx0ICpcblx0ICogQHNpbmNlIDEuNS42XG5cdCAqXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBkeiBEcm9wem9uZSBvYmplY3QuXG5cdCAqL1xuXHRmdW5jdGlvbiB1cGRhdGVJbnB1dFZhbHVlKCBkeiApIHtcblxuXHRcdHZhciAkaW5wdXQgPSBnZXRJbnB1dCggZHogKTtcblxuXHRcdCRpbnB1dC52YWwoIGNvbnZlcnRGaWxlc1RvVmFsdWUoIGdldFZhbHVlKCBkei5maWxlcyApLCBkeiApICkudHJpZ2dlciggJ2lucHV0JyApO1xuXG5cdFx0aWYgKCB0eXBlb2YgalF1ZXJ5LmZuLnZhbGlkICE9PSAndW5kZWZpbmVkJyApIHtcblx0XHRcdCRpbnB1dC52YWxpZCgpO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBDb21wbGV0ZSBldmVudCBoaWdoZXIgb3JkZXIgZnVuY3Rpb24uXG5cdCAqXG5cdCAqIEBkZXByZWNhdGVkIDEuNi4yXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjUuNlxuXHQgKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gZHogRHJvcHpvbmUgb2JqZWN0LlxuXHQgKlxuXHQgKiBAcmV0dXJucyB7RnVuY3Rpb259IEhhbmRsZXIgZnVuY3Rpb24uXG5cdCAqL1xuXHRmdW5jdGlvbiBjb21wbGV0ZSggZHogKSB7XG5cblx0XHRyZXR1cm4gZnVuY3Rpb24oKSB7XG5cdFx0XHRkei5sb2FkaW5nID0gZHoubG9hZGluZyB8fCAwO1xuXHRcdFx0ZHoubG9hZGluZy0tO1xuXHRcdFx0ZHoubG9hZGluZyA9IE1hdGgubWF4KCBkei5sb2FkaW5nIC0gMSwgMCApO1xuXHRcdFx0dG9nZ2xlU3VibWl0KCBkeiApO1xuXHRcdFx0dXBkYXRlSW5wdXRWYWx1ZSggZHogKTtcblx0XHR9O1xuXHR9XG5cblx0LyoqXG5cdCAqIEFkZCBhbiBlcnJvciBtZXNzYWdlIHRvIHRoZSBjdXJyZW50IGZpbGUuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjYuMlxuXHQgKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gZmlsZSAgICAgICAgIEZpbGUgb2JqZWN0LlxuXHQgKiBAcGFyYW0ge3N0cmluZ30gZXJyb3JNZXNzYWdlIEVycm9yIG1lc3NhZ2Vcblx0ICovXG5cdGZ1bmN0aW9uIGFkZEVycm9yTWVzc2FnZSggZmlsZSwgZXJyb3JNZXNzYWdlICkge1xuXG5cdFx0aWYgKCBmaWxlLmlzRXJyb3JOb3RVcGxvYWRlZERpc3BsYXllZCApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR2YXIgc3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdzcGFuJyApO1xuXHRcdHNwYW4uaW5uZXJUZXh0ID0gZXJyb3JNZXNzYWdlLnRvU3RyaW5nKCk7XG5cdFx0c3Bhbi5zZXRBdHRyaWJ1dGUoICdkYXRhLWR6LWVycm9ybWVzc2FnZScsICcnICk7XG5cblx0XHRmaWxlLnByZXZpZXdFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoICcuZHotZXJyb3ItbWVzc2FnZScgKS5hcHBlbmRDaGlsZCggc3BhbiApO1xuXHR9XG5cblx0LyoqXG5cdCAqIENvbmZpcm0gdGhlIHVwbG9hZCB0byB0aGUgc2VydmVyLlxuXHQgKlxuXHQgKiBUaGUgY29uZmlybWF0aW9uIGlzIG5lZWRlZCBpbiBvcmRlciB0byBsZXQgUEhQIGtub3dcblx0ICogdGhhdCBhbGwgdGhlIGNodW5rcyBoYXZlIGJlZW4gdXBsb2FkZWQuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjYuMlxuXHQgKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gZHogRHJvcHpvbmUgb2JqZWN0LlxuXHQgKlxuXHQgKiBAcmV0dXJucyB7RnVuY3Rpb259IEhhbmRsZXIgZnVuY3Rpb24uXG5cdCAqL1xuXHRmdW5jdGlvbiBjb25maXJtQ2h1bmtzRmluaXNoVXBsb2FkKCBkeiApIHtcblxuXHRcdHJldHVybiBmdW5jdGlvbiBjb25maXJtKCBmaWxlICkge1xuXG5cdFx0XHRpZiAoICEgZmlsZS5yZXRyaWVzICkge1xuXHRcdFx0XHRmaWxlLnJldHJpZXMgPSAwO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoICdlcnJvcicgPT09IGZpbGUuc3RhdHVzICkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdC8qKlxuXHRcdFx0ICogUmV0cnkgZmluYWxpemUgZnVuY3Rpb24uXG5cdFx0XHQgKlxuXHRcdFx0ICogQHNpbmNlIDEuNi4yXG5cdFx0XHQgKi9cblx0XHRcdGZ1bmN0aW9uIHJldHJ5KCkge1xuXHRcdFx0XHRmaWxlLnJldHJpZXMrKztcblxuXHRcdFx0XHRpZiAoIGZpbGUucmV0cmllcyA9PT0gMyApIHtcblx0XHRcdFx0XHRhZGRFcnJvck1lc3NhZ2UoIGZpbGUsIHdpbmRvdy53cGZvcm1zX2ZpbGVfdXBsb2FkLmVycm9ycy5maWxlX25vdF91cGxvYWRlZCApO1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHNldFRpbWVvdXQoIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdGNvbmZpcm0oIGZpbGUgKTtcblx0XHRcdFx0fSwgNTAwMCAqIGZpbGUucmV0cmllcyApO1xuXHRcdFx0fVxuXG5cdFx0XHQvKipcblx0XHRcdCAqIEZhaWwgaGFuZGxlciBmb3IgYWpheCByZXF1ZXN0LlxuXHRcdFx0ICpcblx0XHRcdCAqIEBzaW5jZSAxLjYuMlxuXHRcdFx0ICpcblx0XHRcdCAqIEBwYXJhbSB7b2JqZWN0fSByZXNwb25zZSBSZXNwb25zZSBmcm9tIHRoZSBzZXJ2ZXJcblx0XHRcdCAqL1xuXHRcdFx0ZnVuY3Rpb24gZmFpbCggcmVzcG9uc2UgKSB7XG5cblx0XHRcdFx0dmFyIGhhc1NwZWNpZmljRXJyb3IgPVx0cmVzcG9uc2UucmVzcG9uc2VKU09OICYmXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHJlc3BvbnNlLnJlc3BvbnNlSlNPTi5zdWNjZXNzID09PSBmYWxzZSAmJlxuXHRcdFx0XHRcdFx0XHRcdFx0XHRyZXNwb25zZS5yZXNwb25zZUpTT04uZGF0YTtcblxuXHRcdFx0XHRpZiAoIGhhc1NwZWNpZmljRXJyb3IgKSB7XG5cdFx0XHRcdFx0YWRkRXJyb3JNZXNzYWdlKCBmaWxlLCByZXNwb25zZS5yZXNwb25zZUpTT04uZGF0YSApO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJldHJ5KCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0LyoqXG5cdFx0XHQgKiBIYW5kbGVyIGZvciBhamF4IHJlcXVlc3QuXG5cdFx0XHQgKlxuXHRcdFx0ICogQHNpbmNlIDEuNi4yXG5cdFx0XHQgKlxuXHRcdFx0ICogQHBhcmFtIHtvYmplY3R9IHJlc3BvbnNlIFJlc3BvbnNlIGZyb20gdGhlIHNlcnZlclxuXHRcdFx0ICovXG5cdFx0XHRmdW5jdGlvbiBjb21wbGV0ZSggcmVzcG9uc2UgKSB7XG5cblx0XHRcdFx0ZmlsZS5jaHVua1Jlc3BvbnNlID0gSlNPTi5zdHJpbmdpZnkoIHsgZGF0YTogcmVzcG9uc2UgfSApO1xuXHRcdFx0XHRkei5sb2FkaW5nID0gZHoubG9hZGluZyB8fCAwO1xuXHRcdFx0XHRkei5sb2FkaW5nLS07XG5cdFx0XHRcdGR6LmxvYWRpbmcgPSBNYXRoLm1heCggZHoubG9hZGluZywgMCApO1xuXG5cdFx0XHRcdHRvZ2dsZVN1Ym1pdCggZHogKTtcblx0XHRcdFx0dXBkYXRlSW5wdXRWYWx1ZSggZHogKTtcblx0XHRcdH1cblxuXHRcdFx0d3AuYWpheC5wb3N0KCBqUXVlcnkuZXh0ZW5kKFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0YWN0aW9uOiAnd3Bmb3Jtc19maWxlX2NodW5rc191cGxvYWRlZCcsXG5cdFx0XHRcdFx0Zm9ybV9pZDogZHouZGF0YVRyYW5zZmVyLmZvcm1JZCxcblx0XHRcdFx0XHRmaWVsZF9pZDogZHouZGF0YVRyYW5zZmVyLmZpZWxkSWQsXG5cdFx0XHRcdFx0bmFtZTogZmlsZS5uYW1lLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRkei5vcHRpb25zLnBhcmFtcy5jYWxsKCBkeiwgbnVsbCwgbnVsbCwge2ZpbGU6IGZpbGUsIGluZGV4OiAwfSApXG5cdFx0XHQpICkudGhlbiggY29tcGxldGUgKS5mYWlsKCBmYWlsICk7XG5cblx0XHRcdC8vIE1vdmUgdG8gdXBsb2FkIHRoZSBuZXh0IGZpbGUsIGlmIGFueS5cblx0XHRcdGR6LnByb2Nlc3NRdWV1ZSgpO1xuXHRcdH07XG5cdH1cblxuXHQvKipcblx0ICogVG9nZ2xlIHNob3dpbmcgZW1wdHkgbWVzc2FnZS5cblx0ICpcblx0ICogQHNpbmNlIDEuNS42XG5cdCAqXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBkeiBEcm9wem9uZSBvYmplY3QuXG5cdCAqL1xuXHRmdW5jdGlvbiB0b2dnbGVNZXNzYWdlKCBkeiApIHtcblxuXHRcdHNldFRpbWVvdXQoIGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIHZhbGlkRmlsZXMgPSBkei5maWxlcy5maWx0ZXIoIGZ1bmN0aW9uKCBmaWxlICkge1xuXHRcdFx0XHRyZXR1cm4gZmlsZS5hY2NlcHRlZDtcblx0XHRcdH0gKTtcblxuXHRcdFx0aWYgKCB2YWxpZEZpbGVzLmxlbmd0aCA+PSBkei5vcHRpb25zLm1heEZpbGVzICkge1xuXHRcdFx0XHRkei5lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoICcuZHotbWVzc2FnZScgKS5jbGFzc0xpc3QuYWRkKCAnaGlkZScgKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGR6LmVsZW1lbnQucXVlcnlTZWxlY3RvciggJy5kei1tZXNzYWdlJyApLmNsYXNzTGlzdC5yZW1vdmUoICdoaWRlJyApO1xuXHRcdFx0fVxuXHRcdH0sIDAgKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBUb2dnbGUgZXJyb3IgbWVzc2FnZSBpZiB0b3RhbCBzaXplIG1vcmUgdGhhbiBsaW1pdC5cblx0ICogUnVucyBmb3IgZWFjaCBmaWxlLlxuXHQgKlxuXHQgKiBAc2luY2UgMS41LjZcblx0ICpcblx0ICogQHBhcmFtIHtvYmplY3R9IGZpbGUgQ3VycmVudCBmaWxlLlxuXHQgKiBAcGFyYW0ge29iamVjdH0gZHogICBEcm9wem9uZSBvYmplY3QuXG5cdCAqL1xuXHRmdW5jdGlvbiB2YWxpZGF0ZVBvc3RNYXhTaXplRXJyb3IoIGZpbGUsIGR6ICkge1xuXG5cdFx0c2V0VGltZW91dCggZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAoIGZpbGUuc2l6ZSA+PSBkei5kYXRhVHJhbnNmZXIucG9zdE1heFNpemUgKSB7XG5cdFx0XHRcdHZhciBlcnJvck1lc3NhZ2UgPSB3aW5kb3cud3Bmb3Jtc19maWxlX3VwbG9hZC5lcnJvcnMucG9zdF9tYXhfc2l6ZTtcblx0XHRcdFx0aWYgKCAhIGZpbGUuaXNFcnJvck5vdFVwbG9hZGVkRGlzcGxheWVkICkge1xuXHRcdFx0XHRcdGZpbGUuaXNFcnJvck5vdFVwbG9hZGVkRGlzcGxheWVkID0gdHJ1ZTtcblx0XHRcdFx0XHRlcnJvck1lc3NhZ2UgPSB3aW5kb3cud3Bmb3Jtc19maWxlX3VwbG9hZC5lcnJvcnMuZmlsZV9ub3RfdXBsb2FkZWQgKyAnICcgKyBlcnJvck1lc3NhZ2U7XG5cdFx0XHRcdFx0YWRkRXJyb3JNZXNzYWdlKCBmaWxlLCBlcnJvck1lc3NhZ2UgKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0sIDEgKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBTdGFydCBGaWxlIFVwbG9hZC5cblx0ICpcblx0ICogVGhpcyB3b3VsZCBkbyB0aGUgaW5pdGlhbCByZXF1ZXN0IHRvIHN0YXJ0IGEgZmlsZSB1cGxvYWQuIE5vIGNodW5rXG5cdCAqIGlzIHVwbG9hZGVkIGF0IHRoaXMgc3RhZ2UsIGluc3RlYWQgYWxsIHRoZSBpbmZvcm1hdGlvbiByZWxhdGVkIHRvIHRoZVxuXHQgKiBmaWxlIGFyZSBzZW5kIHRvIHRoZSBzZXJ2ZXIgd2FpdGluZyBmb3IgYW4gYXV0aG9yaXphdGlvbi5cblx0ICpcblx0ICogSWYgdGhlIHNlcnZlciBhdXRob3JpemVzIHRoZSBjbGllbnQgd291bGQgc3RhcnQgdXBsb2FkaW5nIHRoZSBjaHVua3MuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjYuMlxuXHQgKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gZHogICBEcm9wem9uZSBvYmplY3QuXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBmaWxlIEN1cnJlbnQgZmlsZS5cblx0ICovXG5cdGZ1bmN0aW9uIGluaXRGaWxlVXBsb2FkKCBkeiwgZmlsZSApIHtcblxuXHRcdHdwLmFqYXgucG9zdCggalF1ZXJ5LmV4dGVuZChcblx0XHRcdHtcblx0XHRcdFx0YWN0aW9uIDogJ3dwZm9ybXNfdXBsb2FkX2NodW5rX2luaXQnLFxuXHRcdFx0XHRmb3JtX2lkOiBkei5kYXRhVHJhbnNmZXIuZm9ybUlkLFxuXHRcdFx0XHRmaWVsZF9pZDogZHouZGF0YVRyYW5zZmVyLmZpZWxkSWQsXG5cdFx0XHRcdG5hbWU6IGZpbGUubmFtZSxcblx0XHRcdFx0c2xvdzogaXNTbG93LFxuXHRcdFx0fSxcblx0XHRcdGR6Lm9wdGlvbnMucGFyYW1zLmNhbGwoIGR6LCBudWxsLCBudWxsLCB7ZmlsZTogZmlsZSwgaW5kZXg6IDB9IClcblx0XHQpICkudGhlbiggZnVuY3Rpb24oIHJlc3BvbnNlICkge1xuXG5cdFx0XHQvLyBGaWxlIHVwbG9hZCBoYXMgYmVlbiBhdXRob3JpemVkLlxuXG5cdFx0XHRmb3IgKCB2YXIga2V5IGluIHJlc3BvbnNlICkge1xuXHRcdFx0XHRkei5vcHRpb25zWyBrZXkgXSA9IHJlc3BvbnNlWyBrZXkgXTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCByZXNwb25zZS5kemNodW5rc2l6ZSApIHtcblx0XHRcdFx0ZHoub3B0aW9ucy5jaHVua1NpemUgPSBwYXJzZUludCggcmVzcG9uc2UuZHpjaHVua3NpemUsIDEwICk7XG5cdFx0XHRcdGZpbGUudXBsb2FkLnRvdGFsQ2h1bmtDb3VudCA9IE1hdGguY2VpbCggZmlsZS5zaXplIC8gZHoub3B0aW9ucy5jaHVua1NpemUgKTtcblx0XHRcdH1cblxuXHRcdFx0ZHoucHJvY2Vzc1F1ZXVlKCk7XG5cdFx0fSApLmZhaWwoIGZ1bmN0aW9uKCByZXNwb25zZSApIHtcblxuXHRcdFx0ZmlsZS5zdGF0dXMgPSAnZXJyb3InO1xuXG5cdFx0XHRpZiAoICEgZmlsZS54aHIgKSB7XG5cdFx0XHRcdHZhciBlcnJvck1lc3NhZ2UgPSB3aW5kb3cud3Bmb3Jtc19maWxlX3VwbG9hZC5lcnJvcnMuZmlsZV9ub3RfdXBsb2FkZWQgKyAnICcgKyB3aW5kb3cud3Bmb3Jtc19maWxlX3VwbG9hZC5lcnJvcnMuZGVmYXVsdF9lcnJvcjtcblxuXHRcdFx0XHRmaWxlLnByZXZpZXdFbGVtZW50LmNsYXNzTGlzdC5hZGQoICdkei1wcm9jZXNzaW5nJywgJ2R6LWVycm9yJywgJ2R6LWNvbXBsZXRlJyApO1xuXHRcdFx0XHRmaWxlLnByZXZpZXdFbGVtZW50LmNsb3Nlc3QoICcud3Bmb3Jtcy1maWVsZCcgKS5jbGFzc0xpc3QuYWRkKCAnd3Bmb3Jtcy1oYXMtZXJyb3InICk7XG5cdFx0XHRcdGFkZEVycm9yTWVzc2FnZSggZmlsZSwgZXJyb3JNZXNzYWdlICk7XG5cdFx0XHR9XG5cblx0XHRcdGR6LnByb2Nlc3NRdWV1ZSgpO1xuXHRcdH0gKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBWYWxpZGF0ZSB0aGUgZmlsZSB3aGVuIGl0IHdhcyBhZGRlZCBpbiB0aGUgZHJvcHpvbmUuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjUuNlxuXHQgKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gZHogRHJvcHpvbmUgb2JqZWN0LlxuXHQgKlxuXHQgKiBAcmV0dXJucyB7RnVuY3Rpb259IEhhbmRsZXIgZnVuY3Rpb24uXG5cdCAqL1xuXHRmdW5jdGlvbiBhZGRlZEZpbGUoIGR6ICkge1xuXG5cdFx0cmV0dXJuIGZ1bmN0aW9uKCBmaWxlICkge1xuXG5cdFx0XHRpZiAoIGZpbGUuc2l6ZSA+PSBkei5kYXRhVHJhbnNmZXIucG9zdE1heFNpemUgKSB7XG5cdFx0XHRcdHZhbGlkYXRlUG9zdE1heFNpemVFcnJvciggZmlsZSwgZHogKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHNwZWVkVGVzdCggZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0aW5pdEZpbGVVcGxvYWQoIGR6LCBmaWxlICk7XG5cdFx0XHRcdH0gKTtcblx0XHRcdH1cblxuXHRcdFx0ZHoubG9hZGluZyA9IGR6LmxvYWRpbmcgfHwgMDtcblx0XHRcdGR6LmxvYWRpbmcrKztcblx0XHRcdHRvZ2dsZVN1Ym1pdCggZHogKTtcblxuXHRcdFx0dG9nZ2xlTWVzc2FnZSggZHogKTtcblx0XHR9O1xuXHR9XG5cblx0LyoqXG5cdCAqIFNlbmQgYW4gQUpBWCByZXF1ZXN0IHRvIHJlbW92ZSBmaWxlIGZyb20gdGhlIHNlcnZlci5cblx0ICpcblx0ICogQHNpbmNlIDEuNS42XG5cdCAqXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBmaWxlIEZpbGUgbmFtZS5cblx0ICogQHBhcmFtIHtvYmplY3R9IGR6IERyb3B6b25lIG9iamVjdC5cblx0ICovXG5cdGZ1bmN0aW9uIHJlbW92ZUZyb21TZXJ2ZXIoIGZpbGUsIGR6ICkge1xuXG5cdFx0d3AuYWpheC5wb3N0KCB7XG5cdFx0XHRhY3Rpb246ICd3cGZvcm1zX3JlbW92ZV9maWxlJyxcblx0XHRcdGZpbGU6IGZpbGUsXG5cdFx0XHRmb3JtX2lkOiBkei5kYXRhVHJhbnNmZXIuZm9ybUlkLFxuXHRcdFx0ZmllbGRfaWQ6IGR6LmRhdGFUcmFuc2Zlci5maWVsZElkLFxuXHRcdH0gKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBJbml0IHRoZSBmaWxlIHJlbW92YWwgb24gc2VydmVyIHdoZW4gdXNlciByZW1vdmVkIGl0IG9uIGZyb250LWVuZC5cblx0ICpcblx0ICogQHNpbmNlIDEuNS42XG5cdCAqXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBkeiBEcm9wem9uZSBvYmplY3QuXG5cdCAqXG5cdCAqIEByZXR1cm5zIHtGdW5jdGlvbn0gSGFuZGxlciBmdW5jdGlvbi5cblx0ICovXG5cdGZ1bmN0aW9uIHJlbW92ZWRGaWxlKCBkeiApIHtcblxuXHRcdHJldHVybiBmdW5jdGlvbiggZmlsZSApIHtcblx0XHRcdHRvZ2dsZU1lc3NhZ2UoIGR6ICk7XG5cblx0XHRcdHZhciBqc29uID0gZmlsZS5jaHVua1Jlc3BvbnNlIHx8ICggZmlsZS54aHIgfHwge30gKS5yZXNwb25zZVRleHQ7XG5cblx0XHRcdGlmICgganNvbiApIHtcblx0XHRcdFx0dmFyIG9iamVjdCA9IHBhcnNlSlNPTigganNvbiApO1xuXG5cdFx0XHRcdGlmICggb2JqZWN0ICYmIG9iamVjdC5kYXRhICYmIG9iamVjdC5kYXRhLmZpbGUgKSB7XG5cdFx0XHRcdFx0cmVtb3ZlRnJvbVNlcnZlciggb2JqZWN0LmRhdGEuZmlsZSwgZHogKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQvLyBSZW1vdmUgc3VibWl0dGVkIHZhbHVlLlxuXHRcdFx0aWYgKCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoIGZpbGUsICdpc0RlZmF1bHQnICkgJiYgZmlsZS5pc0RlZmF1bHQgKSB7XG5cdFx0XHRcdHN1Ym1pdHRlZFZhbHVlc1sgZHouZGF0YVRyYW5zZmVyLmZvcm1JZCBdWyBkei5kYXRhVHJhbnNmZXIuZmllbGRJZCBdLnNwbGljZSggZmlsZS5pbmRleCwgMSApO1xuXHRcdFx0XHRkei5vcHRpb25zLm1heEZpbGVzKys7XG5cdFx0XHRcdHJlbW92ZUZyb21TZXJ2ZXIoIGZpbGUuZmlsZSwgZHogKTtcblx0XHRcdH1cblxuXHRcdFx0dXBkYXRlSW5wdXRWYWx1ZSggZHogKTtcblxuXHRcdFx0ZHoubG9hZGluZyA9IGR6LmxvYWRpbmcgfHwgMDtcblx0XHRcdGR6LmxvYWRpbmctLTtcblx0XHRcdGR6LmxvYWRpbmcgPSBNYXRoLm1heCggZHoubG9hZGluZywgMCApO1xuXG5cdFx0XHR0b2dnbGVTdWJtaXQoIGR6ICk7XG5cdFx0fTtcblx0fVxuXG5cdC8qKlxuXHQgKiBQcm9jZXNzIGFueSBlcnJvciB0aGF0IHdhcyBmaXJlZCBwZXIgZWFjaCBmaWxlLlxuXHQgKiBUaGVyZSBtaWdodCBiZSBzZXZlcmFsIGVycm9ycyBwZXIgZmlsZSwgaW4gdGhhdCBjYXNlIC0gZGlzcGxheSBcIm5vdCB1cGxvYWRlZFwiIHRleHQgb25seSBvbmNlLlxuXHQgKlxuXHQgKiBAc2luY2UgMS41LjYuMVxuXHQgKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gZHogRHJvcHpvbmUgb2JqZWN0LlxuXHQgKlxuXHQgKiBAcmV0dXJucyB7RnVuY3Rpb259IEhhbmRsZXIgZnVuY3Rpb24uXG5cdCAqL1xuXHRmdW5jdGlvbiBlcnJvciggZHogKSB7XG5cblx0XHRyZXR1cm4gZnVuY3Rpb24oIGZpbGUsIGVycm9yTWVzc2FnZSApIHtcblxuXHRcdFx0aWYgKCBmaWxlLmlzRXJyb3JOb3RVcGxvYWRlZERpc3BsYXllZCApIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIHR5cGVvZiBlcnJvck1lc3NhZ2UgPT09ICdvYmplY3QnICkge1xuXHRcdFx0XHRlcnJvck1lc3NhZ2UgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoIGVycm9yTWVzc2FnZSwgJ2RhdGEnICkgJiYgdHlwZW9mIGVycm9yTWVzc2FnZS5kYXRhID09PSAnc3RyaW5nJyA/IGVycm9yTWVzc2FnZS5kYXRhIDogJyc7XG5cdFx0XHR9XG5cblx0XHRcdGVycm9yTWVzc2FnZSA9IGVycm9yTWVzc2FnZSAhPT0gJzAnID8gZXJyb3JNZXNzYWdlIDogJyc7XG5cblx0XHRcdGZpbGUuaXNFcnJvck5vdFVwbG9hZGVkRGlzcGxheWVkID0gdHJ1ZTtcblx0XHRcdGZpbGUucHJldmlld0VsZW1lbnQucXVlcnlTZWxlY3RvckFsbCggJ1tkYXRhLWR6LWVycm9ybWVzc2FnZV0nIClbMF0udGV4dENvbnRlbnQgPSB3aW5kb3cud3Bmb3Jtc19maWxlX3VwbG9hZC5lcnJvcnMuZmlsZV9ub3RfdXBsb2FkZWQgKyAnICcgKyBlcnJvck1lc3NhZ2U7XG5cdFx0fTtcblx0fVxuXG5cdC8qKlxuXHQgKiBQcmVzZXQgcHJldmlvdXNseSBzdWJtaXR0ZWQgZmlsZXMgdG8gdGhlIGRyb3B6b25lLlxuXHQgKlxuXHQgKiBAc2luY2UgMS43LjFcblx0ICpcblx0ICogQHBhcmFtIHtvYmplY3R9IGR6IERyb3B6b25lIG9iamVjdC5cblx0ICovXG5cdGZ1bmN0aW9uIHByZXNldFN1Ym1pdHRlZERhdGEoIGR6ICkge1xuXG5cdFx0dmFyIGZpbGVzID0gcGFyc2VKU09OKCBnZXRJbnB1dCggZHogKS52YWwoKSApO1xuXG5cdFx0aWYgKCAhIGZpbGVzIHx8ICEgZmlsZXMubGVuZ3RoICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHN1Ym1pdHRlZFZhbHVlc1tkei5kYXRhVHJhbnNmZXIuZm9ybUlkXSA9IFtdO1xuXG5cdFx0Ly8gV2UgZG8gZGVlcCBjbG9uaW5nIGFuIG9iamVjdCB0byBiZSBzdXJlIHRoYXQgZGF0YSBpcyBwYXNzZWQgd2l0aG91dCBsaW5rcy5cblx0XHRzdWJtaXR0ZWRWYWx1ZXNbZHouZGF0YVRyYW5zZmVyLmZvcm1JZF1bZHouZGF0YVRyYW5zZmVyLmZpZWxkSWRdID0gSlNPTi5wYXJzZSggSlNPTi5zdHJpbmdpZnkoIGZpbGVzICkgKTtcblxuXHRcdGZpbGVzLmZvckVhY2goIGZ1bmN0aW9uKCBmaWxlLCBpbmRleCApIHtcblxuXHRcdFx0ZmlsZS5pc0RlZmF1bHQgPSB0cnVlO1xuXHRcdFx0ZmlsZS5pbmRleCA9IGluZGV4O1xuXG5cdFx0XHRpZiAoIGZpbGUudHlwZS5tYXRjaCggL2ltYWdlLiovICkgKSB7XG5cdFx0XHRcdGR6LmRpc3BsYXlFeGlzdGluZ0ZpbGUoIGZpbGUsIGZpbGUudXJsICk7XG5cblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRkei5lbWl0KCAnYWRkZWRmaWxlJywgZmlsZSApO1xuXHRcdFx0ZHouZW1pdCggJ2NvbXBsZXRlJywgZmlsZSApO1xuXHRcdH0gKTtcblxuXHRcdGR6Lm9wdGlvbnMubWF4RmlsZXMgPSBkei5vcHRpb25zLm1heEZpbGVzIC0gZmlsZXMubGVuZ3RoO1xuXHR9XG5cblx0LyoqXG5cdCAqIERyb3B6b25lLmpzIGluaXQgZm9yIGVhY2ggZmllbGQuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjUuNlxuXHQgKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gJGVsIFdQRm9ybXMgdXBsb2FkZXIgRE9NIGVsZW1lbnQuXG5cdCAqXG5cdCAqIEByZXR1cm5zIHtvYmplY3R9IERyb3B6b25lIG9iamVjdC5cblx0ICovXG5cdGZ1bmN0aW9uIGRyb3Bab25lSW5pdCggJGVsICkge1xuXG5cdFx0aWYgKCAkZWwuZHJvcHpvbmUgKSB7XG5cdFx0XHRyZXR1cm4gJGVsLmRyb3B6b25lO1xuXHRcdH1cblxuXHRcdHZhciBmb3JtSWQgPSBwYXJzZUludCggJGVsLmRhdGFzZXQuZm9ybUlkLCAxMCApO1xuXHRcdHZhciBmaWVsZElkID0gcGFyc2VJbnQoICRlbC5kYXRhc2V0LmZpZWxkSWQsIDEwICkgfHwgMDtcblx0XHR2YXIgbWF4RmlsZXMgPSBwYXJzZUludCggJGVsLmRhdGFzZXQubWF4RmlsZU51bWJlciwgMTAgKTtcblxuXHRcdHZhciBhY2NlcHRlZEZpbGVzID0gJGVsLmRhdGFzZXQuZXh0ZW5zaW9ucy5zcGxpdCggJywnICkubWFwKCBmdW5jdGlvbiggZWwgKSB7XG5cdFx0XHRyZXR1cm4gJy4nICsgZWw7XG5cdFx0fSApLmpvaW4oICcsJyApO1xuXG5cdFx0Ly8gQ29uZmlndXJlIGFuZCBtb2RpZnkgRHJvcHpvbmUgbGlicmFyeS5cblx0XHR2YXIgZHogPSBuZXcgd2luZG93LkRyb3B6b25lKCAkZWwsIHtcblx0XHRcdHVybDogd2luZG93LndwZm9ybXNfZmlsZV91cGxvYWQudXJsLFxuXHRcdFx0YWRkUmVtb3ZlTGlua3M6IHRydWUsXG5cdFx0XHRjaHVua2luZzogdHJ1ZSxcblx0XHRcdGZvcmNlQ2h1bmtpbmc6IHRydWUsXG5cdFx0XHRyZXRyeUNodW5rczogdHJ1ZSxcblx0XHRcdGNodW5rU2l6ZTogcGFyc2VJbnQoICRlbC5kYXRhc2V0LmZpbGVDaHVua1NpemUsIDEwICksXG5cdFx0XHRwYXJhbU5hbWU6ICRlbC5kYXRhc2V0LmlucHV0TmFtZSxcblx0XHRcdHBhcmFsbGVsQ2h1bmtVcGxvYWRzOiAhISAoICRlbC5kYXRhc2V0LnBhcmFsbGVsVXBsb2FkcyB8fCAnJyApLm1hdGNoKCAvXnRydWUkL2kgKSxcblx0XHRcdHBhcmFsbGVsVXBsb2FkczogcGFyc2VJbnQoICRlbC5kYXRhc2V0Lm1heFBhcmFsbGVsVXBsb2FkcywgMTAgKSxcblx0XHRcdGF1dG9Qcm9jZXNzUXVldWU6IGZhbHNlLFxuXHRcdFx0bWF4RmlsZXNpemU6ICggcGFyc2VJbnQoICRlbC5kYXRhc2V0Lm1heFNpemUsIDEwICkgLyAoIDEwMjQgKiAxMDI0ICkgKS50b0ZpeGVkKCAyICksXG5cdFx0XHRtYXhGaWxlczogbWF4RmlsZXMsXG5cdFx0XHRhY2NlcHRlZEZpbGVzOiBhY2NlcHRlZEZpbGVzLFxuXHRcdFx0ZGljdE1heEZpbGVzRXhjZWVkZWQ6IHdpbmRvdy53cGZvcm1zX2ZpbGVfdXBsb2FkLmVycm9ycy5maWxlX2xpbWl0LnJlcGxhY2UoICd7ZmlsZUxpbWl0fScsIG1heEZpbGVzICksXG5cdFx0XHRkaWN0SW52YWxpZEZpbGVUeXBlOiB3aW5kb3cud3Bmb3Jtc19maWxlX3VwbG9hZC5lcnJvcnMuZmlsZV9leHRlbnNpb24sXG5cdFx0XHRkaWN0RmlsZVRvb0JpZzogd2luZG93LndwZm9ybXNfZmlsZV91cGxvYWQuZXJyb3JzLmZpbGVfc2l6ZSxcblx0XHR9ICk7XG5cblx0XHQvLyBDdXN0b20gdmFyaWFibGVzLlxuXHRcdGR6LmRhdGFUcmFuc2ZlciA9IHtcblx0XHRcdHBvc3RNYXhTaXplOiAkZWwuZGF0YXNldC5tYXhTaXplLFxuXHRcdFx0bmFtZTogJGVsLmRhdGFzZXQuaW5wdXROYW1lLFxuXHRcdFx0Zm9ybUlkOiBmb3JtSWQsXG5cdFx0XHRmaWVsZElkOiBmaWVsZElkLFxuXHRcdH07XG5cblx0XHRwcmVzZXRTdWJtaXR0ZWREYXRhKCBkeiApO1xuXG5cdFx0Ly8gUHJvY2VzcyBldmVudHMuXG5cdFx0ZHoub24oICdzZW5kaW5nJywgc2VuZGluZyggZHosIHtcblx0XHRcdGFjdGlvbjogJ3dwZm9ybXNfdXBsb2FkX2NodW5rJyxcblx0XHRcdGZvcm1faWQ6IGZvcm1JZCxcblx0XHRcdGZpZWxkX2lkOiBmaWVsZElkLFxuXHRcdH0gKSApO1xuXHRcdGR6Lm9uKCAnYWRkZWRmaWxlJywgYWRkZWRGaWxlKCBkeiApICk7XG5cdFx0ZHoub24oICdyZW1vdmVkZmlsZScsIHJlbW92ZWRGaWxlKCBkeiApICk7XG5cdFx0ZHoub24oICdjb21wbGV0ZScsIGNvbmZpcm1DaHVua3NGaW5pc2hVcGxvYWQoIGR6ICkgKTtcblx0XHRkei5vbiggJ2Vycm9yJywgZXJyb3IoIGR6ICkgKTtcblxuXHRcdHJldHVybiBkejtcblx0fVxuXG5cdC8qKlxuXHQgKiBIaWRkZW4gRHJvcHpvbmUgaW5wdXQgZm9jdXMgZXZlbnQgaGFuZGxlci5cblx0ICpcblx0ICogQHNpbmNlIDEuOC4xXG5cdCAqL1xuXHRmdW5jdGlvbiBkcm9wem9uZUlucHV0Rm9jdXMoKSB7XG5cblx0XHQkKCB0aGlzICkucHJldiggJy53cGZvcm1zLXVwbG9hZGVyJyApLmFkZENsYXNzKCAnd3Bmb3Jtcy1mb2N1cycgKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBIaWRkZW4gRHJvcHpvbmUgaW5wdXQgYmx1ciBldmVudCBoYW5kbGVyLlxuXHQgKlxuXHQgKiBAc2luY2UgMS44LjFcblx0ICovXG5cdGZ1bmN0aW9uIGRyb3B6b25lSW5wdXRCbHVyKCkge1xuXG5cdFx0JCggdGhpcyApLnByZXYoICcud3Bmb3Jtcy11cGxvYWRlcicgKS5yZW1vdmVDbGFzcyggJ3dwZm9ybXMtZm9jdXMnICk7XG5cdH1cblxuXHQvKipcblx0ICogSGlkZGVuIERyb3B6b25lIGlucHV0IGJsdXIgZXZlbnQgaGFuZGxlci5cblx0ICpcblx0ICogQHNpbmNlIDEuOC4xXG5cdCAqXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBlIEV2ZW50IG9iamVjdC5cblx0ICovXG5cdGZ1bmN0aW9uIGRyb3B6b25lSW5wdXRLZXlwcmVzcyggZSApIHtcblxuXHRcdGUucHJldmVudERlZmF1bHQoKTtcblxuXHRcdGlmICggZS5rZXlDb2RlICE9PSAxMyApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQkKCB0aGlzICkucHJldiggJy53cGZvcm1zLXVwbG9hZGVyJyApLnRyaWdnZXIoICdjbGljaycgKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBIaWRkZW4gRHJvcHpvbmUgaW5wdXQgYmx1ciBldmVudCBoYW5kbGVyLlxuXHQgKlxuXHQgKiBAc2luY2UgMS44LjFcblx0ICovXG5cdGZ1bmN0aW9uIGRyb3B6b25lQ2xpY2soKSB7XG5cblx0XHQkKCB0aGlzICkubmV4dCggJy5kcm9wem9uZS1pbnB1dCcgKS50cmlnZ2VyKCAnZm9jdXMnICk7XG5cdH1cblxuXHQvKipcblx0ICogRXZlbnRzLlxuXHQgKlxuXHQgKiBAc2luY2UgMS44LjFcblx0ICovXG5cdGZ1bmN0aW9uIGV2ZW50cygpIHtcblxuXHRcdCQoICcuZHJvcHpvbmUtaW5wdXQnIClcblx0XHRcdC5vbiggJ2ZvY3VzJywgZHJvcHpvbmVJbnB1dEZvY3VzIClcblx0XHRcdC5vbiggJ2JsdXInLCBkcm9wem9uZUlucHV0Qmx1ciApXG5cdFx0XHQub24oICdrZXlwcmVzcycsIGRyb3B6b25lSW5wdXRLZXlwcmVzcyApO1xuXG5cdFx0JCggJy53cGZvcm1zLXVwbG9hZGVyJyApXG5cdFx0XHQub24oICdjbGljaycsIGRyb3B6b25lQ2xpY2sgKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBET01Db250ZW50TG9hZGVkIGhhbmRsZXIuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjUuNlxuXHQgKi9cblx0ZnVuY3Rpb24gcmVhZHkoKSB7XG5cblx0XHR3aW5kb3cud3Bmb3JtcyA9IHdpbmRvdy53cGZvcm1zIHx8IHt9O1xuXHRcdHdpbmRvdy53cGZvcm1zLmRyb3B6b25lcyA9IFtdLnNsaWNlLmNhbGwoIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoICcud3Bmb3Jtcy11cGxvYWRlcicgKSApLm1hcCggZHJvcFpvbmVJbml0ICk7XG5cblx0XHRldmVudHMoKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBNb2Rlcm4gRmlsZSBVcGxvYWQgZW5naW5lLlxuXHQgKlxuXHQgKiBAc2luY2UgMS42LjBcblx0ICovXG5cdHZhciB3cGZvcm1zTW9kZXJuRmlsZVVwbG9hZCA9IHtcblxuXHRcdC8qKlxuXHRcdCAqIFN0YXJ0IHRoZSBpbml0aWFsaXphdGlvbi5cblx0XHQgKlxuXHRcdCAqIEBzaW5jZSAxLjYuMFxuXHRcdCAqL1xuXHRcdGluaXQ6IGZ1bmN0aW9uKCkge1xuXG5cdFx0XHRpZiAoIGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdsb2FkaW5nJyApIHtcblx0XHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lciggJ0RPTUNvbnRlbnRMb2FkZWQnLCByZWFkeSApO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmVhZHkoKTtcblx0XHRcdH1cblx0XHR9LFxuXHR9O1xuXG5cdC8vIENhbGwgaW5pdCBhbmQgc2F2ZSBpbiBnbG9iYWwgdmFyaWFibGUuXG5cdHdwZm9ybXNNb2Rlcm5GaWxlVXBsb2FkLmluaXQoKTtcblx0d2luZG93LndwZm9ybXNNb2Rlcm5GaWxlVXBsb2FkID0gd3Bmb3Jtc01vZGVybkZpbGVVcGxvYWQ7XG5cbn0oIGpRdWVyeSApICk7XG4iXSwibWFwcGluZ3MiOiJBQUFBLFlBQVk7O0FBQUM7QUFFWCxXQUFVQSxDQUFDLEVBQUc7RUFFZjtBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNDLElBQUlDLE1BQU0sR0FBRyxJQUFJOztFQUVqQjtBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNDLElBQUlDLGVBQWUsR0FBRyxFQUFFOztFQUV4QjtBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNDLElBQUlDLGlCQUFpQixHQUFHO0lBQ3ZCQyxPQUFPLEVBQUUsSUFBSTtJQUFFO0lBQ2ZDLFdBQVcsRUFBRSxHQUFHLEdBQUcsSUFBSSxDQUFFO0VBQzFCLENBQUM7O0VBRUQ7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNB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
},{}]},{},[1])