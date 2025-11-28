import { useState } from 'react'
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

function App() {
  const [previewData, setPreviewData] = useState<GuestData[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Template selection (A to I)
  const [selectedTemplate, setSelectedTemplate] = useState('C');

  // Coordinate state
  const [coordinates, setCoordinates] = useState<Coordinates>({
    page1: { x: 115, y: 375 },
    page4: { x: 240, y: 235 },
    page5: { x: 240, y: 235 }
  });

  const [showCoordinateSetup, setShowCoordinateSetup] = useState(true);

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
          template: selectedTemplate
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
          template: selectedTemplate
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
      <h1>Guest Name PDF Generator</h1>
      <p>Configure template and coordinates, then generate personalized PDFs</p>

      <div className="card">
        {/* Template Selection */}
        <div className="template-selection">
          <label>Select PDF Template:</label>
          <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)} className="template-select">
            <option value="A">Template A</option>
            <option value="B">Template B</option>
            <option value="C">Template C</option>
            <option value="D">Template D</option>
            <option value="E">Template E</option>
            <option value="F">Template F</option>
            <option value="G">Template G</option>
            <option value="H">Template H</option>
            <option value="I">Template I</option>
          </select>
        </div>

        <hr />

        {/* Coordinate Setup Section */}
        <div className="coordinate-setup">
          <h3 onClick={() => setShowCoordinateSetup(!showCoordinateSetup)} style={{ cursor: 'pointer' }}>
            ⚙️ Coordinate Setup for Template {selectedTemplate} {showCoordinateSetup ? '▼' : '▶'}
          </h3>

          {showCoordinateSetup && (
            <div className="coordinate-inputs">
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

              <button onClick={handlePreviewCoordinates} className="preview-btn">
                👁️ Preview Template {selectedTemplate} with "જીવરાજભાઈ અમરશીભાઈ"
              </button>
            </div>
          )}
        </div>

        <hr />

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
            {generating ? `Generating... (${progress.current}/${progress.total})` : `Generate with Template ${selectedTemplate}`}
          </button>
        </div>

        {message && <p className={`status-message ${message.includes('Error') ? 'error' : 'success'}`}>{message}</p>}
      </div>
    </div>
  )
}

export default App

