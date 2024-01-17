(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

(function () {
  /**
   * Predefine hint text to display.
   *
   * @since 1.5.6
   * @since 1.6.4 Added a new macros - {remaining}.
   *
   * @param {string} hintText Hint text.
   * @param {number} count Current count.
   * @param {number} limit Limit to.
   *
   * @returns {string} Predefined hint text.
   */
  function renderHint(hintText, count, limit) {
    return hintText.replace('{count}', count).replace('{limit}', limit).replace('{remaining}', limit - count);
  }

  /**
   * Create HTMLElement hint element with text.
   *
   * @since 1.5.6
   *
   * @param {number} formId Form id.
   * @param {number} fieldId Form field id.
   * @param {string} text Text to hint element.
   *
   * @returns {object} HTMLElement hint element with text.
   */
  function createHint(formId, fieldId, text) {
    var hint = document.createElement('div');
    hint.classList.add('wpforms-field-limit-text');
    hint.id = 'wpforms-field-limit-text-' + formId + '-' + fieldId;
    hint.setAttribute('aria-live', 'polite');
    hint.textContent = text;
    return hint;
  }

  /**
   * Keyup/Keydown event higher order function for characters limit.
   *
   * @since 1.5.6
   *
   * @param {object} hint HTMLElement hint element.
   * @param {number} limit Max allowed number of characters.
   *
   * @returns {Function} Handler function.
   */
  function checkCharacters(hint, limit) {
    return function (e) {
      hint.textContent = renderHint(window.wpforms_settings.val_limit_characters, this.value.length, limit);
    };
  }

  /**
   * Count words in the string.
   *
   * @since 1.6.2
   *
   * @param {string} string String value.
   *
   * @returns {number} Words count.
   */
  function countWords(string) {
    if (typeof string !== 'string') {
      return 0;
    }
    if (!string.length) {
      return 0;
    }
    [/([A-Z]+),([A-Z]+)/gi, /([0-9]+),([A-Z]+)/gi, /([A-Z]+),([0-9]+)/gi].forEach(function (pattern) {
      string = string.replace(pattern, '$1, $2');
    });
    return string.split(/\s+/).length;
  }

  /**
   * Keyup/Keydown event higher order function for words limit.
   *
   * @since 1.5.6
   *
   * @param {object} hint HTMLElement hint element.
   * @param {number} limit Max allowed number of characters.
   *
   * @returns {Function} Handler function.
   */
  function checkWords(hint, limit) {
    return function (e) {
      var value = this.value.trim(),
        words = countWords(value);
      hint.textContent = renderHint(window.wpforms_settings.val_limit_words, words, limit);

      // We should prevent the keys: Enter, Space, Comma.
      if ([13, 32, 188].indexOf(e.keyCode) > -1 && words >= limit) {
        e.preventDefault();
      }
    };
  }

  /**
   * Get passed text from clipboard.
   *
   * @since 1.5.6
   *
   * @param {ClipboardEvent} e Clipboard event.
   *
   * @returns {string} Text from clipboard.
   */
  function getPastedText(e) {
    if (window.clipboardData && window.clipboardData.getData) {
      // IE

      return window.clipboardData.getData('Text');
    } else if (e.clipboardData && e.clipboardData.getData) {
      return e.clipboardData.getData('text/plain');
    }
  }

  /**
   * Paste event higher order function for characters limit.
   *
   * @since 1.6.7.1
   *
   * @param {number} limit Max allowed number of characters.
   *
   * @returns {Function} Event handler.
   */
  function pasteText(limit) {
    return function (e) {
      e.preventDefault();
      var pastedText = getPastedText(e),
        newPosition = this.selectionStart + pastedText.length,
        newText = this.value.substring(0, this.selectionStart) + pastedText + this.value.substring(this.selectionStart);
      this.value = newText.substring(0, limit);
      this.setSelectionRange(newPosition, newPosition);
    };
  }

  /**
   * Limit string length to a certain number of words, preserving line breaks.
   *
   * @since 1.6.8
   *
   * @param {string} text  Text.
   * @param {number} limit Max allowed number of words.
   *
   * @returns {string} Text with the limited number of words.
   */
  function limitWords(text, limit) {
    var separators,
      newTextArray,
      result = '';

    // Regular expression pattern: match any space character.
    var regEx = /\s+/g;

    // Store separators for further join.
    separators = text.trim().match(regEx) || [];

    // Split the new text by regular expression.
    newTextArray = text.split(regEx);

    // Limit the number of words.
    newTextArray.splice(limit, newTextArray.length);

    // Join the words together using stored separators.
    for (var i = 0; i < newTextArray.length; i++) {
      result += newTextArray[i] + (separators[i] || '');
    }
    return result.trim();
  }

  /**
   * Paste event higher order function for words limit.
   *
   * @since 1.5.6
   *
   * @param {number} limit Max allowed number of words.
   *
   * @returns {Function} Event handler.
   */
  function pasteWords(limit) {
    return function (e) {
      e.preventDefault();
      var pastedText = getPastedText(e),
        newPosition = this.selectionStart + pastedText.length,
        newText = this.value.substring(0, this.selectionStart) + pastedText + this.value.substring(this.selectionStart);
      this.value = limitWords(newText, limit);
      this.setSelectionRange(newPosition, newPosition);
    };
  }

  /**
   * Array.form polyfill.
   *
   * @since 1.5.6
   *
   * @param {object} el Iterator.
   *
   * @returns {object} Array.
   */
  function arrFrom(el) {
    return [].slice.call(el);
  }

  /**
   * DOMContentLoaded handler.
   *
   * @since 1.5.6
   */
  function ready() {
    arrFrom(document.querySelectorAll('.wpforms-limit-characters-enabled')).map(function (e) {
      var limit = parseInt(e.dataset.textLimit, 10) || 0;
      e.value = e.value.slice(0, limit);
      var hint = createHint(e.dataset.formId, e.dataset.fieldId, renderHint(window.wpforms_settings.val_limit_characters, e.value.length, limit));
      var fn = checkCharacters(hint, limit);
      e.parentNode.appendChild(hint);
      e.addEventListener('keydown', fn);
      e.addEventListener('keyup', fn);
      e.addEventListener('paste', pasteText(limit));
    });
    arrFrom(document.querySelectorAll('.wpforms-limit-words-enabled')).map(function (e) {
      var limit = parseInt(e.dataset.textLimit, 10) || 0;
      e.value = limitWords(e.value, limit);
      var hint = createHint(e.dataset.formId, e.dataset.fieldId, renderHint(window.wpforms_settings.val_limit_words, countWords(e.value.trim()), limit));
      var fn = checkWords(hint, limit);
      e.parentNode.appendChild(hint);
      e.addEventListener('keydown', fn);
      e.addEventListener('keyup', fn);
      e.addEventListener('paste', pasteWords(limit));
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready);
  } else {
    ready();
  }
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJyZW5kZXJIaW50IiwiaGludFRleHQiLCJjb3VudCIsImxpbWl0IiwicmVwbGFjZSIsImNyZWF0ZUhpbnQiLCJmb3JtSWQiLCJmaWVsZElkIiwidGV4dCIsImhpbnQiLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJjbGFzc0xpc3QiLCJhZGQiLCJpZCIsInNldEF0dHJpYnV0ZSIsInRleHRDb250ZW50IiwiY2hlY2tDaGFyYWN0ZXJzIiwiZSIsIndpbmRvdyIsIndwZm9ybXNfc2V0dGluZ3MiLCJ2YWxfbGltaXRfY2hhcmFjdGVycyIsInZhbHVlIiwibGVuZ3RoIiwiY291bnRXb3JkcyIsInN0cmluZyIsImZvckVhY2giLCJwYXR0ZXJuIiwic3BsaXQiLCJjaGVja1dvcmRzIiwidHJpbSIsIndvcmRzIiwidmFsX2xpbWl0X3dvcmRzIiwiaW5kZXhPZiIsImtleUNvZGUiLCJwcmV2ZW50RGVmYXVsdCIsImdldFBhc3RlZFRleHQiLCJjbGlwYm9hcmREYXRhIiwiZ2V0RGF0YSIsInBhc3RlVGV4dCIsInBhc3RlZFRleHQiLCJuZXdQb3NpdGlvbiIsInNlbGVjdGlvblN0YXJ0IiwibmV3VGV4dCIsInN1YnN0cmluZyIsInNldFNlbGVjdGlvblJhbmdlIiwibGltaXRXb3JkcyIsInNlcGFyYXRvcnMiLCJuZXdUZXh0QXJyYXkiLCJyZXN1bHQiLCJyZWdFeCIsIm1hdGNoIiwic3BsaWNlIiwiaSIsInBhc3RlV29yZHMiLCJhcnJGcm9tIiwiZWwiLCJzbGljZSIsImNhbGwiLCJyZWFkeSIsInF1ZXJ5U2VsZWN0b3JBbGwiLCJtYXAiLCJwYXJzZUludCIsImRhdGFzZXQiLCJ0ZXh0TGltaXQiLCJmbiIsInBhcmVudE5vZGUiLCJhcHBlbmRDaGlsZCIsImFkZEV2ZW50TGlzdGVuZXIiLCJyZWFkeVN0YXRlIl0sInNvdXJjZXMiOlsiZmFrZV9jNDY3MGRlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuKCBmdW5jdGlvbigpIHtcblxuXHQvKipcblx0ICogUHJlZGVmaW5lIGhpbnQgdGV4dCB0byBkaXNwbGF5LlxuXHQgKlxuXHQgKiBAc2luY2UgMS41LjZcblx0ICogQHNpbmNlIDEuNi40IEFkZGVkIGEgbmV3IG1hY3JvcyAtIHtyZW1haW5pbmd9LlxuXHQgKlxuXHQgKiBAcGFyYW0ge3N0cmluZ30gaGludFRleHQgSGludCB0ZXh0LlxuXHQgKiBAcGFyYW0ge251bWJlcn0gY291bnQgQ3VycmVudCBjb3VudC5cblx0ICogQHBhcmFtIHtudW1iZXJ9IGxpbWl0IExpbWl0IHRvLlxuXHQgKlxuXHQgKiBAcmV0dXJucyB7c3RyaW5nfSBQcmVkZWZpbmVkIGhpbnQgdGV4dC5cblx0ICovXG5cdGZ1bmN0aW9uIHJlbmRlckhpbnQoIGhpbnRUZXh0LCBjb3VudCwgbGltaXQgKSB7XG5cblx0XHRyZXR1cm4gaGludFRleHQucmVwbGFjZSggJ3tjb3VudH0nLCBjb3VudCApLnJlcGxhY2UoICd7bGltaXR9JywgbGltaXQgKS5yZXBsYWNlKCAne3JlbWFpbmluZ30nLCBsaW1pdCAtIGNvdW50ICk7XG5cdH1cblxuXHQvKipcblx0ICogQ3JlYXRlIEhUTUxFbGVtZW50IGhpbnQgZWxlbWVudCB3aXRoIHRleHQuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjUuNlxuXHQgKlxuXHQgKiBAcGFyYW0ge251bWJlcn0gZm9ybUlkIEZvcm0gaWQuXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBmaWVsZElkIEZvcm0gZmllbGQgaWQuXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0IFRleHQgdG8gaGludCBlbGVtZW50LlxuXHQgKlxuXHQgKiBAcmV0dXJucyB7b2JqZWN0fSBIVE1MRWxlbWVudCBoaW50IGVsZW1lbnQgd2l0aCB0ZXh0LlxuXHQgKi9cblx0ZnVuY3Rpb24gY3JlYXRlSGludCggZm9ybUlkLCBmaWVsZElkLCB0ZXh0ICkge1xuXG5cdFx0dmFyIGhpbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnZGl2JyApO1xuXHRcdGhpbnQuY2xhc3NMaXN0LmFkZCggJ3dwZm9ybXMtZmllbGQtbGltaXQtdGV4dCcgKTtcblx0XHRoaW50LmlkID0gJ3dwZm9ybXMtZmllbGQtbGltaXQtdGV4dC0nICsgZm9ybUlkICsgJy0nICsgZmllbGRJZDtcblx0XHRoaW50LnNldEF0dHJpYnV0ZSggJ2FyaWEtbGl2ZScsICdwb2xpdGUnICk7XG5cdFx0aGludC50ZXh0Q29udGVudCA9IHRleHQ7XG5cblx0XHRyZXR1cm4gaGludDtcblx0fVxuXG5cdC8qKlxuXHQgKiBLZXl1cC9LZXlkb3duIGV2ZW50IGhpZ2hlciBvcmRlciBmdW5jdGlvbiBmb3IgY2hhcmFjdGVycyBsaW1pdC5cblx0ICpcblx0ICogQHNpbmNlIDEuNS42XG5cdCAqXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBoaW50IEhUTUxFbGVtZW50IGhpbnQgZWxlbWVudC5cblx0ICogQHBhcmFtIHtudW1iZXJ9IGxpbWl0IE1heCBhbGxvd2VkIG51bWJlciBvZiBjaGFyYWN0ZXJzLlxuXHQgKlxuXHQgKiBAcmV0dXJucyB7RnVuY3Rpb259IEhhbmRsZXIgZnVuY3Rpb24uXG5cdCAqL1xuXHRmdW5jdGlvbiBjaGVja0NoYXJhY3RlcnMoIGhpbnQsIGxpbWl0ICkge1xuXG5cdFx0cmV0dXJuIGZ1bmN0aW9uKCBlICkge1xuXG5cdFx0XHRoaW50LnRleHRDb250ZW50ID0gcmVuZGVySGludChcblx0XHRcdFx0d2luZG93LndwZm9ybXNfc2V0dGluZ3MudmFsX2xpbWl0X2NoYXJhY3RlcnMsXG5cdFx0XHRcdHRoaXMudmFsdWUubGVuZ3RoLFxuXHRcdFx0XHRsaW1pdFxuXHRcdFx0KTtcblx0XHR9O1xuXHR9XG5cblx0LyoqXG5cdCAqIENvdW50IHdvcmRzIGluIHRoZSBzdHJpbmcuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjYuMlxuXHQgKlxuXHQgKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIFN0cmluZyB2YWx1ZS5cblx0ICpcblx0ICogQHJldHVybnMge251bWJlcn0gV29yZHMgY291bnQuXG5cdCAqL1xuXHRmdW5jdGlvbiBjb3VudFdvcmRzKCBzdHJpbmcgKSB7XG5cblx0XHRpZiAoIHR5cGVvZiBzdHJpbmcgIT09ICdzdHJpbmcnICkge1xuXHRcdFx0cmV0dXJuIDA7XG5cdFx0fVxuXG5cdFx0aWYgKCAhIHN0cmluZy5sZW5ndGggKSB7XG5cdFx0XHRyZXR1cm4gMDtcblx0XHR9XG5cblx0XHRbXG5cdFx0XHQvKFtBLVpdKyksKFtBLVpdKykvZ2ksXG5cdFx0XHQvKFswLTldKyksKFtBLVpdKykvZ2ksXG5cdFx0XHQvKFtBLVpdKyksKFswLTldKykvZ2ksXG5cdFx0XS5mb3JFYWNoKCBmdW5jdGlvbiggcGF0dGVybiApIHtcblx0XHRcdHN0cmluZyA9IHN0cmluZy5yZXBsYWNlKCBwYXR0ZXJuLCAnJDEsICQyJyApO1xuXHRcdH0gKTtcblxuXHRcdHJldHVybiBzdHJpbmcuc3BsaXQoIC9cXHMrLyApLmxlbmd0aDtcblx0fVxuXG5cdC8qKlxuXHQgKiBLZXl1cC9LZXlkb3duIGV2ZW50IGhpZ2hlciBvcmRlciBmdW5jdGlvbiBmb3Igd29yZHMgbGltaXQuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjUuNlxuXHQgKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gaGludCBIVE1MRWxlbWVudCBoaW50IGVsZW1lbnQuXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBsaW1pdCBNYXggYWxsb3dlZCBudW1iZXIgb2YgY2hhcmFjdGVycy5cblx0ICpcblx0ICogQHJldHVybnMge0Z1bmN0aW9ufSBIYW5kbGVyIGZ1bmN0aW9uLlxuXHQgKi9cblx0ZnVuY3Rpb24gY2hlY2tXb3JkcyggaGludCwgbGltaXQgKSB7XG5cblx0XHRyZXR1cm4gZnVuY3Rpb24oIGUgKSB7XG5cblx0XHRcdHZhciB2YWx1ZSA9IHRoaXMudmFsdWUudHJpbSgpLFxuXHRcdFx0XHR3b3JkcyA9IGNvdW50V29yZHMoIHZhbHVlICk7XG5cblx0XHRcdGhpbnQudGV4dENvbnRlbnQgPSByZW5kZXJIaW50KFxuXHRcdFx0XHR3aW5kb3cud3Bmb3Jtc19zZXR0aW5ncy52YWxfbGltaXRfd29yZHMsXG5cdFx0XHRcdHdvcmRzLFxuXHRcdFx0XHRsaW1pdFxuXHRcdFx0KTtcblxuXHRcdFx0Ly8gV2Ugc2hvdWxkIHByZXZlbnQgdGhlIGtleXM6IEVudGVyLCBTcGFjZSwgQ29tbWEuXG5cdFx0XHRpZiAoIFsgMTMsIDMyLCAxODggXS5pbmRleE9mKCBlLmtleUNvZGUgKSA+IC0xICYmIHdvcmRzID49IGxpbWl0ICkge1xuXHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHR9XG5cdFx0fTtcblx0fVxuXG5cdC8qKlxuXHQgKiBHZXQgcGFzc2VkIHRleHQgZnJvbSBjbGlwYm9hcmQuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjUuNlxuXHQgKlxuXHQgKiBAcGFyYW0ge0NsaXBib2FyZEV2ZW50fSBlIENsaXBib2FyZCBldmVudC5cblx0ICpcblx0ICogQHJldHVybnMge3N0cmluZ30gVGV4dCBmcm9tIGNsaXBib2FyZC5cblx0ICovXG5cdGZ1bmN0aW9uIGdldFBhc3RlZFRleHQoIGUgKSB7XG5cblx0XHRpZiAoIHdpbmRvdy5jbGlwYm9hcmREYXRhICYmIHdpbmRvdy5jbGlwYm9hcmREYXRhLmdldERhdGEgKSB7IC8vIElFXG5cblx0XHRcdHJldHVybiB3aW5kb3cuY2xpcGJvYXJkRGF0YS5nZXREYXRhKCAnVGV4dCcgKTtcblx0XHR9IGVsc2UgaWYgKCBlLmNsaXBib2FyZERhdGEgJiYgZS5jbGlwYm9hcmREYXRhLmdldERhdGEgKSB7XG5cblx0XHRcdHJldHVybiBlLmNsaXBib2FyZERhdGEuZ2V0RGF0YSggJ3RleHQvcGxhaW4nICk7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIFBhc3RlIGV2ZW50IGhpZ2hlciBvcmRlciBmdW5jdGlvbiBmb3IgY2hhcmFjdGVycyBsaW1pdC5cblx0ICpcblx0ICogQHNpbmNlIDEuNi43LjFcblx0ICpcblx0ICogQHBhcmFtIHtudW1iZXJ9IGxpbWl0IE1heCBhbGxvd2VkIG51bWJlciBvZiBjaGFyYWN0ZXJzLlxuXHQgKlxuXHQgKiBAcmV0dXJucyB7RnVuY3Rpb259IEV2ZW50IGhhbmRsZXIuXG5cdCAqL1xuXHRmdW5jdGlvbiBwYXN0ZVRleHQoIGxpbWl0ICkge1xuXG5cdFx0cmV0dXJuIGZ1bmN0aW9uKCBlICkge1xuXG5cdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cblx0XHRcdHZhciBwYXN0ZWRUZXh0ID0gZ2V0UGFzdGVkVGV4dCggZSApLFxuXHRcdFx0XHRuZXdQb3NpdGlvbiA9IHRoaXMuc2VsZWN0aW9uU3RhcnQgKyBwYXN0ZWRUZXh0Lmxlbmd0aCxcblx0XHRcdFx0bmV3VGV4dCA9IHRoaXMudmFsdWUuc3Vic3RyaW5nKCAwLCB0aGlzLnNlbGVjdGlvblN0YXJ0ICkgKyBwYXN0ZWRUZXh0ICsgdGhpcy52YWx1ZS5zdWJzdHJpbmcoIHRoaXMuc2VsZWN0aW9uU3RhcnQgKTtcblxuXHRcdFx0dGhpcy52YWx1ZSA9IG5ld1RleHQuc3Vic3RyaW5nKCAwLCBsaW1pdCApO1xuXHRcdFx0dGhpcy5zZXRTZWxlY3Rpb25SYW5nZSggbmV3UG9zaXRpb24sIG5ld1Bvc2l0aW9uICk7XG5cdFx0fTtcblx0fVxuXG5cdC8qKlxuXHQgKiBMaW1pdCBzdHJpbmcgbGVuZ3RoIHRvIGEgY2VydGFpbiBudW1iZXIgb2Ygd29yZHMsIHByZXNlcnZpbmcgbGluZSBicmVha3MuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjYuOFxuXHQgKlxuXHQgKiBAcGFyYW0ge3N0cmluZ30gdGV4dCAgVGV4dC5cblx0ICogQHBhcmFtIHtudW1iZXJ9IGxpbWl0IE1heCBhbGxvd2VkIG51bWJlciBvZiB3b3Jkcy5cblx0ICpcblx0ICogQHJldHVybnMge3N0cmluZ30gVGV4dCB3aXRoIHRoZSBsaW1pdGVkIG51bWJlciBvZiB3b3Jkcy5cblx0ICovXG5cdGZ1bmN0aW9uIGxpbWl0V29yZHMoIHRleHQsIGxpbWl0ICkge1xuXG5cdFx0dmFyIHNlcGFyYXRvcnMsXG5cdFx0XHRuZXdUZXh0QXJyYXksXG5cdFx0XHRyZXN1bHQgPSAnJztcblxuXHRcdC8vIFJlZ3VsYXIgZXhwcmVzc2lvbiBwYXR0ZXJuOiBtYXRjaCBhbnkgc3BhY2UgY2hhcmFjdGVyLlxuXHRcdHZhciByZWdFeCA9IC9cXHMrL2c7XG5cblx0XHQvLyBTdG9yZSBzZXBhcmF0b3JzIGZvciBmdXJ0aGVyIGpvaW4uXG5cdFx0c2VwYXJhdG9ycyA9IHRleHQudHJpbSgpLm1hdGNoKCByZWdFeCApIHx8IFtdO1xuXG5cdFx0Ly8gU3BsaXQgdGhlIG5ldyB0ZXh0IGJ5IHJlZ3VsYXIgZXhwcmVzc2lvbi5cblx0XHRuZXdUZXh0QXJyYXkgPSB0ZXh0LnNwbGl0KCByZWdFeCApO1xuXG5cdFx0Ly8gTGltaXQgdGhlIG51bWJlciBvZiB3b3Jkcy5cblx0XHRuZXdUZXh0QXJyYXkuc3BsaWNlKCBsaW1pdCwgbmV3VGV4dEFycmF5Lmxlbmd0aCApO1xuXG5cdFx0Ly8gSm9pbiB0aGUgd29yZHMgdG9nZXRoZXIgdXNpbmcgc3RvcmVkIHNlcGFyYXRvcnMuXG5cdFx0Zm9yICggdmFyIGkgPSAwOyBpIDwgbmV3VGV4dEFycmF5Lmxlbmd0aDsgaSsrICkge1xuXHRcdFx0cmVzdWx0ICs9IG5ld1RleHRBcnJheVsgaSBdICsgKCBzZXBhcmF0b3JzWyBpIF0gfHwgJycgKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gcmVzdWx0LnRyaW0oKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBQYXN0ZSBldmVudCBoaWdoZXIgb3JkZXIgZnVuY3Rpb24gZm9yIHdvcmRzIGxpbWl0LlxuXHQgKlxuXHQgKiBAc2luY2UgMS41LjZcblx0ICpcblx0ICogQHBhcmFtIHtudW1iZXJ9IGxpbWl0IE1heCBhbGxvd2VkIG51bWJlciBvZiB3b3Jkcy5cblx0ICpcblx0ICogQHJldHVybnMge0Z1bmN0aW9ufSBFdmVudCBoYW5kbGVyLlxuXHQgKi9cblx0ZnVuY3Rpb24gcGFzdGVXb3JkcyggbGltaXQgKSB7XG5cblx0XHRyZXR1cm4gZnVuY3Rpb24oIGUgKSB7XG5cblx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblxuXHRcdFx0dmFyIHBhc3RlZFRleHQgPSBnZXRQYXN0ZWRUZXh0KCBlICksXG5cdFx0XHRcdG5ld1Bvc2l0aW9uID0gdGhpcy5zZWxlY3Rpb25TdGFydCArIHBhc3RlZFRleHQubGVuZ3RoLFxuXHRcdFx0XHRuZXdUZXh0ID0gdGhpcy52YWx1ZS5zdWJzdHJpbmcoIDAsIHRoaXMuc2VsZWN0aW9uU3RhcnQgKSArIHBhc3RlZFRleHQgKyB0aGlzLnZhbHVlLnN1YnN0cmluZyggdGhpcy5zZWxlY3Rpb25TdGFydCApO1xuXG5cdFx0XHR0aGlzLnZhbHVlID0gbGltaXRXb3JkcyggbmV3VGV4dCwgbGltaXQgKTtcblx0XHRcdHRoaXMuc2V0U2VsZWN0aW9uUmFuZ2UoIG5ld1Bvc2l0aW9uLCBuZXdQb3NpdGlvbiApO1xuXHRcdH07XG5cdH1cblxuXHQvKipcblx0ICogQXJyYXkuZm9ybSBwb2x5ZmlsbC5cblx0ICpcblx0ICogQHNpbmNlIDEuNS42XG5cdCAqXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBlbCBJdGVyYXRvci5cblx0ICpcblx0ICogQHJldHVybnMge29iamVjdH0gQXJyYXkuXG5cdCAqL1xuXHRmdW5jdGlvbiBhcnJGcm9tKCBlbCApIHtcblxuXHRcdHJldHVybiBbXS5zbGljZS5jYWxsKCBlbCApO1xuXHR9XG5cblx0LyoqXG5cdCAqIERPTUNvbnRlbnRMb2FkZWQgaGFuZGxlci5cblx0ICpcblx0ICogQHNpbmNlIDEuNS42XG5cdCAqL1xuXHRmdW5jdGlvbiByZWFkeSgpIHtcblxuXHRcdGFyckZyb20oIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoICcud3Bmb3Jtcy1saW1pdC1jaGFyYWN0ZXJzLWVuYWJsZWQnICkgKVxuXHRcdFx0Lm1hcChcblx0XHRcdFx0ZnVuY3Rpb24oIGUgKSB7XG5cblx0XHRcdFx0XHR2YXIgbGltaXQgPSBwYXJzZUludCggZS5kYXRhc2V0LnRleHRMaW1pdCwgMTAgKSB8fCAwO1xuXHRcdFx0XHRcdGUudmFsdWUgPSBlLnZhbHVlLnNsaWNlKCAwLCBsaW1pdCApO1xuXHRcdFx0XHRcdHZhciBoaW50ID0gY3JlYXRlSGludChcblx0XHRcdFx0XHRcdGUuZGF0YXNldC5mb3JtSWQsXG5cdFx0XHRcdFx0XHRlLmRhdGFzZXQuZmllbGRJZCxcblx0XHRcdFx0XHRcdHJlbmRlckhpbnQoXG5cdFx0XHRcdFx0XHRcdHdpbmRvdy53cGZvcm1zX3NldHRpbmdzLnZhbF9saW1pdF9jaGFyYWN0ZXJzLFxuXHRcdFx0XHRcdFx0XHRlLnZhbHVlLmxlbmd0aCxcblx0XHRcdFx0XHRcdFx0bGltaXRcblx0XHRcdFx0XHRcdClcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdHZhciBmbiA9IGNoZWNrQ2hhcmFjdGVycyggaGludCwgbGltaXQgKTtcblx0XHRcdFx0XHRlLnBhcmVudE5vZGUuYXBwZW5kQ2hpbGQoIGhpbnQgKTtcblxuXHRcdFx0XHRcdGUuYWRkRXZlbnRMaXN0ZW5lciggJ2tleWRvd24nLCBmbiApO1xuXHRcdFx0XHRcdGUuYWRkRXZlbnRMaXN0ZW5lciggJ2tleXVwJywgZm4gKTtcblx0XHRcdFx0XHRlLmFkZEV2ZW50TGlzdGVuZXIoICdwYXN0ZScsIHBhc3RlVGV4dCggbGltaXQgKSApO1xuXHRcdFx0XHR9XG5cdFx0XHQpO1xuXG5cdFx0YXJyRnJvbSggZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCggJy53cGZvcm1zLWxpbWl0LXdvcmRzLWVuYWJsZWQnICkgKVxuXHRcdFx0Lm1hcChcblx0XHRcdFx0ZnVuY3Rpb24oIGUgKSB7XG5cblx0XHRcdFx0XHR2YXIgbGltaXQgPSBwYXJzZUludCggZS5kYXRhc2V0LnRleHRMaW1pdCwgMTAgKSB8fCAwO1xuXG5cdFx0XHRcdFx0ZS52YWx1ZSA9IGxpbWl0V29yZHMoIGUudmFsdWUsIGxpbWl0ICk7XG5cblx0XHRcdFx0XHR2YXIgaGludCA9IGNyZWF0ZUhpbnQoXG5cdFx0XHRcdFx0XHRlLmRhdGFzZXQuZm9ybUlkLFxuXHRcdFx0XHRcdFx0ZS5kYXRhc2V0LmZpZWxkSWQsXG5cdFx0XHRcdFx0XHRyZW5kZXJIaW50KFxuXHRcdFx0XHRcdFx0XHR3aW5kb3cud3Bmb3Jtc19zZXR0aW5ncy52YWxfbGltaXRfd29yZHMsXG5cdFx0XHRcdFx0XHRcdGNvdW50V29yZHMoIGUudmFsdWUudHJpbSgpICksXG5cdFx0XHRcdFx0XHRcdGxpbWl0XG5cdFx0XHRcdFx0XHQpXG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0XHR2YXIgZm4gPSBjaGVja1dvcmRzKCBoaW50LCBsaW1pdCApO1xuXHRcdFx0XHRcdGUucGFyZW50Tm9kZS5hcHBlbmRDaGlsZCggaGludCApO1xuXG5cdFx0XHRcdFx0ZS5hZGRFdmVudExpc3RlbmVyKCAna2V5ZG93bicsIGZuICk7XG5cdFx0XHRcdFx0ZS5hZGRFdmVudExpc3RlbmVyKCAna2V5dXAnLCBmbiApO1xuXHRcdFx0XHRcdGUuYWRkRXZlbnRMaXN0ZW5lciggJ3Bhc3RlJywgcGFzdGVXb3JkcyggbGltaXQgKSApO1xuXHRcdFx0XHR9XG5cdFx0XHQpO1xuXHR9XG5cblx0aWYgKCBkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnbG9hZGluZycgKSB7XG5cdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lciggJ0RPTUNvbnRlbnRMb2FkZWQnLCByZWFkeSApO1xuXHR9IGVsc2Uge1xuXHRcdHJlYWR5KCk7XG5cdH1cblxufSgpICk7XG4iXSwibWFwcGluZ3MiOiJBQUFBLFlBQVk7O0FBRVYsYUFBVztFQUVaO0FBQ0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNDLFNBQVNBLFVBQVVBLENBQUVDLFFBQVEsRUFBRUMsS0FBSyxFQUFFQyxLQUFLLEVBQUc7SUFFN0MsT0FBT0YsUUFBUSxDQUFDRyxPQUFPLENBQUUsU0FBUyxFQUFFRixLQUFNLENBQUMsQ0FBQ0UsT0FBTyxDQUFFLFNBQVMsRUFBRUQsS0FBTSxDQUFDLENBQUNDLE9BQU8sQ0FBRSxhQUFhLEVBQUVELEtBQUssR0FBR0QsS0FBTSxDQUFDO0VBQ2hIOztFQUVBO0FBQ0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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
},{}]},{},[1])