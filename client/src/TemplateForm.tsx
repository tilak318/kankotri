import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import './App.css'

interface GuestData {
    ID: string | number;
    Name: string;
}

interface Coordinates {
    page1: { x: number; y: number };
    page4: { x: number; y: number };
    page5: { x: number; y: number };
}

// Default coordinates for each template
const DEFAULT_COORDS: Record<string, Coordinates> = {
    A: { page1: { x: 100, y: 375 }, page4: { x: 205, y: 550 }, page5: { x: 175, y: 550 } },
    B: { page1: { x: 100, y: 375 }, page4: { x: 205, y: 550 }, page5: { x: 175, y: 550 } },
    C: { page1: { x: 100, y: 375 }, page4: { x: 205, y: 550 }, page5: { x: 175, y: 550 } },
    D: { page1: { x: 100, y: 375 }, page4: { x: 205, y: 550 }, page5: { x: 0, y: 0 } },
    E: { page1: { x: 100, y: 375 }, page4: { x: 205, y: 550 }, page5: { x: 0, y: 0 } },
    F: { page1: { x: 100, y: 375 }, page4: { x: 175, y: 550 }, page5: { x: 0, y: 0 } },
    G: { page1: { x: 100, y: 375 }, page4: { x: 175, y: 550 }, page5: { x: 0, y: 0 } },
    H: { page1: { x: 100, y: 375 }, page4: { x: 0, y: 0 }, page5: { x: 0, y: 0 } },
    I: { page1: { x: 100, y: 375 }, page4: { x: 0, y: 0 }, page5: { x: 0, y: 0 } },
    J: { page1: { x: 100, y: 375 }, page4: { x: 205, y: 550 }, page5: { x: 0, y: 0 } },
};

// Template tags/notes
const gujaratiNotes: { [key: string]: string[] } = {
    A: ["Sangeet SARVO", "Pruthvi SARVO", "Meet SARVO"],
    B: ["Sangeet SAJODE", "Pruthvi SAJODE", "Meet SAJODE"],
    C: ["Sangeet SARVO", "Pruthvi SAJODE", "Meet SAJODE"],
    D: ["Sangeet SARVO", "Pruthvi SARVO"],
    E: ["Sangeet SARVO", "Pruthvi SAJODE"],
    F: ["Sangeet SARVO", "Meet SARVO"],
    G: ["Sangeet SARVO", "Meet SAJODE"],
    H: ["Sangeet SARVO"],
    I: ["Sangeet SAJODE"],
    J: ["Sangeet SARVO", "Pruthvi SAJODE"],
};

function TemplateForm() {
    const { template } = useParams<{ template: string }>();
    const navigate = useNavigate();

    const [previewData, setPreviewData] = useState<GuestData[]>([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [message, setMessage] = useState('');
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
    const [coordinates, setCoordinates] = useState<Coordinates>(
        template ? DEFAULT_COORDS[template] : DEFAULT_COORDS['C']
    );

    // Helper function to render note with color
    const renderNoteWithColor = (note: string) => {
        const regex = /(SARVO|SAJODE)$/;
        const match = note.match(regex);
        let name = note;
        let keyword = '';

        if (match) {
            name = note.substring(0, match.index).trim();
            keyword = match[0];
        }

        return (
            <div className="note-item" key={note}>
                <span className="note-name">{name}</span>
                {keyword && (
                    <span className={keyword === "SARVO" ? "sarvo-red" : "sajode-green"}>
                        {keyword}
                    </span>
                )}
            </div>
        );
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setMessage('');
            setPreviewData([]);

            setLoading(true);
            const formData = new FormData();
            formData.append('excelFile', selectedFile);

            try {
                const response = await fetch('http://localhost:6001/preview-excel', {
                    method: 'POST',
                    body: formData,
                });

                if (response.ok) {
                    const data = await response.json();
                    setPreviewData(data.guests);
                    setMessage(`Found ${data.guests.length} guests in the Excel file.`);
                } else {
                    const errorData = await response.json();
                    setMessage(`Error: ${errorData.error || 'Failed to read Excel'}`);
                }
            } catch (error) {
                console.error(error);
                setMessage('Error connecting to server.');
            } finally {
                setLoading(false);
            }
        }
    };

    const handlePreviewCoordinates = async () => {
        setMessage('Generating preview PDF...');

        try {
            const response = await fetch('http://localhost:6001/preview-coordinates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    coordinates,
                    testName: 'જીવરાજભાઈ અમરશીભાઈ',
                    template
                }),
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                window.open(url);
                setMessage('Preview PDF opened! Check the position and adjust if needed.');
            } else {
                const errorData = await response.json();
                setMessage(`Error: ${errorData.error || 'Failed to generate preview'}`);
            }
        } catch (error) {
            console.error(error);
            setMessage('Error connecting to server.');
        }
    };

    const handleGenerate = async () => {
        if (previewData.length === 0) {
            setMessage('No data to generate PDFs.');
            return;
        }

        setGenerating(true);
        setMessage('Starting PDF generation...');
        setProgress({ current: 0, total: previewData.length });

        try {
            const response = await fetch('http://localhost:6001/generate-pdfs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    guests: previewData,
                    coordinates,
                    template
                }),
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'generated_pdfs.zip';
                document.body.appendChild(a);
                a.click();
                a.remove();
                setMessage('Success! All PDFs generated and downloaded.');
                setProgress({ current: previewData.length, total: previewData.length });
            } else {
                const errorData = await response.json();
                setMessage(`Error: ${errorData.error || 'Failed to generate'}`);
            }
        } catch (error) {
            console.error(error);
            setMessage('Error connecting to server.');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="app-container">
            <div className="title-with-tags">
                <h2 className="card-title">Template {template} Configuration</h2>
                <div className="template-tags-inline">
                    {template && gujaratiNotes[template] &&
                        gujaratiNotes[template].map((note) => renderNoteWithColor(note))
                    }
                </div>
            </div>

            <div className="two-column-layout">
                {/* Left Column - Coordinate Setup */}
                <div className="form-card">
                    <h3 className="section-title">Coordinate Setup</h3>
                    <div className="coordinate-inputs">
                        {/* Page 1 - Always shown */}
                        <div className="coord-row">
                            <label>Page 1 (after "શ્રી"):</label>
                            <input
                                type="number"
                                placeholder="X"
                                value={coordinates.page1.x}
                                onChange={(e) => setCoordinates({ ...coordinates, page1: { ...coordinates.page1, x: Number(e.target.value) } })}
                            />
                            <input
                                type="number"
                                placeholder="Y"
                                value={coordinates.page1.y}
                                onChange={(e) => setCoordinates({ ...coordinates, page1: { ...coordinates.page1, y: Number(e.target.value) } })}
                            />
                        </div>

                        {/* Page 4 - Show for A, B, C, D, E, F, G, J */}
                        {template && ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'J'].includes(template) && (
                            <div className="coord-row">
                                <label>Page 4 (after "એહી સ્વજનશ્રી"):</label>
                                <input
                                    type="number"
                                    placeholder="X"
                                    value={coordinates.page4.x}
                                    onChange={(e) => setCoordinates({ ...coordinates, page4: { ...coordinates.page4, x: Number(e.target.value) } })}
                                />
                                <input
                                    type="number"
                                    placeholder="Y"
                                    value={coordinates.page4.y}
                                    onChange={(e) => setCoordinates({ ...coordinates, page4: { ...coordinates.page4, y: Number(e.target.value) } })}
                                />
                            </div>
                        )}

                        {/* Page 5 - Show only for A, B, C */}
                        {template && ['A', 'B', 'C'].includes(template) && (
                            <div className="coord-row">
                                <label>Page 5 (after "એહી સ્વજનશ્રી"):</label>
                                <input
                                    type="number"
                                    placeholder="X"
                                    value={coordinates.page5.x}
                                    onChange={(e) => setCoordinates({ ...coordinates, page5: { ...coordinates.page5, x: Number(e.target.value) } })}
                                />
                                <input
                                    type="number"
                                    placeholder="Y"
                                    value={coordinates.page5.y}
                                    onChange={(e) => setCoordinates({ ...coordinates, page5: { ...coordinates.page5, y: Number(e.target.value) } })}
                                />
                            </div>
                        )}

                        <div className="preview-btn-container">
                            <button onClick={handlePreviewCoordinates} className="preview-btn">
                                Preview Template {template}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column - File Upload & Guest Preview */}
                <div className="form-card">
                    <h3 className="section-title">Guest List</h3>

                    {/* File Upload Section */}
                    <div className="file-input-wrapper">
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={handleFileChange}
                            className="file-input"
                        />
                    </div>

                    {loading && <p className="status-message">Loading Excel file...</p>}

                    {previewData.length > 0 && (
                        <div className="preview-section">
                            <h3>Preview ({previewData.length} guests)</h3>
                            <div className="table-wrapper">
                                <table className="preview-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Name</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewData.map((guest, index) => (
                                            <tr key={index}>
                                                <td>{guest.ID}</td>
                                                <td>{guest.Name}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="actions">
                        <button
                            onClick={handleGenerate}
                            disabled={generating || previewData.length === 0}
                            className="primary-btn"
                        >
                            {generating ? `Generating... (${progress.current}/${progress.total})` : `Generate with Template ${template}`}
                        </button>
                    </div>
                </div>
            </div>

            {message && <p className={`status-message ${message.includes('Error') ? 'error' : 'success'}`}>{message}</p>}
        </div>
    );
}

export default TemplateForm;
