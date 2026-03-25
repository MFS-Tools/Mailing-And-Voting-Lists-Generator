MFS Spreadsheet Sorter
=====

| [Details of the WordPress Plugin](#details-of-the-wordpress-plugin) - [Future Development](#future-development) |
..................:|

The Manoa Faculty Senate obtains a spreadsheet of faculty data every year, which needs to be processed to generate mailing lists and determine how many senators each constituency will recieve.

The spreadsheet is not expected to be consistent each year, and the code has been built around data recieved in 2026. Therefore, someone with a working knowledge of JavaScript should check the code against future spreadsheets to ensure future compatability.

### Goals

This program meets a few specific requirements and end goals which were previously done manually (and very tediously).

At a high level, we want:
1. Mailing lists (via ListServ) for each constituency, and the congress (group of all constituencies) as a whole.
    - Eligible faculty only.
    - John's email should be added to each individual list so he can ensure the emails go out properly.
2. Voting lists (via OpaVote) for each constituency
    - Eligible faculty only.
    - TODO: John's email should also be added (?) check this again. The code is correct, I just forgot.
3. Congress spreadsheet (for MFS internal usage, to look up constituencies and faculty).
    - Eligible faculty only.
    - Preserve all the raw data, add constituency data.
4. Total automation of all the tasks.


1. We only consider faculty members with at least 0.5 FTE. Anyone below this threshold is not eligible to vote.

### Dependencies

This program uses a few dependencies which were downloaded and placed into the dependencies/ folder. This folder only exists to keep local unchanging copies, and retain all the attributions, licenses, and documentation for each dependency.

The first dependency is PapaParse, a javascript library which loads csv files into memory extremely fast. Parsing csv files from scratch proved quite complicated with all the edge cases that exist, and PapaParse has been a joy to use in place of the headaches of typical file I/O.
- I've used this library to load csv files as rows of key-value pairs, where the header for each column is the key, and the value is that row & column's value.

The second dependency is ZipJS, which is used to bundle files into a downloadable zip folder.
- This is particularly useful since we are generating over 20 files each time.
- This usage is still in development.

### Challenges

Here are some of the challenges involved that this program overcomes:

- The MFS has its own way of designating "constituency" to each faculty member.
- The input data provided has multiple confusing columns which correspond to MFS constituencies.
- The input data contains multiple of the same faculty member on different rows.
- Sometimes, faculty members have equal participation or FTE in two different constituencies.
- Sometimes, a faculty member is split across several rows, and multiple rows can map to the same constituency, so their individual FTEs must be totaled.
    - We want to compare constituencies for a given faculty member, which doesn't always map cleanly to the separate rows.

### Details of the WordPress Plugin

I have chosen a simple development approach to this code. Websites are made up of simple HTML, CSS, and JavaScript files. Therefore, development consists of using a simple text editor (or IDE) of your choosing, and simply opening the local html file in your browser by double clicking it. This is an extremely straightforward way to test the site locally.

The typical structure of a website is an HTML file which imports JavaScript and CSS files. The HTML file lays out all the words, buttons, and other useful elements that the user needs to see. The CSS file specifies colors, sizes, and the overall appearance of each HTML element. The Javascript file looks at all the text and buttons, and executes the code that you write in it in relation to the HTML elements.

A WordPress Plugin works a little bit differently from our local site, so we have to make some changes in order to keep this simple development setup. On WordPress, the HTML is not loaded as a site, but rather injected into a part of the existing site via a shortcode ( [mfs\_spreadsheet\_sorter] ).

For testing WordPress plugins, I highly recommend installing LocalWP, which simulates a local WordPress site on your computer. I've written a few broken plugins which caused the local site to crash, and I was very happy that I decided to test and fix them before uploading to the MFS WordPress site.

Still, I have not found a fast way to test small changes to plugins in LocalWP, so I recommend iterating with a simple text editor and browser to get it working, followed by thorough testing in LocalWP.


### Future Development:
- A future version of this code could possibly let the user choose what columns correspond to what, but it's easy to over-engineer this when it might not be necessary.


needs to sort faculty emails by constituency.
