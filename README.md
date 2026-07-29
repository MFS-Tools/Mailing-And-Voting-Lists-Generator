MFS Spreadsheet Sorter
=====

A tool that generates ListServ & OpaVote lists for UHM faculty constituencies & congress.

## Table of Contents

- [User Guide](#user-guide)
- [Programmer's Guide](#programmers-guide)
- [Building the WordPress Plugin](#building-the-wordpress-plugin)
- [Deploying to WordPress](#deploying-to-wordpress)
- [Known Issues](#known-issues)

## User Guide

1. Access the website at (TODO: Add permalink after deploying).
2. Select the 3 input files.
3. Click "Process Files."
4. Download the output files.

See below for details on Input files & Output files.

<hr>

### Faculty Congress CSV

The Faculty Congress CSV is procured by HR yearly.

- Faculty may have multiple row entries.
- Multiple rows indicate that a faculty is a part of multiple divisions.
- Different divisions might or might not indicate different constituencies.

Here's a 2026 example:

| Name | Email | Department Descr | UH Deptid Divis | UH Deptid Branc | UH Deptid Secti | TenureStat | Tenure Desc | FTE | TOT_FTE |
| ---- | ----- | ---------------- | --------------- | --------------- | --------------- | ---------- | ----------- | --- | ------- |
| Doe, John M | jdoe@hawaii.edu | DEPARTMENT OF PHILOSOPHY | C OF ARTS, LANGUAGES & LETTERS | DEPARTMENT OF PHILOSOPHY | | FNT | FACULTY-NOT ELIG FOR TENURE | 1.000000 | 1 |
| Schmoe, Joe M. | jschmoe@hawaii.edu | GEOGRAPHY AND ENVIRONMENT | C OF SOC SCI | GEOGRAPHY AND ENV DEPT | | FPR | FACULTY-TENURED | 0.500000 | 1 |
| Schmoe, Joe M. | jschmoe@hawaii.edu | HYDROLOGICAL SCIENCES DIVISION | RES & DEAN OF GRAD DIV | WATR R R CTR | WATR R R CTR | FPR | FACULTY-TENURED | 0.500000 | 1 |

<hr>

### Data Mapping CSV

The Data Mapping CSV is maintained by the MFS.

- Sometimes constituencies change, or their departments change. This file makes it easy to modify without changing the code.
- The code looks for the dual key ["UH Deptid Divis", "UH Deptid Branc"] to find the correct constituency.
- The code just uses "UH Deptic Divis" if "UH Deptid Branc" is blank in the map.

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


Use git to install this project:

```powershell
git clone https://github.com/kylebueche/MFS-Spreadsheet-Sorter.git
```

You can also paste https://github.com/kylebueche/MFS-Spreadsheet-Sorter.git into GitHub Desktop.

The only dependency is [PapaParse](https://www.papaparse.com/), a fast CSV file parser and writer.
PapaParse saves lots of headaches on file I/O, edge-case, & optimization for CSV loading.

<hr>

### Project Goals & Considerations

The program needs to generate the following:

- ListServ Mailing Lists
  - ListServ needs a specific CSV format ("Email FirstName LastName", space-delimited).
  - One for Congress, and one for each Constituency.
  - John's email must be appended each list.
- OpaVote Voting Lists
  - OpaVote needs a specific CSV format (Just one email column).
  - One for Congress, and one for each Constituency.
- A Congress Masterlist for MFS Records
  - Same as HR data, but with the Constituencies column added.
- Useful Statistics
  - Calculates the # of senators for a Constituency based on the total number of faculty in that Constituency.

This program should double check that all faculty are >= 0.5 Total FTE.
Any faculty member that doesn't meet this requirement should be discarded from the list before any other step as they are ineligible to vote.

<hr>

### Algorithm Overview

Steps in the algorithm:

1. Collect user inputs.
2. Convert CSV files to object arrays with PapaParse.
3. Discard any rows for which TOT_FTE < 0.5.
4. Determine the constituency associated with each row.
   - This step consults the [Data Mapping CSV](#data-mapping-csv)
5. Count up the total FTE per-constituency per-person.
   - Collapse rows so only one row exists per unique email
   - Assign the highest FTE constituency, resolve ties with the [Dual Faculty CSV](#dual-faculty-csv).
   - This has some pretty complex edge cases.
6. Generate ListServ & OpaVote lists
   - Add a hard-coded UHMFS email entry.
7. Generate Congress list & Senator Statistics
8. Create download buttons for all generated lists.

<hr>

### Testing Locally as an HTML File

You can test this plugin locally by pasting the local filepath of `src/mfs-spreadsheet-sorter.html` directly into your browser.

There was a bit of engineering to get local testing working. In the plugin, WordPress loads the JavaScript and CSS files through PHP because the HTML is just being injected into an existing website.
Normally, HTML files load JS and CSS in the `<header>` block, but we don't have access to it.
Instead, the HTML has a `<script>` tag that detects whether the site is being run locally.
If it is local, the script adds the JS and CSS files dynamically.

<hr>

### Testing Locally on LocalWP

For testing WordPress plugins, you will need LocalWP installed.
Faulty plugins can crash WordPress, so please test them locally.

1. Download [LocalWP](https://localwp.com/) and start a new WordPress website.
2. Run the site, and open it in a browser.
3. Navigate to plugins, and add a new plugin.
4. Locate and select the zip file located in `build/`
5. Create a new page, and add a shortcode block with the text `[mfs_spreadsheet_sorter]` inside.
6. Save the page and open it in a new tab.
7. Test whether the plugin works.

<hr>

## Building the WordPress Plugin

WordPress plugins must be a zipped folder with a PHP file.
This PHP file adds the HTML & code into the `mfs_spreadsheet_sorter` shortcode.

You can build the plugin by running the `build.bat` script on Windows, or the `build.sh` script on Mac/Linux.

The built plugin will be a .zip file located in the `build/` folder.

> [!NOTE]
> So far, the `build.sh` script for Mac & Linux is untested.
> All it does is zip the `src` folder. Manual zipping will work too.

<hr>

## Deploying the WordPress Plugin

Deploying to the MFS WordPress site is more complicated than using LocalWP.

1. Ensure you have [FileZilla](https://filezilla-project.org/) installed.
2. Ensure you're an admin on the UHMFS WordPress site, and that you can log in.
3. Ensure that you are authorized to edit /1/uhmfs through webedit (may involve emails to ITS).
4. Browse to `/1/uhmfs/wp-content/plugins/` and upload the zipped plugin.
5. If not already created, create a new page and add a shortcode block.
6. Add `[mfs_spreadsheet_sorter]` into the shortcode block.
7. Save & view the website to test that it works.

## Known Issues:

When the Dual Appointments CSV does not cover all detected dual appointments, the program fails silently.
- Desired behavior: The user is alerted that some faculty are not accounted for. The user is instructed to fix the issue.
- Actual behavior: The program removes detected dual appointments from the congress list, and adds CSV-provided dual appointments to the congress list.

<hr>

Pressing the "Process Files" button over and over adds more and more duplicate files to the download section.
- Desired behavior: Every time "Process Files" is run, the downloads section should be cleared of any previous files
- Actual behavior: Duplicate files stack up, and they are identically-named so they can't be distinguished.

<hr>

Build Script on Mac or Linux is untested
- Windows build.bat script is tested and working.
- Mac/Linux build.sh script is untested and unverified.
- Desired behavior for both scripts:
  - Deletes old files in `build/`
  - Zips the entire `src/` directory into `build/mfs-spreadsheet-sorter.zip`
  - Prints the location of the plugin to the console
  - Waits for the user to press a key to exit (so they can see the messages).

<hr>

The 2026 Congress HR Header format is baked into the code.
- As long as HR's format stays consistent, this is not a problem.
- Column names are referenced with exact strings in code.
- Fixing this would require over-engineering and a lot more code complexity.

<hr>

Files must be downloaded one by one.
- A little tedious, but zipping them in code is a bit complicated.
- JSZip might be able to help with this

<hr>

There are no error messages that show to the user.
- Desired behavior: Red highlights/messages to guide users that something went wrong.
- Actual behavior: Console error messages exist. These are mainly for programmers & debugging.
