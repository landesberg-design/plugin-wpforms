<?php

namespace WPForms\Pro\Forms\Fields\Layout;

use WPForms\Pro\Forms\Fields\Traits\Layout\Frontend as LayoutFrontendTrait;

/**
 * The Layout field's Frontend class.
 *
 * @since 1.8.9
 */
class Frontend {

	use LayoutFrontendTrait {
		hooks as trait_hooks;
	}

	/**
	 * Register hooks.
	 *
	 * @since 1.8.9
	 */
	private function hooks() {

		$this->trait_hooks();

		add_filter( 'wpforms_pro_fields_entry_preview_print_entry_preview_exclude_field', [ $this, 'entry_preview_exclude_field' ], 10, 3 );
	}

	/**
	 * Excluded from the Entry Preview display.
	 *
	 * @since 1.8.9
	 *
	 * @param bool  $exclude   Exclude the field.
	 * @param array $field     Field data.
	 * @param array $form_data Form data.
	 *
	 * @return bool
	 * @noinspection PhpMissingParamTypeInspection
	 * @noinspection PhpUnusedParameterInspection
	 */
	public function entry_preview_exclude_field( $exclude, $field, $form_data ): bool { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.FoundAfterLastUsed

		if ( $field['type'] === $this->field_obj->type ) {
			return true;
		}

		return (bool) $exclude;
	}
}
