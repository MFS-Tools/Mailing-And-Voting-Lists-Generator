/**************************************************
 * Software built for the Manoa Faculty Senate
 * Author: Kyle Bueche
 *
 *
 *
 **************************************************/

/*
 * The main pipeline for filtering data into CSVs
 * 1. filter rows by FTE, any < 0.5 get dropped.
 *
 *
 * 3. Collapse rows so that only one row exists for
 *    each unique email. Choose a row that the faculty
 *    member has the highest constituency in.
 *
 * 4. Handle any unresolved (tied) dual constituencies.
 *    John has a maintained list of these, which is provided as an input.
 *
 * 5. Create a hardcoded row for the UHMFS email,
 *    it will be spliced into the ListServs and OpaVotes.
 *    It will not be spliced into the main data,
 *    to not conflict with generating Senator Statistics.
 * 
 * 6. Create a button to save the overall Congress list which:
 *    - Is fully filtered for 0.5+ FTE.
 *    - Has fully resolved constituencies.
 *    - Preserves all the raw data pertaining to that constituency.
 *    - Can be downloaded as a record CSV.
 * 
 * 7. Format a copy of the data as ListServ CSVs
 *    - Create a download button for each ListServ CSV
 *
 * 8. Format a copy of the data as OpaVote CSVs
 *    - Create a download button for each OpaVote CSV
 *
 * 9. Take a copy of the data and count how many
 *    faculty are in each constituency. Then calculate
 *    how many senators should be in each constituency.
 *    - Create a download button for this.
 *
 */
function filteringPipeline(rawData, dataMap) {
  // 1. Convert data to MFS Data, determining a constituency.
  const data = convertDataToMFSData(rawData, dataMap);
  const constituencyRawData = data[0];
  const unknownConstituency = data[1];
  // If the dataMap CSV works correctly,
  // the unknownConstituency list should be empty.

  // 2. Choose only one constituency for each person.
  //
  //   - Now there are people with multiple rows,
  //     and different constituencies on each row.
  //
  //   - But we only want one row and one
  //     coonstituency per person.
  //
  const constituencyData = selectHighestFTEConstituencies(constituencyRawData);
  const knownConstituencies = constituencyData[0];
  const unknownDualConstituencies = constituencyData[1];
  // Some faculty have 0.5 FTE in one constituency,
  // and 0.5 FTE in another.
  //
  // unknownDualConstituencies contains these members.
  // John maintains a list of these people, but it's also
  // useful to have a list incase new members are unaccounted for.
  //
  // Before proceeding: resolve unknown dual constituencies.
  // We are using John's Dual Appointment CSV that he maintains.
  // It contains multiple rows per email, but we only care about
  // the row where Home matches Constituency.
  // Constituency is per-row.
  // Home is the Constituency that John determines in the case of a tie.
  //
  // In the future, we could check if this list covers every case in
  // unknownDualConstituencies above.

  // 3. Insert John's list of Dual Appointments
  let dualAppointmentsClean = [];
  for (row of dualAppointments) {
    console.log(row);
    if (row["Home"] == row["Constituency"]) {
      knownConstituencies.push(row);
    }
  }

  console.log(knownConstituencies);
  knownConstituencies.concat(dualAppointmentsClean);
  console.log(knownConstituencies);
    
  // 4. Remove any faculty whose total FTE is less than 0.5
  const filteredByFTE = filterRawDataByTotalFTE(knownConstituencies);


  // 5. Include John's UHMFS email so he can check whether the emails have been sent out.
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



  // 6. Generate all the output CSV lists.
  const rows = filteredByFTE;

  generateCongressList(rows, "congress-download", uhmfsRow);
  generateListServCSVs(rows, "listserv-download", uhmfsRow);
  generateOpaVoteCSVs(rows, "opavote-download", uhmfsRow);
  generateSenatorStatistics(rows, "senator-statistics-download");
}

/* 
 * Filtering the data based on who is at least half-time
 *
 * If constituents dont have Total FTE >= 0.5, they don't qualify to vote.
 *
 */
function filterRawDataByTotalFTE(rawData) {
  const filteredData = rawData.filter((row) => parseFloat(row["TOT_FTE"]) >= 0.5);

  const numEntriesFiltered = rawData.length - filteredData.length;
  console.log("Total FTE >= 0.5:", numEntriesFiltered, "rows filtered out.");

  console.log(filteredData);
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
  for (const oldRow of inputData) {
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
function selectHighestFTEConstituencies(inputData) {

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

      if (tied) { // Add all the rows with this email to be manually checked

        unresolvedDualConstituencies.concat(rows);

      } else { // Not tied, select the row with the highest FTE.

        let matchingConstituencyRows = []
        for (const row of rows) {
          if (row["Constituency"] == fteSumList[0]["Constituency"]) {
            matchingConstituencyRows.push(row);
          }
        }

        let newRow = matchingConstituencyRows[0];
        // Set the FTE to the sum, incase a constituency was split across multiple rows
        newRow["FTE"] = fteSumList[0]["FTE"];

        resolvedConstituencies.push(newRow);
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
  congress.unshift(uhmfsEmailRow);
  let filename = "Congress_" + new Date().getFullYear() + ".csv";
  createCSVDownloadButton(congress, filename, ",", true, divName);
}

function generateCongressListServ(rows, divName, uhmfsEmailRow) {

}

/*
 * Generates statistics for each constituency automatically
 */
function generateSenatorStatistics(rows, divName) {
  let senatorStats = [];
  let restOfData = rows;
  while (restOfData.length != 0) {

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
  let restOfData = rows;
  while (restOfData.length != 0) {
    /*
     * Choose the top row's constituency arbitrarily
     * Filter out all rows with the same constituency
     * Format the raw data into output data
     */
    let constituencyName = restOfData[0]["Constituency"];
    let singleConstituencyData = restOfData.filter(row => row["Constituency"] === constituencyName);
    restOfData = restOfData.filter(row => row["Constituency"] !== constituencyName);

    generateSingleListServ(singleConstituencyData, constituencyName, divName, uhmfsEmailRow);
  }
}

function generateSingleListServ(rows, constituencyName, divName, uhmfsEmailRow) {
  let listServCSV = rows.map((row) =>
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
  let opaVoteCSV = rows.map((row) =>
    ({ "Email": row["Email"], }));
  
  // Add uhmfs email to the top
  opaVoteCSV.unshift({ "Email": uhmfsEmailRow["Email"] });

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
    let singleConstituencyData = restOfData.filter(row => row["Constituency"] === constituencyName);
    restOfData = restOfData.filter(row => row["Constituency"] !== constituencyName);

    generateSingleOpaVoteCSV(singleConstituencyData, constituencyName, divName, uhmfsEmailRow);
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
 *  - A download link is created, and put into a list determined by divName
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
  
  let link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.innerText = filename;

  let listEntry = document.createElement('li');
  listEntry.appendChild(link);
  document.getElementById(divName).appendChild(listEntry);
}
