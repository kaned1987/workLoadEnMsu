/**
 * ==============================================================================
 * Google Apps Script for Teaching Workload Calculation System
 * Faculty of Engineering, Mahasarakham University (EN MSU)
 * Spreadsheet: ENMSU_CoruseDatabase
 * ==============================================================================
 */

// Configuration: If bound script (Extensions -> Apps Script), leave SPREADSHEET_ID empty.
// If standalone Apps Script, specify the ID or URL of "ENMSU_CoruseDatabase".
var CONFIG = {
  SPREADSHEET_NAME: "ENMSU_CoruseDatabase",
  SPREADSHEET_ID: "", // Optional: e.g. "1A2B3C..."
  DEFAULT_TAB_NAME: "", // Leave blank to auto-detect the first valid sheet tab
};

/**
 * Handle HTTP GET requests from Web Application
 */
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || "getAllData";
  var result = {};

  try {
    var ss = getSpreadsheet();
    
    if (!ss) {
      throw new Error(
        "ไม่พบไฟล์ Google Sheet 'ENMSU_CoruseDatabase' กรุณาตรวจสอบสิทธิ์การเข้าถึงหรือระบุ Spreadsheet ID ใน Apps Script"
      );
    }

    if (action === "ping") {
      result = {
        success: true,
        message: "Google Apps Script connected to " + ss.getName(),
        spreadsheetName: ss.getName(),
        timestamp: new Date().toISOString()
      };
    } else if (action === "getMetadata") {
      result = getSpreadsheetMetadata(ss);
    } else if (action === "getAllData" || action === "getData") {
      var tabName = (e && e.parameter && e.parameter.tab) || CONFIG.DEFAULT_TAB_NAME;
      result = fetchCourseData(ss, tabName);
    } else {
      result = {
        success: false,
        error: "Unknown action: " + action
      };
    }
  } catch (err) {
    result = {
      success: false,
      error: err.message || err.toString()
    };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Retrieve the active or configured spreadsheet
 */
function getSpreadsheet() {
  if (CONFIG.SPREADSHEET_ID && CONFIG.SPREADSHEET_ID.trim() !== "") {
    return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID.trim());
  }

  try {
    var active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (e) {
    // Not a bound script
  }

  // Search by file name in Drive
  var files = DriveApp.getFilesByName(CONFIG.SPREADSHEET_NAME);
  if (files.hasNext()) {
    return SpreadsheetApp.open(files.next());
  }

  return null;
}

/**
 * Get spreadsheet tabs and header inspection metadata
 */
function getSpreadsheetMetadata(ss) {
  var sheets = ss.getSheets();
  var tabNames = sheets.map(function(s) { return s.getName(); });
  var activeSheet = sheets[0];
  var headers = [];

  if (activeSheet.getLastRow() >= 1 && activeSheet.getLastColumn() >= 1) {
    headers = activeSheet.getRange(1, 1, 1, activeSheet.getLastColumn()).getValues()[0];
  }

  return {
    success: true,
    metadata: {
      spreadsheetName: ss.getName(),
      tabNames: tabNames,
      activeTab: activeSheet.getName(),
      totalRows: Math.max(0, activeSheet.getLastRow() - 1),
      headers: headers.map(function(h) { return String(h).trim(); }),
      lastUpdated: new Date().toISOString()
    }
  };
}

/**
 * Fetch and parse course records from spreadsheet
 */
function fetchCourseData(ss, tabName) {
  var sheet = tabName ? ss.getSheetByName(tabName) : ss.getSheets()[0];
  if (!sheet) {
    throw new Error("ไม่พบแท็บชีตที่ต้องการใน " + ss.getName());
  }

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();

  if (lastRow < 2 || lastCol < 1) {
    return {
      success: true,
      metadata: {
        spreadsheetName: ss.getName(),
        tabNames: ss.getSheets().map(function(s) { return s.getName(); }),
        activeTab: sheet.getName(),
        totalRows: 0,
        headers: []
      },
      rows: []
    };
  }

  var rangeValues = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var rawHeaders = rangeValues[0];
  var headers = rawHeaders.map(function(h, idx) {
    var val = String(h).trim();
    return val !== "" ? val : "Column_" + (idx + 1);
  });

  var rows = [];
  for (var i = 1; i < rangeValues.length; i++) {
    var rowValues = rangeValues[i];
    var isBlank = true;
    var rowObj = {};

    for (var j = 0; j < headers.length; j++) {
      var cellVal = rowValues[j];
      var colHeader = headers[j];
      
      if (cellVal !== "" && cellVal !== null && cellVal !== undefined) {
        isBlank = false;
      }
      rowObj[colHeader] = cellVal;
    }

    if (!isBlank) {
      rows.push(rowObj);
    }
  }

  return {
    success: true,
    metadata: {
      spreadsheetName: ss.getName(),
      tabNames: ss.getSheets().map(function(s) { return s.getName(); }),
      activeTab: sheet.getName(),
      totalRows: rows.length,
      headers: headers,
      lastUpdated: new Date().toISOString()
    },
    rows: rows
  };
}
