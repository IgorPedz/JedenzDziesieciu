import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faUpload, faInfo, faTrash } from '@fortawesome/free-solid-svg-icons'; 
import './pytania.css';
import ModalConfirm from '../modal/ModalConfirm'

function Pytania() {
  const [questions, setQuestions] = useState([]); 
  const [error, setError] = useState(null); 
  const [socket, setSocket] = useState(null); 
  const [importQuestions, setImportQuestions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3000'); 

    ws.onopen = () => {
      console.log('✅ Połączono z WebSocket');
      ws.send(JSON.stringify({ action: 'getQuestions' })); // Pobierz pytania po otwarciu połączenia
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.action === 'importSuccess') {
        alert('✅ Pytania zostały zaimportowane!');
      } else if (data.action === 'showQuestions') {
        setQuestions(data.questions || []);
      } else if (data.action === 'questionAdded') {
        // Dodajemy pytanie do obecnej listy
        setQuestions(prev => [...prev, data.data]);
      } else if (data.error) {
        setError(data.error);
      }
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];

    if (file && file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
      const reader = new FileReader();
      
      reader.onload = (evt) => {
        const binaryStr = evt.target.result;
        const wb = XLSX.read(binaryStr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);
        
        const parsedQuestions = data.map(item => ({
          question: item.Pytanie,
          correctAnswer: item["Odpowiedź poprawna"],
          hints: [item["p1"], item["p2"], item["p3"]],
          answers: [item["o1"], item["o2"], item["o3"]],
        }));

        setImportQuestions(parsedQuestions);

        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            action: 'import',
            questions: parsedQuestions,
          }));
        }
      };

      reader.onerror = () => {
        setError("❌ Wystąpił błąd podczas wczytywania pliku");
      };

      reader.readAsBinaryString(file);
    } else {
      setError("❌ Proszę wybrać plik w formacie .xls lub .xlsx");
    }
  };

  const handleResetDatabase = () => {
    setIsModalOpen(true);
  };

  const confirmReset = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ action: 'reset', base: 'pytania' }));
      setQuestions([]);
    }
    setIsModalOpen(false);
  };

  const cancelReset = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="main">
      <div className="file-upload">
        <div className='header'>
        <h2>Obecne Pytania</h2>
        <div className='options'>
            <label className='questions-del' onClick={handleResetDatabase}>
              <FontAwesomeIcon icon={faTrash} />
            </label>
              <label htmlFor="fileUpload" className="file-label">
                <FontAwesomeIcon icon={faUpload} />
              </label>
              <div className='info'>
                <FontAwesomeIcon icon={faInfo }  />
              <div className='hover-img'>
                <img src='images/przykladexcel.png' alt="Przykładowy plik Excel" />
              </div>
            </div>
        </div>
        </div>
        <input 
          type="file" 
          accept=".xls,.xlsx"
          className='file-input'
          id='fileUpload'
          onChange={handleFileUpload} 
        />
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {questions.length > 0 ? (
        <div className='imported-questions'>
          <div className='questions-header'>
          </div>
          <table className='question-table'>
              <thead>
                <tr>
                  <td>Pytanie</td>
                  <td>Poprawna odpowiedź</td>
                  <td>Błędna odpowiedź 1</td>
                  <td>Błędna odpowiedź 2</td>
                  <td>Błędna odpowiedź 3</td>
                  <td>Podpowiedź 1</td>
                  <td>Podpowiedź 2</td>
                  <td>Podpowiedź 3</td>
                </tr>
              </thead>
          {questions.map((item, index) => (
              <tbody>
                <tr>
                  <td>{item.pytanie}</td>
                  <td className='true-answer'>{item.odpowiedz_poprawna}</td>
                  <td className='false-answer'>{item.odpowiedz_1}</td>
                  <td className='false-answer'>{item.odpowiedz_2}</td>
                  <td className='false-answer'>{item.odpowiedz_3}</td>
                  <td className='hint'>{item.podpowiedz_1}</td>
                  <td className='hint'>{item.podpowiedz_2}</td>
                  <td className='hint'>{item.podpowiedz_3}</td>
                </tr>
              </tbody>
          ))}
          </table>
        </div>
      ):(
        <p>Brak pytań</p>
      )}
      <div>
        <ModalConfirm
          isOpen={isModalOpen}
          onConfirm={confirmReset}
          onCancel={cancelReset}
          message="Czy na pewno chcesz usunąć wszystkie pytania?"
        />
    </div>
    </div>
    
  );
}

export default Pytania;
