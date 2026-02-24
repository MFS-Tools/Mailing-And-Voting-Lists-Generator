
// Globals that should be loaded by processInputCSVData and processConstituencyMap
let inputCSVData = null;
let constituencyMap = null;
let manualCheckedData = null;

// Get initial elements from the html file
const content = document.getElementById("text-box");
const csvInput = document.getElementById("data-input");
const constituencyMapInput = document.getElementById("constituency-map-input");
const processButton = document.getElementById("process-button");
const manualInput = document.getElementById("manual-data-input");

// Set input/button callback functions.
csvInput.addEventListener("change", processCSV);
constituencyMapInput.addEventListener("change", processConstituencyMap);
processButton.onclick = processFiles;


// Temporary
manualInput.addEventListener("change", processManualInput);


function processFiles() {
  if (inputCSVData == null || constituencyMap == null) {
    console.error("Error: Some files not loaded.");
    console.error("inputCSV: ", inputCSVData);
    console.error("dataConstituencyMap: ", constituencyMap);
    return;
  }

  filteringPipeline(inputCSVData, constituencyMap);
}


function processCSV(event) {
  console.log("processCSV called");
  const file = event.target.files[0];
  if (file) {
    Papa.parse(file, {
      // Treat first row as an object header
      header: true,

      // Auto convert numbers and booleans to JS types
      dynamicTyping: true,

      // Callback function once processing finishes
      complete: function(results) {
        inputCSVData = results.data;
        console.log("File Loaded: ", inputCSVData);
      },

      // Error log in case CSV is formatted wrong
      error: function(error) {
        console.log("Parsing error: ", error);
      },
    });
  }
}


function processConstituencyMap(event) {
  console.log("processConstituencyMap called");
  const file = event.target.files[0];
  if (file) {
    Papa.parse(file, {
      // Treat first row as an object header
      header: true,

      // Auto convert numbers and booleans to JS types
      dynamicTyping: true,

      // Callback function once processing finishes
      complete: function(results) {
        constituencyMap = results.data;
        console.log("File Loaded: ", constituencyMap);
      },

      // Error log in case CSV is formatted wrong
      error: function(error) {
        console.log("Parsing error: ", error);
      },
    });
  }
}


function processManualInput(event) {
  console.log("processManualInput called");
  const file = event.target.files[0];
  if (file) {
    Papa.parse(file, {
      // Treat first row as an object header
      header: true,

      // Auto convert numbers and booleans to JS types
      dynamicTyping: true,

      // Callback function once processing finishes
      complete: function(results) {
        manualCheckedData = results.data;
        console.log("File Loaded: ", manualCheckedData);
      },

      // Error log in case CSV is formatted wrong
      error: function(error) {
        console.log("Parsing error: ", error);
      },
    });
  }
}


function filteringPipeline(rawData, dataMap) {
  const filteredByFTE = filterRawDataByTotalFTE(rawData);
  const data = convertDataToMFSData(filteredByFTE);
  const constituencyData = data[0];
  const unknownConstituency = data[1];

  const constituencyData = selectHighestFTEConstituencies(constituencyData);
  const knownConstituencies = constituencyData[0];
  const unknownDualConstituencies = constituencyData[1];


  // Before proceeding: resolve unknown dual constituencies somehow.
  // Splice the resolved data back in.


  const uhmfsRow =
    {
      "FirstName":        "John",
      "LastName":         "Kinder",
      "Name":             "Kinder, John",
      "Email":            "uhmfs@hawaii.edu",
      "Constituency":     null,
      "Department Descr": null,
      "UH Deptid Divis":  null,
      "UH Deptid Branc":  null,
      "UH Deptid Secti":  null,
      "TenureStat":       null,
      "Tenure Desc":      null,
      "FTE":              null,
      "TOT_FTE":          null,
    };



  generateCongressCSV(rows, divName, uhmfsRow);
  generateListServCSVs(rows, divName, uhmfsRow);
  generateOpaVoteCSVs(rows, divName, uhmfsRow);
  generateSenatorStatistics(rows)
}

/* 
 * Filtering the data based on who is at least half-time
 *
 * If constituents dont have Total FTE >= 0.5, they don't qualify to vote.
 *
 */
function filterRawDataByTotalFTE(rawData) {
  const filteredData = rawData.filter((entry) => entry["TOT_FTE"] >= 0.5);

  const numEntriesFiltered = rawData.length - filteredData.length;
  console.log("Total FTE >= 0.5:", numEntriesFiltered, "rows filtered out.");

  return filteredData;
}


/*
 * Convert the raw data to cleaner data, made up of just
 * the stuff that the MFS needs.
 *
 * Constituencies are tricky to convert, so we use a map.
 * Determine the constituency of each entry according to
 * SEC shortcodes. 
 *
 * Some constituencies are determined with two key columns, some
 * are determined with only one key column. We check both.
 * 
 * Note that some of the headers are hardcoded and may change:
 * "UH Deptid Branc", "UH Deptid Divis", "MFS_codes".
 */
function convertDataToMFSData(inputData, dataMapCSV) {

  // These are the keys that have identify constituency
  // Some constituencies only depend on keyCol1
  // Some depend on both keyCol1 and keyCol2
  const keyCol1 = "UH Deptid Divis";
  const keyCol2 = "UH Deptid Branc";

  // Set each key in the dataMap to an empty list.
  let dataMap = new Map();
  for (const entry of dataMapCSV) {
    const key1 = entry[keyCol1] + ',' + entry[keyCol2];
    const key2 = entry[keyCol1];
    if (entry[keyCol2] != null) {
      dataMap.set(key1, entry["MFS_codes"]);
    } else {
      dataMap.set(key2, entry["MFS_codes"]);
    }
  }

  // Make two lists incase any constituencies can't be identified by the dataMap
  let constituencyData = [];
  let unknownConstituency = [];
  
  // for every row in the input data, 
  for (const oldRow of filteredData) {
    const keyAttempt1 = oldRow[keyCol1] + ',' + oldRow[keyCol2];
    const keyAttempt2 = oldRow[keyCol1];

    // New data looks like this, store the old row just incase
    let nameList = oldRow["Name"].split(',');
    let lastName = nameList[0].replaceAll(" ", "_");
    let firstName = nameList[1].replaceAll(" ", "_");
    let newRow = {
      "FirstName":        firstName,
      "LastName":         lastName,
      "Name":             oldRow["Name"],
      "Email":            oldRow["Email"],
      "Constituency":     null,
      "Department Descr": oldRow["Department Descr"],
      "UH Deptid Divis":  oldRow["UH Deptid Divis"],
      "UH Deptid Branc":  oldRow["UH Deptid Branc"],
      "UH Deptid Secti":  oldRow["UH Deptid Secti"],
      "TenureStat":       oldRow["TenureStat"],
      "Tenure Desc":      oldRow["Tenure Desc"],
      "FTE":              oldRow["FTE"],
      "TOT_FTE":          oldRow["TOT_FTE"],
      //"OriginalData":     oldRow,
    };

    if (dataMap.has(keyAttempt1)) {
      newRow["Constituency"] = dataMap.get(keyAttempt1);
      constituencyData.push(newRow);

    } else if (dataMap.has(keyAttempt2)) {
      newRow["Constituency"] = dataMap.get(keyAttempt2);
      constituencyData.push(newRow);

    } else {
      unknownConstituency.push(oldRow);
    }
  }

  console.log(constituencyData);
  console.log(unknownConstituency);
  console.log("Mapping raw data to constituencies:", unknownConstituency.length, "entries have unknown constituency");
  return [constituencyData, unknownConstituency];
}


/* 
 * Filtering data based on Full Time Employment levels.
 *
 * We already know the Total Full Time Employment is >= 0.5
 *
 * Some people have several constituencies, so one email can
 * appear on several rows. We want to keep only one entry.
 *
 * The entry with the highest FTE is kept.
 * Ties are stored for manual review.
 */
function selectHighestFTEConstituency(inputData) {

  // Make two arrays, one for resolved constituencies, one for unresolved dual constituencies
  let unresolvedDualConstituencies = [];
  let resolvedConstituencies = [];


  let map = new Map();

  // Give each unique email an empty list
  for (const row of inputData) {
    map.set(row["Email"], [])
  }

  // Add each row to it's email's list
  for (const row of inputData) {
    map.get(row["Email"]).push(row);
  }

  // For every key and value pair in the map
  // email is equal to the unique email
  // rows is equal to the list of rows with that email
  for (const [email, rows] of map) {

    if (rows.length == 1) { // Trivial, just one row
      resolvedConstituencies.push(rows[0]);

    } else { // More than one row

      // Make a new map to sum constituency FTE counts
      let constituencyFTEMap = new Map();

      // Initialize each constituency total to zero FTE
      for (const row of rows) {
        const key = row["Constituency"];
        constituencyFTEMap.set(key, 0.0);
      }

      // For every entry, add the FTE to the corresponding constituency total
      for (const row of rows) {
        const key = row["Constituency"];
        constituencyFTEMap.set(key, row["FTE"] + constituencyFTEMap.get(key));
      }

      // Convert the map to a list so it can be sorted
      let fteSumList = [];
      for (const [constituency, sumFTE] of constituencyFTEMap) {
        fteSumList.push({ "Constituency": constituency, "FTE": sumFTE });
      }
      // Sort in descending order based on FTE
      fteSumList.sort((a, b) => b["FTE"] - a["FTE"]);

      // Criteria for determining whether or not a tie exists between constituency FTEs
      const tied = fteSumList.length > 1 && fteSumList[0]["FTE"] == fteSumList[1]["FTE"];

      if (tied) {
        // There's a tie
        // Add all the rows with this email to be manually checked
        unresolvedDualConstituencies.concat(value)
      } else {
        // Not tied, reduce to one row and set constituency to highest FTE

        // Find rows with matching constituency, ensures other row data is constistent
        let matchingConstituencyRows = []
        for (const row of rows) {
          if (row["Constituency"] == fteSumList[0]["Constituency"]) {
            matchingConstituencyRows.push(row);
          }
        }

        let newRow = matchingConstituencyRows[0];
        // Set the FTE to the sum, incase a constituency was split across multiple rows
        newRow["FTE"] = fteSumList[0]["FTE"];

        outputData.push(newRow);
      }
    }
  }
  
  console.log(resolvedConstituencies);
  console.log(unresolvedDualConstituencies);
  console.log("Choosing the highest FTE:", unresolvedDualConstituencies.length, "people have constituencies with tied FTEs");

  return [resolvedConstituencies, unresolvedDualConstituencies];
}

function generateCongressList(rows, divName, uhmfsEmailRow) {
  let congress = Array.from(rows);
  // Add UHMFS email to the top
  congress.unshift(uhmfsEntry);
  let filename = "Congress_" + new Date().getFullYear() + ".csv";
  createCSVDownloadButton(congress, filename, ",", true, divName);
}

function generateCongressListServ(rows, divName, uhmfsEmailRow)

/*
 * Generates statistics for each constituency automatically
 */
function generateSenatorStatistics(rows, divName) {
  let senatorStats = [];
  let restOfData = rows;
  for (while restOfData.length != 0) {

    /*
     * Choose the top row's constituency arbitrarily
     * Filter out all rows with the same constituency
     * Format the raw data into output data
     */
    let filterString = restOfData[0]["Constituency"];
    let singleConstituencyData = restOfData.filter(row => row["Constituency"] === filterString);
    restOfData = restOfData.filter(row => row["Constituency"] !== filterString);

    let senatorStat = {
      "Constituency": filterString,
      "Number of People": singleConstituencyData.length,
      "Number of Senators": Math.ceil(parseFloat(singleConstituencyData.length) / 30.0)
    }
    senatorStats.push(senatorStat);
  }

  let filename = "SenatorStats_" + new Date().getFullYear() + ".csv";
  createCSVDownloadButton(senatorStats, filename, ",", true, divName);
}


/*
 * Generates ListServ CSVs for each constituency automatically
 */
function generateListServCSVs(rows, divName, uhmfsEmailRow) {
  // UH MFS email to add to the top of the listserv data
  const uhmfsEmail = "uhmfs@hawaii.edu";
  const uhmfsListServ =
    {
      "Email": uhmfsEmail,
      "FirstName": "John",
      "LastName": "Kinder",
    };

  let senatorStats = [];
  for (while restOfData.length != 0) {
    /*
     * Choose the top row's constituency arbitrarily
     * Filter out all rows with the same constituency
     * Format the raw data into output data
     */
    let constituencyName = restOfData[0]["Constituency"];
    let singleConstituencyData = restOfData.filter(row => row["Constituency"] === constituencyName);
    restOfData = restOfData.filter(row => row["Constituency"] !== constituencyName);

    let filename = "listserv_email_name_" + filterString + "_" + new Date().getFullYear() + ".csv";
    generateSingleListServ(singleConstituencyData, divName, uhmfsEmailRow, filename);
    

    createCSVDownloadButton(listServCSV, filename, " ", false, divName);
  }
}

function generateSingleListServ(rows, divName, uhmfsEmailRow, filename) {
  let listServData = rows.map((row) =>
    (
      {
        "Email": row["Email"],
        "FirstName": row["FirstName"],
        "LastName": row["LastName"],
      }
    ));

  // Add uhmfs email to the top
  listServCSV.unshift(
    {
      "Email": uhmfsEmailRow["Email"],
      "FirstName": uhmfsEmailRow["FirstName"],
      "LastName": uhmfsEmailRow["LastName"],
    }
  );

  let filename = "listserv_email_name_" + constituencyName + "_" + new Date().getFullYear() + ".csv";
  createCSVDownloadButton(listServCSV, filename, " ", false, divName);
}

/*
 * Generates a single OpaVote CSV
 */
function generateSingleOpaVoteCSV(rows, constituencyName, divName, uhmfsEmailRow) {
  let opaVoteCSV = singleConstituencyCSV.map((row) =>
    ({ "Email": row["Email"], }));
  
  // Add uhmfs email to the top
  opaVoteCSV.unshift({ "Email": uhmfsRow["Email"] });

  let filename = "opavote_email_" + constituencyName + "_" + new Date().getFullYear() + ".csv";
  createCSVDownloadButton(opaVoteCSV, filename, ",", false, divName);
}


/*
 * Generates OpaVote CSVs for each constituency automatically
 */
function generateOpaVoteCSVs(rows, divName, uhmfsEmailRow) {

  restOfData = rows;
  for (let i = 0; i < 19; i++) {
    // Splitting into files based on constituency
    let constituencyName = restOfData[0]["Constituency"];
    let singleConstituencyCSV = restOfData.filter(row => row["Constituency"] === constituencyName);
    restOfData = restOfData.filter(row => row["Constituency"] !== constituencyName);

    generateSingleOpaVoteCSV(rows, constituencyName, divName, uhmfsEmailRow);
  }
}


/*
 * createCSVDownloadButton(...):
 * 
 * Params:
 *
 * - arrayData: The rows of objects to be converted into a CSV file
 * - filename: The name of the file to download, be sure to include ".csv"
 * - delimiter: The value separator of choice, for example ',' for commas, or ' ' for spaces
 * - keepHeader: Whether you want the first row to be a header, using object keys as header names
 * - divName: The id of the div where you want the download button to appear.
 *
 * Details:
 * 
 *  - Parsing a list of objects into a csv is done with Papa.unparse(...), which returns a string
 *  - The string is then turned into a JavaScript Blob object to be downloaded
 *  - A download button is created, and put into a div determined by divName
 */
function createCSVDownloadButton(arrayData, filename, delimiter, keepHeader, divName) {
  const csv = 
    Papa.unparse(arrayData,
      {
        delimiter: delimiter,
        header: keepHeader,
      }
    );
  let blob = new Blob([csv], { type: 'text/csv' });
  let downloadButton = document.createElement("button");
  downloadButton.onclick = function() {
    let link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };
  downloadButton.innerText = "Download " + filename;
  document.getElementById(divName).appendChild(downloadButton);
}
