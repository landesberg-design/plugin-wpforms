<?php
/**
 * Payment related functions.
 *
 * @since 1.0.0
 */

/**
 * Get supported currencies.
 *
 * @since 1.2.4
 *
 * @return array
 */
function wpforms_get_currencies() {

	$currencies = array(
		'USD' => array(
			'name'                => esc_html__( 'U.S. Dollar', 'wpforms' ),
			'symbol'              => '&#36;',
			'symbol_pos'          => 'left',
			'thousands_separator' => ',',
			'decimal_separator'   => '.',
			'decimals'            => 2,
		),
		'GBP' => array(
			'name'                => esc_html__( 'Pound Sterling', 'wpforms' ),
			'symbol'              => '&pound;',
			'symbol_pos'          => 'left',
			'thousands_separator' => ',',
			'decimal_separator'   => '.',
			'decimals'            => 2,
		),
		'EUR' => array(
			'name'                => esc_html__( 'Euro', 'wpforms' ),
			'symbol'              => '&euro;',
			'symbol_pos'          => 'right',
			'thousands_separator' => '.',
			'decimal_separator'   => ',',
			'decimals'            => 2,
		),
		'AUD' => array(
			'name'                => esc_html__( 'Australian Dollar', 'wpforms' ),
			'symbol'              => '&#36;',
			'symbol_pos'          => 'left',
			'thousands_separator' => ',',
			'decimal_separator'   => '.',
			'decimals'            => 2,
		),
		'BRL' => array(
			'name'                => esc_html__( 'Brazilian Real', 'wpforms' ),
			'symbol'              => 'R$',
			'symbol_pos'          => 'left',
			'thousands_separator' => '.',
			'decimal_separator'   => ',',
			'decimals'            => 2,
		),
		'CAD' => array(
			'name'                => esc_html__( 'Canadian Dollar', 'wpforms' ),
			'symbol'              => '&#36;',
			'symbol_pos'          => 'left',
			'thousands_separator' => ',',
			'decimal_separator'   => '.',
			'decimals'            => 2,
		),
		'CZK' => array(
			'name'                => esc_html__( 'Czech Koruna', 'wpforms' ),
			'symbol'              => '&#75;&#269;',
			'symbol_pos'          => 'right',
			'thousands_separator' => '.',
			'decimal_separator'   => ',',
			'decimals'            => 2,
		),
		'DKK' => array(
			'name'                => esc_html__( 'Danish Krone', 'wpforms' ),
			'symbol'              => 'kr.',
			'symbol_pos'          => 'right',
			'thousands_separator' => '.',
			'decimal_separator'   => ',',
			'decimals'            => 2,
		),
		'HKD' => array(
			'name'                => esc_html__( 'Hong Kong Dollar', 'wpforms' ),
			'symbol'              => '&#36;',
			'symbol_pos'          => 'left',
			'thousands_separator' => ',',
			'decimal_separator'   => '.',
			'decimals'            => 2,
		),
		'HUF' => array(
			'name'                => esc_html__( 'Hungarian Forint', 'wpforms' ),
			'symbol'              => 'Ft',
			'symbol_pos'          => 'right',
			'thousands_separator' => '.',
			'decimal_separator'   => ',',
			'decimals'            => 2,
		),
		'ILS' => array(
			'name'                => esc_html__( 'Israeli New Sheqel', 'wpforms' ),
			'symbol'              => '&#8362;',
			'symbol_pos'          => 'left',
			'thousands_separator' => ',',
			'decimal_separator'   => '.',
			'decimals'            => 2,
		),
		'MYR' => array(
			'name'                => esc_html__( 'Malaysian Ringgit', 'wpforms' ),
			'symbol'              => '&#82;&#77;',
			'symbol_pos'          => 'left',
			'thousands_separator' => ',',
			'decimal_separator'   => '.',
			'decimals'            => 2,
		),
		'MXN' => array(
			'name'                => esc_html__( 'Mexican Peso', 'wpforms' ),
			'symbol'              => '&#36;',
			'symbol_pos'          => 'left',
			'thousands_separator' => ',',
			'decimal_separator'   => '.',
			'decimals'            => 2,
		),
		'NOK' => array(
			'name'                => esc_html__( 'Norwegian Krone', 'wpforms' ),
			'symbol'              => 'Kr',
			'symbol_pos'          => 'left',
			'thousands_separator' => '.',
			'decimal_separator'   => ',',
			'decimals'            => 2,
		),
		'NZD' => array(
			'name'                => esc_html__( 'New Zealand Dollar', 'wpforms' ),
			'symbol'              => '&#36;',
			'symbol_pos'          => 'left',
			'thousands_separator' => ',',
			'decimal_separator'   => '.',
			'decimals'            => 2,
		),
		'PHP' => array(
			'name'                => esc_html__( 'Philippine Peso', 'wpforms' ),
			'symbol'              => 'Php',
			'symbol_pos'          => 'left',
			'thousands_separator' => ',',
			'decimal_separator'   => '.',
			'decimals'            => 2,
		),
		'PLN' => array(
			'name'                => esc_html__( 'Polish Zloty', 'wpforms' ),
			'symbol'              => '&#122;&#322;',
			'symbol_pos'          => 'left',
			'thousands_separator' => '.',
			'decimal_separator'   => ',',
			'decimals'            => 2,
		),
		'RUB' => array(
			'name'                => esc_html__( 'Russian Ruble', 'wpforms' ),
			'symbol'              => 'pyб',
			'symbol_pos'          => 'right',
			'thousands_separator' => ' ',
			'decimal_separator'   => '.',
			'decimals'            => 2,
		),
		'SGD' => array(
			'name'                => esc_html__( 'Singapore Dollar', 'wpforms' ),
			'symbol'              => '&#36;',
			'symbol_pos'          => 'left',
			'thousands_separator' => ',',
			'decimal_separator'   => '.',
			'decimals'            => 2,
		),
		'ZAR' => array(
			'name'                => esc_html__( 'South African Rand', 'wpforms' ),
			'symbol'              => 'R',
			'symbol_pos'          => 'left',
			'thousands_separator' => ',',
			'decimal_separator'   => '.',
			'decimals'            => 2,
		),
		'SEK' => array(
			'name'                => esc_html__( 'Swedish Krona', 'wpforms' ),
			'symbol'              => 'Kr',
			'symbol_pos'          => 'right',
			'thousands_separator' => '.',
			'decimal_separator'   => ',',
			'decimals'            => 2,
		),
		'CHF' => array(
			'name'                => esc_html__( 'Swiss Franc', 'wpforms' ),
			'symbol'              => 'CHF',
			'symbol_pos'          => 'left',
			'thousands_separator' => ',',
			'decimal_separator'   => '.',
			'decimals'            => 2,
		),
		'TWD' => array(
			'name'                => esc_html__( 'Taiwan New Dollar', 'wpforms' ),
			'symbol'              => '&#36;',
			'symbol_pos'          => 'left',
			'thousands_separator' => ',',
			'decimal_separator'   => '.',
			'decimals'            => 2,
		),
		'THB' => array(
			'name'                => esc_html__( 'Thai Baht', 'wpforms' ),
			'symbol'              => '&#3647;',
			'symbol_pos'          => 'left',
			'thousands_separator' => ',',
			'decimal_separator'   => '.',
			'decimals'            => 2,
		),
	);

	return array_change_key_case( apply_filters( 'wpforms_currencies', $currencies ), CASE_UPPER );
}

/**
 * Sanitize amount by stripping out thousands separators.
 *
 * @link https://github.com/easydigitaldownloads/easy-digital-downloads/blob/master/includes/formatting.php#L24
 *
 * @since 1.2.6
 *
 * @param string $amount   Price amount.
 * @param string $currency Currency ISO code (USD, EUR, etc).
 *
 * @return string $amount
 */
function wpforms_sanitize_amount( $amount, $currency = '' ) {

	if ( empty( $currency ) ) {
		$currency = wpforms_get_currency();
	}
	$currency      = strtoupper( $currency );
	$currencies    = wpforms_get_currencies();
	$thousands_sep = isset( $currencies[ $currency ]['thousands_separator'] ) ? $currencies[ $currency ]['thousands_separator'] : ',';
	$decimal_sep   = isset( $currencies[ $currency ]['decimal_separator'] ) ? $currencies[ $currency ]['decimal_separator'] : '.';

	// Sanitize the amount.
	if ( $decimal_sep === ',' && false !== ( $found = strpos( $amount, $decimal_sep ) ) ) {
		if ( ( $thousands_sep === '.' || $thousands_sep === ' ' ) && false !== ( $found = strpos( $amount, $thousands_sep ) ) ) {
			$amount = str_replace( $thousands_sep, '', $amount );
		} elseif ( empty( $thousands_sep ) && false !== ( $found = strpos( $amount, '.' ) ) ) {
			$amount = str_replace( '.', '', $amount );
		}
		$amount = str_replace( $decimal_sep, '.', $amount );
	} elseif ( $thousands_sep === ',' && false !== ( $found = strpos( $amount, $thousands_sep ) ) ) {
		$amount = str_replace( $thousands_sep, '', $amount );
	}

	$amount = preg_replace( '/[^0-9\.-]/', '', $amount );

	/**
	 * Set correct currency decimals.
	 *
	 * @since 1.6.6
	 *
	 * @param int     $decimals Default number of decimals.
	 * @param string  $amount   Price amount.
	 */
	$decimals = (int) apply_filters(
		'wpforms_sanitize_amount_decimals',
		wpforms_get_currency_decimals( $currency ),
		$amount
	);

	$amount = number_format( (float) $amount, $decimals, '.', '' );

	return $amount;
}

/**
 * Return a nicely formatted amount.
 *
 * @since 1.2.6
 *
 * @param string $amount   Price amount.
 * @param bool   $symbol   Currency symbol ($, €).
 * @param string $currency Currency ISO code (USD, EUR, etc).
 *
 * @return string $amount Newly formatted amount or Price Not Available
 */
function wpforms_format_amount( $amount, $symbol = false, $currency = '' ) {

	if ( empty( $currency ) ) {
		$currency = wpforms_get_currency();
	}
	$currency      = strtoupper( $currency );
	$currencies    = wpforms_get_currencies();
	$thousands_sep = isset( $currencies[ $currency ]['thousands_separator'] ) ? $currencies[ $currency ]['thousands_separator'] : ',';
	$decimal_sep   = isset( $currencies[ $currency ]['decimal_separator'] ) ? $currencies[ $currency ]['decimal_separator'] : '.';
	$sep_found     = ! empty( $decimal_sep ) ? strpos( $amount, $decimal_sep ) : false;

	// Format the amount.
	if (
		$decimal_sep === ',' &&
		$sep_found !== false
	) {
		$whole  = substr( $amount, 0, $sep_found );
		$part   = substr( $amount, $sep_found + 1, ( strlen( $amount ) - 1 ) );
		$amount = $whole . '.' . $part;
	}

	// Strip "," (comma) from the amount (if set as the thousands separator).
	if (
		$thousands_sep === ',' &&
		strpos( $amount, $thousands_sep ) !== false
	) {
		$amount = (float) str_replace( ',', '', $amount );
	}

	if ( empty( $amount ) ) {
		$amount = 0;
	}

	/** This filter is documented in wpforms_sanitize_amount function above. */
	$decimals = (int) apply_filters(
		'wpforms_sanitize_amount_decimals',
		wpforms_get_currency_decimals( $currency ),
		$amount
	);

	$number = number_format( (float) $amount, $decimals, $decimal_sep, $thousands_sep );

	// Display a symbol, if any.
	if ( $symbol && isset( $currencies[ $currency ]['symbol_pos'] ) ) {
		$symbol_padding = apply_filters( 'wpforms_currency_symbol_padding', ' ' );
		if ( $currencies[ $currency ]['symbol_pos'] === 'right' ) {
			$number .= $symbol_padding . $currencies[ $currency ]['symbol'];
		} else {
			$number = $currencies[ $currency ]['symbol'] . $symbol_padding . $number;
		}
	}

	return $number;
}

/**
 * Get default number of decimals for a given currency.
 * If not provided inside the currency, default value is used, which is 2.
 *
 * @since 1.6.6
 *
 * @param array|string $currency Currency data we are getting decimals for.
 *
 * @return int
 */
function wpforms_get_currency_decimals( $currency ) {

	if ( is_string( $currency ) ) {
		$currencies    = wpforms_get_currencies();
		$currency_code = strtoupper( $currency );
		$currency      = isset( $currencies[ $currency_code ] ) ? $currencies[ $currency_code ] : [];
	}

	/**
	 * Get currency decimals.
	 *
	 * @since 1.6.6
	 *
	 * @param int          $decimals Default number of decimals.
	 * @param array|string $currency Currency data we are getting decimals for.
	 */
	return (int) apply_filters(
		'wpforms_get_currency_decimals',
		isset( $currency['decimals'] ) ? $currency['decimals'] : 2,
		$currency
	);
}

/**
 * Get payments currency.
 * If the currency not available anymore 'USD' used as default.
 *
 * @since 1.6.6
 *
 * @return string
 */
function wpforms_get_currency() {

	$currency   = wpforms_setting( 'currency' );
	$currencies = wpforms_get_currencies();

	/**
	 * Get payments currency.
	 *
	 * @since 1.6.6
	 *
	 * @param string $currency   Payments currency.
	 * @param array  $currencies Available currencies.
	 */
	return apply_filters(
		'wpforms_get_currency',
		isset( $currencies[ $currency ] ) ? $currency : 'USD',
		$currencies
	);
}

/**
 * Return recognized payment field types.
 *
 * @since 1.0.0
 *
 * @return array
 */
function wpforms_payment_fields() {

	return (array) apply_filters(
		'wpforms_payment_fields',
		[ 'payment-single', 'payment-multiple', 'payment-checkbox', 'payment-select' ]
	);
}

/**
 * Check if form or entry contains payment
 *
 * @since 1.0.0
 *
 * @param string $type Either 'entry' or 'form'.
 * @param array  $data List of form fields.
 *
 * @return bool
 */
function wpforms_has_payment( $type = 'entry', $data = array() ) {

	$payment        = false;
	$payment_fields = wpforms_payment_fields();

	if ( ! empty( $data['fields'] ) ) {
		$data = $data['fields'];
	}

	if ( empty( $data ) ) {
		return false;
	}

	foreach ( $data as $field ) {
		if ( isset( $field['type'] ) && in_array( $field['type'], $payment_fields, true ) ) {

			// For entries, only return true if the payment field has an amount.
			if (
				$type === 'form' ||
				(
					$type === 'entry' &&
					! empty( $field['amount'] ) &&
					! empty( (float) $field['amount'] )
				)
			) {
				$payment = true;

				break;
			}
		}
	}

	return $payment;
}

/**
 * Check to see if a form has an active payment gateway configured.
 *
 * @since 1.4.5
 *
 * @param array $form_data Form data and settings.
 *
 * @return bool
 */
function wpforms_has_payment_gateway( $form_data ) {

	// PayPal Standard check.
	if ( ! empty( $form_data['payments']['paypal_standard']['enable'] ) ) {
		return true;
	}

	// Stripe Check.
	if ( ! empty( $form_data['payments']['stripe']['enable'] ) ) {
		return true;
	}

	return apply_filters( 'wpforms_has_payment_gateway', false, $form_data );
}

/**
 * Get payment total amount from entry.
 *
 * @since 1.0.0
 *
 * @param array $fields
 *
 * @return float
 */
function wpforms_get_total_payment( $fields ) {

	$fields = wpforms_get_payment_items( $fields );
	$total  = 0;

	if ( empty( $fields ) ) {
		return false;
	}

	foreach ( $fields as $field ) {
		if ( ! empty( $field['amount'] ) ) {
			$amount = wpforms_sanitize_amount( $field['amount'] );
			$total  = $total + $amount;
		}
	}

	return wpforms_sanitize_amount( $total );
}

/**
 * Get payment fields in an entry.
 *
 * @since 1.0.0
 *
 * @param array $fields
 *
 * @return array|bool False if no fields provided, otherwise array.
 */
function wpforms_get_payment_items( $fields = array() ) {

	if ( empty( $fields ) ) {
		return false;
	}

	$payment_fields = wpforms_payment_fields();

	foreach ( $fields as $id => $field ) {
		if (
			empty( $field['type'] ) ||
			! in_array( $field['type'], $payment_fields, true ) ||
			empty( $field['amount'] ) ||
			empty( (float) $field['amount'] )
		) {
			// Remove all non-payment fields as well as payment fields with no amount.
			unset( $fields[ $id ] );
		}
	}

	return $fields;
}
