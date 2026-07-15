MFS Spreadsheet Sorter
=====

A tool to automate yearly, manual, time-consuming tasks for the Manoa Faculty Senate

### Table of Contents

- [Overview](#overview)
- [Goals](#goals)
- [Implementation Details](#implementation-details)
- [Expected CSV Formats](#expected-csv-formats)
- [Dependencies](#dependencies)
- [Details of the WordPress Plugin](#details-of-the-wordpress-plugin)
- [Future Development](#future-development)

### Overview

The MFS maintains a list of Eligible Faculty, and the Constituencies they belong to.
This list changes every single year, and updating the information by hand takes weeks.

Eligible Faculty are sorted into Constituency-specific mailing and voting lists, as well as a master list.

This tool should:
- Automate the above tasks.
- Be easy to use.
- Be easy to find.

### Terms

*Constituency:* A named group that some faculty belong to.
- Faculty may have multiple constituencies.
- As of 2026 there are 19 constituencies.

*Total FTE:* The sum of all a faculty member's Full-Time-Employment points.

*Eligible Faculty:* Faculty who have Total FTE >= 0.5 (at least half-time employed).

*Congress:* The collective Eligible Faculty body (all constituencies combined).

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

*Side goal:* Make this tool easily accessible.

### Constraints

1. Every year, the MFS 

### Design Philosophy:

> The tool should be easy to use.

The User Interface should be designed and updated with the user in mind.
If it's easy-to-use for a programmer, it may still be hard-to-use for a non-tech-savvy person.

Design the User Interface to be easy for a non-tech-savvy person.
This means you have to talk to them for feedback.

> The tool should be easy to find.

TODO: The following section is scattered. Remove unnecessary stuff and combine into paragraphs.

Assume the user is non-tech-savvy.
We don't want the user to have to install anything.

The browser is the easiest way for anyone to share code, so we're using JavaScript & HTML/CSS.

The MFS has a WordPress site, so this program is a custom WordPress plugin.

I prefer writing HTML, CSS, and JavaScript the way a typical static website would use it.

WordPress requires a PHP file to register a plugin.

I have designed this plugin so that HTML, CSS, and JavaScript can be captured by a plugin.

This may not be the conventional way to do this.

### Implementation Details:



#### HTML/CSS, JavaScript:

TODO: List JavaScript files in use.

PHP Layer:

WordPress Integration Instructions:

User Instructions:

TODO: Change filenames and update this doc.

PHP Code: `src/mfs-test.php`
Purpose: Provides a shortcode

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


### Expected CSV Formats:

### Dependencies

Dependencies are managed with a simple bundled local copy.

- [PapaParse](https://www.papaparse.com/), a fast CSV file parser and writer.
  - Saves file I/O, edge-case, & optimization headaches.
- [ZipJS](https://stuk.github.io/jszip/), used to compress several files into one downloadable zip folder.
  - Download 20+ files with one click instead of 20+ clicks.

Dependencies are located in `src/deps/`

TODO: Use ZipJS. It is currently unused.

### Challenges

Here are some of the challenges involved that this program overcomes:

- The MFS has its own way of designating "constituency" to each faculty member.
- The input data provided has multiple confusing columns which correspond to MFS constituencies.
- The input data contains multiple of the same faculty member on different rows.
- Sometimes, faculty members have equal participation or FTE in two different constituencies.
- Sometimes, a faculty member is split across several rows, and multiple rows can map to the same constituency, so their individual FTEs must be totaled.
    - We want to compare constituencies for a given faculty member, which doesn't always map cleanly to the separate rows.

- Contituencies have a complex identification process.

### Local Testing

#### Typical Approaches:

In a typical HTML/CSS & JS environment, the HTML file would contain style and script tags that import the proper CSS & JS files.
With this setup, you would be able to run the site by pasting the file path into your browser directly.
Simple, and straightforward.

#### What WordPress Expects:

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

The HTML file should not contain a Head or Body block. In local testing, the HTML5 spec can infer where these will go. Using a Head or Body can cause issues on the WP site, because only one of each is allowed.

This project is designed so that you can load the HTML as a local website, while still decoupling it


See the reasoning for this choice below:

### Details of the WordPress Plugin

I have chosen a simple development approach to this code. Websites are made up of simple HTML, CSS, and JavaScript files. Therefore, development consists of using a simple text editor (or IDE) of your choosing, and simply opening the local html file in your browser by double clicking it. This is an extremely straightforward way to test the site locally.

The typical structure of a website is an HTML file which imports JavaScript and CSS files. The HTML file lays out all the words, buttons, and other useful elements that the user needs to see. The CSS file specifies colors, sizes, and the overall appearance of each HTML element. The Javascript file looks at all the text and buttons, and executes the code that you write in it in relation to the HTML elements.

A WordPress Plugin works a little bit differently from our local site, so we have to make some changes in order to keep this simple development setup. On WordPress, the HTML is not loaded as a site, but rather injected into a part of the existing site via a shortcode ( [mfs\_spreadsheet\_sorter] ).

For testing WordPress plugins, I highly recommend installing LocalWP, which simulates a local WordPress site on your computer. I've written a few broken plugins which caused the local site to crash, and I was very happy that I decided to test and fix them before uploading to the MFS WordPress site.

Still, I have not found a fast way to test small changes to plugins in LocalWP, so I recommend iterating with a simple text editor and browser to get it working, followed by thorough testing in LocalWP.


### Future Development:
- A future version of this code could possibly let the user choose what columns correspond to what, but it's easy to over-engineer this when it might not be necessary.


needs to sort faculty emails by constituency.
