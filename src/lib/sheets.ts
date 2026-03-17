import { google } from "googleapis";

export async function readSheetValues(range: string) {
  const spreadsheetId = process.env.SPREADSHEET_ID;
  const serviceAccountRaw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!spreadsheetId) {
    throw new Error("Missing SPREADSHEET_ID in .env.local");
  }

  if (!serviceAccountRaw) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON in .env.local");
  }

  const credentials = JSON.parse(serviceAccountRaw);

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({
    version: "v4",
    auth,
  });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  return response.data.values ?? [];
}