<?php

namespace WPForms\Integrations\DefaultThemes;

use WPForms\Integrations\IntegrationInterface;

/**
 * Class DefaultThemes.
 *
 * @since 1.6.6
 */
class DefaultThemes implements IntegrationInterface {

	/**
	 * Twenty Twenty theme name.
	 *
	 * @since 1.6.6
	 */
	const TT = 'twentytwenty';

	/**
	 * Twenty Twenty-One theme name.
	 *
	 * @since 1.6.6
	 */
	const TT1 = 'twentytwentyone';

	/**
	 * Current theme name.
	 *
	 * @since 1.6.6
	 *
	 * @var string
	 */
	private $current_theme;

	/**
	 * Determinate default theme.
	 *
	 * @since 1.6.6
	 *
	 * @return string
	 */
	private function get_current_default_theme() {

		$allowed_themes = [ self::TT, self::TT1 ];
		$theme          = wp_get_theme();
		$theme_name     = $theme->get_template();
		$theme_parent   = $theme->parent();
		$default_themes = array_intersect( array_filter( [ $theme_name, $theme_parent ] ), $allowed_themes );

		return ! empty( $default_themes[0] ) ? $default_themes[0] : '';
	}

	/**
	 * Allow load integration.
	 *
	 * @since 1.6.6
	 *
	 * @return bool
	 */
	public function allow_load() {

		$this->current_theme = $this->get_current_default_theme();

		return ! empty( $this->current_theme );
	}

	/**
	 * Load integration.
	 *
	 * @since 1.6.6
	 */
	public function load() {

		if ( $this->current_theme === self::TT ) {
			$this->tt_hooks();

			return;
		}

		if ( $this->current_theme === self::TT1 ) {
			$this->tt1_hooks();

			return;
		}
	}

	/**
	 * Load hooks for the Twenty Twenty theme.
	 *
	 * @since 1.6.6
	 */
	private function tt_hooks() {

		add_action( 'wp_enqueue_scripts', [ $this, 'tt_iframe_fix' ], 11 );
	}

	/**
	 * Load hooks for the Twenty Twenty-One theme.
	 *
	 * @since 1.6.6
	 */
	private function tt1_hooks() {

		if ( wpforms_setting( 'disable-css' ) === '1' ) {
			add_action( 'wp_enqueue_scripts', [ $this, 'tt1_multiple_fields_fix' ], 11 );
			add_action( 'wp_enqueue_scripts', [ $this, 'tt1_dropdown_fix' ], 11 );
		}

		if ( wpforms_setting( 'disable-css' ) === '2' ) {
			add_action( 'wp_enqueue_scripts', [ $this, 'tt1_base_style_fix' ], 11 );
		}
	}


	/**
	 * Apply fix for checkboxes and radio fields in the Twenty Twenty-One theme.
	 *
	 * @since 1.6.6
	 */
	public function tt1_multiple_fields_fix() {

		wp_add_inline_style(
			'twenty-twenty-one-style',
			/** @lang CSS */ // phpcs:ignore Generic.Commenting.DocComment.MissingShort
			'@supports (-webkit-appearance: none) or (-moz-appearance: none) {
				div.wpforms-container-full .wpforms-form input[type=checkbox] {
					-webkit-appearance: checkbox;
					-moz-appearance: checkbox;
				}
				div.wpforms-container-full .wpforms-form input[type=radio] {
					-webkit-appearance: radio;
					-moz-appearance: radio;
				}
				div.wpforms-container-full .wpforms-form input[type=checkbox]:after,
				div.wpforms-container-full .wpforms-form input[type=radio]:after {
					content: none;
				}
			}'
		);
	}

	/**
	 * Apply fix for dropdown field arrow, when it disappeared from select in the Twenty Twenty-One theme.
	 *
	 * @since 1.6.8
	 */
	public function tt1_dropdown_fix() {

		wp_add_inline_style(
			'twenty-twenty-one-style',
			/** @lang CSS */ // phpcs:ignore Generic.Commenting.DocComment.MissingShort
			'div.wpforms-container-full .wpforms-form select {
				background-image: url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'10\' fill=\'%2328303d\'><polygon points=\'0,0 10,0 5,5\'/></svg>");
				background-repeat: no-repeat;
				background-position: right var(--form--spacing-unit) top 60%;
			}'
		);
	}

	/**
	 * Apply fix for checkboxes and radio fields width in the Twenty Twenty-One theme, when the user uses only base styles.
	 *
	 * @since 1.6.8
	 */
	public function tt1_base_style_fix() {

		wp_add_inline_style(
			'twenty-twenty-one-style',
			/** @lang CSS */ // phpcs:ignore Generic.Commenting.DocComment.MissingShort
			'.wpforms-container .wpforms-field input[type=checkbox],
			.wpforms-container .wpforms-field input[type=radio] {
				width: 25px;
				height: 25px;
			}
			.wpforms-container .wpforms-field input[type=checkbox] + label,
			.wpforms-container .wpforms-field input[type=radio] + label {
				vertical-align: top;
			}'
		);
	}

	/**
	 * Apply resize-fix for iframe HTML element, when the next page was clicked in the Twenty Twenty theme.
	 *
	 * @since 1.6.6
	 */
	public function tt_iframe_fix() {

		wp_add_inline_script(
			'twentytwenty-js',
			/** @lang JavaScript */ // phpcs:ignore Generic.Commenting.DocComment.MissingShort
			'window.addEventListener( "load", function() {

				if ( typeof jQuery === "undefined" ) {
					return;
				}

				jQuery( document ).on( "wpformsPageChange", function() { 

					if ( typeof twentytwenty === "undefined" || typeof twentytwenty.intrinsicRatioVideos === "undefined" || typeof twentytwenty.intrinsicRatioVideos.makeFit === "undefined" ) {
						return;
					}
	
					twentytwenty.intrinsicRatioVideos.makeFit();
				} );
			} );'
		);
	}
}
