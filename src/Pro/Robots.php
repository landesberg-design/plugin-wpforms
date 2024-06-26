<?php

namespace WPForms\Pro;

/**
 * Class Robots handles robots.txt related code.
 *
 * @since 1.7.0
 */
class Robots {

	/**
	 * Hooks.
	 *
	 * @since 1.7.0
	 */
	public function hooks() {

		add_filter( 'robots_txt', [ $this, 'disallow_upload_dir_indexing' ], -42 );
	}

	/**
	 * Disallow WPForms upload directory indexing in robots.txt.
	 *
	 * @since 1.7.0
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

		/**
		 * By default, Allow/Disallow rules should be appended on the `robots_txt` filter to WordPress's default rules.
		 * However, some customers were reporting that the default rules were not present in the output.
		 * In this case, we need to add a User-agent rule manually to make robots.txt valid.
		 */
		if ( strpos( $output, 'User-agent:' ) === false ) {
			$output .= "User-agent: *\n";
		}

		$output .= "Disallow: $upload_root\n";

		return $output;
	}
}
