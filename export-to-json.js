import { google } from 'googleapis'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sanitize from 'sanitize-filename'

const convertGeolocation = (geolocation) =>
	geolocation
		.trim()
		.split(',')
		.map((s) => Number(s.trim()))

const convertPolygon = (polygon) =>
	polygon.split(',').map((point) => point.trim().split(' ').map(Number))

const convert = (key, value) => {
	if (value.length === 0) return [key, undefined]
	if (key === 'geolocation') return [key, convertGeolocation(value)]
	if (key === 'polygon') return [key, convertPolygon(value)]
	return [key, value]
}

try {
	await mkdir(path.join(process.cwd(), 'data'))
} catch {
	// directory exists
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const spreadsheetId =
	process.env.SPREADSHEET_ID ?? '13bCkmgQpBOrVl72sX4_12vwf-blY_3vlN5RAQxyPUY4'

const auth = new google.auth.GoogleAuth({
	keyFile: path.join(__dirname, 'jwt.keys.json'),
	scopes: 'https://www.googleapis.com/auth/drive.readonly',
})
const gsheets = google.sheets({ version: 'v4', auth })
const {
	data: { sheets },
} = await gsheets.spreadsheets.get({ spreadsheetId })

const jsonIndex = []

for (const {
	properties: { sheetId, title },
} of sheets) {
	const {
		data: { values },
	} = await gsheets.spreadsheets.values.get({
		spreadsheetId,
		range: `${title}`,
		valueRenderOption: 'UNFORMATTED_VALUE',
	})

	if (values === undefined) {
		console.warn(`No data found for ${title} (${sheetId})!`)
		continue
	}

	const [header, ...rows] = values
	const mvpData = rows.map((row) =>
		Object.fromEntries(
			row.map((v, i) => {
				if (header[i] === undefined) return []
				return convert(header[i], v)
			}),
		),
	)
	const filename = sanitize(`${title.replace(/ +/g, '-')}.json`)
	const outFile = path.join(__dirname, `data`, filename)
	await writeFile(outFile, JSON.stringify(mvpData, null, 2))
	console.log(`Sheet ${sheetId} written to ${filename}.`)
	jsonIndex.push({
		sheetId,
		title,
		link: `./${filename}`,
	})
}

await writeFile(
	path.join(__dirname, `data`, 'index.json'),
	JSON.stringify(jsonIndex, null, 2),
)
console.log(`Index written.`)
