'use strict';

( function() {

	/**
	 * Toggle loading message above submit button.
	 *
	 * @since 1.5.6
	 *
	 * @param {object} $form jQuery form element.
	 *
	 * @returns {Function} event handler function.
	 */
	function toggleLoadingMessage( $form ) {

		return function() {
			if ( ! $form.find( '.wpforms-uploading-in-progress-alert' ).length ) {
				$form.find( '.wpforms-submit-container' ).before( '<div class="wpforms-error-alert wpforms-uploading-in-progress-alert">' + window.wpforms_file_upload.loading_message + '</div>' );
			}
		};
	}

	/**
	 * Disable submit button when we are sending files to the server.
	 *
	 * @since 1.5.6
	 *
	 * @param {object} dz Dropzone object.
	 */
	function toggleSubmit( dz ) {

		var $form    = jQuery( dz.element ).closest( 'form' );
		var $btn     = $form.find( '.wpforms-submit' );
		var disabled = dz.loading > 0;
		var handler  = toggleLoadingMessage( $form );

		if ( disabled ) {
			$btn.prop( 'disabled', true );
			if ( ! $form.find( '.wpforms-submit-overlay' ).length ) {
				$btn.parent().addClass( 'wpforms-submit-overlay-container' );
				$btn.parent().append( '<div class="wpforms-submit-overlay"></div>' );
				$form.find( '.wpforms-submit-overlay' ).css( 'width', $btn.outerWidth() + 'px' );
				$form.find( '.wpforms-submit-overlay' ).css( 'height', $btn.parent().outerHeight() + 'px' );
				$form.find( '.wpforms-submit-overlay' ).on( 'click', handler );
			}
		} else {
			$btn.prop( 'disabled', false );
			$form.find( '.wpforms-submit-overlay' ).off( 'click', handler );
			$form.find( '.wpforms-submit-overlay' ).remove();
			$btn.parent().removeClass( 'wpforms-submit-overlay-container' );
			if ( $form.find( '.wpforms-uploading-in-progress-alert' ).length ) {
				$form.find( '.wpforms-uploading-in-progress-alert' ).remove();
			}
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
	function parseJSON( str ) {
		try {
			return JSON.parse( str );
		} catch ( e ) {
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
	function onlyWithLength( el ) {
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
	function onlyPositive( el ) {
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
	function getXHR( el ) {
		return el.xhr;
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
	function getResponseText( el ) {
		return el.responseText;
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
	function getData( el ) {
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
	function getValue( files ) {
		return files
			.map( getXHR )
			.filter( onlyPositive )
			.map( getResponseText )
			.filter( onlyWithLength )
			.map( parseJSON )
			.filter( onlyPositive )
			.map( getData );
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
	function sending( dz, data ) {

		return function( file, xhr, formData ) {

			/*
			 * We should not allow sending a file, that exceeds server post_max_size.
			 * With this "hack" we redefine the default send functionality
			 * to prevent only this object from sending a request at all.
			 * The file that generated that error should be marked as rejected,
			 * so Dropzone will silently ignore it.
			 */
			if ( file.size > this.dataTransfer.postMaxSize ) {
				xhr.send = function() {};

				file.accepted = false;
				file.processing = false;
				file.status = 'rejected';
				file.previewElement.classList.add( 'dz-error' );
				file.previewElement.classList.add( 'dz-complete' );

				return;
			}

			this.loading = this.loading || 0;
			this.loading++;
			toggleSubmit( this );
			Object.keys( data ).forEach( function( key ) {
				formData.append( key, data[key] );
			} );
		};
	}

	/**
	 * Convert files to input value.
	 *
	 * @since 1.5.6
	 *
	 * @param {object} files Files list.
	 *
	 * @returns {string} Converted value.
	 */
	function convertFilesToValue( files ) {

		return files.length ? JSON.stringify( files ) : '';
	}

	/**
	 * Update value in input.
	 *
	 * @since 1.5.6
	 *
	 * @param {object} dz Dropzone object.
	 */
	function updateInputValue( dz ) {

		var $input = jQuery( dz.element ).parents( '.wpforms-field-file-upload' ).find( 'input[name=' + dz.dataTransfer.name + ']' );

		$input.val( convertFilesToValue( getValue( dz.files ) ) ).trigger( 'input' );

		if ( typeof jQuery.fn.valid !== 'undefined' ) {
			$input.valid();
		}
	}

	/**
	 * Complete event higher order function.
	 *
	 * @since 1.5.6
	 *
	 * @param {object} dz Dropzone object.
	 *
	 * @returns {Function} Handler function.
	 */
	function complete( dz ) {

		return function() {
			dz.loading = dz.loading || 0;
			dz.loading--;
			toggleSubmit( dz );
			updateInputValue( dz );
		};
	}

	/**
	 * Toggle showing empty message.
	 *
	 * @since 1.5.6
	 *
	 * @param {object} dz Dropzone object.
	 */
	function toggleMessage( dz ) {

		setTimeout( function() {
			var validFiles = dz.files.filter( function( file ) {
				return file.accepted;
			} );

			if ( validFiles.length >= dz.options.maxFiles ) {
				dz.element.querySelector( '.dz-message' ).classList.add( 'hide' );
			} else {
				dz.element.querySelector( '.dz-message' ).classList.remove( 'hide' );
			}
		}, 0 );
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
	function validatePostMaxSizeError( file, dz ) {

		setTimeout( function() {
			if ( file.size >= dz.dataTransfer.postMaxSize ) {
				var errorMessage = window.wpforms_file_upload.errors.post_max_size;
				if ( ! file.isErrorNotUploadedDisplayed ) {
					file.isErrorNotUploadedDisplayed = true;
					errorMessage = window.wpforms_file_upload.errors.file_not_uploaded + ' ' + errorMessage;
				}

				var span = document.createElement( 'span' );
				span.innerText = errorMessage;
				span.setAttribute( 'data-dz-errormessage', '' );

				file.previewElement.querySelector( '.dz-error-message' ).appendChild( span );
			}
		}, 1 );
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
	function addedFile( dz ) {

		return function( file ) {

			validatePostMaxSizeError( file, dz );
			toggleMessage( dz );
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
	function removeFromServer( file, dz ) {

		wp.ajax.post( {
			action: 'wpforms_remove_file',
			file: file,
			form_id: dz.dataTransfer.formId,
			field_id: dz.dataTransfer.fieldId,
		} );
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
	function removedFile( dz ) {

		return function( file ) {
			toggleMessage( dz );

			if ( file.xhr ) {
				var json = parseJSON( file.xhr.responseText );

				if ( json ) {
					removeFromServer( json.data.file, dz );
				}
			}

			updateInputValue( dz );
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
	function error( dz ) {

		return function( file, errorMessage ) {

			if ( file.isErrorNotUploadedDisplayed ) {
				return;
			}

			file.isErrorNotUploadedDisplayed = true;
			file.previewElement.querySelectorAll( '[data-dz-errormessage]' )[0].textContent = window.wpforms_file_upload.errors.file_not_uploaded + ' ' + errorMessage;
		};
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
	function dropZoneInit( $el ) {

		var formId = parseInt( $el.dataset.formId, 10 );
		var fieldId = parseInt( $el.dataset.fieldId, 10 ) || 0;
		var maxFiles = parseInt( $el.dataset.maxFileNumber, 10 );

		var acceptedFiles = $el.dataset.extensions.split( ',' ).map( function( el ) {
			return '.' + el;
		} ).join( ',' );

		// Configure and modify Dropzone library.
		var dz = new window.Dropzone( $el, {
			url: window.wpforms_file_upload.url,
			addRemoveLinks: true,
			maxFilesize: ( parseInt( $el.dataset.maxSize, 10 ) / 1000000 ).toFixed( 2 ),
			maxFiles: maxFiles,
			acceptedFiles: acceptedFiles,
			dictMaxFilesExceeded: window.wpforms_file_upload.errors.file_limit.replace( '{fileLimit}', maxFiles ),
			dictInvalidFileType: window.wpforms_file_upload.errors.file_extension,
			dictFileTooBig: window.wpforms_file_upload.errors.file_size,
		} );

		// Custom variables.
		dz.dataTransfer = {
			name: $el.dataset.inputName,
			postMaxSize: parseInt( $el.dataset.postMaxSize, 10 ),
			formId: formId,
			fieldId: fieldId,
		};

		// Process events.
		dz.on( 'sending', sending( dz, {
			action: 'wpforms_upload_file',
			form_id: formId,
			field_id: fieldId,
		} ) );
		dz.on( 'addedfile', addedFile( dz ) );
		dz.on( 'removedfile', removedFile( dz ) );
		dz.on( 'complete', complete( dz ) );
		dz.on( 'error', error( dz ) );

		return dz;
	}

	/**
	 * DOMContentLoaded handler.
	 *
	 * @since 1.5.6
	 */
	function ready() {
		window.wpforms = window.wpforms || {};
		window.wpforms.dropzones = [].slice.call( document.querySelectorAll( '.wpforms-uploader' ) ).map( dropZoneInit );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', ready );
	} else {
		ready();
	}

}() );
