import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes,faCheck,faTrash,faEdit } from '@fortawesome/free-solid-svg-icons'; 
import './etapy.css';
import  ModalConfirm from '../modal/ModalConfirm'
const Etapy = () => {
  // Stan do kontrolowania widoczności poszczególnych elementów
  const [poolName, setPoolName] = useState('');
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [pools,setPools] = useState([]); 
  const [isEditMode, setIsEditMode] = useState(false);
  const [Questions, setQuestions] = useState([]);
  const [editedPoolName,setEditPoolName] = useState('');
  const [poolId,setPoolId] = useState('');
  const [selectedStage, setSelectedStage] = useState(null);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPoolId, setSelectedPoolId] = useState(null);
  const [assignedQuestions, setAssignedQuestions] = useState([]);

  useEffect(() => {
    const socketConnection = new WebSocket('ws://localhost:3000'); // Połączenie z serwerem WebSocket

    socketConnection.onopen = () => {
      console.log('Połączono z WebSocket');
      socketConnection.send(JSON.stringify({ action: 'getPools' }));
      socketConnection.send(JSON.stringify({ action: 'getQuestions' })); 
    };

    socketConnection.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Dane od WebSocket:', data); // Logowanie danych
      if (data.action === 'showPools') {
        setPools(data.pools);  // Ustawiamy graczy w stanie
        setLoading(false);  // Zakończenie ładowania
      } else if (data.action === 'showQuestions') {
        setQuestions(data.questions || []);
      }
    };

    socketConnection.onerror = (error) => {
      console.error('Błąd WebSocket:', error);
      setLoading(false);
    };

    socketConnection.onclose = () => {
      console.log('Połączenie WebSocket zostało zamknięte');
    };

    setSocket(socketConnection); // Przechowywanie referencji do socketu

    return () => {
      if (socketConnection.readyState === WebSocket.OPEN) {
        socketConnection.close();
      }
    };
  }, []);
  // Funkcja do aktualizowania nazwy puli pytań
  const handleNameChange = (event) => {
    setPoolName(event.target.value);
  };



  const handleAddPool = (event) => {
    event.preventDefault();
    if (!poolName.trim()) {
      alert('Nazwa puli nie może być pusta!');
      return;
    }

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({ action: 'addPool', name: poolName })
      );
      setPoolName(''); // Resetujemy pole formularza po dodaniu puli
      setIsFormVisible(false)
    }
  };
  const handleEditPool = (nazwa,id) => {
    setIsEditMode(!isEditMode); // Przełączenie między trybem edycji i podglądem
    setEditPoolName(nazwa);
    setPoolId(id)
  };
  const closeModal = () => {
    setIsEditMode(false); // Zamykamy popup
  };
  const handleStageSelect = (stage) => {
    setSelectedStage(stage);
  };
  const handleCheckboxChange = (questionId) => {
    setSelectedQuestions((prev) =>
        prev.includes(questionId)
            ? prev.filter((id) => id !== questionId)
            : [...prev, questionId]
    );
};  
const handleAddQuestionstoPool = () => {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    alert('Połączenie z serwerem nie jest aktywne');
    return;
  }

  if (!selectedStage) {
    alert('Wybierz etap, zanim dodasz pytania');
    return;
  }

  if (!selectedQuestions.length) {
    alert('Nie wybrano żadnych pytań');
    return;
  }

  const data = {
    action: 'updatePoolQuestions',
    selectedQuestions: selectedQuestions, // array of question IDs
    poolId: poolId, // lub poolId zależnie od nazwy w Twoim stanie
    stage: selectedStage
  };

  console.log('Wysyłam do serwera:', data);
  socket.send(JSON.stringify(data));
};



const handleDeletePool = (poolId) => {
  setSelectedPoolId(poolId)
  setIsModalOpen(true);
};

const confirmDeletePool = () => {
  if (selectedPoolId) {

    // Przykład przez socket:
    socket.send(JSON.stringify({ action: 'deletePool', id: selectedPoolId }));

    // Resetuj stan
    setSelectedPoolId(null);
    setIsModalOpen(false);
  }
};

const cancelReset = () => {
  setIsModalOpen(false);
};
  return (
    <div className="etaps">
      <div className='current-pools'>
      {pools.length === 0 ? (
        <h2>Brak stworzonych pul pytań</h2>
      ) : (
        <ul>
          <h2>Obecne pule pytań</h2>
          {pools.map((pool) => (
            <li className='play' key={pool.id}>
              {pool.id}.{pool.nazwa}
              <div className='options'>
                <label className='del-pool' onClick={() => handleDeletePool(pool.id)}>
                    <FontAwesomeIcon icon={faTrash}/>
                </label>
                <label className='edit-pool' onClick={() => handleEditPool(pool.nazwa,pool.id)}>
                    <FontAwesomeIcon icon={faEdit}/>
                </label>
              </div>
            </li>
          ))}
        </ul>
      )}
      </div>
      <button className='create-pool-btn' onClick={() => setIsFormVisible(true)}>Stwórz pulę pytań</button>

{/* Formularz pojawia się w oknie modalnym */}
{isFormVisible && (
  <div className="modal-overlay" onClick={() => setIsFormVisible(false)}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <h2>Podaj nazwę puli pytań</h2>
      <form onSubmit={handleAddPool}>
        <label>
          <input
            type="text"
            value={poolName}
            onChange={handleNameChange}
            placeholder="Wpisz nazwę puli"
          />
        </label>
        <div className="button-group">
          <button className='pool-ok' type="submit" ><FontAwesomeIcon icon={faCheck}/></button>
          <button className='pool-close' type="button" onClick={() => setIsFormVisible(false)}><FontAwesomeIcon icon={faTimes}/></button>
        </div>
      </form>
    </div>
  </div>
)}
       {isEditMode && (
        <div className="modal-overlay">
          <div className="modal-edit-content">
            <button className="close-btn" onClick={closeModal}>×</button>
            <h3>Edytujesz pulę pytań: {editedPoolName}</h3>
            <ul className='possible-etaps'>
              {['Etap 1', 'Etap 2', 'Etap 3'].map((stage, index) => (
                <li 
                  key={index  } 
                  className={selectedStage === stage ? 'selected' : ''}
                  onClick={() => handleStageSelect(stage)}
                >
                  {stage}
                </li>
              ))}
          </ul>
            <div className='possible-questions'> 
              <h3>Wszystkie pytania</h3>
              <table className='question-table'>
                <thead>
                    <tr>
                        <td>Id</td>
                        <td>Pytanie</td>
                        <td>Poprawna odpowiedź</td>
                        <td>Błędna odpowiedź 1</td>
                        <td>Błędna odpowiedź 2</td>
                        <td>Błędna odpowiedź 3</td>
                        <td>Podpowiedź 1</td>
                        <td>Podpowiedź 2</td>
                        <td>Podpowiedź 3</td>
                        <td>Etap</td>
                        <td>Dodaj do etapu</td>
                    </tr>
                </thead>
                {Questions.filter(q => q.id_puli === poolId || q.id_puli === null).map((item, index) => (
                    <tbody key={index}>
                        <tr>
                            <td>{item.id}</td>
                            <td>{item.pytanie}</td>
                            <td className='true-answer'>{item.odpowiedz_poprawna}</td>
                            <td className='false-answer'>{item.odpowiedz_1}</td>
                            <td className='false-answer'>{item.odpowiedz_2}</td>
                            <td className='false-answer'>{item.odpowiedz_3}</td>
                            <td className='hint'>{item.podpowiedz_1}</td>
                            <td className='hint'>{item.podpowiedz_2}</td>
                            <td className='hint'>{item.podpowiedz_3}</td>
                            <td className='stage'>{item.etap}</td>
                            <td className='checkbox-container'>

                            <input 
                                type="checkbox" 
                                className="modern-checkbox" 
                                id={`modern-checkbox-${item.id}`} 
                                checked={selectedQuestions.includes(item.id)}
                                onChange={() => handleCheckboxChange(item.id)}
                            />
                            <label htmlFor={`modern-checkbox-${item.id}`}></label>
                            </td>
                        </tr>
                    </tbody>
                ))}       
            </table>
            <div className='selected-questions'>
                <h3>Wybrane pytania:</h3>
                {JSON.stringify(selectedQuestions, selectedStage, 2)}
                  {console.log(selectedStage)
                }
            </div>
                <button className='send-button' onClick={handleAddQuestionstoPool}>Dodaj pytania</button>
            </div>
          </div>
        </div>
      )}
      <div>
      <ModalConfirm
        isOpen={isModalOpen}
        onConfirm={confirmDeletePool}
        onCancel={cancelReset}
        message="Czy na pewno chcesz usunąć tę pule pytań?"
      />
    </div>
    </div>
  );
};

export default Etapy;
