<?php

namespace WPForms\SmartTags\SmartTag;

/**
 * Class UserMeta.
 *
 * @since 1.6.7
 */
class UserMeta extends SmartTag {

	/**
	 * Get smart tag value.
	 *
	 * @since 1.6.7
	 *
	 * @param array  $form_data Form data.
	 * @param array  $fields    List of fields.
	 * @param string $entry_id  Entry ID.
	 *
	 * @return string
	 */
	public function get_value( $form_data, $fields = [], $entry_id = '' ) {

		$attributes = $this->get_attributes();

		if ( empty( $attributes['key'] ) ) {
			return '';
		}

		$user    = $this->get_user( $entry_id );
		$user_id = $user->ID ?? 0;

		if ( ! $user_id ) {
			return '';
		}

		return wp_kses_post(
			get_user_meta(
				$user_id,
				sanitize_text_field( $attributes['key'] ),
				true
			)
		);
	}
}
