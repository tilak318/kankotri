import { useState } from 'react'
import './App.css'

interface GuestData {
  ID: string | number;
  Name: string;
}

function App() {
  const [previewData, setPreviewData] = useState<GuestData[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setMessage('');
      setPreviewData([]);

      // Upload and preview
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
        body: JSON.stringify({ guests: previewData }),
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
      <p>Upload an Excel file with columns <b>ID</b> and <b>Name</b> to generate personalized PDFs.</p>

      <div className="card">
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
            {generating ? `Generating... (${progress.current}/${progress.total})` : 'Start Generation'}
          </button>
        </div>

        {message && <p className={`status-message ${message.includes('Error') ? 'error' : 'success'}`}>{message}</p>}
      </div>
    </div>
  )
}

export default App
