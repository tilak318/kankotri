import { useNavigate } from 'react-router-dom'
import './App.css'

function App() {
  const navigate = useNavigate();

  const handleTemplateClick = (template: string) => {
    navigate(`/template/${template}`);
  };

  return (
    <div className="app-container">
      <h1>Guest Name PDF Generator</h1>

      {/* Template Cards Grid */}
      <div className="template-grid">
        {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].map((template) => (
          <div
            key={template}
            className="template-card"
            onClick={() => handleTemplateClick(template)}
          >
            <div className="template-letter">{template}</div>
            <div className="template-info">
              {['A', 'B', 'C'].includes(template) && <span>Pages: 1, 4, 5</span>}
              {['D', 'E', 'F', 'G'].includes(template) && <span>Pages: 1, 4</span>}
              {['H', 'I'].includes(template) && <span>Page: 1</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
