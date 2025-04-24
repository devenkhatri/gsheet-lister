/**
 * Represents the data extracted from a row in the Google Sheet.
 */
export interface SheetRowData {
  [key: string]: any;
}

/**
 * Interface to represent the structure of the response from Google Sheets API.
 */
export interface SheetData {
  /**
   * The column names of the Google Sheet
   */
  columnNames: string[];
  /**
   * An array of rows, where each row is an object representing the data in that row.
   */
  rows: SheetRowData[];
}

/**
 * Asynchronously retrieves data from a specified Google Sheet.
 *
 * @returns A promise that resolves to a SheetData object containing column names and rows of data.
 */
export async function getSheetData(): Promise<SheetData> {
  if (!process.env.NEXT_PUBLIC_GOOGLE_API_KEY) {
    throw new Error('NEXT_PUBLIC_GOOGLE_API_KEY is not set in environment variables.');
  }

    if (!process.env.NEXT_PUBLIC_SHEET_ID) {
    throw new Error('NEXT_PUBLIC_SHEET_ID is not set in environment variables.');
  }

  const spreadsheetId = process.env.NEXT_PUBLIC_SHEET_ID;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  const sheetName = process.env.NEXT_PUBLIC_SHEET_ID;
  const range = sheetName || 'Sheet1'; // default sheet name
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HTTP error ${response.status}: ${response.statusText} - ${errorText}`);
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(`Failed to fetch data: ${response.status} ${response.statusText} - ${JSON.stringify(errorJson)}`);
      } catch (jsonError) {
        // If parsing JSON fails, just use the raw error text
        throw new Error(`Failed to fetch data: ${response.status} ${response.statusText} - ${errorText}`);
      }
    }

    const data = await response.json();

    if (!data.values || data.values.length === 0) {
      return { columnNames: [], rows: [] }; // Return empty data if no values are found
    }

    const columnNames = data.values[0] as string[];
    const rows = data.values.slice(1).map((row: any[]) => {
      const rowData: { [key: string]: any } = {};
      for (let i = 0; i < columnNames.length; i++) {
        rowData[columnNames[i]] = row[i] || ''; // Handles undefined values
      }
      return rowData;
    });

    return { columnNames, rows };
  } catch (error: any) {
    console.error("Error fetching data from Google Sheets:", error);
    throw new Error(error.message || "Failed to fetch data from Google Sheets");
  }
}

/**
 * Appends a new row to the Google Sheet.
 * @param rowData An object containing the data for the new row.  Keys must match column names.
 * @returns A promise that resolves when the data has been appended.
 */
export async function appendSheetData(rowData: { [key: string]: any }): Promise<void> {
  if (!process.env.NEXT_PUBLIC_GOOGLE_API_KEY) {
    throw new Error('NEXT_PUBLIC_GOOGLE_API_KEY is not set in environment variables.');
  }

  if (!process.env.NEXT_PUBLIC_SHEET_ID) {
    throw new Error('NEXT_PUBLIC_SHEET_ID is not set in environment variables.');
  }

  const spreadsheetId = process.env.NEXT_PUBLIC_SHEET_ID;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  const sheetName = process.env.NEXT_PUBLIC_SHEET_ID;
  const range = sheetName || 'Sheet1'; // default sheet name
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS&key=${apiKey}`;

  try {
    const sheetData = await getSheetData();
    const columnNames = sheetData.columnNames;

    // Ensure that all rowData keys are present in the columnNames
    const values = [columnNames.map(columnName => rowData[columnName] !== undefined ? rowData[columnName] : '')];

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: values,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error appending data to Google Sheets:", errorData);
      throw new Error(`Failed to append data: ${response.status} ${response.statusText} - ${errorData.error.message}`);
    }

    const data = await response.json();
    console.log("Data appended successfully:", data);
  } catch (error: any) {
    console.error("Error appending data to Google Sheets:", error);
    throw new Error(error.message || "Failed to append data to Google Sheets");
  }
}
