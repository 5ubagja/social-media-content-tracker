/**
 * Social Media Content Tracker - Google Apps Script Backend
 * 
 * SETUP INSTRUCTIONS:
 * 1. Open your Google Sheet
 * 2. Go to Extensions → Apps Script
 * 3. Delete any existing code and paste this entire file
 * 4. Click Deploy → Manage deployments → Edit (pencil icon)
 * 5. Change version to "New version"
 * 6. Click Deploy
 * 
 * NOTE: You must create a NEW VERSION after updating the code!
 */

const SHEET_NAME = 'Sheet1';

// ====== API KEY PROTECTION ======
// GANTI dengan key rahasia Anda sendiri!
const API_KEY = 'TIMSOSMED_2026_SECRET';

function checkApiKey(key) {
  return key === API_KEY;
}

// Column mapping (0-indexed)
const COLUMNS = {
  inp_dateTime: 0,
  inp_date: 1,
  inp_location: 2,
  change_dateTime: 3,
  ID_Karyawan: 4,
  post_Date: 5,
  post_Type: 6,
  post_Akun: 7,
  post_URL: 8,
  post_Sumber: 9,
  post_Pengiklan: 10,
  post_Likes: 11,
  post_Image_v1: 12,
  post_Image_v2: 13,
  post_MetaData: 14,
  post_Comments: 15,
  post_Caption: 16,
  post_Likes_Comments: 17
};

// Get active sheet
function getSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
}

// Handle ALL requests via GET (to avoid CORS issues)
function doGet(e) {
  try {
    const action = e.parameter.action || 'read';
    
    // API Key check for write operations
    if (action !== 'read') {
      if (!checkApiKey(e.parameter.apiKey)) {
        return createResponse({ success: false, error: 'Invalid API Key' });
      }
    }
    
    switch(action) {
      case 'create':
        return handleCreate(e.parameter);
      case 'update':
        return handleUpdate(e.parameter);
      case 'delete':
        return handleDelete(e.parameter);
      default:
        return handleRead(e);
    }
  } catch (error) {
    return createResponse({ success: false, error: error.toString() });
  }
}

// Handle POST requests (kept for compatibility)
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === 'update') {
      return handleUpdate(data);
    } else if (data.action === 'delete') {
      return handleDelete(data);
    } else {
      return handleCreate(data);
    }
  } catch (error) {
    return createResponse({ success: false, error: error.toString() });
  }
}

// READ - Get all data
function handleRead(e) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  
  // If specific row requested
  if (e.parameter.row) {
    const rowIndex = parseInt(e.parameter.row);
    if (rowIndex > 0 && rowIndex <= rows.length) {
      const rowData = {};
      headers.forEach((header, i) => {
        rowData[header] = rows[rowIndex - 1][i];
      });
      rowData._rowIndex = rowIndex;
      return createResponse({ success: true, data: rowData });
    }
    return createResponse({ success: false, error: 'Row not found' });
  }
  
  // Return all data
  const result = rows.map((row, index) => {
    const obj = { _rowIndex: index + 1 };
    headers.forEach((header, i) => {
      obj[header] = row[i];
    });
    return obj;
  });
  
  // Calculate statistics
  const stats = {
    totalPosts: rows.length,
    totalLikes: rows.reduce((sum, row) => sum + (parseInt(row[COLUMNS.post_Likes]) || 0), 0),
    uniqueAccounts: [...new Set(rows.map(row => row[COLUMNS.post_Akun]))].length,
    postTypes: {}
  };
  
  rows.forEach(row => {
    const type = row[COLUMNS.post_Type] || 'Unknown';
    stats.postTypes[type] = (stats.postTypes[type] || 0) + 1;
  });
  
  return createResponse({ success: true, data: result, stats: stats });
}

// CREATE - Add new row
function handleCreate(data) {
  const sheet = getSheet();
  
  const now = new Date();
  const dateString = Utilities.formatDate(now, Session.getScriptTimeZone(), 'MM/dd/yyyy');
  const dateTimeString = Utilities.formatDate(now, Session.getScriptTimeZone(), 'MM/dd/yyyy HH:mm:ss');
  
  const newRow = [
    dateTimeString,
    dateString,
    data.inp_location || '',
    dateTimeString,
    data.ID_Karyawan || '',
    data.post_Date || dateString,
    data.post_Type || '',
    data.post_Akun || '',
    data.post_URL || '',
    data.post_Sumber || '',
    data.post_Pengiklan || '',
    data.post_Likes || '',
    data.post_Image_v1 || '',
    data.post_Image_v2 || '',
    data.post_MetaData || '',
    data.post_Comments || '',
    data.post_Caption || '',
    data.post_Likes_Comments || ''
  ];
  
  sheet.appendRow(newRow);
  
  return createResponse({ 
    success: true, 
    message: 'Data added successfully',
    rowIndex: sheet.getLastRow() - 1
  });
}

// UPDATE - Modify existing row
function handleUpdate(data) {
  const sheet = getSheet();
  const rowIndex = parseInt(data._rowIndex);
  
  if (!rowIndex || rowIndex < 1) {
    return createResponse({ success: false, error: 'Invalid row index' });
  }
  
  const now = new Date();
  const dateTimeString = Utilities.formatDate(now, Session.getScriptTimeZone(), 'MM/dd/yyyy HH:mm:ss');
  
  // Update change_dateTime
  sheet.getRange(rowIndex + 1, COLUMNS.change_dateTime + 1).setValue(dateTimeString);
  
  // Update other fields
  const fieldsToUpdate = [
    'ID_Karyawan', 'post_Date', 'post_Type', 'post_Akun', 'post_URL',
    'post_Sumber', 'post_Pengiklan', 'post_Likes', 'post_Image_v1',
    'post_Image_v2', 'post_MetaData', 'post_Comments', 'post_Caption',
    'post_Likes_Comments', 'inp_location'
  ];
  
  fieldsToUpdate.forEach(field => {
    if (data[field] !== undefined && data[field] !== '') {
      sheet.getRange(rowIndex + 1, COLUMNS[field] + 1).setValue(data[field]);
    }
  });
  
  return createResponse({ success: true, message: 'Data updated successfully' });
}

// DELETE - Remove row
function handleDelete(data) {
  const sheet = getSheet();
  const rowIndex = parseInt(data._rowIndex);
  
  if (!rowIndex || rowIndex < 1) {
    return createResponse({ success: false, error: 'Invalid row index' });
  }
  
  sheet.deleteRow(rowIndex + 1);
  
  return createResponse({ success: true, message: 'Data deleted successfully' });
}

// Create JSON response
function createResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
