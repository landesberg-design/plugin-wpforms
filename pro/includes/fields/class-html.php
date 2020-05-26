<?php

/**
 * HTML block text field.
 *
 * @since 1.0.0
 */
class WPForms_Field_HTML extends WPForms_Field {

	/**
	 * Primary class constructor.
	 *
	 * @since 1.0.0
	 */
	public function init() {

		// Define field type information.
		$this->name  = esc_html__( 'HTML', 'wpforms' );
		$this->type  = 'html';
		$this->icon  = 'fa-code';
		$this->order = 170;
		$this->group = 'fancy';

		// Define additional field properties.
		add_filter( 'wpforms_field_properties_html', array( $this, 'field_properties' ), 5, 3 );
		add_filter( 'wpforms_field_new_default', array( $this, 'field_new_default' ) );
	}

	/**
	 * Define new field default.
	 *
	 * @since 1.5.7
	 *
	 * @param array $field Field settings.
	 *
	 * @return array Field settings.
	 */
	public function field_new_default( $field ) {

		$field['name'] = '';

		return $field;
	}

	/**
	 * Define additional field properties.
	 *
	 * @since 1.3.7
	 *
	 * @param array $properties Field properties.
	 * @param array $field      Field settings.
	 * @param array $form_data  Form data and settings.
	 *
	 * @return array
	 */
	public function field_properties( $properties, $field, $form_data ) {

		// Remove input attributes references.
		$properties['inputs']['primary']['attr'] = array();

		// Add code value.
		$properties['inputs']['primary']['code'] = ! empty( $field['code'] ) ? $field['code'] : '';

		return $properties;
	}

	/**
	 * @inheritdoc
	 */
	public function is_dynamic_population_allowed( $properties, $field ) {

		return false;
	}

	/**
	 * @inheritdoc
	 */
	public function is_fallback_population_allowed( $properties, $field ) {

		return false;
	}

	/**
	 * Extend from `parent::field_option()` in order to add `name` option.
	 *
	 * @since 1.5.7
	 *
	 * @param string $option Field option to render.
	 * @param array  $field  Field data and settings.
	 * @param array  $args   Field preview arguments.
	 * @param bool   $echo   Print or return the value. Print by default.
	 *
	 * @return mixed echo or return string
	 */
	public function field_option( $option, $field, $args = array(), $echo = true ) {

		if ( $option !== 'name' ) {
			return parent::field_option( $option, $field, $args, $echo );
		}

		$output  = $this->field_element(
			'label',
			$field,
			array(
				'slug'    => 'name',
				'value'   => esc_html__( 'Label', 'wpforms' ),
				'tooltip' => esc_html__( 'Enter text for the form field label. It will help identify your HTML blocks inside the form builder, but will not be displayed in the form.', 'wpforms' ),
			),
			false
		);
		$output .= $this->field_element(
			'text',
			$field,
			array(
				'slug'  => 'name',
				'value' => ! empty( $field['name'] ) ? esc_attr( $field['name'] ) : '',
			),
			false
		);
		$output  = $this->field_element(
			'row',
			$field,
			array(
				'slug'    => 'name',
				'content' => $output,
			),
			false
		);

		if ( $echo ) {
			echo $output; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		} else {
			return $output;
		}
	}

	/**
	 * Field options panel inside the builder.
	 *
	 * @since 1.0.0
	 *
	 * @param array $field Field settings.
	 */
	public function field_options( $field ) {
		/*
		 * Basic field options.
		 */

		// Options open markup.
		$args = array(
			'markup' => 'open',
		);
		$this->field_option( 'basic-options', $field, $args );

		// Name (Label).
		$this->field_option( 'name', $field );

		// Code.
		$this->field_option( 'code', $field );

		// Set label to disabled.
		$args = array(
			'type'  => 'hidden',
			'slug'  => 'label_disable',
			'value' => '1',
		);
		$this->field_element( 'text', $field, $args );

		// Options close markup.
		$args = array(
			'markup' => 'close',
		);
		$this->field_option( 'basic-options', $field, $args );

		/*
		 * Advanced field options.
		 */

		// Options open markup.
		$args = array(
			'markup' => 'open',
		);
		$this->field_option( 'advanced-options', $field, $args );

		// Custom CSS classes.
		$this->field_option( 'css', $field );

		// Options close markup.
		$args = array(
			'markup' => 'close',
		);
		$this->field_option( 'advanced-options', $field, $args );
	}

	/**
	 * Field preview inside the builder.
	 *
	 * @since 1.0.0
	 *
	 * @param array $field Field settings.
	 */
	public function field_preview( $field ) {

		$label = ! empty( $field['name'] ) ? $field['name'] : '';
		?>

		<div class="code-block">
			<label class="label-title">
				<div class="text"><?php echo esc_html( $label ); ?></div>
				<div class="grey"><i class="fa fa-code"></i> <?php esc_html_e( 'HTML / Code Block', 'wpforms' ); ?></div>
			</label>
			<div class="description"><?php esc_html_e( 'Contents of this field are not displayed in the form builder preview.', 'wpforms' ); ?></div>
		</div>

		<?php
	}

	/**
	 * Field display on the form front-end.
	 *
	 * @since 1.0.0
	 *
	 * @param array $field      Field data and settings.
	 * @param array $deprecated Deprecated field attributes. Use field properties.
	 * @param array $form_data  Form data and settings.
	 */
	public function field_display( $field, $deprecated, $form_data ) {

		// Define data.
		$primary = $field['properties']['inputs']['primary'];

		// Primary field.
		printf(
			'<div %s>%s</div>',
			wpforms_html_attributes( $primary['id'], $primary['class'], $primary['data'], $primary['attr'] ),
			do_shortcode( $primary['code'] )
		);
	}

	/**
	 * Format field.
	 *
	 * @since 1.0.0
	 *
	 * @param int   $field_id     Field ID.
	 * @param array $field_submit Submitted field value.
	 * @param array $form_data    Form data and settings.
	 */
	public function format( $field_id, $field_submit, $form_data ) {
	}
}

new WPForms_Field_HTML();
