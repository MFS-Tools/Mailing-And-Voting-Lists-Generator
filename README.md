# MFS Spreadsheet Sorter
The Manoa Faculty Senate obtains a spreadsheet of faculty data every year, which needs to be processed to generate mailing lists and determine how many senators each constituency will recieve.

The spreadsheet is not expected to be consistent each year, and the code has been built around data recieved in 2026. Therefore, someone with a working knowledge of JavaScript should check the code against future spreadsheets to ensure compatability.

## Details of the Wordpress Plugin
I have chosen a simple development approach to this code. All websites are made up of simple HTML, CSS, and JavaScript files. Therefore, development consists of using a simple text editor (or IDE) of your choosing, and simply opening the local html file in your browser by double clicking it. This is an extremely straightforward way to test the site locally.

The typical structure of a website is an HTML file which imports JavaScript and CSS files. The HTML file lays out all the words, buttons, and other useful elements that the user needs to see. The CSS file specifies colors, sizes, and the overall appearance of each HTML element. The Javascript file looks at all the text and buttons, and executes the code that you write in it in relation to the HTML elements.

A WordPress Plugin works a little bit differently from our local site, so we have to make some changes in order to keep this simple development setup. On WordPress, the HTML is not loaded as a site, but rather injected into a part of the existing site via a shortcode ( [mfs_spreadsheet_sorter] ).

For testing WordPress plugins, I highly recommend installing LocalWP, which simulates a local WordPress site on your computer. I've written a few broken plugins which caused the local site to crash, and I was very happy that I decided to test and fix them before uploading to the MFS WordPress site.

Still, I have not found a fast way to test small changes to plugins in LocalWP, so I recommend iterating with a simple text editor and browser to get it working, followed by thorough testing in LocalWP.


## Future Development:
- A future version of this code could possibly let the user choose what columns

Here are some of the challenges involved that this program overcomes:

- The MFS has its own way of designating "constituency" to each faculty member.
- The input data provided has multiple columns which correspond to MFS constituencies.
- The inpute data 

needs to sort faculty emails by constituency.
