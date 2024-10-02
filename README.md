# MVP Data

Pulls data from
[this spreadsheet](https://docs.google.com/spreadsheets/d/13bCkmgQpBOrVl72sX4_12vwf-blY_3vlN5RAQxyPUY4/)
and makes it available as a JSON document.

## Set up a Google Account to fetch the data

### Using the Google Drive API

> _WARNING!_ Use a blank Google Account when setting this up on Continuous
> Integration

1. Enable the Drive API:
   <https://console.cloud.google.com/flows/enableapi?apiid=drive.googleapis.com>
1. Enable the Sheets API:
   <https://console.cloud.google.com/flows/enableapi?apiid=sheets.googleapis.com>
1. Follow the
   [Create the service account and credentials](https://developers.google.com/admin-sdk/directory/v1/guides/delegation#create_the_service_account_and_credentials)
   instructions and generate a key for the service account
1. Store that file in the project folder as `jwt.keys.json`

You can now run

```bash
node export-to-json.js
```

## GitHub Actions setup

Configure the secret `service_account_jwt` in the `production` environment with
the contents of the file `jwt.keys.json`.
