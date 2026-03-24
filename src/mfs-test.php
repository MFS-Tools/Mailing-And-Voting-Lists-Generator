<?php
/*
Plugin Name: MFS-Spreadsheet-Sorter
Description: Sorts faculty by constituency for MFS mailing lists and per-constituency senator counts.
Version: 1.0.0
Author: Kyle Bueche

Shortcode: [mfs_spreadsheet_sorter]
*/

if (!defined('ABSPATH')) exit;

function load_app( $atts ) {
    load_js_from_file();
    load_css_from_file();
    // The shortcode is replaced with the HTML file returned here
    return load_html_from_file();
}

// Enqueues JavaScript file, which loads after the HTML is inserted.
function load_js_from_file() {
    wp_enqueue_script(
        'mfs-spreadsheet-sorter-script',
        plugins_url( 'mfs-spreadsheet-sorter.js', __FILE__ ),
        array(),
        '1.0.0',
        array(
            'strategy' => 'defer', // Only run once the HTML DOM tree has fully loaded
            'in-footer' => false
        )
    );
}

// enqueues the CSS stylesheet.
function load_css_from_file() {
    wp_enqueue_style(
        'mfs-spreadsheet-sorter-style',
        plugins_url( 'mfs-spreadsheet-sorter.css', __FILE__ ),
        array(),
        '1.0.0',
        'all' // Defined for all media types (PC site, phone site, etc.)
    );
}

// Parses and returns the html file as a clean string.
function load_html_from_file() {
    ob_start();
    include( 'mfs-spreadsheet-sorter.html' );
    $html_content = ob_get_clean();
    return $html_content;
}

// Register the shortcode for easy use in WordPress
add_shortcode( 'mfs_spreadsheet-sorter', 'load_app' );
