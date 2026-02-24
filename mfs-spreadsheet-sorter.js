// Globals that should be loaded by processInputCSVData and processConstituencyMap
let inputCSVData = null;
let constituencyMap = null;
let manualCheckedData = null;

const content = document.getElementById("text-box");
const csvInput = document.getElementById("data-input");
const constituencyMapInput = document.getElementById("constituency-map-input");
const processButton = document.getElementById("process-button");
const manualInput = document.getElementById("manual-data-input");
manualInput.addEventListener("change", processManualInput);


csvInput.addEventListener("change", processCSV);
constituencyMapInput.addEventListener("change", processConstituencyMap);
processButton.onclick = processFiles;


// Future pipeline:
// Given an input masterlist and input datamap:
// Generate Congress.csv master list which includes original data and constituencies.
// Contains only one row per email.
// Also generate ManualCheckData.csv which must give manual assignments
// Would be good to keep the constituency for each of the columns
// ManualCheckData.csv has multiple emails per row which have tied FTEs.
//
// Congress.csv and ManualCheckData.csv should have the same header format.
//
// After manual review:
// ManualCheckData.csv can include multiple emails,
// but the Constituency column must only have one constituency per email.
//
// Then, separate pipeline:
// Given Congress.csv and manually reviewed ManualCheckData.csv,
// Generate output lists for ListServ and OpaVote
//
//
//
// ManualCheckData is dual appointments
// Congress is single appointments

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


function processFiles() {
  if (inputCSVData == null || constituencyMap == null) {
    console.error("Error: Some files not loaded.");
    console.error("inputCSV: ", inputCSVData);
    console.error("dataConstituencyMap: ", constituencyMap);
    return;
  }

  filterData(inputCSVData, constituencyMap);
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




function filterData(inputData, dataMapCSV) {
  /* 
   * Filtering the data based on who is at least half-time
   *
   * If constituents dont have Total FTE >= 0.5, they don't qualify to vote.
   *
   */
  let unfilteredSize = inputData.length;
  let filteredData = inputData.filter((entry) => entry["TOT_FTE"] >= 0.5);
  let filteredSize = filteredData.length;

  let numEntriesFiltered = unfilteredSize - filteredSize;
  console.log("Total FTE >= 0.5:", numEntriesFiltered, "rows filtered out.");
  
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

  const keyCol1 = "UH Deptid Divis";
  const keyCol2 = "UH Deptid Branc";
  let dataMap = new Map();
  for (const entry of dataMapCSV) {
    const key1 = [entry[keyCol1], entry[keyCol2]].join(',');
    const key2 = entry[keyCol1];
    if (entry[keyCol2] != null) {
      dataMap.set(key1, entry["MFS_codes"]);
    } else {
      dataMap.set(key2, entry["MFS_codes"]);
    }
    // Verifying correct processing of datamap
    /*
    console.log("MFS code:", entry["MFS_codes"]);
    console.log("UH Deptid Divis, UH Deptid Branc", key1);
    console.log("UH Deptid Branch:", key2);
    console.log("Map Entry Key1:", dataMap.get(key1));
    console.log("Map Entry Key2:", dataMap.get(key2));
    */
  }

  let constituencyData = [];
  let unknownConstituency = [];
  let keyAttempt1Counter
  for (const oldEntry of filteredData) {
    // Necessary to stringify array, because js Maps use address identity for array keys
    const keyAttempt1 = [oldEntry[keyCol1], oldEntry[keyCol2]].join(',');
    const keyAttempt2 = oldEntry[keyCol1];

    if (dataMap.has(keyAttempt1)) {
      let newEntry = {
        "Name": oldEntry["Name"],
        "Email": oldEntry["Email"],
        "FTE": oldEntry["FTE"],
        "TOT_FTE": oldEntry["TOT_FTE"],
        "Constituency": dataMap.get(keyAttempt1),
        "OriginalData": oldEntry,
      }
      constituencyData.push(newEntry);

    } else if (dataMap.has(keyAttempt2)) {
      let newEntry = {
        "Name": oldEntry["Name"],
        "Email": oldEntry["Email"],
        "FTE": oldEntry["FTE"],
        "TOT_FTE": oldEntry["TOT_FTE"],
        "Constituency": dataMap.get(keyAttempt2),
        "OriginalData": oldEntry,
      }
      constituencyData.push(newEntry);

    } else {
      // Constituency not found, split into a separate array for manual review
      unknownConstituency.push(oldEntry);
    }
  }

  console.log(constituencyData);
  console.log(unknownConstituency);
  console.log("Mapping raw data to constituencies:", unknownConstituency.length, "entries have unknown constituency");

  /*
   * Potential flaw here:
   * imagine two rows:
   * { "Email": "abc@hawaii.edu", "Constituency": "CALL", "FTE": 0.1 }
   * { "Email": "abc@hawaii.edu", "Constituency": null, "FTE": 0.5 }
   * In this case, constituency wasn't identified,
   * but the valid row was still sent off.
   *
   * If any data should be manual reviewed, all rows with the same email
   * should also be manually reviewed.
   *
   * One solution: only check if the highest-FTE constituency is null.
   * If that is true, filter the original row out.


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
  let map = new Map();
  for (const entry of constituencyData) {
    map.set(entry["Email"], [])
  }
  for (const entry of constituencyData) {
    map.get(entry["Email"]).push(entry);
  }
  let manualCheckData = [];
  let outputData = [];
  for (const [key, value] of map) {
    // value is an array of entries with the same email
    if (value.length > 1) {
      let constituencyFTESum = new Map();
      for (const entry of value) {
        constituencyFTESum.set(entry["Constituency"], 0);
      }
      for (const entry of value) {
        const constituencyKey = entry["Constituency"];
        constituencyFTESum.set(constituencyKey, entry["FTE"] + constituencyFTESum.get(constituencyKey));
      }
      let constituencyFTEsToSort = [];
      for (const [key2, value2] of constituencyFTESum) {
        constituencyFTEsToSort.push({ "Constituency": key2, "FTE": value2 });
      }
      constituencyFTEsToSort.sort((a, b) => b["FTE"] - a["FTE"]); // descending
      let tied = constituencyFTEsToSort.length > 1
                 && constituencyFTEsToSort[0]["FTE"] == constituencyFTEsToSort[1]["FTE"];
      if (tied) {
        for (const entry of value) {
          manualCheckData.push(entry["OriginalData"]);
        }
      } else {
        // Not tied, clear constituency
        let nameList = value[0]["Name"].split(',');
        let lastName = nameList[0];
        let firstName = nameList[1];

        let reducedEntry = {
          "FirstName": firstName,
          "LastName": lastName,
          "Name": value[0]["Name"],
          "Email": value[0]["Email"],
          "Constituency": constituencyFTEsToSort[0]["Constituency"],
          "Department Descr": value[0]["OriginalData"]["Department Descr"],
          "UH Deptid Divis": value[0]["OriginalData"]["UH Deptid Divis"],
          "UH Deptid Branc": value[0]["OriginalData"]["UH Deptid Branc"],
          "UH Deptid Secti": value[0]["OriginalData"]["UH Deptid Secti"],
          "TenureStat": value[0]["OriginalData"]["TenureStat"],
          "Tenure Desc": value[0]["OriginalData"]["Tenure Desc"],
          "FTE": value[0]["OriginalData"]["FTE"],
          "TOT_FTE": value[0]["OriginalData"]["TOT_FTE"],
        }
        outputData.push(reducedEntry);
      }

    } else {
      // Only one value, trivial
      let nameList = value[0]["Name"].split(',');
      let lastName = nameList[0];
      let firstName = nameList[1];
      let reducedEntry = {
        "FirstName": firstName,
        "LastName": lastName,
        "Name": value[0]["Name"],
        "Email": value[0]["Email"],
        "Constituency": value[0]["Constituency"],
        "Department Descr": value[0]["OriginalData"]["Department Descr"],
        "UH Deptid Divis": value[0]["OriginalData"]["UH Deptid Divis"],
        "UH Deptid Branc": value[0]["OriginalData"]["UH Deptid Branc"],
        "UH Deptid Secti": value[0]["OriginalData"]["UH Deptid Secti"],
        "TenureStat": value[0]["OriginalData"]["TenureStat"],
        "Tenure Desc": value[0]["OriginalData"]["Tenure Desc"],
        "FTE": value[0]["OriginalData"]["FTE"],
        "TOT_FTE": value[0]["OriginalData"]["TOT_FTE"],
      }
      outputData.push(reducedEntry);
    }
    
  }
  
  console.log(outputData);
  console.log(manualCheckData);
  console.log("Choosing the highest FTE:", manualCheckData.length, "people have constituencies with tied FTEs");

  /*
   * Finally we have two groups to manually check:
   * 1. Those with an unknown constituency
   * 2. Those with multiple constituencies tied for FTE
   */

  // Time to add the manual check data back in (dual appointments):

  let manualMap = new Map();
  for (const entry of manualCheckedData) {
    manualMap.set(entry["Email"], []);
  }
  for (const entry of manualCheckedData) {
    const constituencyKey = entry["Email"];
    manualMap.get(constituencyKey).push(entry);
  }
  for (const [key, value] of manualMap) {
      let nameList = value[0]["Name"].split(',');
      let lastName = nameList[0];
      let firstName = nameList[1];
      let reducedEntry = {
        "FirstName": firstName,
        "LastName": lastName,
        "Name": value[0]["Name"],
        "Email": value[0]["Email"],
        "Constituency": value[0]["Constituency"],
        "Department Descr": value[0]["Department Descr"],
        "UH Deptid Divis": value[0]["UH Deptid Divis"],
        "UH Deptid Branc": value[0]["UH Deptid Branc"],
        "UH Deptid Secti": value[0]["UH Deptid Secti"],
        "TenureStat": value[0]["TenureStat"],
        "Tenure Desc": value[0]["Tenure Desc"],
        "FTE": value[0]["FTE"],
        "TOT_FTE": value[0]["TOT_FTE"],
      }
    outputData.push(reducedEntry);
    console.log(reducedEntry);
  }

  console.log("Adding back in dual constituencies:");
  console.log(outputData);

  outputData.sort((a, b) => a["Constituency"] - b["Constituency"]);

  const currentYear = new Date().getFullYear();
  createCSVDownloadButton(outputData, "Congress_" + currentYear + ".csv", ",", true);
  
  // Splitting for ListServ
  // Must be space delimited
  // Must be email, firstname, lastname
  //
  // Record number of people per constituency
  // Also record number of senators:
  // For every 30 people rounded up to the nearest 30, one senator
  // Senators = (numPeople / 30.0).ceil();
  const uhmfsEmail = "uhmfs@hawaii.edu";
  const uhmfsListServ = { "Email": uhmfsEmail,
                          "FirstName": "John",
                          "LastName": "Kinder", };
  const uhmfsOpaVote = { "Email": uhmfsEmail };

  let senatorStats = [];
  let restOfData = outputData;
  for (let i = 0; i < 19; i++) {
    console.log(restOfData);
    // Splitting into files based on constituency
    let filterString = restOfData[0]["Constituency"];
    let filename = "listserv_email_name_" + filterString + "_" + currentYear + ".csv";
    let singleConstituencyCSV = restOfData.filter(row => row["Constituency"] === filterString);
    let listServCSV = singleConstituencyCSV.map((row) =>
      ({ "Email": row["Email"],
        "FirstName": row["FirstName"],
        "LastName": row["LastName"],
      }));
    let senatorStat = {
      "Constituency": filterString,
      "Number of People": singleConstituencyCSV.length,
      "Number of Senators": Math.ceil(parseFloat(singleConstituencyCSV.length) / 30.0)
    }
    senatorStats.push(senatorStat);
    // Do this after to not affect senator stats
    listServCSV.unshift(uhmfsListServ);
    restOfData = restOfData.filter(row => row["Constituency"] !== filterString);

    createCSVDownloadButton(listServCSV, filename, " ", false);
  }

  restOfData = outputData;
  for (let i = 0; i < 19; i++) {
    console.log(restOfData);
    // Splitting into files based on constituency
    let filterString = restOfData[0]["Constituency"];
    let filename = "opavote_email_" + filterString + "_" + currentYear + ".csv";
    let singleConstituencyCSV = restOfData.filter(row => row["Constituency"] === filterString);
    let opaVoteCSV = singleConstituencyCSV.map((row) =>
      ({ "Email": row["Email"],
      }));
    opaVoteCSV.unshift(uhmfsOpaVote);
    restOfData = restOfData.filter(row => row["Constituency"] !== filterString);

    createCSVDownloadButton(opaVoteCSV, filename, ",", false);
  }
  createCSVDownloadButton(senatorStats, "SenatorStats_" + currentYear + ".csv", ",", true);

  createCSVDownloadButton(manualCheckData, "ManualCheckData_" + currentYear + ".csv", ",", true);

  // Splitting for OpaVote
  // opavote folder
  // email_CONSTITUENCY.csv
  // listserv folder
  // email_name_CONSTITUENCY.csv
}

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
function generateListServCSVs(rows, divName) {
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
    let filterString = restOfData[0]["Constituency"];
    let singleConstituencyData = restOfData.filter(row => row["Constituency"] === filterString);
    restOfData = restOfData.filter(row => row["Constituency"] !== filterString);
    
    let listServData = singleConstituencyData.map((row) =>
      (
        {
          "Email": row["Email"],
          "FirstName": row["FirstName"],
          "LastName": row["LastName"],
        }
      ));
    listServCSV.unshift(uhmfsListServ);

    let filename = "listserv_email_name_" + filterString + "_" + currentYear + ".csv";
    createCSVDownloadButton(listServCSV, filename, " ", false, divName);
  }
}

function generateOpaVoteCSVs(rows, divName) {
  // UH MFS email to add to the top of the opavote data
  const uhmfsEmail = "uhmfs@hawaii.edu";
  const uhmfsOpaVote = { "Email": uhmfsEmail };

  restOfData = rows;
  for (let i = 0; i < 19; i++) {
    console.log(restOfData);
    // Splitting into files based on constituency
    let filterString = restOfData[0]["Constituency"];
    let filename = "opavote_email_" + filterString + "_" + currentYear + ".csv";
    let singleConstituencyCSV = restOfData.filter(row => row["Constituency"] === filterString);
    let opaVoteCSV = singleConstituencyCSV.map((row) =>
      ({ "Email": row["Email"],
      }));
    opaVoteCSV.unshift(uhmfsOpaVote);
    restOfData = restOfData.filter(row => row["Constituency"] !== filterString);

    createCSVDownloadButton(opaVoteCSV, filename, ",", false, divName);
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





















/* example logic for splitting into constituencies
let outFile1 = loadedFile;//.filter(row => parseFloat(row[fulltime]) >== 0.99);
let restOfFile1 = outFile1;
while (restOfFile1.length != 0) {
let filename1 = restOfFile1[0][constituency];
let file1 = restOfFile1.filter(row => row[constituency] === filename1);
restOfFile1 = restOfFile1.filter(row => row[constituency] !== filename1);
let blob = convertCSVToBlob(file1);
downloadBlob(blob, filename1 + "_MFS_2025");
}
*/











/*


function convertCSVToBlob(csvRows) {
  let blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
  return blob;
}

function downloadBlob(blob, filename) {
  let link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename.concat(".csv");
  link.click();
}
*/
/*
let csv = getCSV();

function getCSV() {
    let a = [];
    let lines = 10;
    let columns = 10;
    for (let line = 0; i < lines; i++) {
        for (let column = 0; column < columns; column++) {
            a.push(
                {
                    "email": line.email;
                    "firstname": line.firstname;
                    "lastname": line.lastname;
                }
            )
        }
    }
}
*/




/*

function rawCSVTo2DArray(rawCSV) {
  let fileNotEnded = true;
  let startOfLine = 0;
  let endOfLine = 0;
  let restOfFile = rawCSV;
  let rows = [];
  while (fileNotEnded) {
    if (restOfFile.length == 0) {
      fileNotEnded = true;
      break;
    }
    
    let line;
    let splitIndex = restOfFile.indexOf("\n");
    
    if (splitIndex != -1) {
      line = restOfFile.substring(0, splitIndex);
      restOfFile = restOfFile.substring(splitIndex + 1);
    }
    else {
      line = restOfFile;
      restOfFile = "";
    }

    let columns = [];
    let lineNotEnded = true;
    let restOfLine = line;
    let firstComma = true;

    let quoteLocations = [];
    let index = 0;

    while (lineNotEnded) {
      let value;
      if (restOfLine.length == 0) {
        lineNotEnded = true;
        break;
      }

      
      let lineSplitIndex = restOfLine.indexOf(",");
      if (firstComma) {
        lineSplitIndex = restOfLine.indexOf(",", lineSplitIndex + 2);
        firstComma = false;
      }
        
      if (lineSplitIndex != -1) {
        value = restOfLine.substring(0, lineSplitIndex);
        restOfLine = restOfLine.substring(lineSplitIndex + 1);
      }
      else {
        value = restOfLine;
        restOfLine = "";
      }
      
      columns.push(value);
    }
    rows.push(columns);
  }
  return rows;
}


function inputDataArrayToObject(rowArray) {
  let rowObject = {
    name: rowArray[0],
    email: rowArray[1],
    departmentDescription: rowArray[2],
    departmentDivision: rowArray[3],
    departmentBranch: rowArray[4],
    departmentSection: rowArray[5],
    tenureStatus: rowArray[6],
    tenureDescription: rowArray[7],
    fullTimeEmployment: rowArray[8],
    totalFullTimeEmployment: rowArray[9],
  };
  return rowObject;
}
*/


/*
function unParseWithLib(parsedCSV) {
  return Papa.unparse(parsedCSV, {
    header: false, // Treat first row as an object header
  });
}




function toListServData(inputObject) {
  let outputObject = {
    "Name": inputObject["Name"],
    "Email": inputObject["Email"],
  };
  return outputObject
}

function objectToOpaVoteArray(rowObject) {
  let rowArray = [
    rowObject.email,
  ];
  return rowArray;
}
*/
