import { useNavigate } from 'react-router-dom'
import './App.css'

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
};

function App() {
  const navigate = useNavigate();

  const handleTemplateClick = (template: string) => {
    navigate(`/template/${template}`);
  };

  return (
    <div className="app-container">
      <h1>Invitation PDF Generator</h1>

      {/* Template Cards Grid */}
      <div className="template-grid">
        {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].map((template) => (
          <div
            key={template}
            className="template-card"
            onClick={() => handleTemplateClick(template)}
          >
            <div className="template-letter">{template}</div>
            <div className="template-gujarati-note">
              {gujaratiNotes[template] &&
                gujaratiNotes[template].map((note, index) => <p key={index}>{note}</p>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App

