exports.handler = async (event, context, callback) => {
  const { httpMethod } = event;
  let { spreadsheetId, range } = event.queryStringParameters;

  //response
  let data = {};
  const response = {
    "statusCode": 200,
    "body": JSON.stringify(data)
  };

  //only allow read/write from attendance
  if (spreadsheetId !== process.env.ATTENDANCE_SPREADSHEET_ID) {
    response.statusCode = 403;
    response.body = JSON.stringify({error: 'You are not authorized to view this sheet'});
    callback(null, response);
  }

  // fetch credentials to authorize
  let credentials = await googleSheetsCredentials();

  // authorize using credentials
  let auth = await authorize(credentials);

  if (httpMethod=== 'GET') {
    if (!spreadsheetId || !range) {
      response.statusCode = 400;
      data = {
        error: 'request must include spreadsheetId and range'
      };
    } else {
      try {
        data = await readSheetResults(auth, spreadsheetId, range);
      } catch (err) {
        console.log("error reading sheets", err);
      }
    }
  } else if (httpMethod === 'POST') {
    const { values } = JSON.parse(event.body);
    if (!spreadsheetId || !range || !values) {
      response.statusCode = 400;
      data = {
        error: 'request must include spreadsheetId, range, and values'
      };
    } else {
      try {
        data = await writeSheetResults(auth, values, spreadsheetId, range);
      } catch (err) {
        cosnole.log("error writing to sheets", err);
      }
    }
  } else {
    response.statusCode = 403;
    data = {
      error: 'http method must be either GET or POST'
    };
  }

  response.body = JSON.stringify(data);
  callback(null, response);
};

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { google } = require('googleapis');

// If modifying these scopes, delete credentials.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_PATH = path.join(__dirname, 'credentials.json');

function googleSheetsCredentials() {
    // Load client secrets from a local file.
    return new Promise( (resolve, reject) => {
    fs.readFile(path.join(__dirname, 'google_secret.json'), (err, content) => {
      if (err) reject('Error loading client secret file:', err);
      // Authorize a client with credentials, then call the Google Sheets API.
      resolve(JSON.parse(content));
    });
  });
};

async function authorize(credentials) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);
  // Check if we have previously stored a token.
  return new Promise( (resolve, reject) => {
    fs.readFile(TOKEN_PATH, async (err, token) => {
      if (err) {
        console.log('🐸');
        console.log(err);
        let newToken = await getNewToken(oAuth2Client);
        resolve(newToken);
      } else {
        oAuth2Client.setCredentials(JSON.parse(token));
        resolve(oAuth2Client);
      }
    });
  });
};

function getNewToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('😎 Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise( (resolve, reject) => {
    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) reject(err);
        oAuth2Client.setCredentials(token);
        // Store the token to disk for later program executions
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
          if (err) reject(err);
          console.log('Token stored to', TOKEN_PATH);
        });
        resolve(oAuth2Client);
      });
    });
  });
};

function readSheetResults(auth, spreadsheetId, range) {
  return new Promise( (resolve, reject) => {
    const sheets = google.sheets({version: 'v4', auth});
    sheets.spreadsheets.values.get({ spreadsheetId, range}, (err, {data}) => {
      if (err) reject('The API returned an error: ' + err);
      const rows = data.values;
      if (rows.length) {
        resolve(rows)
      } else {
        resolve('No data found.');
      }
    });
  })
};

function writeSheetResults(auth, body, spreadsheetId, range) {
  return new Promise((resolve, reject) => {
    const sheets = google.sheets({version: 'v4', auth});
    sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'RAW',
      resource: {values: body}
    }, (err, response) => {
      if (err) {
        console.log("ERROR: ", err);
        reject(err);
      } else {
        console.log("SUCCESS", response);
        resolve(response.data);
      }
    });
  });
};
