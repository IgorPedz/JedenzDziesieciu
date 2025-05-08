import React, { useState, useEffect } from 'react';
import "./uczestnicy.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faInfo,faTrash,faHeart,faRedo} from '@fortawesome/free-solid-svg-icons'; 
import * as XLSX from 'xlsx';
import ModalConfirm from '../modal/ModalConfirm';

function Uczestnicy() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPlayer, setNewPlayer] = useState({ Imie: '', Nazwisko: '', Klasa: '' });
  const [socket, setSocket] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [importPlayers, setImportPlayers] = useState([]);
  const [error, setError] = useState(null); 
  // Połączenie z WebSocket
  useEffect(() => {
    const socketConnection = new WebSocket('ws://localhost:3000'); // Połączenie z serwerem WebSocket

    socketConnection.onopen = () => {
      console.log('Połączono z WebSocket');
      socketConnection.send(JSON.stringify({ action: 'getPlayers' })); // Zapytanie o graczy
    };

    socketConnection.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Dane od WebSocket:', data); // Logowanie danych
      if (data.action === 'playersList') {
        setPlayers(data.data);  // Ustawiamy graczy w stanie
        setLoading(false);  // Zakończenie ładowania
      } else if (data.action === 'playerAdded') {
        setPlayers((prevPlayers) => [...prevPlayers, data.data]); // Dodajemy nowego gracza
        setNewPlayer({ Imie: '', Nazwisko: '', Klasa: '' }); // Resetowanie formularza
      } else if (data.action === 'playerDeleted') {
        setPlayers((prevPlayers) => prevPlayers.filter(player => player.id_uczestnika !== data.id)); // Usuwamy gracza
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
      socketConnection.close(); // Zamykamy połączenie przy odmontowywaniu komponentu
    };
  }, []);

  const handleAddPlayer = () => {
    console.log('Dodawanie gracza:', newPlayer);

    if (!newPlayer.Imie || !newPlayer.Nazwisko || !newPlayer.Klasa) {
      console.error('Wszystkie dane są wymagane');
      return;
    }

    const playerData = {
      action: 'addPlayer',
      Imie: newPlayer.Imie,
      Nazwisko: newPlayer.Nazwisko,
      Klasa: newPlayer.Klasa
    };

    socket.send(JSON.stringify(playerData)); // Wysyłamy dane gracza przez WebSocket
  };

  const handleRemovePlayer = (id) => {
    console.log('Usuwanie gracza, ID:', id);

    const removeData = {
      action: 'deletePlayer',
      playerId: id
    };

    socket.send(JSON.stringify(removeData)); // Wysyłamy zapytanie o usunięcie gracza przez WebSocket
  };
  const handleHealthReset = (playerId) => {
    // Tworzymy obiekt zapytania do WebSocket
    const resetHealthData = {
      action: 'resetHealth'
    };
  
    // Wysyłamy zapytanie przez WebSocket
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(resetHealthData));
    } else {
      console.error('Połączenie WebSocket nie jest aktywne');
    }
  };
  
  const handlePointsReset = () => {
    // Tworzymy obiekt zapytania do WebSocket
    const resetPointsData = {
      action: 'resetPoints'
    };
  
    // Wysyłamy zapytanie przez WebSocket
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(resetPointsData));
    } else {
      console.error('Połączenie WebSocket nie jest aktywne');
    }
  };
  const handleFileUpload = (e) => {
    const file = e.target.files[0];

    if (file && file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
      const reader = new FileReader();
      
      reader.onload = (evt) => {
        const binaryStr = evt.target.result;
        const wb = XLSX.read(binaryStr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);
        
        const parsedPlayers = data.map(item => ({
          name: item['Imie'],
          surrname: item['Nazwisko'],
          cl: item['Klasa']
        }));

        setImportPlayers(parsedPlayers);

        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            action: 'importPlayers',
            players: parsedPlayers,
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
      socket.send(JSON.stringify({ action: 'reset', base: 'uczestnicy' }));
      setPlayers([]);
    }
    setIsModalOpen(false);
  };

  const cancelReset = () => {
    setIsModalOpen(false);
  };

  return (
    <div className='main'>
      <div className="file-upload">
        <div className='header'>
        <h2>Uczestnicy gry</h2>
        <div className='options'>
          <label className='questions-del' onClick={handleResetDatabase}>
            <FontAwesomeIcon icon={faTrash} />
            </label>
            <label htmlFor="fileUpload" className="file-label">
              <FontAwesomeIcon icon ={faUpload} />
            </label>
          <div className='info'>
            <FontAwesomeIcon icon={faInfo }  />
            <div className='hover-img-2'>
              <img src='images/przyklad_excel_uczestnicy.png' alt="Przykładowy plik Excel" />
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
      {players.length === 0 ? (
        <p>Brak uczestników</p>
      ) : (
        <ul>
          {players.map((player) => (
            <li className="play" key={player.id_uczestnika}>
            <span className="player-info">
              {player.id_uczestnika}. {player.Imie} {player.Nazwisko} ({player.Klasa})
              <span className="attri"> 
                {player.Życia} Życia  {player.Punkty} Punkty
              </span>
            </span>
            <button className="del-player" onClick={() => handleRemovePlayer(player.id_uczestnika)}>
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </li>
          
          ))}
          <div className='options'> 
          <button className="health-reset reset-btns" onClick={()=>handleHealthReset()} >
            Zresetuj życia
            <FontAwesomeIcon icon={faHeart} />
          </button>
          <button className="points-reset reset-btns" onClick={()=>handlePointsReset()}>
            Zresetuj punkty
            <FontAwesomeIcon icon={faRedo} />
          </button>
          </div>
        </ul>
      )}
      <div className='player-form'>
        <input
          type="text"
          placeholder="Imię"
          value={newPlayer.Imie}
          onChange={(e) => setNewPlayer({ ...newPlayer, Imie: e.target.value })}
        />
        <input
          type="text"
          placeholder="Nazwisko"
          value={newPlayer.Nazwisko}
          onChange={(e) => setNewPlayer({ ...newPlayer, Nazwisko: e.target.value })}
        />
        <input
          type="text"
          placeholder="Klasa"
          value={newPlayer.Klasa}
          onChange={(e) => setNewPlayer({ ...newPlayer, Klasa: e.target.value })}
        />
        <label className='add-player' onClick={handleAddPlayer}>Dodaj uczestnika</label>
      </div>

      <div>
      <ModalConfirm
        isOpen={isModalOpen}
        onConfirm={confirmReset}
        onCancel={cancelReset}
        message="Czy na pewno chcesz usunąć wszystkich uczestników?"
      />
    </div>

    </div>
  );
}

export default Uczestnicy;
