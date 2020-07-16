<?php

/**
 * File upload field.
 *
 * @since 1.0.0
 */
class WPForms_Field_File_Upload extends WPForms_Field {

	/**
	 * Dropzone plugin version.
	 *
	 * @since 1.5.6
	 *
	 * @var string
	 */
	const DROPZONE_VERSION = '5.5.0';

	/**
	 * Classic (old) style of file uploader field.
	 *
	 * @since 1.5.6
	 *
	 * @var string
	 */
	const STYLE_CLASSIC = 'classic';

	/**
	 * Modern style of file uploader field.
	 *
	 * @since 1.5.6
	 *
	 * @var string
	 */
	const STYLE_MODERN = 'modern';

	/**
	 * Replaceable (either in PHP or JS) template for a maximum file number.
	 *
	 * @since 1.5.8
	 *
	 * @var string
	 */
	const TEMPLATE_MAXFILENUM = '{maxFileNumber}';

	/**
	 * File extensions that are now allowed.
	 *
	 * @since 1.0.0
	 *
	 * @var array
	 */
	private $blacklist = array( 'ade', 'adp', 'app', 'asp', 'bas', 'bat', 'cer', 'cgi', 'chm', 'cmd', 'com', 'cpl', 'crt', 'csh', 'csr', 'dll', 'drv', 'exe', 'fxp', 'flv', 'hlp', 'hta', 'htaccess', 'htm', 'html', 'htpasswd', 'inf', 'ins', 'isp', 'jar', 'js', 'jse', 'jsp', 'ksh', 'lnk', 'mdb', 'mde', 'mdt', 'mdw', 'msc', 'msi', 'msp', 'mst', 'ops', 'pcd', 'php', 'pif', 'pl', 'prg', 'ps1', 'ps2', 'py', 'rb', 'reg', 'scr', 'sct', 'sh', 'shb', 'shs', 'sys', 'swf', 'tmp', 'torrent', 'url', 'vb', 'vbe', 'vbs', 'vbscript', 'wsc', 'wsf', 'wsf', 'wsh', 'dfxp', 'onetmp' );

	/**
	 * Primary class constructor.
	 *
	 * @since 1.0.0
	 */
	public function init() {

		// Define field type information.
		$this->name  = esc_html__( 'File Upload', 'wpforms' );
		$this->type  = 'file-upload';
		$this->icon  = 'fa-upload';
		$this->order = 90;
		$this->group = 'fancy';

		// Form frontend javascript.
		add_action( 'wpforms_frontend_js', array( $this, 'frontend_js' ) );

		// Form frontend CSS.
		add_action( 'wpforms_frontend_css', array( $this, 'frontend_css' ) );

		// Field styles for Gutenberg.
		add_action( 'enqueue_block_editor_assets', array( $this, 'gutenberg_enqueues' ) );

		// Define additional field properties.
		add_filter( 'wpforms_field_properties_file-upload', array( $this, 'field_properties' ), 5, 3 );

		// Customize value format for HTML emails.
		add_filter( 'wpforms_html_field_value', array( $this, 'html_email_value' ), 10, 4 );

		// Add builder strings.
		add_filter( 'wpforms_builder_strings', array( $this, 'add_builder_strings' ), 10, 2 );

		// Maybe format/upload file depending on the conditional visibility state.
		add_action( 'wpforms_process_format_after', array( $this, 'format_conditional' ), 6, 1 );

		// Upload file ajax route.
		add_action( 'wp_ajax_wpforms_upload_file', array( $this, 'ajax_modern_upload' ) );
		add_action( 'wp_ajax_nopriv_wpforms_upload_file', array( $this, 'ajax_modern_upload' ) );

		// Remove file ajax route.
		add_action( 'wp_ajax_wpforms_remove_file', array( $this, 'ajax_modern_remove' ) );
		add_action( 'wp_ajax_nopriv_wpforms_remove_file', array( $this, 'ajax_modern_remove' ) );

		add_filter( 'robots_txt', array( $this, 'disallow_upload_dir_indexing' ), -42 );
	}

	/**
	 * Enqueue frontend field js.
	 *
	 * @since 1.5.6
	 *
	 * @param array $forms Forms on the current page.
	 */
	public function frontend_js( $forms ) {

		$is_file_modern_style = false;

		foreach ( $forms as $form ) {
			if ( $this->is_field_style( $form, self::STYLE_MODERN ) ) {
				$is_file_modern_style = true;

				break;
			}
		}

		if (
			$is_file_modern_style ||
			wpforms()->frontend->assets_global()
		) {

			$min = wpforms_get_min_suffix();

			wp_enqueue_script(
				'wpforms-dropzone',
				WPFORMS_PLUGIN_URL . "pro/assets/js/vendor/dropzone{$min}.js",
				array( 'jquery' ),
				self::DROPZONE_VERSION,
				true
			);

			wp_enqueue_script(
				'wpforms-file-upload',
				WPFORMS_PLUGIN_URL . "pro/assets/js/wpforms-file-upload{$min}.js",
				array( 'wp-util', 'wpforms-dropzone' ),
				WPFORMS_VERSION,
				true
			);

			wp_localize_script(
				'wpforms-dropzone',
				'wpforms_file_upload',
				array(
					'url'             => admin_url( 'admin-ajax.php' ),
					'errors'          => array(
						'file_not_uploaded' => esc_html__( 'This file was not uploaded.', 'wpforms' ),
						'file_limit'        => esc_html__( 'File limit has been reached ({fileLimit}).', 'wpforms' ),
						'file_extension'    => wpforms_setting( 'validation-fileextension', esc_html__( 'File type is not allowed.', 'wpforms' ) ),
						'file_size'         => wpforms_setting( 'validation-filesize', esc_html__( 'File exceeds the max size allowed.', 'wpforms' ) ),
						'post_max_size'     => sprintf( /* translators: %s - max allowed file size by a server. */
							esc_html__( 'File exceeds the upload limit allowed (%s).', 'wpforms' ),
							wpforms_max_upload()
						),
					),
					'loading_message' => esc_html__( 'File upload is in progress. Please submit the form once uploading is completed.', 'wpforms' ),
				)
			);
		}
	}

	/**
	 * Enqueue frontend field CSS.
	 *
	 * @since 1.5.6
	 *
	 * @param array $forms Forms on the current page.
	 */
	public function frontend_css( $forms ) {

		$is_file_modern_style = false;

		foreach ( $forms as $form ) {
			if ( $this->is_field_style( $form, self::STYLE_MODERN ) ) {
				$is_file_modern_style = true;

				break;
			}
		}

		if (
			$is_file_modern_style ||
			wpforms()->frontend->assets_global()
		) {

			$min = wpforms_get_min_suffix();

			wp_enqueue_style(
				'wpforms-dropzone',
				WPFORMS_PLUGIN_URL . "pro/assets/css/dropzone{$min}.css",
				array(),
				self::DROPZONE_VERSION
			);
		}
	}

	/**
	 * Whether provided form has a file field with a specified style.
	 *
	 * @since 1.5.6
	 *
	 * @param array  $form  Form data.
	 * @param string $style Desired field style.
	 *
	 * @return bool
	 */
	protected function is_field_style( $form, $style ) {

		$is_field_style = false;

		if ( empty( $form['fields'] ) ) {
			return $is_field_style;
		}

		foreach ( (array) $form['fields'] as $field ) {

			if (
				! empty( $field['type'] ) &&
				$field['type'] === $this->type &&
				! empty( $field['style'] ) &&
				$field['style'] === sanitize_key( $style )
			) {
				$is_field_style = true;

				break;
			}
		}

		return $is_field_style;
	}

	/**
	 * Load enqueues for the Gutenberg editor.
	 *
	 * @since 1.5.6
	 */
	public function gutenberg_enqueues() {

		$min = wpforms_get_min_suffix();

		wp_enqueue_style(
			'wpforms-dropzone',
			WPFORMS_PLUGIN_URL . "pro/assets/css/dropzone{$min}.css",
			array(),
			self::DROPZONE_VERSION
		);
	}

	/**
	 * Define additional field properties.
	 *
	 * @since 1.3.7
	 *
	 * @param array $properties Field properties.
	 * @param array $field      Field data and settings.
	 * @param array $form_data  Form data and settings.
	 *
	 * @return array
	 */
	public function field_properties( $properties, $field, $form_data ) {

		$this->form_data  = (array) $form_data;
		$this->form_id    = absint( $this->form_data['id'] );
		$this->field_id   = absint( $field['id'] );
		$this->field_data = $this->form_data['fields'][ $this->field_id ];

		// Input Primary: adjust name.
		$properties['inputs']['primary']['attr']['name'] = "wpforms_{$this->form_id}_{$this->field_id}";

		// Input Primary: filter files in classic uploader style in files selection window.
		if ( empty( $this->field_data['style'] ) || self::STYLE_CLASSIC === $this->field_data['style'] ) {
			$properties['inputs']['primary']['attr']['accept'] = rtrim( '.' . implode( ',.', $this->get_extensions() ), ',.' );
		}

		// Input Primary: allowed file extensions.
		$properties['inputs']['primary']['data']['rule-extension'] = implode( ',', $this->get_extensions() );

		// Input Primary: max file size.
		$properties['inputs']['primary']['data']['rule-maxsize'] = $this->max_file_size();

		return $properties;
	}

	/**
	 * Whether current field can be populated dynamically.
	 *
	 * @since 1.5.0
	 *
	 * @param array $properties Field properties.
	 * @param array $field      Current field specific data.
	 *
	 * @return bool
	 */
	public function is_dynamic_population_allowed( $properties, $field ) {

		// We need to disable an ability to steal files from user computer.
		return false;
	}

	/**
	 * Whether current field can be populated dynamically.
	 *
	 * @since 1.5.0
	 *
	 * @param array $properties Field properties.
	 * @param array $field      Current field specific data.
	 *
	 * @return bool
	 */
	public function is_fallback_population_allowed( $properties, $field ) {

		// We need to disable an ability to steal files from user computer.
		return false;
	}

	/**
	 * Customize format for HTML email notifications.
	 *
	 * @since 1.1.3
	 * @since 1.5.6 Added different link generation for classic and modern uploader.
	 *
	 * @param string $val       Field value.
	 * @param array  $field     Field settings.
	 * @param array  $form_data Form data and settings.
	 * @param string $context   Value display context.
	 *
	 * @return string
	 */
	public function html_email_value( $val, $field, $form_data = array(), $context = '' ) {

		if ( empty( $field['value'] ) || $field['type'] !== $this->type ) {
			return $val;
		}

		// Process modern uploader.
		if ( ! empty( $field['value_raw'] ) ) {
			return wpforms_chain( $field['value_raw'] )
				->map(
					static function ( $file ) {

						if ( empty( $file['value'] ) || empty( $file['file_original'] ) ) {
							return '';
						}

						return sprintf(
							'<a href="%s" rel="noopener noreferrer" target="_blank">%s</a>',
							esc_url( $file['value'] ),
							esc_html( $file['file_original'] )
						);
					}
				)
				->array_filter()
				->implode( '<br>' )
				->value();
		}

		// Process classic uploader.
		return sprintf(
			'<a href="%s" rel="noopener" target="_blank">%s</a>',
			esc_url( $field['value'] ),
			esc_html( $field['file_original'] )
		);
	}

	/**
	 * File Upload field specific strings.
	 *
	 * @since 1.5.8
	 *
	 * @return array Field specific strings.
	 */
	public function get_strings() {

		return array(
			'preview_title_single' => esc_html__( 'Click or drag a file to this area to upload.', 'wpforms' ),
			'preview_title_plural' => esc_html__( 'Click or drag files to this area to upload.', 'wpforms' ),
			'preview_hint'         => sprintf( /* translators: % - max number of files as a template string (not a number), replaced by a number later. */
				esc_html__( 'You can upload up to %s files.', 'wpforms' ),
				self::TEMPLATE_MAXFILENUM
			),
		);
	}

	/**
	 * Add Builder strings that are passed to JS.
	 *
	 * @since 1.5.8
	 *
	 * @param array $strings Form Builder strings.
	 * @param array $form    Form Data.
	 *
	 * @return array Form Builder strings.
	 */
	public function add_builder_strings( $strings, $form ) {

		$strings['file_upload'] = $this->get_strings();

		return $strings;
	}

	/**
	 * Field options panel inside the builder.
	 *
	 * @since 1.0.0
	 * @since 1.5.6 Added modern style uploader options.
	 *
	 * @param array $field Field data and settings.
	 */
	public function field_options( $field ) {

		$style = ! empty( $field['style'] ) ? $field['style'] : self::STYLE_MODERN;

		/*
		 * Basic field options.
		 */

		// Options open markup.
		$this->field_option( 'basic-options', $field, array( 'markup' => 'open' ) );

		// Label.
		$this->field_option( 'label', $field );

		// Description.
		$this->field_option( 'description', $field );

		// Allowed extensions.
		$lbl = $this->field_element(
			'label',
			$field,
			array(
				'slug'    => 'extensions',
				'value'   => esc_html__( 'Allowed File Extensions', 'wpforms' ),
				'tooltip' => esc_html__( 'Enter the extensions you would like to allow, comma separated.', 'wpforms' ),
			),
			false
		);
		$fld = $this->field_element(
			'text',
			$field,
			array(
				'slug'  => 'extensions',
				'value' => ! empty( $field['extensions'] ) ? $field['extensions'] : '',
			),
			false
		);
		$this->field_element(
			'row',
			$field,
			array(
				'slug'    => 'extensions',
				'content' => $lbl . $fld,
			)
		);

		// Max file size.
		$lbl = $this->field_element(
			'label',
			$field,
			array(
				'slug'    => 'max_size',
				'value'   => esc_html__( 'Max File Size', 'wpforms' ),
				/* translators: %s - max upload size. */
				'tooltip' => sprintf( esc_html__( 'Enter the max size of each file, in megabytes, to allow. If left blank, the value defaults to the maximum size the server allows which is %s.', 'wpforms' ), wpforms_max_upload() ),
			),
			false
		);
		$fld = $this->field_element(
			'text',
			$field,
			array(
				'slug'  => 'max_size',
				'type'  => 'number',
				'attrs' => array(
					'min'     => 1,
					'max'     => 512,
					'step'    => 1,
					'pattern' => '[0-9]',
				),
				'value' => ! empty( $field['max_size'] ) ? abs( $field['max_size'] ) : '',
			),
			false
		);
		$this->field_element(
			'row',
			$field,
			array(
				'slug'    => 'max_size',
				'content' => $lbl . $fld,
			)
		);

		// Max file number.
		$lbl = $this->field_element(
			'label',
			$field,
			array(
				'slug'    => 'max_file_number',
				'value'   => esc_html__( 'Max File Number', 'wpforms' ),
				'tooltip' => esc_html__( 'Enter the max file number, to allow. If left blank, the value defaults to 1.', 'wpforms' ),
			),
			false
		);
		$fld = $this->field_element(
			'text',
			$field,
			array(
				'slug'  => 'max_file_number',
				'type'  => 'number',
				'attrs' => array(
					'min'     => 1,
					'max'     => 100,
					'step'    => 1,
					'pattern' => '[0-9]',
				),
				'value' => ! empty( $field['max_file_number'] ) ? absint( $field['max_file_number'] ) : 1,
			),
			false
		);
		$this->field_element( 'row', $field, array(
			'slug'    => 'max_file_number',
			'content' => $lbl . $fld,
			'class'   => self::STYLE_CLASSIC === $style ? 'wpforms-row-hide' : '',
		) );

		// Required toggle.
		$this->field_option( 'required', $field );

		// Options close markup.
		$this->field_option( 'basic-options', $field, array( 'markup' => 'close' ) );

		/*
		 * Advanced field options.
		 */

		// Options open markup.
		$this->field_option( 'advanced-options', $field, array( 'markup' => 'open' ) );

		// Style.
		$lbl = $this->field_element(
			'label',
			$field,
			array(
				'slug'    => 'style',
				'value'   => esc_html__( 'Style', 'wpforms' ),
				'tooltip' => esc_html__( 'Modern Style supports multiple file uploads, displays a drag-and-drop upload box, and uses AJAX. Classic Style supports single file upload and displays a traditional upload button.', 'wpforms' ),
			),
			false
		);
		$fld = $this->field_element(
			'select',
			$field,
			array(
				'slug'    => 'style',
				'value'   => $style,
				'options' => array(
					self::STYLE_MODERN  => esc_html__( 'Modern', 'wpforms' ),
					self::STYLE_CLASSIC => esc_html__( 'Classic', 'wpforms' ),
				),
			),
			false
		);
		$this->field_element( 'row', $field, array(
			'slug'    => 'style',
			'content' => $lbl . $fld,
		) );

		// Hide Label.
		$this->field_option( 'label_hide', $field );

		// Media Library toggle.
		$fld  = $this->field_element(
			'checkbox',
			$field,
			array(
				'slug'    => 'media_library',
				'value'   => ! empty( $field['media_library'] ) ? 1 : '',
				'desc'    => esc_html__( 'Store file in WordPress Media Library', 'wpforms' ),
				'tooltip' => esc_html__( 'Check this option to store the final uploaded file in the WordPress Media Library', 'wpforms' ),
			),
			false
		);
		$this->field_element( 'row', $field, array(
			'slug'    => 'media_library',
			'content' => $fld,
		) );

		// Custom CSS classes.
		$this->field_option( 'css', $field );

		// Options close markup.
		$this->field_option( 'advanced-options', $field, array(
			'markup' => 'close',
		) );
	}

	/**
	 * Field preview panel inside the builder.
	 *
	 * @since 1.0.0
	 * @since 1.5.6 Added modern style uploader logic.
	 *
	 * @param array $field Field data.
	 */
	public function field_preview( $field ) {

		// Label.
		$this->field_preview_option( 'label', $field );

		$modern_classes  = array( 'wpforms-file-upload-builder-modern' );
		$classic_classes = array( 'wpforms-file-upload-builder-classic' );
		if ( empty( $field['style'] ) || self::STYLE_CLASSIC !== $field['style'] ) {
			$classic_classes[] = 'wpforms-hide';
		} else {
			$modern_classes[] = 'wpforms-hide';
		}

		$strings         = $this->get_strings();
		$max_file_number = ! empty( $field['max_file_number'] ) ? max( 1, absint( $field['max_file_number'] ) ) : 1;

		// Primary input.
		echo wpforms_render(
			'fields/file-upload-backend',
			array(
				'max_file_number' => $max_file_number,
				'preview_hint'    => str_replace( self::TEMPLATE_MAXFILENUM, $max_file_number, $strings['preview_hint'] ),
				'modern_classes'  => implode( ' ', $modern_classes ),
				'classic_classes' => implode( ' ', $classic_classes ),
			),
			true
		);

		// Description.
		$this->field_preview_option( 'description', $field );
	}

	/**
	 * Field display on the form front-end.
	 *
	 * @since 1.0.0
	 * @since 1.5.6 Added modern style uploader logic.
	 *
	 * @param array $field      Field data and settings.
	 * @param array $deprecated Deprecated field attributes. Use field properties.
	 * @param array $form_data  Form data and settings.
	 */
	public function field_display( $field, $deprecated, $form_data ) {

		// Define data.
		$primary = $field['properties']['inputs']['primary'];

		// Modern style.
		if ( ! empty( $field['style'] ) && self::STYLE_MODERN === $field['style'] ) {

			$strings         = $this->get_strings();
			$max_file_number = ! empty( $field['max_file_number'] ) ? max( 1, absint( $field['max_file_number'] ) ) : 1;

			// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			echo wpforms_render(
				'fields/file-upload-frontend',
				array(
					'field_id'        => (int) $field['id'],
					'form_id'         => (int) $form_data['id'],
					'url'             => admin_url( 'admin-ajax.php' ),
					'input_name'      => 'wpforms_' . $form_data['id'] . '_' . $field['id'],
					'required'        => $primary['required'],
					'extensions'      => $primary['data']['rule-extension'],
					'max_size'        => abs( $primary['data']['rule-maxsize'] ),
					'max_file_number' => $max_file_number,
					'preview_hint'    => str_replace( self::TEMPLATE_MAXFILENUM, $max_file_number, $strings['preview_hint'] ),
					'post_max_size'   => wp_max_upload_size(),
				),
				true
			);
		} else {
			// Classic style.
			printf(
				'<input type="file" %s %s>',
				wpforms_html_attributes( $primary['id'], $primary['class'], $primary['data'], $primary['attr'] ),
				$primary['required'] // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			);
		}
	}

	/**
	 * Validate field for various errors on form submit.
	 *
	 * @since 1.0.0
	 * @since 1.5.6 Added modern style uploader logic.
	 *
	 * @param int   $field_id     Field ID.
	 * @param array $field_submit Submitted field value.
	 * @param array $form_data    Form data and settings.
	 */
	public function validate( $field_id, $field_submit, $form_data ) {

		$this->form_data  = (array) $form_data;
		$this->form_id    = absint( $this->form_data['id'] );
		$this->field_id   = absint( $field_id );
		$this->field_data = $this->form_data['fields'][ $this->field_id ];

		$input_name = sprintf( 'wpforms_%d_%d', $this->form_id, $this->field_id );
		$style      = ! empty( $this->field_data['style'] ) ? $this->field_data['style'] : self::STYLE_CLASSIC;

		// Add modern validate.
		if ( self::STYLE_CLASSIC === $style ) {
			$this->validate_classic( $input_name );
		} else {
			$this->validate_modern( $input_name );
		}
	}

	/**
	 * Validate classic file uploader field data.
	 *
	 * @since 1.5.6
	 *
	 * @param string $input_name Input name inside the form on front-end.
	 */
	protected function validate_classic( $input_name ) {

		if ( empty( $_FILES[ $input_name ] ) ) {
			return;
		}

		/*
		 * If nothing is uploaded and it is not required, don't process.
		 */
		if ( $_FILES[ $input_name ]['error'] === 4 && ! $this->is_required() ) {
			return;
		}

		/*
		 * Basic file upload validation.
		 */
		$validated_basic = $this->validate_basic( (int) $_FILES[ $input_name ]['error'] );
		if ( ! empty( $validated_basic ) ) {
			wpforms()->process->errors[ $this->form_id ][ $this->field_id ] = $validated_basic;

			return;
		}

		/*
		 * Validate if file is required and provided.
		 */
		if (
			( empty( $_FILES[ $input_name ]['tmp_name'] ) || 4 === $_FILES[ $input_name ]['error'] ) &&
		     $this->is_required()
		) {
			wpforms()->process->errors[ $this->form_id ][ $this->field_id ] = wpforms_get_required_label();

			return;
		}

		/*
		 * Validate file size.
		 */
		$validated_size = $this->validate_size();
		if ( ! empty( $validated_size ) ) {
			wpforms()->process->errors[ $this->form_id ][ $this->field_id ] = $validated_size;

			return;
		}

		/*
		 * Validate file extension.
		 */
		$ext = strtolower( pathinfo( $_FILES[ $input_name ]['name'], PATHINFO_EXTENSION ) );

		$validated_ext = $this->validate_extension( $ext );
		if ( ! empty( $validated_ext ) ) {
			wpforms()->process->errors[ $this->form_id ][ $this->field_id ] = $validated_ext;

			return;
		}

		/*
		 * Validate file against what WordPress is set to allow.
		 * At the end of the day, if you try to upload a file that WordPress
		 * doesn't allow, we won't allow it either. Users can use a plugin to
		 * filter the allowed mime types in WordPress if this is an issue.
		 */
		$validated_filetype = $this->validate_wp_filetype_and_ext( $_FILES[ $input_name ]['tmp_name'], sanitize_file_name( wp_unslash( $_FILES[ $input_name ]['name'] ) ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
		if ( ! empty( $validated_filetype ) ) {
			wpforms()->process->errors[ $this->form_id ][ $this->field_id ] = $validated_filetype;

			return;
		}
	}

	/**
	 * Validate modern file uploader field data.
	 *
	 * @since 1.5.6
	 *
	 * @param string $input_name Input name inside the form on front-end.
	 */
	protected function validate_modern( $input_name ) {

		if ( ! $this->is_required() ) {
			return;
		}

		$value = '';
		if ( ! empty( $_POST[ $input_name ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
			$value = json_decode( wp_unslash( $_POST[ $input_name ] ), true ); // phpcs:ignore WordPress.Security
		}

		if ( empty( $value ) ) {
			wpforms()->process->errors[ $this->form_id ][ $this->field_id ] = wpforms_get_required_label();
		}
	}

	/**
	 * Format and sanitize field.
	 *
	 * @since 1.0.0
	 *
	 * @param int   $field_id     Field ID.
	 * @param array $field_submit Submitted field value.
	 * @param array $form_data    Form data and settings.
	 */
	public function format( $field_id, $field_submit, $form_data ) {

		// Setup class properties to reuse everywhere.
		$this->form_data  = (array) $form_data;
		$this->form_id    = absint( $this->form_data['id'] );
		$this->field_id   = absint( $field_id );
		$this->field_data = $this->form_data['fields'][ $this->field_id ];

		$field_label = ! empty( $this->form_data['fields'][ $this->field_id ]['label'] ) ? $this->form_data['fields'][ $this->field_id ]['label'] : '';
		$input_name  = sprintf( 'wpforms_%d_%d', $this->form_id, $this->field_id );
		$style       = ! empty( $this->field_data['style'] ) ? $this->field_data['style'] : self::STYLE_CLASSIC;

		if ( self::STYLE_CLASSIC === $style ) {
			$this->format_classic( $field_label, $input_name );
		} else {
			$this->format_modern( $field_label, $input_name );
		}
	}

	/**
	 * Format and sanitize classic style of file upload field.
	 *
	 * @since 1.5.6
	 *
	 * @param string $field_label Field label.
	 * @param string $input_name  Input name inside the form on front-end.
	 */
	protected function format_classic( $field_label, $input_name ) {

		$file = ! empty( $_FILES[ $input_name ] ) ? $_FILES[ $input_name ] : false; // phpcs:ignore

		// Preserve field CL visibility state before processing the field.
		$visible = isset( wpforms()->process->fields[ $this->field_id ]['visible'] ) ? wpforms()->process->fields[ $this->field_id ]['visible'] : false;

		// If there was no file uploaded or if this field has conditional logic
		// rules active, stop here before we continue with the
		// upload process.
		if ( ! $file || 0 !== $file['error'] || in_array( $this->field_id, $this->form_data['conditional_fields'], true ) ) {

			wpforms()->process->fields[ $this->field_id ] = array(
				'name'          => sanitize_text_field( $field_label ),
				'value'         => '',
				'file'          => '',
				'file_original' => '',
				'ext'           => '',
				'id'            => absint( $this->field_id ),
				'type'          => $this->type,
			);
			if ( $visible ) {
				wpforms()->process->fields[ $this->field_id ]['visible'] = $visible;
			}

			return;
		}

		// Define data.
		$file_name     = sanitize_file_name( $file['name'] );
		$file_ext      = pathinfo( $file_name, PATHINFO_EXTENSION );
		$file_base     = wp_basename( $file_name, '.' . $file_ext );
		$file_name_new = sprintf( '%s-%s.%s', $file_base, wp_hash( wp_rand() . microtime() . $this->form_id . $this->field_id ), strtolower( $file_ext ) );
		$upload_dir    = wpforms_upload_dir();
		$upload_path   = $upload_dir['path'];

		// Old dir.
		$form_directory   = absint( $this->form_id ) . '-' . md5( $this->form_id . $this->form_data['created'] );
		$upload_path_form = trailingslashit( $upload_path ) . $form_directory;

		// Check for form upload directory destination.
		if ( ! file_exists( $upload_path_form ) ) {

			// New one.
			$form_directory   = absint( $this->form_id ) . '-' . wp_hash( $this->form_data['created'] . $this->form_id );
			$upload_path_form = trailingslashit( $upload_path ) . $form_directory;

			// Check once again and make directory if it's not exists.
			if ( ! file_exists( $upload_path_form ) ) {
				wp_mkdir_p( $upload_path_form );
			}
		}
		$file_new      = trailingslashit( $upload_path_form ) . $file_name_new;
		$file_name_new = wp_basename( trailingslashit( dirname( $file_new ) ) . $file_name_new );
		$file_new      = trailingslashit( dirname( $file_new ) ) . $file_name_new;
		$file_url      = trailingslashit( $upload_dir['url'] ) . trailingslashit( $form_directory ) . $file_name_new;
		$attachment_id = '0';

		// Check if the .htaccess exists in the upload directory, if not - create it.
		wpforms_create_upload_dir_htaccess_file();

		// Check if the index.html exists in the directories, if not - create it.
		wpforms_create_index_html_file( $upload_path );
		wpforms_create_index_html_file( $upload_path_form );

		// Move the file to the uploads dir - similar to _wp_handle_upload().
		$move_new_file = @move_uploaded_file( $file['tmp_name'], $file_new ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
		if ( false === $move_new_file ) {
			wpforms_log(
				'Upload Error, could not upload file',
				$file_url,
				array(
					'type'    => array( 'entry', 'error' ),
					'form_id' => $this->form_data['id'],
				)
			);

			return;
		}

		$this->set_file_fs_permissions( $file_new );

		// Maybe move file to the WordPress media library.
		if ( $this->is_media_integrated() ) {

			// Include necessary code from core.
			require_once ABSPATH . 'wp-admin/includes/media.php';
			require_once ABSPATH . 'wp-admin/includes/file.php';
			require_once ABSPATH . 'wp-admin/includes/image.php';

			// Copy our file into WordPress uploads.
			$file_args = array(
				'error'    => '',
				'tmp_name' => $file_new,
				'name'     => $file_name_new,
				'type'     => $file['type'],
				'size'     => $file['size'],
			);
			$upload    = wp_handle_sideload( $file_args, array( 'test_form' => false ) );

			if ( ! empty( $upload['file'] ) ) {
				// Create a Media attachment for the file.
				$attachment_id = wp_insert_attachment(
					array(
						'post_title'     => $this->get_wp_media_file_title( $file ),
						'post_content'   => $this->get_wp_media_file_desc( $file ),
						'post_status'    => 'publish',
						'post_mime_type' => $file['type'],
					),
					$upload['file']
				);

				if ( ! empty( $attachment_id ) ) {
					// Generate attachment meta.
					wp_update_attachment_metadata(
						$attachment_id,
						wp_generate_attachment_metadata( $attachment_id, $upload['file'] )
					);

					// Update file url/name.
					$file_url      = wp_get_attachment_url( $attachment_id );
					$file_name_new = wp_basename( $file_url );
				}
			}
		}

		// Set final field details.
		wpforms()->process->fields[ $this->field_id ] = array(
			'name'          => sanitize_text_field( $field_label ),
			'value'         => esc_url_raw( $file_url ),
			'file'          => $file_name_new,
			'file_original' => $file_name,
			'ext'           => $file_ext,
			'attachment_id' => absint( $attachment_id ),
			'id'            => absint( $this->field_id ),
			'type'          => $this->type,
		);

		// Save field CL visibility state after field processing.
		if ( $visible ) {
			wpforms()->process->fields[ $this->field_id ]['visible'] = $visible;
		}
	}

	/**
	 * Format and sanitize modern style of file upload field.
	 *
	 * @since 1.5.6
	 *
	 * @param string $field_label Field label.
	 * @param string $input_name  Input name inside the form on front-end.
	 */
	protected function format_modern( $field_label, $input_name ) {

		$processed = array(
			'name'      => sanitize_text_field( $field_label ),
			'value'     => '',
			'value_raw' => '',
			'id'        => $this->field_id,
			'type'      => $this->type,
			'style'     => self::STYLE_MODERN,
		);

		// Preserve field CL visibility state before processing the field.
		if ( isset( wpforms()->process->fields[ $this->field_id ]['visible'] ) ) {
			$processed['visible'] = wpforms()->process->fields[ $this->field_id ]['visible'];
		}

		// We should actually receive some files info.
		if ( empty( $_POST[ $input_name ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
			wpforms()->process->fields[ $this->field_id ] = $processed;

			return;
		}

		if ( ! empty( wpforms()->process->fields[ $this->field_id ] ) ) {
			return;
		}

		// Make sure json_decode() doesn't fail on newer PHP.
		try {
			$raw_files = json_decode( wp_unslash( $_POST[ $input_name ] ), true ); // phpcs:ignore WordPress.Security
		} catch ( Exception $e ) {
			wpforms()->process->fields[ $this->field_id ] = $processed;

			return;
		}

		// Make sure we actually have some files.
		if ( empty( $raw_files ) || ! is_array( $raw_files ) ) {
			wpforms()->process->fields[ $this->field_id ] = $processed;

			return;
		}

		// Make sure we process only submitted files with the expected structure and keys.
		$files = array_filter(
			$raw_files,
			static function ( $file ) {

				return is_array( $file ) && count( $file ) === 2 && ! empty( $file['file'] ) && ! empty( $file['name'] );
			}
		);

		if ( empty( $files ) ) {
			wpforms()->process->fields[ $this->field_id ] = $processed;

			return;
		}

		wpforms_create_upload_dir_htaccess_file();

		$upload_dir = wpforms_upload_dir();
		if ( empty( $upload_dir['error'] ) ) {
			wpforms_create_index_html_file( $upload_dir['path'] );
		}

		$data = array();

		foreach ( $files as $file ) {
			$file = $this->generate_file_info( $file );

			if ( $this->is_media_integrated() ) {
				$file['path'] = $file['tmp_path'];

				$file = $this->generate_file_attachment( $file );
			} else {
				// Create form upload directory if needed.
				$this->create_dir( dirname( $file['path'] ) );
				rename( $file['tmp_path'], $file['path'] );
				$this->set_file_fs_permissions( $file['path'] );
			}

			$data[] = $this->generate_file_data( $file );
		}

		if ( ! empty( $data ) ) {
			$processed = wp_parse_args(
				array(
					'value_raw' => $data,
					'value'     => wpforms_chain( $data )
						->map(
							static function ( $file ) {

								return $file['value'];
							}
						)
						->implode( "\n" )
						->value(),
				),
				$processed
			);
		}

		wpforms()->process->fields[ $this->field_id ] = $processed;
	}

	/**
	 * Add additional information to the files array for each file.
	 *
	 * @since 1.5.6
	 *
	 * @param array $file Submitted file basic info.
	 *
	 * @return array
	 */
	protected function generate_file_info( $file ) {

		$dir = $this->get_form_files_dir();

		$file['tmp_path'] = trailingslashit( $this->get_tmp_dir() ) . $file['file'];
		$file['type']     = 'application/octet-stream';
		if ( is_file( $file['tmp_path'] ) ) {
			$filetype     = wp_check_filetype( $file['tmp_path'] );
			$file['type'] = $filetype['type'];
		}

		// Data for no media case.
		$file_ext              = pathinfo( $file['name'], PATHINFO_EXTENSION );
		$file_base             = wp_basename( $file['name'], '.' . $file_ext );
		$file['file_name_new'] = sanitize_file_name( sprintf( '%s-%s.%s', $file_base, wp_hash( wp_rand() . microtime() . $this->form_data['id'] . $this->field_id ), strtolower( $file_ext ) ) );
		$file['file_url']      = trailingslashit( $dir['url'] ) . $file['file_name_new'];
		$file['path']          = trailingslashit( $dir['path'] ) . $file['file_name_new'];
		$file['attachment_id'] = 0;

		return $file;
	}

	/**
	 * Create a Media Library attachment.
	 *
	 * @since 1.5.6
	 *
	 * @param array $file File to create Media Library attachment for.
	 *
	 * @return array
	 */
	protected function generate_file_attachment( $file ) {

		// Include necessary code from core.
		require_once ABSPATH . 'wp-admin/includes/media.php';
		require_once ABSPATH . 'wp-admin/includes/file.php';
		require_once ABSPATH . 'wp-admin/includes/image.php';

		$file_args = array(
			'error'    => '',
			'tmp_name' => $file['path'],
			'name'     => $file['file_name_new'],
			'type'     => $file['type'],
		);
		$upload    = wp_handle_sideload( $file_args, array( 'test_form' => false ) );

		if ( empty( $upload['file'] ) ) {
			return $file;
		}

		// Create a Media attachment for the file.
		$attachment_id = wp_insert_attachment(
			array(
				'post_title'     => $this->get_wp_media_file_title( $file ),
				'post_content'   => $this->get_wp_media_file_desc( $file ),
				'post_status'    => 'publish',
				'post_mime_type' => $file['type'],
			),
			$upload['file']
		);

		if ( empty( $attachment_id ) ) {
			return $file;
		}

		// Generate and update attachment meta.
		wp_update_attachment_metadata(
			$attachment_id,
			wp_generate_attachment_metadata( $attachment_id, $upload['file'] )
		);

		// Update file information.
		$file_url              = wp_get_attachment_url( $attachment_id );
		$file['path']          = $upload['file'];
		$file['file_url']      = $file_url;
		$file['file_name_new'] = wp_basename( $file_url );
		$file['attachment_id'] = $attachment_id;

		return $file;
	}

	/**
	 * Generate an attachment title used in WP Media library for an uploaded file.
	 *
	 * @since 1.6.1
	 *
	 * @param array $file File data.
	 *
	 * @return string
	 */
	private function get_wp_media_file_title( $file ) {

		$title = apply_filters(
			'wpforms_field_' . $this->type . '_media_file_title',
			sprintf(
				'%s: %s',
				$this->field_data['label'],
				$file['name']
			),
			$file,
			$this->field_data
		);

		return wpforms_sanitize_text_deeply( $title );
	}

	/**
	 * Generate an attachment description used in WP Media library for an uploaded file.
	 *
	 * @since 1.6.1
	 *
	 * @param array $file File data.
	 *
	 * @return string
	 */
	private function get_wp_media_file_desc( $file ) {

		$desc = apply_filters(
			'wpforms_field_' . $this->type . '_media_file_desc',
			$this->field_data['description'],
			$file,
			$this->field_data
		);

		return wp_kses_post_deep( $desc );
	}

	/**
	 * Generate a ready for DB data for each file.
	 *
	 * @since 1.5.6
	 *
	 * @param array $file File to generate data for.
	 *
	 * @return array
	 */
	protected function generate_file_data( $file ) {

		return array(
			'name'          => sanitize_text_field( $file['name'] ),
			'value'         => esc_url_raw( $file['file_url'] ),
			'file'          => $file['file_name_new'],
			'file_original' => $file['name'],
			'ext'           => wpforms_chain( $file['file'] )->explode( '.' )->pop()->value(),
			'attachment_id' => isset( $file['attachment_id'] ) ? absint( $file['attachment_id'] ) : 0,
			'id'            => $this->field_id,
			'type'          => $file['type'],
		);
	}

	/**
	 * Format, sanitize, and upload files for fields that have conditional logic rules applied.
	 *
	 * @since 1.3.8
	 *
	 * @param array $form_data Form data and settings.
	 */
	public function format_conditional( $form_data ) {

		// If the form contains no fields with conditional logic no need to
		// continue processing.
		if ( empty( $form_data['conditional_fields'] ) ) {
			return;
		}

		// Loop through each field that has conditional logic rules.
		foreach ( $form_data['conditional_fields'] as $key => $field_id ) {

			// Check if the field exists.
			if ( empty( wpforms()->process->fields[ $field_id ] ) ) {
				continue;
			}

			// Check if the 'type' exists.
			if ( empty( wpforms()->process->fields[ $field_id ]['type'] ) ) {
				continue;
			}

			// We are only concerned with file upload fields.
			if ( wpforms()->process->fields[ $field_id ]['type'] !== $this->type ) {
				continue;
			}

			// If the upload field was no visible at submit then ignore it.
			if ( empty( wpforms()->process->fields[ $field_id ]['visible'] ) ) {
				continue;
			}

			// If there are errors pertaining to this form, its not going to
			// process, so bail and avoid file upload.
			if ( ! empty( wpforms()->process->errors[ $form_data['id'] ] ) ) {
				continue;
			}

			/*
			 * We made it this far, so we can assume we have a file upload field
			 * which was visible during submit, inside a form which does not
			 * contain any errors, so at last we can proceed with uploading the
			 * file.
			 */

			// Unset this field from conditional fields so the format method will proceed.
			unset( $form_data['conditional_fields'][ $key ] );

			// Upload the file and celebrate.
			$this->format( $field_id, array(), $form_data );
		}
	}

	/**
	 * Determine the max allowed file size in bytes as per field options.
	 *
	 * @since 1.0.0
	 *
	 * @return int Number of bytes allowed.
	 */
	public function max_file_size() {

		if ( ! empty( $this->field_data['max_size'] ) ) {

			// Strip any suffix provided (eg M, MB etc), which leaves is wit the raw MB value.
			$max_size = preg_replace( '/[^0-9.]/', '', $this->field_data['max_size'] );
			$max_size = wpforms_size_to_bytes( $max_size . 'M' );

		} else {
			$max_size = wpforms_max_upload( true );
		}

		return $max_size;
	}

	/**
	 * Clean up the tmp folder - remove all old files every day (filterable interval).
	 *
	 * @since 1.5.6
	 */
	protected function clean_tmp_files() {

		$files = glob( trailingslashit( $this->get_tmp_dir() ) . '*' );

		if ( ! is_array( $files ) || empty( $files ) ) {
			return;
		}

		$lifespan = (int) apply_filters( 'wpforms_field_' . $this->type . '_clean_tmp_files_lifespan', DAY_IN_SECONDS );

		foreach ( $files as $file ) {
			if ( ! is_file( $file ) ) {
				continue;
			}

			// In some cases filemtime() can return false, in that case - pretend this is a new file and do nothing.
			$modified = (int) filemtime( $file );
			if ( empty( $modified ) ) {
				$modified = time();
			}

			if ( ( time() - $modified ) >= $lifespan ) {
				@unlink( $file ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
			}
		}
	}

	/**
	 * Remove the file from the temporary directory.
	 *
	 * @since 1.5.6
	 */
	public function ajax_modern_remove() {

		$default_error = esc_html__( 'Something went wrong while removing the file.', 'wpforms' );

		$validated_form_field = $this->ajax_validate_form_field_modern();
		if ( empty( $validated_form_field ) ) {
			wp_send_json_error( $default_error );
		}

		if ( empty( $_POST['file'] ) ) {
			wp_send_json_error( $default_error );
		}

		$file     = sanitize_file_name( wp_unslash( $_POST['file'] ) );
		$tmp_path = wp_normalize_path( $this->get_tmp_dir() . '/' . $file );

		// Requested file does not exist, which is good.
		if ( ! is_file( $tmp_path ) ) {
			wp_send_json_success( $file );
		}

		if ( @unlink( $tmp_path ) ) {
			wp_send_json_success( $file );
		}

		wp_send_json_error( $default_error );
	}

	/**
	 * Upload the file, used during AJAX requests.
	 *
	 * @since 1.5.6
	 */
	public function ajax_modern_upload() {

		$default_error = esc_html__( 'Something went wrong, please try again.', 'wpforms' );

		$validated_form_field = $this->ajax_validate_form_field_modern();
		if ( empty( $validated_form_field ) ) {
			wp_send_json_error( $default_error );
		}

		// Make sure we have required values from $_FILES.
		if ( empty( $_FILES['file']['name'] ) ) {
			wp_send_json_error( $default_error );
		}
		if ( empty( $_FILES['file']['tmp_name'] ) ) {
			wp_send_json_error( $default_error );
		}

		// Make data available everywhere in the class, so we don't need to pass it manually.
		$this->form_data  = $validated_form_field['form_data'];
		$this->form_id    = $this->form_data['id'];
		$this->field_id   = $validated_form_field['field_id'];
		$this->field_data = $this->form_data['fields'][ $this->field_id ];

		$error     = empty( $_FILES['file']['error'] ) ? 0 : (int) $_FILES['file']['error'];
		$name      = sanitize_file_name( wp_unslash( $_FILES['file']['name'] ) );
		$path      = $_FILES['file']['tmp_name']; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.MissingUnslash, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		$extension = strtolower( pathinfo( $name, PATHINFO_EXTENSION ) );
		$errors    = wpforms_chain( array() )
			->array_merge( (array) $this->validate_basic( $error ) )
			->array_merge( (array) $this->validate_size() )
			->array_merge( (array) $this->validate_extension( $extension ) )
			->array_merge( (array) $this->validate_wp_filetype_and_ext( $path, $name ) )
			->array_filter()
			->value();

		if ( count( $errors ) ) {
			wp_send_json_error( implode( ',', $errors ) );
		}

		$tmp_dir  = $this->get_tmp_dir();
		$tmp_name = $this->get_tmp_file_name( $extension );
		$tmp_path = wp_normalize_path( $tmp_dir . '/' . $tmp_name );
		$tmp      = $this->move_file( $path, $tmp_path );

		if ( ! $tmp ) {
			wp_send_json_error( $default_error );
		}

		$this->clean_tmp_files();

		wp_send_json_success(
			array(
				'file' => pathinfo( $tmp, PATHINFO_FILENAME ) . '.' . pathinfo( $tmp, PATHINFO_EXTENSION ),
				'name' => $name,
			)
		);
	}

	/**
	 * Validate form ID, field ID and field style for existence and that they are actually valid.
	 *
	 * @since 1.5.6
	 *
	 * @return array Empty array on any kind of failure.
	 */
	protected function ajax_validate_form_field_modern() {

		if (
			empty( $_POST['form_id'] ) ||
			empty( $_POST['field_id'] )
		) {
			return array();
		}

		$form_data = wpforms()->form->get( (int) $_POST['form_id'], array(
			'content_only' => true,
		) );

		if ( empty( $form_data ) || ! is_array( $form_data ) ) {
			return array();
		}

		$field_id = (int) $_POST['field_id'];
		if (
			! isset( $form_data['fields'][ $field_id ]['style'] ) ||
			self::STYLE_MODERN !== $form_data['fields'][ $field_id ]['style']
		) {
			return array();
		}

		return array(
			'form_data' => $form_data,
			'field_id'  => $field_id,
		);
	}

	/**
	 * Basic file upload validation.
	 *
	 * @since 1.5.6
	 *
	 * @param int $error Error ID provided by PHP.
	 *
	 * @return false|string False if no errors found, error text otherwise.
	 */
	protected function validate_basic( $error ) {

		if ( 0 === $error || 4 === $error ) {
			return false;
		}

		$errors = array(
			false,
			esc_html__( 'The uploaded file exceeds the upload_max_filesize directive in php.ini.', 'wpforms' ),
			esc_html__( 'The uploaded file exceeds the MAX_FILE_SIZE directive that was specified in the HTML form.', 'wpforms' ),
			esc_html__( 'The uploaded file was only partially uploaded.', 'wpforms' ),
			esc_html__( 'No file was uploaded.', 'wpforms' ),
			'',
			esc_html__( 'Missing a temporary folder.', 'wpforms' ),
			esc_html__( 'Failed to write file to disk.', 'wpforms' ),
			esc_html__( 'File upload stopped by extension.', 'wpforms' ),
		);

		if ( array_key_exists( $error, $errors ) ) {
			/* translators: %s - error text. */
			return sprintf( esc_html__( 'File upload error. %s', 'wpforms' ), $errors[ $error ] );
		}

		return false;
	}

	/**
	 * Validate file size.
	 *
	 * @since 1.5.6
	 *
	 * @return false|string False if no errors found, error text otherwise.
	 */
	protected function validate_size() {

		$max_size = min( wp_max_upload_size(), $this->max_file_size() );

		if ( ! empty( $_FILES ) ) {
			foreach ( $_FILES as $file ) {
				if ( $file['size'] > $max_size ) {
					return sprintf( /* translators: $s - allowed file size in Mb. */
						esc_html__( 'File exceeds max size allowed (%s).', 'wpforms' ),
						wpforms_size_to_megabytes( $max_size )
					);
				}
			}
		}

		return false;
	}

	/**
	 * Validate extension against blacklist and admin-provided list.
	 * There are certain extensions we do not allow under any circumstances,
	 * with no exceptions, for security purposes.
	 *
	 * @since 1.5.6
	 *
	 * @param string $ext Extension.
	 *
	 * @return false|string False if no errors found, error text otherwise.
	 */
	protected function validate_extension( $ext ) {

		// Make sure file has an extension first.
		if ( empty( $ext ) ) {
			return esc_html__( 'File must have an extension.', 'wpforms' );
		}

		// Validate extension against all allowed values.
		if ( ! in_array( $ext, $this->get_extensions(), true ) ) {
			return esc_html__( 'File type is not allowed.', 'wpforms' );
		}

		return false;
	}

	/**
	 * Validate file against what WordPress is set to allow.
	 * At the end of the day, if you try to upload a file that WordPress
	 * doesn't allow, we won't allow it either. Users can use a plugin to
	 * filter the allowed mime types in WordPress if this is an issue.
	 *
	 * @since 1.5.6
	 *
	 * @param string $path Path to a newly uploaded file.
	 * @param string $name Name of a newly uploaded file.
	 *
	 * @return false|string False if no errors found, error text otherwise.
	 */
	protected function validate_wp_filetype_and_ext( $path, $name ) {

		$wp_filetype = wp_check_filetype_and_ext( $path, $name );

		$ext             = empty( $wp_filetype['ext'] ) ? '' : $wp_filetype['ext'];
		$type            = empty( $wp_filetype['type'] ) ? '' : $wp_filetype['type'];
		$proper_filename = empty( $wp_filetype['proper_filename'] ) ? '' : $wp_filetype['proper_filename'];

		if ( $proper_filename || ! $ext || ! $type ) {
			return esc_html__( 'File type is not allowed.', 'wpforms' );
		}

		return false;
	}

	/**
	 * Get form-specific uploads directory path and URL.
	 *
	 * @since 1.5.6
	 *
	 * @return array
	 */
	protected function get_form_files_dir() {

		$upload_dir = wpforms_upload_dir();
		$folder     = absint( $this->form_data['id'] ) . '-' . wp_hash( $this->form_data['created'] . $this->form_data['id'] );

		return array(
			'path' => trailingslashit( $upload_dir['path'] ) . $folder,
			'url'  => trailingslashit( $upload_dir['url'] ) . $folder,
		);
	}

	/**
	 * Get tmp dir for files.
	 *
	 * @since 1.5.6
	 *
	 * @return string
	 */
	protected function get_tmp_dir() {

		$upload_dir = wpforms_upload_dir();
		$tmp_root   = $upload_dir['path'] . '/tmp';

		if ( ! file_exists( $tmp_root ) || ! wp_is_writable( $tmp_root ) ) {
			wp_mkdir_p( $tmp_root );
		}

		// Check if the index.html exists in the directory, if not - create it.
		wpforms_create_index_html_file( $tmp_root );

		return $tmp_root;
	}

	/**
	 * Create both the directory and index.html file in it if any of them doesn't exist.
	 *
	 * @since 1.5.6
	 *
	 * @param string $path Path to the directory.
	 *
	 * @return string Path to the newly created directory.
	 */
	protected function create_dir( $path ) {

		if ( ! file_exists( $path ) ) {
			wp_mkdir_p( $path );
		}

		// Check if the index.html exists in the path, if not - create it.
		wpforms_create_index_html_file( $path );

		return $path;
	}

	/**
	 * Get tmp file name.
	 *
	 * @since 1.5.6
	 *
	 * @param string $extension File extension.
	 *
	 * @return string
	 */
	protected function get_tmp_file_name( $extension ) {

		return wp_hash( wp_rand() . microtime() . $this->form_id . $this->field_id ) . '.' . $extension;
	}

	/**
	 * Move file to a permanent location.
	 *
	 * @since 1.5.6
	 *
	 * @param string $path_from From.
	 * @param string $path_to   To.
	 *
	 * @return false|string False on error.
	 */
	protected function move_file( $path_from, $path_to ) {

		$this->create_dir( dirname( $path_to ) );

		if ( false === move_uploaded_file( $path_from, $path_to ) ) {
			wpforms_log(
				'Upload Error, could not upload file',
				$path_from,
				array(
					'type' => array( 'entry', 'error' ),
				)
			);

			return false;
		}

		$this->set_file_fs_permissions( $path_to );

		return $path_to;
	}

	/**
	 * Set correct file permissions in the file system.
	 *
	 * @since 1.5.6
	 *
	 * @param string $path File to set permissions for.
	 */
	protected function set_file_fs_permissions( $path ) {

		// Set correct file permissions.
		$stat = stat( dirname( $path ) );

		@chmod( $path, $stat['mode'] & 0000666 ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
	}

	/**
	 * Get all allowed extensions.
	 * Check against user-entered extensions.
	 *
	 * @since 1.5.6
	 *
	 * @return array
	 */
	protected function get_extensions() {

		// Allowed file extensions by default.
		$default_extensions = $this->get_default_extensions();

		// Allowed file extensions.
		$extensions = ! empty( $this->field_data['extensions'] ) ? explode( ',', $this->field_data['extensions'] ) : $default_extensions;

		return wpforms_chain( $extensions )
			->map(
				static function ( $ext ) {

					return strtolower( preg_replace( '/[^A-Za-z0-9]/', '', $ext ) );
				}
			)
			->array_filter()
			->array_intersect( $default_extensions )
			->value();
	}

	/**
	 * Get default extensions supported by WordPress
	 * without those that we manually blacklist.
	 *
	 * @since 1.5.6
	 *
	 * @return array
	 */
	protected function get_default_extensions() {

		return wpforms_chain( get_allowed_mime_types() )
			->array_keys()
			->implode( '|' )
			->explode( '|' )
			->array_diff( $this->blacklist )
			->value();
	}

	/**
	 * Whether field is required or not.
	 *
	 * @uses $this->field_data
	 *
	 * @since 1.5.6
	 *
	 * @return bool
	 */
	protected function is_required() {

		return ! empty( $this->field_data['required'] );
	}

	/**
	 * Whether field is integrated with WordPress Media Library.
	 *
	 * @uses $this->field_data
	 *
	 * @since 1.5.6
	 *
	 * @return bool
	 */
	protected function is_media_integrated() {

		return ! empty( $this->field_data['media_library'] ) && '1' === $this->field_data['media_library'];
	}

	/**
	 * Disallow WPForms upload directory indexing in robots.txt.
	 *
	 * @since 1.6.1
	 *
	 * @param string $output Robots.txt output.
	 *
	 * @return string
	 */
	public function disallow_upload_dir_indexing( $output ) {

		$upload_dir = wpforms_upload_dir();

		if ( ! empty( $upload_dir['error'] ) ) {
			return $output;
		}

		$site_url = site_url();

		$upload_root = str_replace( $site_url, '', $upload_dir['url'] );
		$upload_root = trailingslashit( $upload_root );

		$site_url_parts = wp_parse_url( $site_url );
		if ( ! empty( $site_url_parts['path'] ) ) {
			$upload_root = $site_url_parts['path'] . $upload_root;
		}

		$output .= "Disallow: $upload_root\n";

		return $output;
	}
}

new WPForms_Field_File_Upload();
