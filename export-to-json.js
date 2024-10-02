import { google } from 'googleapis'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sanitize from 'sanitize-filename'

try {
	await mkdir(path.join(process.cwd(), 'data'))
} catch {
	// directory exists
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const spreadsheetId =
	process.env.SPREADSHEET_ID ?? '13bCkmgQpBOrVl72sX4_12vwf-blY_3vlN5RAQxyPUY4'

const main = async () => {
	const auth = new google.auth.GoogleAuth({
		keyFile: path.join(__dirname, 'jwt.keys.json'),
		scopes: 'https://www.googleapis.com/auth/drive.readonly',
	})
	const gsheets = google.sheets({ version: 'v4', auth })
	const {
		data: { sheets },
	} = await gsheets.spreadsheets.get({ spreadsheetId })

	for (const {
		properties: { sheetId, title },
	} of sheets) {
		const {
			data: { values },
		} = await gsheets.spreadsheets.values.get({
			spreadsheetId,
			range: `${title}`,
		})

		if (values === undefined) {
			console.warn(`No data found for ${title}!`)
			continue
		}

		const [header, ...rows] = values
		const mvpData = rows.map((row) =>
			Object.fromEntries(row.map((v, i) => [header[i], v])),
		)
		const outFile = path.join(
			__dirname,
			`data/${sanitize(title.replace(' ', '-'))}.json`,
		)
		await writeFile(outFile, JSON.stringify(mvpData, null, 2))
		console.log(`${outFile} written...`)
	}
}

main()
