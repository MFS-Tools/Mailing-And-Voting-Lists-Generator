MFS Spreadsheet Sorter
=====

A tool that generates ListServ & OpaVote lists for UHM faculty constituencies & congress.

## Table of Contents

- [Details of the WordPress Plugin](#details-of-the-wordpress-plugin)

- [User Guide](#user-guide)
- [Programmer's Guide](#programmers-guide)
- [Building the WordPress Plugin](#building-the-wordpress-plugin)
- [Deploying to WordPress](#deploying-to-wordpress)

## User Guide

1. Access the website at (TODO: Add permalink after deploying).
2. Select the 3 input files.
3. Click "Process Files."
4. Download the output files.

See below for details on Input files & Output files.

### Faculty Congress CSV

The Faculty Congress CSV is procured by HR yearly.

- One faculty may have multiple row entries.
- Multiple rows indicate that a faculty is a part of multiple divisions.
- The MFS separates faculty into constituencies internally, so we need to determine them from this data.

Here's a 2026 example:

| Name | Email | Department Descr | UH Deptid Divis | UH Deptid Branc | UH Deptid Secti | TenureStat | Tenure Desc | FTE | TOT_FTE |
| ---- | ----- | ---------------- | --------------- | --------------- | --------------- | ---------- | ----------- | --- | ------- |
| Doe, John M | jdoe@hawaii.edu | DEPARTMENT OF PHILOSOPHY | C OF ARTS, LANGUAGES & LETTERS | DEPARTMENT OF PHILOSOPHY | | FNT | FACULTY-NOT ELIG FOR TENURE | 1.000000 | 1 |
| Schmoe, Joe M. | jschmoe@hawaii.edu | GEOGRAPHY AND ENVIRONMENT | C OF SOC SCI | GEOGRAPHY AND ENV DEPT | | FPR | FACULTY-TENURED | 0.500000 | 1 |
| Schmoe, Joe M. | jschmoe@hawaii.edu | HYDROLOGICAL SCIENCES DIVISION | RES & DEAN OF GRAD DIV | WATR R R CTR | WATR R R CTR | FPR | FACULTY-TENURED | 0.500000 | 1 |

<hr>

### Data Mapping CSV

The Data Mapping CSV is maintained by the MFS.
If the above format changes, this file makes it easy to remap everything correctly without changing the code.

- The current HR format requires the dual key ["UH Deptid Divis", "UH Deptid Branc"] to find the correct constituency.
- When "UH Deptid Branc" is blank, it uses the Single key ["UH Deptid Divis"] to find the correct constituency.
- MFS Constituencies are labeled under "MFS_codes," and are fully described under "MFS_long_codes."

Here's a 2026 Example:

| UH Deptid Divis | UH Deptid Branc | MFS_codes | MFS_long_codes |
| --------------- | --------------- | --------- | -------------- |
| C OF EDUC | | ED | College of Education |
| C OF HLTH SCI & SW | SCH OF NURSG | SONDH | School of Nursing and Dental Hygiene |
| C OF HLTH SCI & SW | SCH PUB HLTH | TSSWPH | Thompson School of Social Work & Public Health |
| C OF HLTH SCI & SW | SCH SOC WORK | TSSWPH | Thompson School of Social Work & Public Health |

<hr>

### Dual Faculty CSV

The Dual Faculty CSV is maintained by John alongside the MFS.

- Some faculty have 2+ potential constituencies.
- The code resolves this by picking the one with the highest FTE.
- If FTE is tied, the code looks in this file to resolve it.
- This file must be the same format as the HR Congress file, but with a "Home" and "Constituency" column added.
- "Home" is the tiebreaker. It must be the same for all of a faculty's rows.
- "Constituency" shows the different potential constituencies. They're not used by the code, but they're helpful to John.

Here's a 2026 Example of the Dual Faculty CSV:

| Name | Email | Home | Constituency | Department Descr | UH Deptid Divis | UH Deptid Branc | UH Deptid Secti | TenureStat | Tenure Desc | FTE | TOT_FTE |
| ---- | ----- | ---- | -------------| ---------------- | --------------- | --------------- |-------|------------| ----------- | --- | ------- |
| Doe, John M | jdoe@hawaii.edu | CALL | SOCSCI | ANTHROPOLOGY | C OF SOC SCI | ANTHROPOLOGY DEPT | | FTN        | FACULTY-TENURED | 0.500000 | 1 |
| Doe, John M | jdoe@hawaii.edu | CALL | CALL | CTR SE ASIAN STU | C OF ARTS, LANGUAGES & LETTERS | CTR SE ASIAN STU | | FTN        | FACULTY-TENURED | 0.500000 | 1 |
| Schmoe, Joe M | jschmoe@hawaii.edu | ED | CALL | CENTER FOR PHILIPPINE STUDIES | C OF ARTS, LANGUAGES & LETTERS | CENTER FOR PHILIPPINE STUDIES | | FTN        | FACULTY-TENURED | 0.500000 | 1 |
| Schmoe, Joe M | jschmoe@hawaii.edu | ED | ED | CURRICULUM STUDIES | C OF EDUC | CURRICULUM STUDIES | | FTN        | FACULTY-TENURED | 0.500000 | 1 |

### Output Files

After clicking "Process Files," the code generates:
1. Mailing Lists in ListServ CSV format. One for each constituency, and one for congress as a whole.
2. Voting Lists in OpaVote CSV format. One for each constituency, and one for congress as a whole.
3. A Congress masterlist for MFS records. This is basically the HR data with a Constituency column added.
4. Statistics that say how many senator seats should be allocated to each Constituency.

Each file is downloadable via clicking.

<hr>

## Programmer's Guide

Programmers and maintainers should read the following before modifying the source code.



### Project Goals & Considerations

The program needs to generate the following:

- ListServ Mailing Lists
  - ListServ has a specific CSV format.
  - One for Congress, and one for each Constituency.
  - John's email must be appended each list.
- OpaVote Voting Lists
  - OpaVote has a specific CSV format.
  - One for Congress, and one for each Constituency.
- A Congress Masterlist for MFS Records
  - Same as HR data, but with the Constituencies column added.
- Useful Statistics
  - Calculates the # of senators for a Constituency based on the total number of faculty in that Constituency.

This program should double check that all faculty are >= 0.5 Total FTE.
Any faculty member that doesn't meet this requirement should be discarded from the list before any other step as they are ineligible to vote.

TODO: Double check whether John's email should be added to the voting lists.

### Algorithm Overview

Steps in the algorithm:

1. Collect user inputs.
2. Convert CSV files to object arrays with PapaParse.
3. Discard any rows for which TOT_FTE < 0.5.
4. Determine the constituency associated with each row.
   - This step consults the [Data Mapping CSV](#data-mapping-csv)
5. Count up the total FTE per-constituency per-person.
   - This has some pretty complex edge cases.
6. Assign one constituency to each person, based on the highest FTE count.
7. Resolve ties (For example, 0.5 FTE for two different constituencies).
   - This step consults the [Dual Faculty CSV](#dual-faculty-csv)
8. 

### Dependencies

The only dependency is [PapaParse](https://www.papaparse.com/), a fast CSV file parser and writer.
PapaParse saves lots of headaches on file I/O, edge-case, & optimization for CSV loading.

Dependencies are located in `src/deps/`

## Development

### Cloning the Project

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



# Unsure where these things fit:


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
