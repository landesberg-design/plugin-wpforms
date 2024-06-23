<?php
/**
 * Suppress inspection on private properties `frontend_obj` and `builder_obj`.
 * They are used via getter `get_object()`.
 *
 * @noinspection PhpPropertyOnlyWrittenInspection
 */

namespace WPForms\Pro\Forms\Fields\Layout;

use WPForms\Pro\Forms\Fields\Traits\Layout\Field as LayoutFieldTrait;
use WPForms_Field;

/**
 * Layout field.
 *
 * @since 1.8.9
 */
class Field extends WPForms_Field {

	use LayoutFieldTrait {
		hooks as layout_hooks;
	}

	/**
	 * Instance of the Builder class for Layout Field.
	 *
	 * @since 1.8.9
	 *
	 * @var Builder
	 */
	protected $builder_obj;

	/**
	 * Layout presets.
	 *
	 * @since 1.8.9
	 *
	 * @var array
	 */
	const PRESETS = [
		'50-50',
		'67-33',
		'33-67',
		'33-33-33',
		'50-25-25',
		'25-25-50',
		'25-50-25',
		'25-25-25-25',
	];

	/**
	 * Field types that not allowed to drag into the column.
	 *
	 * @since 1.8.9
	 *
	 * @var array
	 */
	const NOT_ALLOWED_FIELDS = [
		'layout',
		'repeater',
		'pagebreak',
		'entry-preview',
	];

	/**
	 * Handle name for `wp_register_styles`.
	 *
	 * @since 1.8.9
	 *
	 * @var string
	 */
	public $style_handle = 'wpforms-layout';

	/**
	 * Primary class constructor.
	 *
	 * @since 1.8.9
	 */
	public function init() {

		// Define field type information.
		$this->name     = esc_html__( 'Layout', 'wpforms' );
		$this->keywords = esc_html__( 'column, row', 'wpforms' );
		$this->type     = 'layout';
		$this->icon     = 'fa-columns';
		$this->order    = 140;
		$this->group    = 'fancy';

		// Default settings.
		$this->defaults = [
			'label'       => $this->name,
			'name'        => $this->name,
			'description' => '',
			'label_hide'  => '1',
			'size'        => 'large',
			'preset'      => '50-50',
			'display'     => 'rows',
			'columns'     => [
				0 => [
					'width_custom' => '',
					'width_preset' => '50',
					'fields'       => [],
				],
				1 => [
					'width_custom' => '',
					'width_preset' => '50',
					'fields'       => [],
				],
			],
		];

		$this->init_objects();
		$this->hooks();
	}

	/**
	 * Hooks.
	 *
	 * @since 1.8.9
	 */
	public function hooks() {

		$this->layout_hooks();

		add_filter( "wpforms_pro_admin_entries_edit_is_field_displayable_{$this->type}", '__return_false' );
	}
}
