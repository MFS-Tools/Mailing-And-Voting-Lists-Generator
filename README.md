MFS Spreadsheet Sorter
=====

A tool to automate yearly, manual, time-consuming tasks for the Manoa Faculty Senate

This tool has two main parts:
1. Determining the Constituency of each faculty from HR's records.
2. Generating mailing lists and voting lists for eligible faculty, separated by constituency.

## Table of Contents

- [Goals](#goals)
- [Implementation Details](#implementation-details)
- [Expected CSV Formats](#expected-csv-formats)
- [Dependencies](#dependencies)
- [Details of the WordPress Plugin](#details-of-the-wordpress-plugin)
- [Future Development](#future-development)

## Algorithm Design

### Data Inputs

The input data has strange formatting. In 2026, the HR data looks like:

| Name | Email | Department | Descr | UH Deptid Divis | UH Deptid Branc | UH Deptid Secti | TenureStat | Tenure Desc | FTE | TOT_FTE |
| ---- | ----- | ---------- | ----- | --------------- | --------------- | --------------- | ---------- | ----------- | --- | ------- |
| Doe, John M | johndoe@hawaii.edu | DEPARTMENT OF PHILOSOPHY | C OF ARTS, LANGUAGES & LETTERS | DEPARTMENT OF PHILOSOPHY | | FNT | FACULTY-NOT ELIG FOR TENURE | 1.000000 | 1 |
| Doe, Jane H | janedoe@hawaii.edu | CHEMISTRY DEPT | C OF NAT SCI | CHEMISTRY DEPT | CHEMISTRY DEPT | FTN | FACULTY-TENURED | 1.000000 | 1 |

Because of the irregular nature of the columns and their complex mapping to MFS Constituencies, the MFS came up with this mapping in 2026:

TODO: Add mapping.

### Determining Constituencies

Constituency-mapping is complicated, so a lookup table has been designed to automate the process.

For each row, the code checks multiple relevant columns, and determines a constituency for each person.

### Goals

*Main goal:* Automate some tedious tasks.

The program needs to generate the following:

1. Mailing Lists
  - ListServ csv format.
  - Congress has a mailing list.
  - Each constituency has its own mailing list.
2. Voting Lists
  - OpaVote csv format.

TODO: Add bullet points

3. Congress Info
  - An internal record for the MFS to hold on to.

Note: John's email should be added to the mailing lists so he can verify that his emails are being sent out.

TODO: Double check whether John's email should be added to the voting lists.

TODO: Add note about determining how many senators each constituency will recieve.

## Constrains / Reason for Development

HR doesn't keep record of constituencies, we have to figure them out on our own.

Updating these lists takes weeks. Faculty constituencies shift around, and some faculty join or leave.

### Implementation Details:



## User Instructions

User Inputs:
- Select the Raw Congress Data CSV file.
- Select the DataMap CSV file.
- Select the Dual Constituency Data CSV file.
- Click a "run" button to generate output CSV files.
- Download output CSV files.

Steps in the algorithm:
1. Collect user inputs.
2. Process CSV files with PapaParse.
3. Convert the data to MFS data.
  - Map all rows to rows that include constituency designations.
  - Use the DataMap CSV to determine constituencies from row data.
4. 
1. We only consider faculty members with at least 0.5 FTE. Anyone below this threshold is not eligible to vote.

The spreadsheet is not expected to be consistent each year, and the code has been built around data recieved in 2026. Therefore, someone with a working knowledge of JavaScript should check the code against future spreadsheets to ensure compatability.


### Dependencies

Dependencies are managed with a simple bundled local copy.

- [PapaParse](https://www.papaparse.com/), a fast CSV file parser and writer.
  - Saves headaches on file I/O, edge-case, & optimization.

Dependencies are located in `src/deps/`

### Challenges

Here are some of the challenges involved that this program overcomes:

- The MFS has its own way of designating "constituency" to each faculty member.
- The input data provided has multiple confusing columns which correspond to MFS constituencies.
- The input data contains multiple of the same faculty member on different rows.
- Sometimes, faculty members have equal participation or FTE in two different constituencies.
- Sometimes, a faculty member is split across several rows, and multiple rows can map to the same constituency, so their individual FTEs must be totaled.
    - We want to compare constituencies for a given faculty member, which doesn't always map cleanly to the separate rows.

- Contituencies have a complex identification process.


#### WordPress Overview:

WordPress Plugins allow you to paste HTML into the body of an existing site (via shortcode), but style and script tags will not run properly.
WordPress instead uses PHP, which lets you enqueue both CSS and JS files.

WordPress uses a PHP file that registers a shortcode.
When the shortcode is found on a page in the website, it calls whatever function you define.
The return value of this function is pasted, and replaces the shortcode.
If the return value is HTML, it is inserted into the div where the shortcode used to be.

The PHP file currently registers shortcode that does the following:

1. Enqueues the CSS file
2. Enqueues the JavaScript file
3. Injects the HTML snippet into the website.

The HTML file should not contain a Head or Body block.
In local testing, the HTML5 spec can infer where these will go.
Using a Head or Body can cause issues on the WP site, because only one of each is allowed.

## Development

### Installing the Project

Use git to install this project:

```powershell
git clone https://github.com/kylebueche/MFS-Spreadsheet-Sorter.git
```

You can also paste https://github.com/kylebueche/MFS-Spreadsheet-Sorter.git into GitHub Desktop.

### Testing Locally

You can test this plugin locally by pasting the local filepath of `src/mfs-spreadsheet-sorter.html` directly into your browser.

The HTML file contains a script that loads the CSS and JavaScript files, only when a local host is detected.
The plugin will load as it's own website, and you just have to refresh the page when you edit the code.

### Building

Once the plugin works, you can build it using the `build.bat` script on Windows, or the `build.sh` script on Linux.

The built plugin will be a .zip file located in the `build/` folder.

### Testing the Built Plugin

For testing WordPress plugins, you will need LocalWP installed.
Faulty plugins can crash WordPress, so please test them locally.

TODO: Add instructions for installing a WordPress plugin to both LocalWP and the school WP site.

## Details of the WordPress Plugin

WordPress plugins must be a zipped folder with a PHP file specifying the plugin details.

The current PHP file does the following tasks:
- Injects HTML into the `mfs-spreadsheet-sorter` shortcode.
- Enqueus custom CSS and JavaScript to run on the WordPress frontend

In WordPress, you cannot use the usual HTML syntax for CSS or JavaScript:

```HTML
<head>
    <link rel="stylesheet" href="my-style.css">
    <script src="my-script.js">
</head>
```

Reasons this isn't allowed:
- This WordPress plugin just pastes HTML into an existing site. The site already has a head block.
- The pasted HTML cannot see other files bundled in the plugin. CSS and JS have to be loaded with PHP.

Instead, a WordPress PHP plugin adds the JavaScript and CSS files by *enqueuing* them:

```PHP
wp_enqueue_script(
    'my-script-name',
    plugins_url( 'my-script.js' __FILE__ ),
    array(), // dependencies list
    '1.0.0', // version
    array( // extra settings
        'strategy' => 'defer' // Wait till all HTML has loaded to run this script
        'in-footer' => false
    )
);

wp_enqueue_style(
    'my-style-name'
    plugins_url( 'my-style.css', __FILE__ ),
    array() // dependencies list
    '1.0.0' // version
    'all' // media types (PC, phone, etc)
);
```

Future development shouldn't need to modify the existing PHP file.

If in doubt, refer to the WordPress PHP API docs.

### Definitions

- **Constituency:** A named group that some faculty belong to.
    - Faculty may have multiple constituencies.
    - As of 2026 there are 19 constituencies.
- **Total FTE:** The sum of all a faculty member's Full-Time-Employment points.
- **Eligible Faculty:** Faculty who have Total FTE >= 0.5 (at least half-time employed).
- **Congress:** The collective Eligible Faculty body (all constituencies combined).
