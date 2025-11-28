require('regenerator-runtime/runtime');
const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const AdmZip = require('adm-zip');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 6001;

app.use(cors());
app.use(express.json());

// Ensure directories exist
const dirs = ['uploads', 'generated', 'templates', 'fonts'];
dirs.forEach(dir => {
	const dirPath = path.join(__dirname, dir);
	if (!fs.existsSync(dirPath)) {
		fs.mkdirSync(dirPath);
	}
});

const upload = multer({ dest: 'uploads/' });

// Preview Excel endpoint - just reads and returns the data
app.post('/preview-excel', upload.single('excelFile'), async (req, res) => {
	if (!req.file) {
		return res.status(400).json({ error: 'No Excel file uploaded' });
	}

	try {
		// Read Excel
		const workbook = xlsx.readFile(req.file.path);
		const sheetName = workbook.SheetNames[0];
		const sheet = workbook.Sheets[sheetName];
		const data = xlsx.utils.sheet_to_json(sheet);

		if (!data || data.length === 0) {
			return res.status(400).json({ error: 'Excel file is empty or invalid.' });
		}

		// Extract ID and Name
		const guests = data.map(row => ({
			ID: row.ID || 'N/A',
			Name: row.Name || ''
		})).filter(guest => guest.Name); // Only include rows with names

		// Cleanup uploaded file
		fs.unlinkSync(req.file.path);

		res.json({ guests });

	} catch (error) {
		console.error('Error reading Excel:', error);
		if (req.file && fs.existsSync(req.file.path)) {
			fs.unlinkSync(req.file.path);
		}
		res.status(500).json({ error: 'Failed to read Excel file', details: error.message });
	}
});

// Generate PDFs endpoint
app.post('/generate-pdfs', async (req, res) => {
	const { guests } = req.body;

	if (!guests || guests.length === 0) {
		return res.status(400).json({ error: 'No guest data provided' });
	}

	// Check for template
	const templatePath = path.join(__dirname, 'templates', 'template1.pdf');
	if (!fs.existsSync(templatePath)) {
		return res.status(404).json({ error: 'Template PDF (template1.pdf) not found.' });
	}

	// Check for Font
	const fontPath = path.join(__dirname, 'fonts', 'NotoSansGujarati-Regular.ttf');
	if (!fs.existsSync(fontPath)) {
		return res.status(404).json({ error: 'Gujarati font not found.' });
	}

	try {
		const zip = new AdmZip();
		const templateBytes = fs.readFileSync(templatePath);
		const fontBytes = fs.readFileSync(fontPath);

		console.log(`Starting PDF generation for ${guests.length} guests...`);

		// Process each guest
		for (let i = 0; i < guests.length; i++) {
			const guest = guests[i];
			const { ID, Name } = guest;

			console.log(`Processing ${i + 1}/${guests.length}: ${Name}`);

			const pdfDoc = await PDFDocument.load(templateBytes);

			// Register fontkit and embed Gujarati font
			pdfDoc.registerFontkit(fontkit);
			const customFont = await pdfDoc.embedFont(fontBytes);

			const pages = pdfDoc.getPages();

			// Coordinates for insertion (Page 1, 4, 5) -> Indices 0, 3, 4
			// Updated based on actual PDF positions
			const coords = [
				{ pageIndex: 0, x: 130, y: 395 }, // Page 1 - after "શ્રી" on the line
				{ pageIndex: 3, x: 240, y: 235 }, // Page 4 - after "એહી સ્વજનશ્રી" on the line
				{ pageIndex: 4, x: 240, y: 235 }  // Page 5 - after "એહી સ્વજનશ્રી" on the line
			];

			for (const coord of coords) {
				if (pages[coord.pageIndex]) {
					pages[coord.pageIndex].drawText(String(Name), {
						x: coord.x,
						y: coord.y,
						size: 24,
						font: customFont,
						color: rgb(1, 0, 0), // RED COLOR
					});
				}
			}

			const pdfBytes = await pdfDoc.save();

			// Use Name as filename (sanitized)
			const safeName = String(Name).replace(/[^a-z0-9\u0A80-\u0AFF\s]/gi, '_');
			const filename = `${safeName}.pdf`;

			zip.addFile(filename, Buffer.from(pdfBytes));
		}

		const zipBuffer = zip.toBuffer();

		console.log('All PDFs generated successfully!');

		res.set('Content-Type', 'application/zip');
		res.set('Content-Disposition', 'attachment; filename=generated_pdfs.zip');
		res.set('Content-Length', zipBuffer.length);
		res.send(zipBuffer);

	} catch (error) {
		console.error('Error generating PDFs:', error);
		res.status(500).json({ error: 'Internal Server Error', details: error.message });
	}
});

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
