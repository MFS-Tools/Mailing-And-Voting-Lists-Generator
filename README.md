MFS Spreadsheet Sorter
=====

A tool to automate yearly, manual, time-consuming tasks for the Manoa Faculty Senate

This tool has two main parts:
1. Determining the constituency of each faculty from HR's records.
2. Generating mailing lists and voting lists for eligible faculty, separated by constituency.

## Table of Contents

- [Goals](#goals)
- [Implementation Details](#implementation-details)
- [Expected CSV Formats](#expected-csv-formats)
- [Dependencies](#dependencies)
- [Details of the WordPress Plugin](#details-of-the-wordpress-plugin)
- [Future Development](#future-development)

- [User Guide](#user-guide)
  - [Input CSVs](#input-csvs)
  - [Output CSVs](#output-csvs)
- [Programming](#programming)
- [Building](#building)
- [Deploying](#deploying)

## User Guide

1. Access the website at (TODO: Add permalink)
2. Select the Congress Data CSV file from HR.
3. Select the DataMap CSV file.
4. Select the Dual Constituency Data CSV file.
5. Click "Process Files."
6. Download the output CSV files.

See below for details on Input files & Output files:

### Input CSVs

There are 3 data inputs that this application expects:
1. Faculty Congress CSV (Procured by HR yearly)
2. Data Mapping CSV (Maintained by MFS)
3. Dual Faculty CSV (Maintained by John/MFS)

#### Faculty Congress CSV from HR

2026 Example:

| Name | Email | Department Descr | UH Deptid Divis | UH Deptid Branc | UH Deptid Secti | TenureStat | Tenure Desc | FTE | TOT_FTE |
| ---- | ----- | ---------------- | --------------- | --------------- | --------------- | ---------- | ----------- | --- | ------- |
| Doe, John M | jdoe@hawaii.edu | DEPARTMENT OF PHILOSOPHY | C OF ARTS, LANGUAGES & LETTERS | DEPARTMENT OF PHILOSOPHY | | FNT | FACULTY-NOT ELIG FOR TENURE | 1.000000 | 1 |
| Schmoe, Joe M. | jschmoe@hawaii.edu | GEOGRAPHY AND ENVIRONMENT | C OF SOC SCI | GEOGRAPHY AND ENV DEPT | | FPR | FACULTY-TENURED | 0.500000 | 1 |
| Schmoe, Joe M. | jschmoe@hawaii.edu | HYDROLOGICAL SCIENCES DIVISION | RES & DEAN OF GRAD DIV | WATR R R CTR | WATR R R CTR | FPR | FACULTY-TENURED | 0.500000 | 1 |

#### Data Mapping CSV

The Data Mapping CSV uses the dual key ["UH Deptid Divis", "UH Deptid Branc"] to find the correct constituency.

When "UH Deptid Branc" is blank, it uses the Single key ["UH Deptid Divis"] to find the correct constituency.

2026 Example:

| UH Deptid Divis | UH Deptid Branc | MFS_codes | MFS_long_codes |
| --------------- | --------------- | --------- | -------------- |
| C OF EDUC | | ED | College of Education |
| C OF HLTH SCI & SW | SCH OF NURSG | SONDH | School of Nursing and Dental Hygiene |
| C OF HLTH SCI & SW | SCH PUB HLTH | TSSWPH | Thompson School of Social Work & Public Health |
| C OF HLTH SCI & SW | SCH SOC WORK | TSSWPH | Thompson School of Social Work & Public Health |

Constituencies are labeled under "MFS_codes."

#### Dual Faculty CSV

Some faculty have multiple constituencies, but the code chooses the one with the highest FTE.

There are a small number of ties that John manually resolves via this CSV file.

2026 Example:

| Name | Email | Home | Constituency | Department Descr | UH Deptid Divis | UH Deptid Branc | UH Deptid Secti | TenureStat | Tenure Desc | FTE | TOT_FTE |
| Doe, John M | jdoe@hawaii.edu | CALL | SOCSCI | ANTHROPOLOGY | C OF SOC SCI | ANTHROPOLOGY DEPT | FTN | FACULTY-TENURED | 0.500000 | 1 |
| Doe, John M | jdoe@hawaii.edu | CALL | CALL | CTR SE ASIAN STU | C OF ARTS, LANGUAGES & LETTERS | CTR SE ASIAN STU | FTN | FACULTY-TENURED | 0.500000 | 1 |
| Schmoe, Joe M | jschmoe@hawaii.edu | ED | CALL | CENTER FOR PHILIPPINE STUDIES | C OF ARTS, LANGUAGES & LETTERS | CENTER FOR PHILIPPINE STUDIES | FTN | FACULTY-TENURED | 0.500000 | 1 |
| Schmoe, Joe M | jschmoe@hawaii.edu | ED | ED | CURRICULUM STUDIES | C OF EDUC | CURRICULUM STUDIES | FTN | FACULTY-TENURED | 0.500000 | 1 |

Resolved constituencies are labeled under the "Home" column.

### Output CSVs

After clicking "Process Files," the code generates:
1. Mailing Lists in ListServ CSV format. One for each constituency, and one for congress as a whole.
2. Voting Lists in OpaVote CSV format. One for each constituency, and one for congress as a whole.
3. A Congress masterlist for MFS records. This is basically the HR data with a Constituency column added.
4. Statistics that say how many senator seats should be allocated to each Constituency.

## Programming

### Goals

The program needs to generate the following:

1. ListServ Mailing Lists
  - ListServ has a specific CSV format.
  - One for Congress, and one for each Constituency.
  - John's email must be appended each list.
2. OpaVote Voting Lists
  - OpaVote has a specific CSV format.
  - One for Congress, and one for each Constituency.
3. A Congress Masterlist for MFS Records
  - Same as HR data, but with the Constituencies column added.
4. Useful Statistics
  - Calculates the # of senators for a Constituency based on the total number of faculty in that Constituency.

TODO: Double check whether John's email should be added to the voting lists.

In order to achieve the above, we have to know what Constituency each faculty member belongs to.
HR doesn't keep record of these, so we have to map their codes to our Constituency codes.

See [Data Inputs](#data-inputs) above for exampels of users' input data.

### Algorithm Overview

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
