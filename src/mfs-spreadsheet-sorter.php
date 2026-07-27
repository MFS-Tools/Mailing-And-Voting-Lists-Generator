<?php
/*
Plugin Name: MFS-Spreadsheet-Sorter
Description: Sorts faculty by constituency for MFS mailing lists and per-constituency senator counts.
Version: 1.0.0
Author: Kyle Bueche

Shortcode: [mfs_spreadsheet_sorter]
*/

if (!defined('ABSPATH')) exit;


function mfs_load_spreadsheet_plugin( $atts ) {
    // Load JavaScript, only runs after HTML loads
    wp_enqueue_script(
        'papa-parse',
        plugins_url( 'deps/papaparse.min.js', __FILE__ ),
        array(), // dependencies
        '5.4.1', // version
        array( 'strategy' => 'defer' ) // Only run HTML loads
    );
    wp_enqueue_script(
        'mfs-spreadsheet-sorter-script',
        plugins_url( 'mfs-spreadsheet-sorter.js', __FILE__ ),
        array('papa-parse'), // Wait till papaparse loads to run
        '1.0.0', // version
        array( 'strategy' => 'defer' ) // Only run once HTML loads
    );

    // Load Stylesheet
    wp_enqueue_style(
        'mfs-spreadsheet-sorter-style',
        plugins_url( 'mfs-spreadsheet-sorter.css', __FILE__ ),
        array(), // dependencies
        '1.0.0', // version
        'all' // Defined for all media types (PC site, phone site, etc.)
    );


    // Parses and cleans the HTML file
    ob_start();
    include( 'mfs-spreadsheet-sorter.html' );
    $html_content = ob_get_clean();

    // Replace the shortcode with the HTML.
    return $html_content;
}

// Register the shortcode for easy use in WordPress
add_shortcode( 'mfs_spreadsheet_sorter', 'mfs_load_spreadsheet_plugin' );
