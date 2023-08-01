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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfdHlwZW9mIiwib2JqIiwiU3ltYm9sIiwiaXRlcmF0b3IiLCJjb25zdHJ1Y3RvciIsInByb3RvdHlwZSIsIiQiLCJpc1Nsb3ciLCJzdWJtaXR0ZWRWYWx1ZXMiLCJzcGVlZFRlc3RTZXR0aW5ncyIsIm1heFRpbWUiLCJwYXlsb2FkU2l6ZSIsImdldFBheWxvYWQiLCJkYXRhIiwiaSIsIlN0cmluZyIsImZyb21DaGFyQ29kZSIsIk1hdGgiLCJyb3VuZCIsInJhbmRvbSIsInNwZWVkVGVzdCIsIm5leHQiLCJzZXRUaW1lb3V0Iiwic3RhcnQiLCJEYXRlIiwid3AiLCJhamF4IiwicG9zdCIsImFjdGlvbiIsInRoZW4iLCJkZWx0YSIsImZhaWwiLCJ0b2dnbGVMb2FkaW5nTWVzc2FnZSIsIiRmb3JtIiwiZmluZCIsImxlbmd0aCIsImJlZm9yZSIsImNvbmNhdCIsIndpbmRvdyIsIndwZm9ybXNfZmlsZV91cGxvYWQiLCJsb2FkaW5nX21lc3NhZ2UiLCJ1cGxvYWRJblByb2dyZXNzIiwiZHoiLCJsb2FkaW5nIiwiZ2V0RmlsZXNXaXRoU3RhdHVzIiwiYW55VXBsb2Fkc0luUHJvZ3Jlc3MiLCJ3cGZvcm1zIiwiZHJvcHpvbmVzIiwic29tZSIsInRvZ2dsZVN1Ym1pdCIsImpRdWVyeSIsImVsZW1lbnQiLCJjbG9zZXN0IiwiJGJ0biIsIiRidG5OZXh0IiwiaGFuZGxlciIsImRpc2FibGVkIiwiQm9vbGVhbiIsInByb3AiLCJhdHRyIiwicGFyZW50IiwiYWRkQ2xhc3MiLCJhcHBlbmQiLCJjc3MiLCJ3aWR0aCIsIm91dGVyV2lkdGgiLCJoZWlnaHQiLCJvdXRlckhlaWdodCIsIm9uIiwib2ZmIiwicmVtb3ZlIiwicmVtb3ZlQ2xhc3MiLCJwYXJzZUpTT04iLCJzdHIiLCJKU09OIiwicGFyc2UiLCJlIiwib25seVdpdGhMZW5ndGgiLCJlbCIsIm9ubHlQb3NpdGl2ZSIsImdldFhIUiIsImNodW5rUmVzcG9uc2UiLCJ4aHIiLCJnZXRSZXNwb25zZVRleHQiLCJyZXNwb25zZVRleHQiLCJnZXREYXRhIiwiZ2V0VmFsdWUiLCJmaWxlcyIsIm1hcCIsImZpbHRlciIsInNlbmRpbmciLCJmaWxlIiwiZm9ybURhdGEiLCJzaXplIiwiZGF0YVRyYW5zZmVyIiwicG9zdE1heFNpemUiLCJzZW5kIiwiYWNjZXB0ZWQiLCJwcm9jZXNzaW5nIiwic3RhdHVzIiwicHJldmlld0VsZW1lbnQiLCJjbGFzc0xpc3QiLCJhZGQiLCJPYmplY3QiLCJrZXlzIiwiZm9yRWFjaCIsImtleSIsImNvbnZlcnRGaWxlc1RvVmFsdWUiLCJmb3JtSWQiLCJmaWVsZElkIiwic3RyaW5naWZ5IiwicHVzaCIsImFwcGx5IiwiZ2V0SW5wdXQiLCJwYXJlbnRzIiwibmFtZSIsInVwZGF0ZUlucHV0VmFsdWUiLCIkaW5wdXQiLCJ2YWwiLCJ0cmlnZ2VyIiwiZm4iLCJ2YWxpZCIsImNvbXBsZXRlIiwibWF4IiwiYWRkRXJyb3JNZXNzYWdlIiwiZXJyb3JNZXNzYWdlIiwiaXNFcnJvck5vdFVwbG9hZGVkRGlzcGxheWVkIiwic3BhbiIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsImlubmVyVGV4dCIsInRvU3RyaW5nIiwic2V0QXR0cmlidXRlIiwicXVlcnlTZWxlY3RvciIsImFwcGVuZENoaWxkIiwiY29uZmlybUNodW5rc0ZpbmlzaFVwbG9hZCIsImNvbmZpcm0iLCJyZXRyaWVzIiwicmV0cnkiLCJlcnJvcnMiLCJmaWxlX25vdF91cGxvYWRlZCIsInJlc3BvbnNlIiwiaGFzU3BlY2lmaWNFcnJvciIsInJlc3BvbnNlSlNPTiIsInN1Y2Nlc3MiLCJleHRlbmQiLCJmb3JtX2lkIiwiZmllbGRfaWQiLCJvcHRpb25zIiwicGFyYW1zIiwiY2FsbCIsImluZGV4IiwicHJvY2Vzc1F1ZXVlIiwidG9nZ2xlTWVzc2FnZSIsInZhbGlkRmlsZXMiLCJtYXhGaWxlcyIsInZhbGlkYXRlUG9zdE1heFNpemVFcnJvciIsInBvc3RfbWF4X3NpemUiLCJpbml0RmlsZVVwbG9hZCIsInNsb3ciLCJkemNodW5rc2l6ZSIsImNodW5rU2l6ZSIsInBhcnNlSW50IiwidXBsb2FkIiwidG90YWxDaHVua0NvdW50IiwiY2VpbCIsImRlZmF1bHRfZXJyb3IiLCJhZGRlZEZpbGUiLCJyZW1vdmVGcm9tU2VydmVyIiwicmVtb3ZlZEZpbGUiLCJqc29uIiwib2JqZWN0IiwiaGFzT3duUHJvcGVydHkiLCJpc0RlZmF1bHQiLCJzcGxpY2UiLCJlcnJvciIsInF1ZXJ5U2VsZWN0b3JBbGwiLCJ0ZXh0Q29udGVudCIsInByZXNldFN1Ym1pdHRlZERhdGEiLCJ0eXBlIiwibWF0Y2giLCJkaXNwbGF5RXhpc3RpbmdGaWxlIiwidXJsIiwiZW1pdCIsImRyb3Bab25lSW5pdCIsIiRlbCIsImRyb3B6b25lIiwiZGF0YXNldCIsIm1heEZpbGVOdW1iZXIiLCJhY2NlcHRlZEZpbGVzIiwiZXh0ZW5zaW9ucyIsInNwbGl0Iiwiam9pbiIsIkRyb3B6b25lIiwiYWRkUmVtb3ZlTGlua3MiLCJjaHVua2luZyIsImZvcmNlQ2h1bmtpbmciLCJyZXRyeUNodW5rcyIsImZpbGVDaHVua1NpemUiLCJwYXJhbU5hbWUiLCJpbnB1dE5hbWUiLCJwYXJhbGxlbENodW5rVXBsb2FkcyIsInBhcmFsbGVsVXBsb2FkcyIsIm1heFBhcmFsbGVsVXBsb2FkcyIsImF1dG9Qcm9jZXNzUXVldWUiLCJtYXhGaWxlc2l6ZSIsIm1heFNpemUiLCJ0b0ZpeGVkIiwiZGljdE1heEZpbGVzRXhjZWVkZWQiLCJmaWxlX2xpbWl0IiwicmVwbGFjZSIsImRpY3RJbnZhbGlkRmlsZVR5cGUiLCJmaWxlX2V4dGVuc2lvbiIsImRpY3RGaWxlVG9vQmlnIiwiZmlsZV9zaXplIiwiZHJvcHpvbmVJbnB1dEZvY3VzIiwicHJldiIsImRyb3B6b25lSW5wdXRCbHVyIiwiZHJvcHpvbmVJbnB1dEtleXByZXNzIiwicHJldmVudERlZmF1bHQiLCJrZXlDb2RlIiwiZHJvcHpvbmVDbGljayIsImV2ZW50cyIsInJlYWR5Iiwic2xpY2UiLCJ3cGZvcm1zTW9kZXJuRmlsZVVwbG9hZCIsImluaXQiLCJyZWFkeVN0YXRlIiwiYWRkRXZlbnRMaXN0ZW5lciJdLCJzb3VyY2VzIjpbImZha2VfZjg3YzE0N2UuanMiXSwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG4oIGZ1bmN0aW9uKCAkICkge1xuXG5cdC8qKlxuXHQgKiBBbGwgY29ubmVjdGlvbnMgYXJlIHNsb3cgYnkgZGVmYXVsdC5cblx0ICpcblx0ICogQHNpbmNlIDEuNi4yXG5cdCAqXG5cdCAqIEB0eXBlIHtib29sZWFufG51bGx9XG5cdCAqL1xuXHR2YXIgaXNTbG93ID0gbnVsbDtcblxuXHQvKipcblx0ICogUHJldmlvdXNseSBzdWJtaXR0ZWQgZGF0YS5cblx0ICpcblx0ICogQHNpbmNlIDEuNy4xXG5cdCAqXG5cdCAqIEB0eXBlIHtBcnJheX1cblx0ICovXG5cdHZhciBzdWJtaXR0ZWRWYWx1ZXMgPSBbXTtcblxuXHQvKipcblx0ICogRGVmYXVsdCBzZXR0aW5ncyBmb3Igb3VyIHNwZWVkIHRlc3QuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjYuMlxuXHQgKlxuXHQgKiBAdHlwZSB7e21heFRpbWU6IG51bWJlciwgcGF5bG9hZFNpemU6IG51bWJlcn19XG5cdCAqL1xuXHR2YXIgc3BlZWRUZXN0U2V0dGluZ3MgPSB7XG5cdFx0bWF4VGltZTogMzAwMCwgLy8gTWF4IHRpbWUgKG1zKSBpdCBzaG91bGQgdGFrZSB0byBiZSBjb25zaWRlcmVkIGEgJ2Zhc3QgY29ubmVjdGlvbicuXG5cdFx0cGF5bG9hZFNpemU6IDEwMCAqIDEwMjQsIC8vIFBheWxvYWQgc2l6ZS5cblx0fTtcblxuXHQvKipcblx0ICogQ3JlYXRlIGEgcmFuZG9tIHBheWxvYWQgZm9yIHRoZSBzcGVlZCB0ZXN0LlxuXHQgKlxuXHQgKiBAc2luY2UgMS42LjJcblx0ICpcblx0ICogQHJldHVybnMge3N0cmluZ30gUmFuZG9tIHBheWxvYWQuXG5cdCAqL1xuXHRmdW5jdGlvbiBnZXRQYXlsb2FkKCkge1xuXG5cdFx0dmFyIGRhdGEgPSAnJztcblxuXHRcdGZvciAoIHZhciBpID0gMDsgaSA8IHNwZWVkVGVzdFNldHRpbmdzLnBheWxvYWRTaXplOyArK2kgKSB7XG5cdFx0XHRkYXRhICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoIE1hdGgucm91bmQoIE1hdGgucmFuZG9tKCkgKiAzNiArIDY0ICkgKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gZGF0YTtcblx0fVxuXG5cdC8qKlxuXHQgKiBSdW4gc3BlZWQgdGVzdHMgYW5kIGZsYWcgdGhlIGNsaWVudHMgYXMgc2xvdyBvciBub3QuIElmIGEgY29ubmVjdGlvblxuXHQgKiBpcyBzbG93IGl0IHdvdWxkIGxldCB0aGUgYmFja2VuZCBrbm93IGFuZCB0aGUgYmFja2VuZCBtb3N0IGxpa2VseVxuXHQgKiB3b3VsZCBkaXNhYmxlIHBhcmFsbGVsIHVwbG9hZHMgYW5kIHdvdWxkIHNldCBzbWFsbGVyIGNodW5rIHNpemVzLlxuXHQgKlxuXHQgKiBAc2luY2UgMS42LjJcblx0ICpcblx0ICogQHBhcmFtIHtGdW5jdGlvbn0gbmV4dCBGdW5jdGlvbiB0byBjYWxsIHdoZW4gdGhlIHNwZWVkIGRldGVjdGlvbiBpcyBkb25lLlxuXHQgKi9cblx0ZnVuY3Rpb24gc3BlZWRUZXN0KCBuZXh0ICkge1xuXG5cdFx0aWYgKCBudWxsICE9PSBpc1Nsb3cgKSB7XG5cdFx0XHRzZXRUaW1lb3V0KCBuZXh0ICk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dmFyIGRhdGEgID0gZ2V0UGF5bG9hZCgpO1xuXHRcdHZhciBzdGFydCA9IG5ldyBEYXRlO1xuXG5cdFx0d3AuYWpheC5wb3N0KCB7XG5cdFx0XHRhY3Rpb246ICd3cGZvcm1zX2ZpbGVfdXBsb2FkX3NwZWVkX3Rlc3QnLFxuXHRcdFx0ZGF0YTogZGF0YSxcblx0XHR9ICkudGhlbiggZnVuY3Rpb24oKSB7XG5cblx0XHRcdHZhciBkZWx0YSA9IG5ldyBEYXRlIC0gc3RhcnQ7XG5cblx0XHRcdGlzU2xvdyA9IGRlbHRhID49IHNwZWVkVGVzdFNldHRpbmdzLm1heFRpbWU7XG5cblx0XHRcdG5leHQoKTtcblx0XHR9ICkuZmFpbCggZnVuY3Rpb24oKSB7XG5cblx0XHRcdGlzU2xvdyA9IHRydWU7XG5cblx0XHRcdG5leHQoKTtcblx0XHR9ICk7XG5cdH1cblxuXHQvKipcblx0ICogVG9nZ2xlIGxvYWRpbmcgbWVzc2FnZSBhYm92ZSBzdWJtaXQgYnV0dG9uLlxuXHQgKlxuXHQgKiBAc2luY2UgMS41LjZcblx0ICpcblx0ICogQHBhcmFtIHtvYmplY3R9ICRmb3JtIGpRdWVyeSBmb3JtIGVsZW1lbnQuXG5cdCAqXG5cdCAqIEByZXR1cm5zIHtGdW5jdGlvbn0gZXZlbnQgaGFuZGxlciBmdW5jdGlvbi5cblx0ICovXG5cdGZ1bmN0aW9uIHRvZ2dsZUxvYWRpbmdNZXNzYWdlKCAkZm9ybSApIHtcblxuXHRcdHJldHVybiBmdW5jdGlvbigpIHtcblxuXHRcdFx0aWYgKCAkZm9ybS5maW5kKCAnLndwZm9ybXMtdXBsb2FkaW5nLWluLXByb2dyZXNzLWFsZXJ0JyApLmxlbmd0aCApIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHQkZm9ybS5maW5kKCAnLndwZm9ybXMtc3VibWl0LWNvbnRhaW5lcicgKVxuXHRcdFx0XHQuYmVmb3JlKFxuXHRcdFx0XHRcdGA8ZGl2IGNsYXNzPVwid3Bmb3Jtcy1lcnJvci1hbGVydCB3cGZvcm1zLXVwbG9hZGluZy1pbi1wcm9ncmVzcy1hbGVydFwiPlxuXHRcdFx0XHRcdFx0JHt3aW5kb3cud3Bmb3Jtc19maWxlX3VwbG9hZC5sb2FkaW5nX21lc3NhZ2V9XG5cdFx0XHRcdFx0PC9kaXY+YFxuXHRcdFx0XHQpO1xuXHRcdH07XG5cdH1cblxuXHQvKipcblx0ICogSXMgYSBmaWVsZCBsb2FkaW5nP1xuXHQgKlxuXHQgKiBAc2luY2UgMS43LjZcblx0ICpcblx0ICogQHBhcmFtIHtvYmplY3R9IGR6IERyb3B6b25lIG9iamVjdC5cblx0ICpcblx0ICogQHJldHVybnMge2Jvb2xlYW59IHRydWUgaWYgdGhlIGZpZWxkIGlzIGxvYWRpbmcuXG5cdCAqL1xuXHRmdW5jdGlvbiB1cGxvYWRJblByb2dyZXNzKCBkeiApIHtcblxuXHRcdHJldHVybiBkei5sb2FkaW5nID4gMCB8fCBkei5nZXRGaWxlc1dpdGhTdGF0dXMoICdlcnJvcicgKS5sZW5ndGggPiAwO1xuXHR9XG5cblx0LyoqXG5cdCAqIElzIGF0IGxlYXN0IG9uZSBmaWVsZCBsb2FkaW5nP1xuXHQgKlxuXHQgKiBAc2luY2UgMS43LjZcblx0ICpcblx0ICogQHJldHVybnMge2Jvb2xlYW59IHRydWUgaWYgYXQgbGVhc3Qgb25lIGZpZWxkIGlzIGxvYWRpbmcuXG5cdCAqL1xuXHRmdW5jdGlvbiBhbnlVcGxvYWRzSW5Qcm9ncmVzcygpIHtcblxuXHRcdHZhciBhbnlVcGxvYWRzSW5Qcm9ncmVzcyA9IGZhbHNlO1xuXG5cdFx0d2luZG93LndwZm9ybXMuZHJvcHpvbmVzLnNvbWUoIGZ1bmN0aW9uKCBkeiApIHtcblxuXHRcdFx0aWYgKCB1cGxvYWRJblByb2dyZXNzKCBkeiApICkge1xuXHRcdFx0XHRhbnlVcGxvYWRzSW5Qcm9ncmVzcyA9IHRydWU7XG5cblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0fSApO1xuXG5cdFx0cmV0dXJuIGFueVVwbG9hZHNJblByb2dyZXNzO1xuXHR9XG5cblx0LyoqXG5cdCAqIERpc2FibGUgc3VibWl0IGJ1dHRvbiB3aGVuIHdlIGFyZSBzZW5kaW5nIGZpbGVzIHRvIHRoZSBzZXJ2ZXIuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjUuNlxuXHQgKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gZHogRHJvcHpvbmUgb2JqZWN0LlxuXHQgKi9cblx0ZnVuY3Rpb24gdG9nZ2xlU3VibWl0KCBkeiApIHtcblxuXHRcdHZhciAkZm9ybSAgICA9IGpRdWVyeSggZHouZWxlbWVudCApLmNsb3Nlc3QoICdmb3JtJyApLFxuXHRcdFx0JGJ0biAgICAgPSAkZm9ybS5maW5kKCAnLndwZm9ybXMtc3VibWl0JyApLFxuXHRcdFx0JGJ0bk5leHQgPSAkZm9ybS5maW5kKCAnLndwZm9ybXMtcGFnZS1uZXh0OnZpc2libGUnICksXG5cdFx0XHRoYW5kbGVyICA9IHRvZ2dsZUxvYWRpbmdNZXNzYWdlKCAkZm9ybSApLFxuXHRcdFx0ZGlzYWJsZWQgPSB1cGxvYWRJblByb2dyZXNzKCBkeiApO1xuXG5cdFx0Ly8gRm9yIG11bHRpLXBhZ2VzIGxheW91dC5cblx0XHRpZiAoICRmb3JtLmZpbmQoICcud3Bmb3Jtcy1wYWdlLWluZGljYXRvcicgKS5sZW5ndGggIT09IDAgJiYgJGJ0bk5leHQubGVuZ3RoICE9PSAwICkge1xuXHRcdFx0JGJ0biA9ICRidG5OZXh0O1xuXHRcdH1cblxuXHRcdGlmICggZGlzYWJsZWQgPT09IEJvb2xlYW4oICRidG4ucHJvcCggJ2Rpc2FibGVkJyApICkgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0aWYgKCBkaXNhYmxlZCApIHtcblx0XHRcdCRidG4ucHJvcCggJ2Rpc2FibGVkJywgdHJ1ZSApO1xuXHRcdFx0aWYgKCAhICRmb3JtLmZpbmQoICcud3Bmb3Jtcy1zdWJtaXQtb3ZlcmxheScgKS5sZW5ndGggJiYgJGJ0bi5hdHRyKCAndHlwZScgKSA9PT0gJ3N1Ym1pdCcgKSB7XG5cdFx0XHRcdCRidG4ucGFyZW50KCkuYWRkQ2xhc3MoICd3cGZvcm1zLXN1Ym1pdC1vdmVybGF5LWNvbnRhaW5lcicgKTtcblx0XHRcdFx0JGJ0bi5wYXJlbnQoKS5hcHBlbmQoICc8ZGl2IGNsYXNzPVwid3Bmb3Jtcy1zdWJtaXQtb3ZlcmxheVwiPjwvZGl2PicgKTtcblx0XHRcdFx0JGZvcm0uZmluZCggJy53cGZvcm1zLXN1Ym1pdC1vdmVybGF5JyApLmNzcygge1xuXHRcdFx0XHRcdHdpZHRoOiBgJHskYnRuLm91dGVyV2lkdGgoKX1weGAsXG5cdFx0XHRcdFx0aGVpZ2h0OiBgJHskYnRuLnBhcmVudCgpLm91dGVySGVpZ2h0KCl9cHhgLFxuXHRcdFx0XHR9ICk7XG5cdFx0XHRcdCRmb3JtLmZpbmQoICcud3Bmb3Jtcy1zdWJtaXQtb3ZlcmxheScgKS5vbiggJ2NsaWNrJywgaGFuZGxlciApO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0aWYgKCBhbnlVcGxvYWRzSW5Qcm9ncmVzcygpICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdCRidG4ucHJvcCggJ2Rpc2FibGVkJywgZmFsc2UgKTtcblx0XHQkZm9ybS5maW5kKCAnLndwZm9ybXMtc3VibWl0LW92ZXJsYXknICkub2ZmKCAnY2xpY2snLCBoYW5kbGVyICk7XG5cdFx0JGZvcm0uZmluZCggJy53cGZvcm1zLXN1Ym1pdC1vdmVybGF5JyApLnJlbW92ZSgpO1xuXHRcdCRidG4ucGFyZW50KCkucmVtb3ZlQ2xhc3MoICd3cGZvcm1zLXN1Ym1pdC1vdmVybGF5LWNvbnRhaW5lcicgKTtcblx0XHRpZiAoICRmb3JtLmZpbmQoICcud3Bmb3Jtcy11cGxvYWRpbmctaW4tcHJvZ3Jlc3MtYWxlcnQnICkubGVuZ3RoICkge1xuXHRcdFx0JGZvcm0uZmluZCggJy53cGZvcm1zLXVwbG9hZGluZy1pbi1wcm9ncmVzcy1hbGVydCcgKS5yZW1vdmUoKTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogVHJ5IHRvIHBhcnNlIEpTT04gb3IgcmV0dXJuIGZhbHNlLlxuXHQgKlxuXHQgKiBAc2luY2UgMS41LjZcblx0ICpcblx0ICogQHBhcmFtIHtzdHJpbmd9IHN0ciBKU09OIHN0cmluZyBjYW5kaWRhdGUuXG5cdCAqXG5cdCAqIEByZXR1cm5zIHsqfSBQYXJzZSBvYmplY3Qgb3IgZmFsc2UuXG5cdCAqL1xuXHRmdW5jdGlvbiBwYXJzZUpTT04oIHN0ciApIHtcblx0XHR0cnkge1xuXHRcdFx0cmV0dXJuIEpTT04ucGFyc2UoIHN0ciApO1xuXHRcdH0gY2F0Y2ggKCBlICkge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBMZWF2ZSBvbmx5IG9iamVjdHMgd2l0aCBsZW5ndGguXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjUuNlxuXHQgKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gZWwgQW55IGFycmF5LlxuXHQgKlxuXHQgKiBAcmV0dXJucyB7Ym9vbH0gSGFzIGxlbmd0aCBtb3JlIHRoYW4gMCBvciBuby5cblx0ICovXG5cdGZ1bmN0aW9uIG9ubHlXaXRoTGVuZ3RoKCBlbCApIHtcblx0XHRyZXR1cm4gZWwubGVuZ3RoID4gMDtcblx0fVxuXG5cdC8qKlxuXHQgKiBMZWF2ZSBvbmx5IHBvc2l0aXZlIGVsZW1lbnRzLlxuXHQgKlxuXHQgKiBAc2luY2UgMS41LjZcblx0ICpcblx0ICogQHBhcmFtIHsqfSBlbCBBbnkgZWxlbWVudC5cblx0ICpcblx0ICogQHJldHVybnMgeyp9IEZpbHRlciBvbmx5IHBvc2l0aXZlLlxuXHQgKi9cblx0ZnVuY3Rpb24gb25seVBvc2l0aXZlKCBlbCApIHtcblx0XHRyZXR1cm4gZWw7XG5cdH1cblxuXHQvKipcblx0ICogR2V0IHhoci5cblx0ICpcblx0ICogQHNpbmNlIDEuNS42XG5cdCAqXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBlbCBPYmplY3Qgd2l0aCB4aHIgcHJvcGVydHkuXG5cdCAqXG5cdCAqIEByZXR1cm5zIHsqfSBHZXQgWEhSLlxuXHQgKi9cblx0ZnVuY3Rpb24gZ2V0WEhSKCBlbCApIHtcblx0XHRyZXR1cm4gZWwuY2h1bmtSZXNwb25zZSB8fCBlbC54aHI7XG5cdH1cblxuXHQvKipcblx0ICogR2V0IHJlc3BvbnNlIHRleHQuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjUuNlxuXHQgKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gZWwgWGhyIG9iamVjdC5cblx0ICpcblx0ICogQHJldHVybnMge29iamVjdH0gUmVzcG9uc2UgdGV4dC5cblx0ICovXG5cdGZ1bmN0aW9uIGdldFJlc3BvbnNlVGV4dCggZWwgKSB7XG5cdFx0cmV0dXJuIHR5cGVvZiBlbCA9PT0gJ3N0cmluZycgPyBlbCA6IGVsLnJlc3BvbnNlVGV4dDtcblx0fVxuXG5cdC8qKlxuXHQgKiBHZXQgZGF0YS5cblx0ICpcblx0ICogQHNpbmNlIDEuNS42XG5cdCAqXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBlbCBPYmplY3Qgd2l0aCBkYXRhIHByb3BlcnR5LlxuXHQgKlxuXHQgKiBAcmV0dXJucyB7b2JqZWN0fSBEYXRhLlxuXHQgKi9cblx0ZnVuY3Rpb24gZ2V0RGF0YSggZWwgKSB7XG5cdFx0cmV0dXJuIGVsLmRhdGE7XG5cdH1cblxuXHQvKipcblx0ICogR2V0IHZhbHVlIGZyb20gZmlsZXMuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjUuNlxuXHQgKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gZmlsZXMgRHJvcHpvbmUgZmlsZXMuXG5cdCAqXG5cdCAqIEByZXR1cm5zIHtvYmplY3R9IFByZXBhcmVkIHZhbHVlLlxuXHQgKi9cblx0ZnVuY3Rpb24gZ2V0VmFsdWUoIGZpbGVzICkge1xuXHRcdHJldHVybiBmaWxlc1xuXHRcdFx0Lm1hcCggZ2V0WEhSIClcblx0XHRcdC5maWx0ZXIoIG9ubHlQb3NpdGl2ZSApXG5cdFx0XHQubWFwKCBnZXRSZXNwb25zZVRleHQgKVxuXHRcdFx0LmZpbHRlciggb25seVdpdGhMZW5ndGggKVxuXHRcdFx0Lm1hcCggcGFyc2VKU09OIClcblx0XHRcdC5maWx0ZXIoIG9ubHlQb3NpdGl2ZSApXG5cdFx0XHQubWFwKCBnZXREYXRhICk7XG5cdH1cblxuXHQvKipcblx0ICogU2VuZGluZyBldmVudCBoaWdoZXIgb3JkZXIgZnVuY3Rpb24uXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjUuNlxuXHQgKiBAc2luY2UgMS41LjYuMSBBZGRlZCBzcGVjaWFsIHByb2Nlc3Npbmcgb2YgYSBmaWxlIHRoYXQgaXMgbGFyZ2VyIHRoYW4gc2VydmVyJ3MgcG9zdF9tYXhfc2l6ZS5cblx0ICpcblx0ICogQHBhcmFtIHtvYmplY3R9IGR6IERyb3B6b25lIG9iamVjdC5cblx0ICogQHBhcmFtIHtvYmplY3R9IGRhdGEgQWRkaW5nIGRhdGEgdG8gcmVxdWVzdC5cblx0ICpcblx0ICogQHJldHVybnMge0Z1bmN0aW9ufSBIYW5kbGVyIGZ1bmN0aW9uLlxuXHQgKi9cblx0ZnVuY3Rpb24gc2VuZGluZyggZHosIGRhdGEgKSB7XG5cblx0XHRyZXR1cm4gZnVuY3Rpb24oIGZpbGUsIHhociwgZm9ybURhdGEgKSB7XG5cblx0XHRcdC8qXG5cdFx0XHQgKiBXZSBzaG91bGQgbm90IGFsbG93IHNlbmRpbmcgYSBmaWxlLCB0aGF0IGV4Y2VlZHMgc2VydmVyIHBvc3RfbWF4X3NpemUuXG5cdFx0XHQgKiBXaXRoIHRoaXMgXCJoYWNrXCIgd2UgcmVkZWZpbmUgdGhlIGRlZmF1bHQgc2VuZCBmdW5jdGlvbmFsaXR5XG5cdFx0XHQgKiB0byBwcmV2ZW50IG9ubHkgdGhpcyBvYmplY3QgZnJvbSBzZW5kaW5nIGEgcmVxdWVzdCBhdCBhbGwuXG5cdFx0XHQgKiBUaGUgZmlsZSB0aGF0IGdlbmVyYXRlZCB0aGF0IGVycm9yIHNob3VsZCBiZSBtYXJrZWQgYXMgcmVqZWN0ZWQsXG5cdFx0XHQgKiBzbyBEcm9wem9uZSB3aWxsIHNpbGVudGx5IGlnbm9yZSBpdC5cblx0XHRcdCAqXG5cdFx0XHQgKiBJZiBDaHVua3MgYXJlIGVuYWJsZWQgdGhlIGZpbGUgc2l6ZSB3aWxsIG5ldmVyIGV4Y2VlZCAoYnkgYSBQSFAgY29uc3RyYWludCkgdGhlXG5cdFx0XHQgKiBwb3N0TWF4U2l6ZS4gVGhpcyBibG9jayBzaG91bGRuJ3QgYmUgcmVtb3ZlZCBub25ldGhlbGVzcyB1bnRpbCB0aGUgXCJtb2Rlcm5cIiB1cGxvYWQgaXMgY29tcGxldGVseVxuXHRcdFx0ICogZGVwcmVjYXRlZCBhbmQgcmVtb3ZlZC5cblx0XHRcdCAqL1xuXHRcdFx0aWYgKCBmaWxlLnNpemUgPiB0aGlzLmRhdGFUcmFuc2Zlci5wb3N0TWF4U2l6ZSApIHtcblx0XHRcdFx0eGhyLnNlbmQgPSBmdW5jdGlvbigpIHt9O1xuXG5cdFx0XHRcdGZpbGUuYWNjZXB0ZWQgPSBmYWxzZTtcblx0XHRcdFx0ZmlsZS5wcm9jZXNzaW5nID0gZmFsc2U7XG5cdFx0XHRcdGZpbGUuc3RhdHVzID0gJ3JlamVjdGVkJztcblx0XHRcdFx0ZmlsZS5wcmV2aWV3RWxlbWVudC5jbGFzc0xpc3QuYWRkKCAnZHotZXJyb3InICk7XG5cdFx0XHRcdGZpbGUucHJldmlld0VsZW1lbnQuY2xhc3NMaXN0LmFkZCggJ2R6LWNvbXBsZXRlJyApO1xuXG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0T2JqZWN0LmtleXMoIGRhdGEgKS5mb3JFYWNoKCBmdW5jdGlvbigga2V5ICkge1xuXHRcdFx0XHRmb3JtRGF0YS5hcHBlbmQoIGtleSwgZGF0YVtrZXldICk7XG5cdFx0XHR9ICk7XG5cdFx0fTtcblx0fVxuXG5cdC8qKlxuXHQgKiBDb252ZXJ0IGZpbGVzIHRvIGlucHV0IHZhbHVlLlxuXHQgKlxuXHQgKiBAc2luY2UgMS41LjZcblx0ICogQHNpbmNlIDEuNy4xIEFkZGVkIHRoZSBkeiBhcmd1bWVudC5cblx0ICpcblx0ICogQHBhcmFtIHtvYmplY3R9IGZpbGVzIEZpbGVzIGxpc3QuXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBkeiBEcm9wem9uZSBvYmplY3QuXG5cdCAqXG5cdCAqIEByZXR1cm5zIHtzdHJpbmd9IENvbnZlcnRlZCB2YWx1ZS5cblx0ICovXG5cdGZ1bmN0aW9uIGNvbnZlcnRGaWxlc1RvVmFsdWUoIGZpbGVzLCBkeiApIHtcblxuXHRcdGlmICggISBzdWJtaXR0ZWRWYWx1ZXNbIGR6LmRhdGFUcmFuc2Zlci5mb3JtSWQgXSB8fCAhIHN1Ym1pdHRlZFZhbHVlc1sgZHouZGF0YVRyYW5zZmVyLmZvcm1JZCBdWyBkei5kYXRhVHJhbnNmZXIuZmllbGRJZCBdICkge1xuXHRcdFx0cmV0dXJuIGZpbGVzLmxlbmd0aCA/IEpTT04uc3RyaW5naWZ5KCBmaWxlcyApIDogJyc7XG5cdFx0fVxuXG5cdFx0ZmlsZXMucHVzaC5hcHBseSggZmlsZXMsIHN1Ym1pdHRlZFZhbHVlc1sgZHouZGF0YVRyYW5zZmVyLmZvcm1JZCBdWyBkei5kYXRhVHJhbnNmZXIuZmllbGRJZCBdICk7XG5cblx0XHRyZXR1cm4gSlNPTi5zdHJpbmdpZnkoIGZpbGVzICk7XG5cdH1cblxuXHQvKipcblx0ICogR2V0IGlucHV0IGVsZW1lbnQuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjcuMVxuXHQgKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gZHogRHJvcHpvbmUgb2JqZWN0LlxuXHQgKlxuXHQgKiBAcmV0dXJucyB7alF1ZXJ5fSBIaWRkZW4gaW5wdXQgZWxlbWVudC5cblx0ICovXG5cdGZ1bmN0aW9uIGdldElucHV0KCBkeiApIHtcblxuXHRcdHJldHVybiBqUXVlcnkoIGR6LmVsZW1lbnQgKS5wYXJlbnRzKCAnLndwZm9ybXMtZmllbGQtZmlsZS11cGxvYWQnICkuZmluZCggJ2lucHV0W25hbWU9JyArIGR6LmRhdGFUcmFuc2Zlci5uYW1lICsgJ10nICk7XG5cdH1cblxuXHQvKipcblx0ICogVXBkYXRlIHZhbHVlIGluIGlucHV0LlxuXHQgKlxuXHQgKiBAc2luY2UgMS41LjZcblx0ICpcblx0ICogQHBhcmFtIHtvYmplY3R9IGR6IERyb3B6b25lIG9iamVjdC5cblx0ICovXG5cdGZ1bmN0aW9uIHVwZGF0ZUlucHV0VmFsdWUoIGR6ICkge1xuXG5cdFx0dmFyICRpbnB1dCA9IGdldElucHV0KCBkeiApO1xuXG5cdFx0JGlucHV0LnZhbCggY29udmVydEZpbGVzVG9WYWx1ZSggZ2V0VmFsdWUoIGR6LmZpbGVzICksIGR6ICkgKS50cmlnZ2VyKCAnaW5wdXQnICk7XG5cblx0XHRpZiAoIHR5cGVvZiBqUXVlcnkuZm4udmFsaWQgIT09ICd1bmRlZmluZWQnICkge1xuXHRcdFx0JGlucHV0LnZhbGlkKCk7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIENvbXBsZXRlIGV2ZW50IGhpZ2hlciBvcmRlciBmdW5jdGlvbi5cblx0ICpcblx0ICogQGRlcHJlY2F0ZWQgMS42LjJcblx0ICpcblx0ICogQHNpbmNlIDEuNS42XG5cdCAqXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBkeiBEcm9wem9uZSBvYmplY3QuXG5cdCAqXG5cdCAqIEByZXR1cm5zIHtGdW5jdGlvbn0gSGFuZGxlciBmdW5jdGlvbi5cblx0ICovXG5cdGZ1bmN0aW9uIGNvbXBsZXRlKCBkeiApIHtcblxuXHRcdHJldHVybiBmdW5jdGlvbigpIHtcblx0XHRcdGR6LmxvYWRpbmcgPSBkei5sb2FkaW5nIHx8IDA7XG5cdFx0XHRkei5sb2FkaW5nLS07XG5cdFx0XHRkei5sb2FkaW5nID0gTWF0aC5tYXgoIGR6LmxvYWRpbmcgLSAxLCAwICk7XG5cdFx0XHR0b2dnbGVTdWJtaXQoIGR6ICk7XG5cdFx0XHR1cGRhdGVJbnB1dFZhbHVlKCBkeiApO1xuXHRcdH07XG5cdH1cblxuXHQvKipcblx0ICogQWRkIGFuIGVycm9yIG1lc3NhZ2UgdG8gdGhlIGN1cnJlbnQgZmlsZS5cblx0ICpcblx0ICogQHNpbmNlIDEuNi4yXG5cdCAqXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBmaWxlICAgICAgICAgRmlsZSBvYmplY3QuXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBlcnJvck1lc3NhZ2UgRXJyb3IgbWVzc2FnZVxuXHQgKi9cblx0ZnVuY3Rpb24gYWRkRXJyb3JNZXNzYWdlKCBmaWxlLCBlcnJvck1lc3NhZ2UgKSB7XG5cblx0XHRpZiAoIGZpbGUuaXNFcnJvck5vdFVwbG9hZGVkRGlzcGxheWVkICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHZhciBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ3NwYW4nICk7XG5cdFx0c3Bhbi5pbm5lclRleHQgPSBlcnJvck1lc3NhZ2UudG9TdHJpbmcoKTtcblx0XHRzcGFuLnNldEF0dHJpYnV0ZSggJ2RhdGEtZHotZXJyb3JtZXNzYWdlJywgJycgKTtcblxuXHRcdGZpbGUucHJldmlld0VsZW1lbnQucXVlcnlTZWxlY3RvciggJy5kei1lcnJvci1tZXNzYWdlJyApLmFwcGVuZENoaWxkKCBzcGFuICk7XG5cdH1cblxuXHQvKipcblx0ICogQ29uZmlybSB0aGUgdXBsb2FkIHRvIHRoZSBzZXJ2ZXIuXG5cdCAqXG5cdCAqIFRoZSBjb25maXJtYXRpb24gaXMgbmVlZGVkIGluIG9yZGVyIHRvIGxldCBQSFAga25vd1xuXHQgKiB0aGF0IGFsbCB0aGUgY2h1bmtzIGhhdmUgYmVlbiB1cGxvYWRlZC5cblx0ICpcblx0ICogQHNpbmNlIDEuNi4yXG5cdCAqXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBkeiBEcm9wem9uZSBvYmplY3QuXG5cdCAqXG5cdCAqIEByZXR1cm5zIHtGdW5jdGlvbn0gSGFuZGxlciBmdW5jdGlvbi5cblx0ICovXG5cdGZ1bmN0aW9uIGNvbmZpcm1DaHVua3NGaW5pc2hVcGxvYWQoIGR6ICkge1xuXG5cdFx0cmV0dXJuIGZ1bmN0aW9uIGNvbmZpcm0oIGZpbGUgKSB7XG5cblx0XHRcdGlmICggISBmaWxlLnJldHJpZXMgKSB7XG5cdFx0XHRcdGZpbGUucmV0cmllcyA9IDA7XG5cdFx0XHR9XG5cblx0XHRcdGlmICggJ2Vycm9yJyA9PT0gZmlsZS5zdGF0dXMgKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0LyoqXG5cdFx0XHQgKiBSZXRyeSBmaW5hbGl6ZSBmdW5jdGlvbi5cblx0XHRcdCAqXG5cdFx0XHQgKiBAc2luY2UgMS42LjJcblx0XHRcdCAqL1xuXHRcdFx0ZnVuY3Rpb24gcmV0cnkoKSB7XG5cdFx0XHRcdGZpbGUucmV0cmllcysrO1xuXG5cdFx0XHRcdGlmICggZmlsZS5yZXRyaWVzID09PSAzICkge1xuXHRcdFx0XHRcdGFkZEVycm9yTWVzc2FnZSggZmlsZSwgd2luZG93LndwZm9ybXNfZmlsZV91cGxvYWQuZXJyb3JzLmZpbGVfbm90X3VwbG9hZGVkICk7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0c2V0VGltZW91dCggZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0Y29uZmlybSggZmlsZSApO1xuXHRcdFx0XHR9LCA1MDAwICogZmlsZS5yZXRyaWVzICk7XG5cdFx0XHR9XG5cblx0XHRcdC8qKlxuXHRcdFx0ICogRmFpbCBoYW5kbGVyIGZvciBhamF4IHJlcXVlc3QuXG5cdFx0XHQgKlxuXHRcdFx0ICogQHNpbmNlIDEuNi4yXG5cdFx0XHQgKlxuXHRcdFx0ICogQHBhcmFtIHtvYmplY3R9IHJlc3BvbnNlIFJlc3BvbnNlIGZyb20gdGhlIHNlcnZlclxuXHRcdFx0ICovXG5cdFx0XHRmdW5jdGlvbiBmYWlsKCByZXNwb25zZSApIHtcblxuXHRcdFx0XHR2YXIgaGFzU3BlY2lmaWNFcnJvciA9XHRyZXNwb25zZS5yZXNwb25zZUpTT04gJiZcblx0XHRcdFx0XHRcdFx0XHRcdFx0cmVzcG9uc2UucmVzcG9uc2VKU09OLnN1Y2Nlc3MgPT09IGZhbHNlICYmXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHJlc3BvbnNlLnJlc3BvbnNlSlNPTi5kYXRhO1xuXG5cdFx0XHRcdGlmICggaGFzU3BlY2lmaWNFcnJvciApIHtcblx0XHRcdFx0XHRhZGRFcnJvck1lc3NhZ2UoIGZpbGUsIHJlc3BvbnNlLnJlc3BvbnNlSlNPTi5kYXRhICk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmV0cnkoKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQvKipcblx0XHRcdCAqIEhhbmRsZXIgZm9yIGFqYXggcmVxdWVzdC5cblx0XHRcdCAqXG5cdFx0XHQgKiBAc2luY2UgMS42LjJcblx0XHRcdCAqXG5cdFx0XHQgKiBAcGFyYW0ge29iamVjdH0gcmVzcG9uc2UgUmVzcG9uc2UgZnJvbSB0aGUgc2VydmVyXG5cdFx0XHQgKi9cblx0XHRcdGZ1bmN0aW9uIGNvbXBsZXRlKCByZXNwb25zZSApIHtcblxuXHRcdFx0XHRmaWxlLmNodW5rUmVzcG9uc2UgPSBKU09OLnN0cmluZ2lmeSggeyBkYXRhOiByZXNwb25zZSB9ICk7XG5cdFx0XHRcdGR6LmxvYWRpbmcgPSBkei5sb2FkaW5nIHx8IDA7XG5cdFx0XHRcdGR6LmxvYWRpbmctLTtcblx0XHRcdFx0ZHoubG9hZGluZyA9IE1hdGgubWF4KCBkei5sb2FkaW5nLCAwICk7XG5cblx0XHRcdFx0dG9nZ2xlU3VibWl0KCBkeiApO1xuXHRcdFx0XHR1cGRhdGVJbnB1dFZhbHVlKCBkeiApO1xuXHRcdFx0fVxuXG5cdFx0XHR3cC5hamF4LnBvc3QoIGpRdWVyeS5leHRlbmQoXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRhY3Rpb246ICd3cGZvcm1zX2ZpbGVfY2h1bmtzX3VwbG9hZGVkJyxcblx0XHRcdFx0XHRmb3JtX2lkOiBkei5kYXRhVHJhbnNmZXIuZm9ybUlkLFxuXHRcdFx0XHRcdGZpZWxkX2lkOiBkei5kYXRhVHJhbnNmZXIuZmllbGRJZCxcblx0XHRcdFx0XHRuYW1lOiBmaWxlLm5hbWUsXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGR6Lm9wdGlvbnMucGFyYW1zLmNhbGwoIGR6LCBudWxsLCBudWxsLCB7ZmlsZTogZmlsZSwgaW5kZXg6IDB9IClcblx0XHRcdCkgKS50aGVuKCBjb21wbGV0ZSApLmZhaWwoIGZhaWwgKTtcblxuXHRcdFx0Ly8gTW92ZSB0byB1cGxvYWQgdGhlIG5leHQgZmlsZSwgaWYgYW55LlxuXHRcdFx0ZHoucHJvY2Vzc1F1ZXVlKCk7XG5cdFx0fTtcblx0fVxuXG5cdC8qKlxuXHQgKiBUb2dnbGUgc2hvd2luZyBlbXB0eSBtZXNzYWdlLlxuXHQgKlxuXHQgKiBAc2luY2UgMS41LjZcblx0ICpcblx0ICogQHBhcmFtIHtvYmplY3R9IGR6IERyb3B6b25lIG9iamVjdC5cblx0ICovXG5cdGZ1bmN0aW9uIHRvZ2dsZU1lc3NhZ2UoIGR6ICkge1xuXG5cdFx0c2V0VGltZW91dCggZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgdmFsaWRGaWxlcyA9IGR6LmZpbGVzLmZpbHRlciggZnVuY3Rpb24oIGZpbGUgKSB7XG5cdFx0XHRcdHJldHVybiBmaWxlLmFjY2VwdGVkO1xuXHRcdFx0fSApO1xuXG5cdFx0XHRpZiAoIHZhbGlkRmlsZXMubGVuZ3RoID49IGR6Lm9wdGlvbnMubWF4RmlsZXMgKSB7XG5cdFx0XHRcdGR6LmVsZW1lbnQucXVlcnlTZWxlY3RvciggJy5kei1tZXNzYWdlJyApLmNsYXNzTGlzdC5hZGQoICdoaWRlJyApO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZHouZWxlbWVudC5xdWVyeVNlbGVjdG9yKCAnLmR6LW1lc3NhZ2UnICkuY2xhc3NMaXN0LnJlbW92ZSggJ2hpZGUnICk7XG5cdFx0XHR9XG5cdFx0fSwgMCApO1xuXHR9XG5cblx0LyoqXG5cdCAqIFRvZ2dsZSBlcnJvciBtZXNzYWdlIGlmIHRvdGFsIHNpemUgbW9yZSB0aGFuIGxpbWl0LlxuXHQgKiBSdW5zIGZvciBlYWNoIGZpbGUuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjUuNlxuXHQgKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gZmlsZSBDdXJyZW50IGZpbGUuXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBkeiAgIERyb3B6b25lIG9iamVjdC5cblx0ICovXG5cdGZ1bmN0aW9uIHZhbGlkYXRlUG9zdE1heFNpemVFcnJvciggZmlsZSwgZHogKSB7XG5cblx0XHRzZXRUaW1lb3V0KCBmdW5jdGlvbigpIHtcblx0XHRcdGlmICggZmlsZS5zaXplID49IGR6LmRhdGFUcmFuc2Zlci5wb3N0TWF4U2l6ZSApIHtcblx0XHRcdFx0dmFyIGVycm9yTWVzc2FnZSA9IHdpbmRvdy53cGZvcm1zX2ZpbGVfdXBsb2FkLmVycm9ycy5wb3N0X21heF9zaXplO1xuXHRcdFx0XHRpZiAoICEgZmlsZS5pc0Vycm9yTm90VXBsb2FkZWREaXNwbGF5ZWQgKSB7XG5cdFx0XHRcdFx0ZmlsZS5pc0Vycm9yTm90VXBsb2FkZWREaXNwbGF5ZWQgPSB0cnVlO1xuXHRcdFx0XHRcdGVycm9yTWVzc2FnZSA9IHdpbmRvdy53cGZvcm1zX2ZpbGVfdXBsb2FkLmVycm9ycy5maWxlX25vdF91cGxvYWRlZCArICcgJyArIGVycm9yTWVzc2FnZTtcblx0XHRcdFx0XHRhZGRFcnJvck1lc3NhZ2UoIGZpbGUsIGVycm9yTWVzc2FnZSApO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSwgMSApO1xuXHR9XG5cblx0LyoqXG5cdCAqIFN0YXJ0IEZpbGUgVXBsb2FkLlxuXHQgKlxuXHQgKiBUaGlzIHdvdWxkIGRvIHRoZSBpbml0aWFsIHJlcXVlc3QgdG8gc3RhcnQgYSBmaWxlIHVwbG9hZC4gTm8gY2h1bmtcblx0ICogaXMgdXBsb2FkZWQgYXQgdGhpcyBzdGFnZSwgaW5zdGVhZCBhbGwgdGhlIGluZm9ybWF0aW9uIHJlbGF0ZWQgdG8gdGhlXG5cdCAqIGZpbGUgYXJlIHNlbmQgdG8gdGhlIHNlcnZlciB3YWl0aW5nIGZvciBhbiBhdXRob3JpemF0aW9uLlxuXHQgKlxuXHQgKiBJZiB0aGUgc2VydmVyIGF1dGhvcml6ZXMgdGhlIGNsaWVudCB3b3VsZCBzdGFydCB1cGxvYWRpbmcgdGhlIGNodW5rcy5cblx0ICpcblx0ICogQHNpbmNlIDEuNi4yXG5cdCAqXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBkeiAgIERyb3B6b25lIG9iamVjdC5cblx0ICogQHBhcmFtIHtvYmplY3R9IGZpbGUgQ3VycmVudCBmaWxlLlxuXHQgKi9cblx0ZnVuY3Rpb24gaW5pdEZpbGVVcGxvYWQoIGR6LCBmaWxlICkge1xuXG5cdFx0d3AuYWpheC5wb3N0KCBqUXVlcnkuZXh0ZW5kKFxuXHRcdFx0e1xuXHRcdFx0XHRhY3Rpb24gOiAnd3Bmb3Jtc191cGxvYWRfY2h1bmtfaW5pdCcsXG5cdFx0XHRcdGZvcm1faWQ6IGR6LmRhdGFUcmFuc2Zlci5mb3JtSWQsXG5cdFx0XHRcdGZpZWxkX2lkOiBkei5kYXRhVHJhbnNmZXIuZmllbGRJZCxcblx0XHRcdFx0bmFtZTogZmlsZS5uYW1lLFxuXHRcdFx0XHRzbG93OiBpc1Nsb3csXG5cdFx0XHR9LFxuXHRcdFx0ZHoub3B0aW9ucy5wYXJhbXMuY2FsbCggZHosIG51bGwsIG51bGwsIHtmaWxlOiBmaWxlLCBpbmRleDogMH0gKVxuXHRcdCkgKS50aGVuKCBmdW5jdGlvbiggcmVzcG9uc2UgKSB7XG5cblx0XHRcdC8vIEZpbGUgdXBsb2FkIGhhcyBiZWVuIGF1dGhvcml6ZWQuXG5cblx0XHRcdGZvciAoIHZhciBrZXkgaW4gcmVzcG9uc2UgKSB7XG5cdFx0XHRcdGR6Lm9wdGlvbnNbIGtleSBdID0gcmVzcG9uc2VbIGtleSBdO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIHJlc3BvbnNlLmR6Y2h1bmtzaXplICkge1xuXHRcdFx0XHRkei5vcHRpb25zLmNodW5rU2l6ZSA9IHBhcnNlSW50KCByZXNwb25zZS5kemNodW5rc2l6ZSwgMTAgKTtcblx0XHRcdFx0ZmlsZS51cGxvYWQudG90YWxDaHVua0NvdW50ID0gTWF0aC5jZWlsKCBmaWxlLnNpemUgLyBkei5vcHRpb25zLmNodW5rU2l6ZSApO1xuXHRcdFx0fVxuXG5cdFx0XHRkei5wcm9jZXNzUXVldWUoKTtcblx0XHR9ICkuZmFpbCggZnVuY3Rpb24oIHJlc3BvbnNlICkge1xuXG5cdFx0XHRmaWxlLnN0YXR1cyA9ICdlcnJvcic7XG5cblx0XHRcdGlmICggISBmaWxlLnhociApIHtcblx0XHRcdFx0dmFyIGVycm9yTWVzc2FnZSA9IHdpbmRvdy53cGZvcm1zX2ZpbGVfdXBsb2FkLmVycm9ycy5maWxlX25vdF91cGxvYWRlZCArICcgJyArIHdpbmRvdy53cGZvcm1zX2ZpbGVfdXBsb2FkLmVycm9ycy5kZWZhdWx0X2Vycm9yO1xuXG5cdFx0XHRcdGZpbGUucHJldmlld0VsZW1lbnQuY2xhc3NMaXN0LmFkZCggJ2R6LXByb2Nlc3NpbmcnLCAnZHotZXJyb3InLCAnZHotY29tcGxldGUnICk7XG5cdFx0XHRcdGZpbGUucHJldmlld0VsZW1lbnQuY2xvc2VzdCggJy53cGZvcm1zLWZpZWxkJyApLmNsYXNzTGlzdC5hZGQoICd3cGZvcm1zLWhhcy1lcnJvcicgKTtcblx0XHRcdFx0YWRkRXJyb3JNZXNzYWdlKCBmaWxlLCBlcnJvck1lc3NhZ2UgKTtcblx0XHRcdH1cblxuXHRcdFx0ZHoucHJvY2Vzc1F1ZXVlKCk7XG5cdFx0fSApO1xuXHR9XG5cblx0LyoqXG5cdCAqIFZhbGlkYXRlIHRoZSBmaWxlIHdoZW4gaXQgd2FzIGFkZGVkIGluIHRoZSBkcm9wem9uZS5cblx0ICpcblx0ICogQHNpbmNlIDEuNS42XG5cdCAqXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBkeiBEcm9wem9uZSBvYmplY3QuXG5cdCAqXG5cdCAqIEByZXR1cm5zIHtGdW5jdGlvbn0gSGFuZGxlciBmdW5jdGlvbi5cblx0ICovXG5cdGZ1bmN0aW9uIGFkZGVkRmlsZSggZHogKSB7XG5cblx0XHRyZXR1cm4gZnVuY3Rpb24oIGZpbGUgKSB7XG5cblx0XHRcdGlmICggZmlsZS5zaXplID49IGR6LmRhdGFUcmFuc2Zlci5wb3N0TWF4U2l6ZSApIHtcblx0XHRcdFx0dmFsaWRhdGVQb3N0TWF4U2l6ZUVycm9yKCBmaWxlLCBkeiApO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0c3BlZWRUZXN0KCBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRpbml0RmlsZVVwbG9hZCggZHosIGZpbGUgKTtcblx0XHRcdFx0fSApO1xuXHRcdFx0fVxuXG5cdFx0XHRkei5sb2FkaW5nID0gZHoubG9hZGluZyB8fCAwO1xuXHRcdFx0ZHoubG9hZGluZysrO1xuXHRcdFx0dG9nZ2xlU3VibWl0KCBkeiApO1xuXG5cdFx0XHR0b2dnbGVNZXNzYWdlKCBkeiApO1xuXHRcdH07XG5cdH1cblxuXHQvKipcblx0ICogU2VuZCBhbiBBSkFYIHJlcXVlc3QgdG8gcmVtb3ZlIGZpbGUgZnJvbSB0aGUgc2VydmVyLlxuXHQgKlxuXHQgKiBAc2luY2UgMS41LjZcblx0ICpcblx0ICogQHBhcmFtIHtzdHJpbmd9IGZpbGUgRmlsZSBuYW1lLlxuXHQgKiBAcGFyYW0ge29iamVjdH0gZHogRHJvcHpvbmUgb2JqZWN0LlxuXHQgKi9cblx0ZnVuY3Rpb24gcmVtb3ZlRnJvbVNlcnZlciggZmlsZSwgZHogKSB7XG5cblx0XHR3cC5hamF4LnBvc3QoIHtcblx0XHRcdGFjdGlvbjogJ3dwZm9ybXNfcmVtb3ZlX2ZpbGUnLFxuXHRcdFx0ZmlsZTogZmlsZSxcblx0XHRcdGZvcm1faWQ6IGR6LmRhdGFUcmFuc2Zlci5mb3JtSWQsXG5cdFx0XHRmaWVsZF9pZDogZHouZGF0YVRyYW5zZmVyLmZpZWxkSWQsXG5cdFx0fSApO1xuXHR9XG5cblx0LyoqXG5cdCAqIEluaXQgdGhlIGZpbGUgcmVtb3ZhbCBvbiBzZXJ2ZXIgd2hlbiB1c2VyIHJlbW92ZWQgaXQgb24gZnJvbnQtZW5kLlxuXHQgKlxuXHQgKiBAc2luY2UgMS41LjZcblx0ICpcblx0ICogQHBhcmFtIHtvYmplY3R9IGR6IERyb3B6b25lIG9iamVjdC5cblx0ICpcblx0ICogQHJldHVybnMge0Z1bmN0aW9ufSBIYW5kbGVyIGZ1bmN0aW9uLlxuXHQgKi9cblx0ZnVuY3Rpb24gcmVtb3ZlZEZpbGUoIGR6ICkge1xuXG5cdFx0cmV0dXJuIGZ1bmN0aW9uKCBmaWxlICkge1xuXHRcdFx0dG9nZ2xlTWVzc2FnZSggZHogKTtcblxuXHRcdFx0dmFyIGpzb24gPSBmaWxlLmNodW5rUmVzcG9uc2UgfHwgKCBmaWxlLnhociB8fCB7fSApLnJlc3BvbnNlVGV4dDtcblxuXHRcdFx0aWYgKCBqc29uICkge1xuXHRcdFx0XHR2YXIgb2JqZWN0ID0gcGFyc2VKU09OKCBqc29uICk7XG5cblx0XHRcdFx0aWYgKCBvYmplY3QgJiYgb2JqZWN0LmRhdGEgJiYgb2JqZWN0LmRhdGEuZmlsZSApIHtcblx0XHRcdFx0XHRyZW1vdmVGcm9tU2VydmVyKCBvYmplY3QuZGF0YS5maWxlLCBkeiApO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdC8vIFJlbW92ZSBzdWJtaXR0ZWQgdmFsdWUuXG5cdFx0XHRpZiAoIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCggZmlsZSwgJ2lzRGVmYXVsdCcgKSAmJiBmaWxlLmlzRGVmYXVsdCApIHtcblx0XHRcdFx0c3VibWl0dGVkVmFsdWVzWyBkei5kYXRhVHJhbnNmZXIuZm9ybUlkIF1bIGR6LmRhdGFUcmFuc2Zlci5maWVsZElkIF0uc3BsaWNlKCBmaWxlLmluZGV4LCAxICk7XG5cdFx0XHRcdGR6Lm9wdGlvbnMubWF4RmlsZXMrKztcblx0XHRcdFx0cmVtb3ZlRnJvbVNlcnZlciggZmlsZS5maWxlLCBkeiApO1xuXHRcdFx0fVxuXG5cdFx0XHR1cGRhdGVJbnB1dFZhbHVlKCBkeiApO1xuXG5cdFx0XHRkei5sb2FkaW5nID0gZHoubG9hZGluZyB8fCAwO1xuXHRcdFx0ZHoubG9hZGluZy0tO1xuXHRcdFx0ZHoubG9hZGluZyA9IE1hdGgubWF4KCBkei5sb2FkaW5nLCAwICk7XG5cblx0XHRcdHRvZ2dsZVN1Ym1pdCggZHogKTtcblx0XHR9O1xuXHR9XG5cblx0LyoqXG5cdCAqIFByb2Nlc3MgYW55IGVycm9yIHRoYXQgd2FzIGZpcmVkIHBlciBlYWNoIGZpbGUuXG5cdCAqIFRoZXJlIG1pZ2h0IGJlIHNldmVyYWwgZXJyb3JzIHBlciBmaWxlLCBpbiB0aGF0IGNhc2UgLSBkaXNwbGF5IFwibm90IHVwbG9hZGVkXCIgdGV4dCBvbmx5IG9uY2UuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjUuNi4xXG5cdCAqXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBkeiBEcm9wem9uZSBvYmplY3QuXG5cdCAqXG5cdCAqIEByZXR1cm5zIHtGdW5jdGlvbn0gSGFuZGxlciBmdW5jdGlvbi5cblx0ICovXG5cdGZ1bmN0aW9uIGVycm9yKCBkeiApIHtcblxuXHRcdHJldHVybiBmdW5jdGlvbiggZmlsZSwgZXJyb3JNZXNzYWdlICkge1xuXG5cdFx0XHRpZiAoIGZpbGUuaXNFcnJvck5vdFVwbG9hZGVkRGlzcGxheWVkICkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdGlmICggdHlwZW9mIGVycm9yTWVzc2FnZSA9PT0gJ29iamVjdCcgKSB7XG5cdFx0XHRcdGVycm9yTWVzc2FnZSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCggZXJyb3JNZXNzYWdlLCAnZGF0YScgKSAmJiB0eXBlb2YgZXJyb3JNZXNzYWdlLmRhdGEgPT09ICdzdHJpbmcnID8gZXJyb3JNZXNzYWdlLmRhdGEgOiAnJztcblx0XHRcdH1cblxuXHRcdFx0ZXJyb3JNZXNzYWdlID0gZXJyb3JNZXNzYWdlICE9PSAnMCcgPyBlcnJvck1lc3NhZ2UgOiAnJztcblxuXHRcdFx0ZmlsZS5pc0Vycm9yTm90VXBsb2FkZWREaXNwbGF5ZWQgPSB0cnVlO1xuXHRcdFx0ZmlsZS5wcmV2aWV3RWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCAnW2RhdGEtZHotZXJyb3JtZXNzYWdlXScgKVswXS50ZXh0Q29udGVudCA9IHdpbmRvdy53cGZvcm1zX2ZpbGVfdXBsb2FkLmVycm9ycy5maWxlX25vdF91cGxvYWRlZCArICcgJyArIGVycm9yTWVzc2FnZTtcblx0XHR9O1xuXHR9XG5cblx0LyoqXG5cdCAqIFByZXNldCBwcmV2aW91c2x5IHN1Ym1pdHRlZCBmaWxlcyB0byB0aGUgZHJvcHpvbmUuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjcuMVxuXHQgKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gZHogRHJvcHpvbmUgb2JqZWN0LlxuXHQgKi9cblx0ZnVuY3Rpb24gcHJlc2V0U3VibWl0dGVkRGF0YSggZHogKSB7XG5cblx0XHR2YXIgZmlsZXMgPSBwYXJzZUpTT04oIGdldElucHV0KCBkeiApLnZhbCgpICk7XG5cblx0XHRpZiAoICEgZmlsZXMgfHwgISBmaWxlcy5sZW5ndGggKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0c3VibWl0dGVkVmFsdWVzW2R6LmRhdGFUcmFuc2Zlci5mb3JtSWRdID0gW107XG5cblx0XHQvLyBXZSBkbyBkZWVwIGNsb25pbmcgYW4gb2JqZWN0IHRvIGJlIHN1cmUgdGhhdCBkYXRhIGlzIHBhc3NlZCB3aXRob3V0IGxpbmtzLlxuXHRcdHN1Ym1pdHRlZFZhbHVlc1tkei5kYXRhVHJhbnNmZXIuZm9ybUlkXVtkei5kYXRhVHJhbnNmZXIuZmllbGRJZF0gPSBKU09OLnBhcnNlKCBKU09OLnN0cmluZ2lmeSggZmlsZXMgKSApO1xuXG5cdFx0ZmlsZXMuZm9yRWFjaCggZnVuY3Rpb24oIGZpbGUsIGluZGV4ICkge1xuXG5cdFx0XHRmaWxlLmlzRGVmYXVsdCA9IHRydWU7XG5cdFx0XHRmaWxlLmluZGV4ID0gaW5kZXg7XG5cblx0XHRcdGlmICggZmlsZS50eXBlLm1hdGNoKCAvaW1hZ2UuKi8gKSApIHtcblx0XHRcdFx0ZHouZGlzcGxheUV4aXN0aW5nRmlsZSggZmlsZSwgZmlsZS51cmwgKTtcblxuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdGR6LmVtaXQoICdhZGRlZGZpbGUnLCBmaWxlICk7XG5cdFx0XHRkei5lbWl0KCAnY29tcGxldGUnLCBmaWxlICk7XG5cdFx0fSApO1xuXG5cdFx0ZHoub3B0aW9ucy5tYXhGaWxlcyA9IGR6Lm9wdGlvbnMubWF4RmlsZXMgLSBmaWxlcy5sZW5ndGg7XG5cdH1cblxuXHQvKipcblx0ICogRHJvcHpvbmUuanMgaW5pdCBmb3IgZWFjaCBmaWVsZC5cblx0ICpcblx0ICogQHNpbmNlIDEuNS42XG5cdCAqXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSAkZWwgV1BGb3JtcyB1cGxvYWRlciBET00gZWxlbWVudC5cblx0ICpcblx0ICogQHJldHVybnMge29iamVjdH0gRHJvcHpvbmUgb2JqZWN0LlxuXHQgKi9cblx0ZnVuY3Rpb24gZHJvcFpvbmVJbml0KCAkZWwgKSB7XG5cblx0XHRpZiAoICRlbC5kcm9wem9uZSApIHtcblx0XHRcdHJldHVybiAkZWwuZHJvcHpvbmU7XG5cdFx0fVxuXG5cdFx0dmFyIGZvcm1JZCA9IHBhcnNlSW50KCAkZWwuZGF0YXNldC5mb3JtSWQsIDEwICk7XG5cdFx0dmFyIGZpZWxkSWQgPSBwYXJzZUludCggJGVsLmRhdGFzZXQuZmllbGRJZCwgMTAgKSB8fCAwO1xuXHRcdHZhciBtYXhGaWxlcyA9IHBhcnNlSW50KCAkZWwuZGF0YXNldC5tYXhGaWxlTnVtYmVyLCAxMCApO1xuXG5cdFx0dmFyIGFjY2VwdGVkRmlsZXMgPSAkZWwuZGF0YXNldC5leHRlbnNpb25zLnNwbGl0KCAnLCcgKS5tYXAoIGZ1bmN0aW9uKCBlbCApIHtcblx0XHRcdHJldHVybiAnLicgKyBlbDtcblx0XHR9ICkuam9pbiggJywnICk7XG5cblx0XHQvLyBDb25maWd1cmUgYW5kIG1vZGlmeSBEcm9wem9uZSBsaWJyYXJ5LlxuXHRcdHZhciBkeiA9IG5ldyB3aW5kb3cuRHJvcHpvbmUoICRlbCwge1xuXHRcdFx0dXJsOiB3aW5kb3cud3Bmb3Jtc19maWxlX3VwbG9hZC51cmwsXG5cdFx0XHRhZGRSZW1vdmVMaW5rczogdHJ1ZSxcblx0XHRcdGNodW5raW5nOiB0cnVlLFxuXHRcdFx0Zm9yY2VDaHVua2luZzogdHJ1ZSxcblx0XHRcdHJldHJ5Q2h1bmtzOiB0cnVlLFxuXHRcdFx0Y2h1bmtTaXplOiBwYXJzZUludCggJGVsLmRhdGFzZXQuZmlsZUNodW5rU2l6ZSwgMTAgKSxcblx0XHRcdHBhcmFtTmFtZTogJGVsLmRhdGFzZXQuaW5wdXROYW1lLFxuXHRcdFx0cGFyYWxsZWxDaHVua1VwbG9hZHM6ICEhICggJGVsLmRhdGFzZXQucGFyYWxsZWxVcGxvYWRzIHx8ICcnICkubWF0Y2goIC9edHJ1ZSQvaSApLFxuXHRcdFx0cGFyYWxsZWxVcGxvYWRzOiBwYXJzZUludCggJGVsLmRhdGFzZXQubWF4UGFyYWxsZWxVcGxvYWRzLCAxMCApLFxuXHRcdFx0YXV0b1Byb2Nlc3NRdWV1ZTogZmFsc2UsXG5cdFx0XHRtYXhGaWxlc2l6ZTogKCBwYXJzZUludCggJGVsLmRhdGFzZXQubWF4U2l6ZSwgMTAgKSAvICggMTAyNCAqIDEwMjQgKSApLnRvRml4ZWQoIDIgKSxcblx0XHRcdG1heEZpbGVzOiBtYXhGaWxlcyxcblx0XHRcdGFjY2VwdGVkRmlsZXM6IGFjY2VwdGVkRmlsZXMsXG5cdFx0XHRkaWN0TWF4RmlsZXNFeGNlZWRlZDogd2luZG93LndwZm9ybXNfZmlsZV91cGxvYWQuZXJyb3JzLmZpbGVfbGltaXQucmVwbGFjZSggJ3tmaWxlTGltaXR9JywgbWF4RmlsZXMgKSxcblx0XHRcdGRpY3RJbnZhbGlkRmlsZVR5cGU6IHdpbmRvdy53cGZvcm1zX2ZpbGVfdXBsb2FkLmVycm9ycy5maWxlX2V4dGVuc2lvbixcblx0XHRcdGRpY3RGaWxlVG9vQmlnOiB3aW5kb3cud3Bmb3Jtc19maWxlX3VwbG9hZC5lcnJvcnMuZmlsZV9zaXplLFxuXHRcdH0gKTtcblxuXHRcdC8vIEN1c3RvbSB2YXJpYWJsZXMuXG5cdFx0ZHouZGF0YVRyYW5zZmVyID0ge1xuXHRcdFx0cG9zdE1heFNpemU6ICRlbC5kYXRhc2V0Lm1heFNpemUsXG5cdFx0XHRuYW1lOiAkZWwuZGF0YXNldC5pbnB1dE5hbWUsXG5cdFx0XHRmb3JtSWQ6IGZvcm1JZCxcblx0XHRcdGZpZWxkSWQ6IGZpZWxkSWQsXG5cdFx0fTtcblxuXHRcdHByZXNldFN1Ym1pdHRlZERhdGEoIGR6ICk7XG5cblx0XHQvLyBQcm9jZXNzIGV2ZW50cy5cblx0XHRkei5vbiggJ3NlbmRpbmcnLCBzZW5kaW5nKCBkeiwge1xuXHRcdFx0YWN0aW9uOiAnd3Bmb3Jtc191cGxvYWRfY2h1bmsnLFxuXHRcdFx0Zm9ybV9pZDogZm9ybUlkLFxuXHRcdFx0ZmllbGRfaWQ6IGZpZWxkSWQsXG5cdFx0fSApICk7XG5cdFx0ZHoub24oICdhZGRlZGZpbGUnLCBhZGRlZEZpbGUoIGR6ICkgKTtcblx0XHRkei5vbiggJ3JlbW92ZWRmaWxlJywgcmVtb3ZlZEZpbGUoIGR6ICkgKTtcblx0XHRkei5vbiggJ2NvbXBsZXRlJywgY29uZmlybUNodW5rc0ZpbmlzaFVwbG9hZCggZHogKSApO1xuXHRcdGR6Lm9uKCAnZXJyb3InLCBlcnJvciggZHogKSApO1xuXG5cdFx0cmV0dXJuIGR6O1xuXHR9XG5cblx0LyoqXG5cdCAqIEhpZGRlbiBEcm9wem9uZSBpbnB1dCBmb2N1cyBldmVudCBoYW5kbGVyLlxuXHQgKlxuXHQgKiBAc2luY2UgMS44LjFcblx0ICovXG5cdGZ1bmN0aW9uIGRyb3B6b25lSW5wdXRGb2N1cygpIHtcblxuXHRcdCQoIHRoaXMgKS5wcmV2KCAnLndwZm9ybXMtdXBsb2FkZXInICkuYWRkQ2xhc3MoICd3cGZvcm1zLWZvY3VzJyApO1xuXHR9XG5cblx0LyoqXG5cdCAqIEhpZGRlbiBEcm9wem9uZSBpbnB1dCBibHVyIGV2ZW50IGhhbmRsZXIuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjguMVxuXHQgKi9cblx0ZnVuY3Rpb24gZHJvcHpvbmVJbnB1dEJsdXIoKSB7XG5cblx0XHQkKCB0aGlzICkucHJldiggJy53cGZvcm1zLXVwbG9hZGVyJyApLnJlbW92ZUNsYXNzKCAnd3Bmb3Jtcy1mb2N1cycgKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBIaWRkZW4gRHJvcHpvbmUgaW5wdXQgYmx1ciBldmVudCBoYW5kbGVyLlxuXHQgKlxuXHQgKiBAc2luY2UgMS44LjFcblx0ICpcblx0ICogQHBhcmFtIHtvYmplY3R9IGUgRXZlbnQgb2JqZWN0LlxuXHQgKi9cblx0ZnVuY3Rpb24gZHJvcHpvbmVJbnB1dEtleXByZXNzKCBlICkge1xuXG5cdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG5cdFx0aWYgKCBlLmtleUNvZGUgIT09IDEzICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdCQoIHRoaXMgKS5wcmV2KCAnLndwZm9ybXMtdXBsb2FkZXInICkudHJpZ2dlciggJ2NsaWNrJyApO1xuXHR9XG5cblx0LyoqXG5cdCAqIEhpZGRlbiBEcm9wem9uZSBpbnB1dCBibHVyIGV2ZW50IGhhbmRsZXIuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjguMVxuXHQgKi9cblx0ZnVuY3Rpb24gZHJvcHpvbmVDbGljaygpIHtcblxuXHRcdCQoIHRoaXMgKS5uZXh0KCAnLmRyb3B6b25lLWlucHV0JyApLnRyaWdnZXIoICdmb2N1cycgKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBFdmVudHMuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjguMVxuXHQgKi9cblx0ZnVuY3Rpb24gZXZlbnRzKCkge1xuXG5cdFx0JCggJy5kcm9wem9uZS1pbnB1dCcgKVxuXHRcdFx0Lm9uKCAnZm9jdXMnLCBkcm9wem9uZUlucHV0Rm9jdXMgKVxuXHRcdFx0Lm9uKCAnYmx1cicsIGRyb3B6b25lSW5wdXRCbHVyIClcblx0XHRcdC5vbiggJ2tleXByZXNzJywgZHJvcHpvbmVJbnB1dEtleXByZXNzICk7XG5cblx0XHQkKCAnLndwZm9ybXMtdXBsb2FkZXInIClcblx0XHRcdC5vbiggJ2NsaWNrJywgZHJvcHpvbmVDbGljayApO1xuXHR9XG5cblx0LyoqXG5cdCAqIERPTUNvbnRlbnRMb2FkZWQgaGFuZGxlci5cblx0ICpcblx0ICogQHNpbmNlIDEuNS42XG5cdCAqL1xuXHRmdW5jdGlvbiByZWFkeSgpIHtcblxuXHRcdHdpbmRvdy53cGZvcm1zID0gd2luZG93LndwZm9ybXMgfHwge307XG5cdFx0d2luZG93LndwZm9ybXMuZHJvcHpvbmVzID0gW10uc2xpY2UuY2FsbCggZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCggJy53cGZvcm1zLXVwbG9hZGVyJyApICkubWFwKCBkcm9wWm9uZUluaXQgKTtcblxuXHRcdGV2ZW50cygpO1xuXHR9XG5cblx0LyoqXG5cdCAqIE1vZGVybiBGaWxlIFVwbG9hZCBlbmdpbmUuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjYuMFxuXHQgKi9cblx0dmFyIHdwZm9ybXNNb2Rlcm5GaWxlVXBsb2FkID0ge1xuXG5cdFx0LyoqXG5cdFx0ICogU3RhcnQgdGhlIGluaXRpYWxpemF0aW9uLlxuXHRcdCAqXG5cdFx0ICogQHNpbmNlIDEuNi4wXG5cdFx0ICovXG5cdFx0aW5pdDogZnVuY3Rpb24oKSB7XG5cblx0XHRcdGlmICggZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gJ2xvYWRpbmcnICkge1xuXHRcdFx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCAnRE9NQ29udGVudExvYWRlZCcsIHJlYWR5ICk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZWFkeSgpO1xuXHRcdFx0fVxuXHRcdH0sXG5cdH07XG5cblx0Ly8gQ2FsbCBpbml0IGFuZCBzYXZlIGluIGdsb2JhbCB2YXJpYWJsZS5cblx0d3Bmb3Jtc01vZGVybkZpbGVVcGxvYWQuaW5pdCgpO1xuXHR3aW5kb3cud3Bmb3Jtc01vZGVybkZpbGVVcGxvYWQgPSB3cGZvcm1zTW9kZXJuRmlsZVVwbG9hZDtcblxufSggalF1ZXJ5ICkgKTtcbiJdLCJtYXBw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
},{}]},{},[1])