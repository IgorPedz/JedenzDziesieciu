const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const WebSocket = require('ws');
const cors = require('cors');

// Utwórz aplikację Express
const app = express();
const port = 3000;

// Połączenie z bazą danych MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'projekt_abd'
});

// Sprawdź, czy połączenie z bazą danych jest udane
db.connect((err) => {
    if (err) {
        console.error('Błąd połączenia z bazą danych:', err);
        return;
    }
    console.log('Połączono z bazą danych MySQL');
});

// Middleware
app.use(cors({
    origin: 'http://localhost:3001',  // Pozwól tylko na połączenia z frontendem na porcie 3001
    methods: ['GET', 'POST', 'DELETE'],  // Dozwolone metody HTTP
    allowedHeaders: ['Content-Type'], // Dozwolone nagłówki
}));

app.use(express.json());

// Serwowanie plików statycznych z folderu build (z aplikacji React)
app.use(express.static(path.join(__dirname, 'client/build')));

// Endpoint do WebSocket
const server = app.listen(port, () => {
    console.log(`Serwer działa na porcie ${port}`);
});

// WebSocket setup
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('Połączono z WebSocket');

    ws.on('message', (message) => {
        console.log('Otrzymano wiadomość od klienta:', message);
        const data = JSON.parse(message);

        switch (data.action) {
            case 'getPlayers':
                const query = 'SELECT * FROM uczestnicy';
                db.query(query, (err, results) => {
                    if (err) {
                        console.error('Błąd zapytania:', err);
                        ws.send(JSON.stringify({ error: 'Błąd pobierania danych' }));
                        return;
                    }
                    console.log('Wysyłamy dane graczy:', results);
                    ws.send(JSON.stringify({ action: 'playersList', data: results }));
                });
                break;

            case 'addPlayer':
                const { Imie, Nazwisko, Klasa } = data;
                if (!Imie || !Nazwisko || !Klasa) {
                    ws.send(JSON.stringify({ error: 'Brak wymaganych danych' }));
                    return;
                }

                const insertQuery = 'INSERT INTO uczestnicy (Imie, Nazwisko, Klasa, Punkty, Życia) VALUES (?, ?, ?, "0", "3")';
                db.query(insertQuery, [Imie, Nazwisko, Klasa], (err, results) => {
                    if (err) {
                        if (err.code === 'ER_SIGNAL_EXCEPTION') { // dla MySQL 8+
                            console.error('❌ Maksymalna liczba rekordów osiągnięta.');
                            ws.send(JSON.stringify({ error: 'Maksymalna liczba rekordów osiągnięta' }));
                        } else {
                            console.error('❌ Błąd bazy danych:', err.message);
                            ws.send(JSON.stringify({ error: 'Błąd dodawania gracza' }));
                        }
                        return;
                    }
                    const Punkty = 0
                    const Życia = 3
                    const newPlayer = { id_uczestnika: results.insertId, Imie, Nazwisko, Klasa,Punkty,Życia };
                    ws.send(JSON.stringify({ action: 'playerAdded', data: newPlayer }));
                });
                break;

                case 'deletePlayer':
                    const { playerId } = data;
                
                    // Sprawdzamy poprawność playerId
                    if (!playerId || isNaN(playerId) || playerId <= 0) {
                        ws.send(JSON.stringify({ error: 'Nieprawidłowy identyfikator gracza' }));
                        return;
                    }
                
                    // Zapytanie do bazy danych o usunięcie gracza
                    const deleteQuery = 'DELETE FROM uczestnicy WHERE id_uczestnika = ?';
                    db.query(deleteQuery, [playerId], (err, results) => {
                        if (err) {
                            console.error('Błąd usuwania gracza:', err);
                            ws.send(JSON.stringify({ error: 'Błąd usuwania gracza' }));
                            return;
                        }
                
                        // Jeżeli gracz nie został znaleziony
                        if (results.affectedRows === 0) {
                            ws.send(JSON.stringify({ error: 'Gracz nie znaleziony' }));
                            return;
                        }
                
                        // Wysyłamy informację o usunięciu gracza
                        ws.send(JSON.stringify({ action: 'playerDeleted', message: 'Gracz usunięty' }));
                
                        // Pobieramy zaktualizowaną listę graczy i wysyłamy ją do wszystkich połączonych klientów
                        db.query('SELECT * FROM uczestnicy', (err, updatedPlayers) => {
                            if (err) {
                                console.error('Błąd pobierania graczy po usunięciu:', err);
                                return;
                            }
                
                            // Wysyłamy zaktualizowaną listę graczy do wszystkich połączonych klientów
                            wss.clients.forEach(client => {
                                if (client.readyState === WebSocket.OPEN) {
                                    client.send(JSON.stringify({ action: 'playersList', data: updatedPlayers }));
                                }
                            });
                        });
                    });
                    break;
                case 'importPlayers':
                    {
                    const players = data.players;
                
                    // Liczymy, ile zapytań musimy wykonać
                    let totalQueries = players.length;
                    let completedQueries = 0;
                    let importSuccess = true;

                   players.forEach((item) => {
                    const { name, surrname, cl } = item;

                    const query = 'INSERT INTO uczestnicy (Imie, Nazwisko, Klasa, Punkty, Życia) VALUES (?, ?, ?, "0", "3")';
                    db.query(query, [name, surrname, cl], (err, results) => {
                        completedQueries++;

                        if (err) {
                        console.error('Błąd zapisu do bazy danych:', err);
                        importSuccess = false;
                        } else {
                        console.log('Gracz dodany:', results);

                        // Wysyłamy gracza z powrotem do frontendu
                        const newPlayer = {
                            id_uczestnika: results.insertId,
                            Imie: name,
                            Nazwisko: surrname,
                            Klasa: cl,
                            Punkty: 0,
                            Życia: 3
                        };

                        ws.send(JSON.stringify({
                            action: 'playerAdded',
                            data: newPlayer
                        }));
                        }

                        if (completedQueries === totalQueries) {
                        if (importSuccess) {
                            ws.send(JSON.stringify({
                            action: 'importSuccess',
                            message: 'Gracze zostali zaimportowani'
                            }));
                        } else {
                            ws.send(JSON.stringify({
                            error: 'Wystąpił błąd podczas importowania graczy'
                            }));
                        }
                        }
                    });
                    });

                    break

                    }

                    case 'import':
                        {
                          const questions = data.questions;
                        
                          let totalQueries = questions.length;
                          let completedQueries = 0;
                          let importSuccess = true;
                        
                          questions.forEach((item) => {
                            const { question, correctAnswer, hints, answers } = item;
                        
                            const query = `
                              INSERT INTO pytania 
                              (pytanie, odpowiedz_poprawna, odpowiedz_1, odpowiedz_2, odpowiedz_3, podpowiedz_1, podpowiedz_2, podpowiedz_3) 
                              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
                        
                            db.query(query, [
                              question,
                              correctAnswer,
                              answers[0],
                              answers[1],
                              answers[2],
                              hints[0],
                              hints[1],
                              hints[2]
                            ], (err, results) => {
                              completedQueries++;
                        
                              if (err) {
                                console.error('Błąd zapisu do bazy danych:', err);
                                importSuccess = false;
                              } else {
                                console.log('Pytanie dodane do bazy:', results);
                        
                                // Dynamiczne odesłanie pytania z ID
                                const newQuestion = {
                                  id: results.insertId,
                                  pytanie: question,
                                  odpowiedz_poprawna: correctAnswer,
                                  odpowiedz_1: answers[0],
                                  odpowiedz_2: answers[1],
                                  odpowiedz_3: answers[2],
                                  podpowiedz_1: hints[0],
                                  podpowiedz_2: hints[1],
                                  podpowiedz_3: hints[2]
                                };
                        
                                ws.send(JSON.stringify({
                                  action: 'questionAdded',
                                  data: newQuestion
                                }));
                              }
                        
                              if (completedQueries === totalQueries) {
                                if (importSuccess) {
                                  ws.send(JSON.stringify({
                                    action: 'importSuccess',
                                    message: '✅ Pytania zostały zaimportowane'
                                  }));
                                } else {
                                  ws.send(JSON.stringify({
                                    error: '❌ Wystąpił błąd podczas importowania pytań'
                                  }));
                                }
                              }
                            });
                          });
                        
                          break;
                        }
                        
                case 'reset':
                {
                    const { base } = data;

                    const allowedTables = ['uczestnicy', 'pytania']; // dodaj, co trzeba

                    if (!allowedTables.includes(base)) {
                        ws.send(JSON.stringify({ message: '❌ Nieprawidłowa nazwa tabeli' }));
                        return;
                    }

                    const query = `DELETE FROM ${base}`;
                    db.query(query, (err, results) => {
                        if (err) {
                        console.error('Błąd przy resetowaniu bazy danych:', err);
                        ws.send(JSON.stringify({ message: '❌ Błąd przy resetowaniu bazy danych' }));
                        } else {
                        console.log('Baza danych została zresetowana!', results);
                        ws.send(JSON.stringify({ message: '✅ Baza danych została zresetowana!' }));
                        }
                    });

                    break;
                }
                case 'getQuestions':
                    {
                        const query = 'SELECT * FROM pytania left join etapy_pytan etapy on pytania.id = etapy.id_pytania';
                        db.query(query, (err, results) => {
                            if (err) {
                                console.error('❌ Błąd pobierania pytań:', err);
                                ws.send(JSON.stringify({ error: 'Błąd pobierania pytań' }));
                                return;
                            }
                            console.log('📜 Pytania pobrane z bazy:', results);
                            ws.send(JSON.stringify({ action: 'showQuestions', questions: results }));
                        });
                        break;
                    }
                case 'getPools':
                    {
                        const query = 'SELECT * FROM pula';
                        db.query(query,(err,results)=>{
                            if (err) {
                                console.error('❌ Błąd pobierania pytań:', err);
                                ws.send(JSON.stringify({ error: 'Błąd pobierania pytań' }));
                                return;
                            }
                            console.log('📜 Pule pobrane z bazy:', results);
                            ws.send(JSON.stringify({ action: 'showPools', pools: results }));
                        });
                        break;
                    }
                    case 'deletePool':
                        {
                            const { id } = data;
                        
                            // Sprawdzamy, czy ID jest dostępne
                            if (!id) {
                                ws.send(JSON.stringify({ error: 'Brak ID puli do usunięcia' }));
                                return;
                            }
                        
                            // Logowanie ID przed zapytaniem SQL
                            console.log(`Usuwanie puli o ID: ${id}`);
                        
                            // Sprawdź, czy ID jest liczbą (można to dopasować do struktury danych w bazie)
                            if (isNaN(id)) {
                                ws.send(JSON.stringify({ error: 'Nieprawidłowe ID' }));
                                return;
                            }
                        
                            // Rozpoczynamy transakcję
                            db.beginTransaction((err) => {
                                if (err) {
                                    console.error('❌ Błąd transakcji:', err);
                                    ws.send(JSON.stringify({ error: 'Błąd serwera' }));
                                    return;
                                }
                        
                                // Krok 1: Usuwamy powiązane rekordy z tabeli etapy_pytan
                                db.query('DELETE FROM etapy_pytan WHERE id_puli = ?', [id], (err) => {
                                    if (err) {
                                        console.error('❌ Błąd przy usuwaniu pytań z etapów:', err);
                                        db.rollback(() => {
                                            ws.send(JSON.stringify({ error: 'Błąd przy usuwaniu pytań z etapów' }));
                                        });
                                        return;
                                    }
                        
                                    // Krok 2: Usuwamy rekordy z tabeli pula
                                    db.query('DELETE FROM pula WHERE id = ?', [id], (err, result) => {
                                        if (err) {
                                            console.error('❌ Błąd usuwania puli:', err);
                                            db.rollback(() => {
                                                ws.send(JSON.stringify({ error: 'Błąd serwera' }));
                                            });
                                            return;
                                        }
                        
                                        // Logowanie wyniku zapytania
                                        console.log(`🗑️ Pula pytań o ID ${id} została usunięta`, result);
                        
                                        // Krok 3: Wysłanie zaktualizowanej listy pul po usunięciu
                                        db.query('SELECT * FROM pula', (err, results) => {
                                            if (err) {
                                                console.error('❌ Błąd pobierania pul po usunięciu:', err);
                                                db.rollback(() => {
                                                    ws.send(JSON.stringify({ error: 'Błąd pobierania pul' }));
                                                });
                                                return;
                                            }
                        
                                            // Wysłanie danych do wszystkich połączonych klientów
                                            wss.clients.forEach(client => {
                                                if (client.readyState === WebSocket.OPEN) {
                                                    client.send(JSON.stringify({ action: 'showPools', pools: results }));
                                                }
                                            });
                        
                                            // Zatwierdzenie transakcji
                                            db.commit((err) => {
                                                if (err) {
                                                    console.error('❌ Błąd commitowania transakcji:', err);
                                                    db.rollback(() => {
                                                        ws.send(JSON.stringify({ error: 'Błąd przy zatwierdzaniu zmian' }));
                                                    });
                                                    return;
                                                }
                                                console.log(`✅ Pula o ID ${id} została usunięta wraz z powiązanymi pytaniami`);
                                                ws.send(JSON.stringify({ action: 'deleteSuccess', message: 'Pula i pytania zostały usunięte' }));
                                            });
                                        });
                                    });
                                });
                            });
                            break;
                        }
                        
                    case 'addPool':
                        {
                            const { name } = data;
                            if (!name || name.trim() === '') {
                                ws.send(JSON.stringify({ error: 'Nazwa puli jest wymagana!' }));
                                return;
                            }

                            const query = 'INSERT INTO pula (nazwa) VALUES (?)';
                            db.query(query, [name], (err, result) => {
                                if (err) {
                                    console.error('❌ Błąd dodawania puli:', err);
                                    ws.send(JSON.stringify({ error: 'Błąd serwera' }));
                                    return;
                                }

                                console.log(`✅ Pula pytań "${name}" została dodana`);

                                // Pobierz zaktualizowaną listę pul i wyślij do wszystkich klientów
                                db.query('SELECT * FROM pula', (err, results) => {
                                    if (err) {
                                        console.error('❌ Błąd pobierania pul po dodaniu:', err);
                                        return;
                                    }
                                    wss.clients.forEach(client => {
                                        if (client.readyState === WebSocket.OPEN) {
                                            client.send(JSON.stringify({ action: 'showPools', pools: results }));
                                        }
                                    });
                                });
                            });
                            break;
                        }
                       case 'updatePoolQuestions': {
                        const { selectedQuestions, poolId, stage } = data;
                        console.log('Etap:', stage);

                        if (!poolId || !Array.isArray(selectedQuestions)) {
                            ws.send(JSON.stringify({ error: 'Brak danych' }));
                            return;
                        }

                        db.beginTransaction(async (err) => {
                            if (err) {
                                console.error('❌ Błąd transakcji:', err);
                                ws.send(JSON.stringify({ error: 'Błąd serwera' }));
                                return;
                            }

                            try {
                                // 🔁 Krok 1: Usuń WSZYSTKIE przypisania do tego etapu i puli
                                await new Promise((resolve, reject) => {
                                    db.query(
                                        'DELETE FROM etapy_pytan WHERE id_puli = ? AND etap = ?',
                                        [poolId, stage],
                                        (err) => {
                                            if (err) return reject(err);
                                            resolve();
                                        }
                                    );
                                });

                                // 🆕 Krok 2: Dodaj nowe pytania (bez duplikatów – usunięte wcześniej)
                                for (const questionId of selectedQuestions) {
                                    await new Promise((resolve, reject) => {
                                        db.query(
                                            'INSERT INTO etapy_pytan (etap, id_pytania, id_puli) VALUES (?, ?, ?)',
                                            [stage, questionId, poolId],
                                            (err) => {
                                                if (err) return reject(err);
                                                resolve();
                                            }
                                        );
                                    });
                                }

                                // ✅ Zatwierdź transakcję
                                db.commit((err) => {
                                    if (err) {
                                        console.error('❌ Błąd commitowania transakcji:', err);
                                        return db.rollback(() => {
                                            ws.send(JSON.stringify({ error: 'Błąd przy zatwierdzaniu zmian' }));
                                        });
                                    }

                                    console.log(`✅ Pytania zostały nadpisane dla puli ${poolId} na etapie ${stage}`);
                                    ws.send(JSON.stringify({ action: 'updateSuccess', message: 'Pytania zaktualizowane' }));
                                });

                            } catch (error) {
                                console.error('❌ Błąd podczas aktualizacji pytań:', error);
                                db.rollback(() => {
                                    ws.send(JSON.stringify({ error: 'Wystąpił błąd podczas aktualizacji pytań' }));
                                });
                            }
                        });

                        break;
                    }

                        case 'createGame':
                            {
                                const { gameName, poolId } = data;
                        
                                // Sprawdzamy, czy wszystkie dane są poprawne
                                if (!gameName || !poolId) {
                                    ws.send(JSON.stringify({ success: false, error: 'Brak nazwy gry lub ID puli' }));
                                    return;
                                }
                        
                                console.log(`🆕 Tworzenie gry: ${gameName}, ID Puli: ${poolId}`);
                        
                                // Zapytanie SQL do dodania gry do bazy danych
                                const query = 'INSERT INTO gry (nazwa_gry, id_puli) VALUES (?, ?)';
                                db.query(query, [gameName, poolId], (err, result) => {
                                    if (err) {
                                        console.error('❌ Błąd przy dodawaniu gry do bazy:', err);
                                        ws.send(JSON.stringify({ success: false, error: 'Błąd serwera podczas dodawania gry' }));
                                        return;
                                    }
                        
                                    console.log(`✅ Gra "${gameName}" została dodana do bazy (ID: ${result.insertId})`);
                        
                                    // Odpowiedź do klienta
                                    ws.send(JSON.stringify({ success: true, action: 'gameCreated', gameId: result.insertId, gameName }));
                        
                                    // Powiadomienie innych klientów o nowej grze
                                    wss.clients.forEach(client => {
                                        if (client.readyState === WebSocket.OPEN) {
                                            client.send(JSON.stringify({ action: 'newGameAvailable', gameId: result.insertId, gameName }));
                                        }
                                    });
                                });
                            }
                            break;
                        case 'getGames':
                            {
                                const query = 'SELECT nazwa_gry,p.nazwa,id_puli FROM gry left join pula p on gry.id_puli = p.id';
                                db.query(query, (err, results) => {
                                    if (err) {
                                        console.error('❌ Błąd pobierania gier:', err);
                                        ws.send(JSON.stringify({ error: 'Błąd pobierania gier' }));
                                        return;
                                    }
                                    console.log('📜 Gry pobrane z bazy:', results);
                                    ws.send(JSON.stringify({ action: 'showGames', games: results }));
                                });
                                break;
                            }
                            case 'deleteGame': {
                                const { gameId } = data;
                            
                                if (!gameId) {
                                    ws.send(JSON.stringify({ action: 'deleteError', message: 'Brak ID gry' }));
                                    return;
                                }
                            
                                const query = 'DELETE FROM gry WHERE id = ?';
                            
                                db.query(query, [gameId], (err, result) => {
                                    if (err) {
                                        console.error('❌ Błąd usuwania gry:', err);
                                        ws.send(JSON.stringify({ action: 'deleteError', message: 'Błąd serwera' }));
                                        return;
                                    }
                            
                                    if (result.affectedRows > 0) {
                                        console.log(`🗑️ Gra o ID ${gameId} została usunięta`);
                            
                                        // Wysyłamy do WSZYSTKICH klientów info o usunięciu
                                        wss.clients.forEach(client => {
                                            if (client.readyState === WebSocket.OPEN) {
                                                client.send(JSON.stringify({ action: 'gameDeleted', gameId }));
                                            }
                                        });
                                    }
                                });
                            
                                break;
                            }
                            case 'resetHealth': {
                                // Zapytanie SQL, które ustawia życie wszystkich graczy na 3
                                const query = 'UPDATE uczestnicy SET Życia = 3';
                            
                                db.query(query, (err, result) => {
                                    if (err) {
                                        console.error('Błąd podczas resetowania życia:', err);
                                        ws.send(JSON.stringify({ error: 'Błąd resetowania życia' }));
                                        return;
                                    }
                            
                                    console.log('Życie wszystkich graczy zostało zresetowane do 3');
                                    
                                    // Po udanej operacji, wyślij odpowiedź do klienta
                                    ws.send(JSON.stringify({ action: 'healthResetSuccess', message: 'Życie wszystkich graczy zostało zresetowane do 3' }));
                            
                                    // Opcjonalnie: Po zresetowaniu życia, możesz wysłać zaktualizowaną listę graczy do wszystkich klientów
                                    db.query('SELECT * FROM uczestnicy', (err, results) => {
                                        if (err) {
                                            console.error('Błąd pobierania graczy po resecie życia:', err);
                                            return;
                                        }
                            
                                        // Przekaż zaktualizowaną listę graczy do wszystkich połączonych klientów
                                        wss.clients.forEach(client => {
                                            if (client.readyState === WebSocket.OPEN) {
                                                client.send(JSON.stringify({ action: 'playersList', data: results }));
                                            }
                                        });
                                    });
                                });
                                break;
                            }
                            case 'resetPoints': 
                            {
                                // Zapytanie SQL, które ustawia punkty wszystkich graczy na 0
                                const query = 'UPDATE uczestnicy SET Punkty = 0';
                            
                                db.query(query, (err, result) => {
                                    if (err) {
                                        console.error('Błąd podczas resetowania punktów:', err);
                                        ws.send(JSON.stringify({ error: 'Błąd resetowania punktów' }));
                                        return;
                                    }
                            
                                    console.log('Punkty wszystkich graczy zostały zresetowane do 0');
                            
                                    // Po udanej operacji, wyślij odpowiedź do klienta
                                    ws.send(JSON.stringify({ action: 'pointsResetSuccess', message: 'Punkty wszystkich graczy zostały zresetowane do 0' }));
                            
                                    // Opcjonalnie: Po zresetowaniu punktów, możesz wysłać zaktualizowaną listę graczy do wszystkich klientów
                                    db.query('SELECT * FROM uczestnicy', (err, results) => {
                                        if (err) {
                                            console.error('Błąd pobierania graczy po resecie punktów:', err);
                                            return;
                                        }
                            
                                        // Przekaż zaktualizowaną listę graczy do wszystkich połączonych klientów
                                        wss.clients.forEach(client => {
                                            if (client.readyState === WebSocket.OPEN) {
                                                client.send(JSON.stringify({ action: 'playersList', data: results }));
                                            }
                                        });
                                    });
                                });
                                break;
                            }
                            case 'adjustHealth': {
                                const { playerId } = data;
                            
                                // Sprawdzamy, czy playerId jest poprawne
                                if (!playerId || isNaN(playerId) || playerId <= 0) {
                                    ws.send(JSON.stringify({ error: 'Nieprawidłowy identyfikator gracza' }));
                                    return;
                                }
                            
                                // Zapytanie SQL - pobieramy aktualne życie gracza
                                const getPlayerQuery = 'SELECT Życia FROM uczestnicy WHERE id_uczestnika = ?';
                                db.query(getPlayerQuery, [playerId], (err, results) => {
                                    if (err) {
                                        console.error('Błąd pobierania danych gracza:', err);
                                        ws.send(JSON.stringify({ error: 'Błąd pobierania danych gracza' }));
                                        return;
                                    }
                            
                                    if (results.length === 0) {
                                        ws.send(JSON.stringify({ error: 'Gracz nie znaleziony' }));
                                        return;
                                    }
                            
                                    // Zmniejszamy życie gracza o 1
                                    const currentHealth = results[0].Życia;
                                    const newHealth = currentHealth - 1;
                            
                                    // Zapytanie SQL - aktualizujemy życie gracza
                                    const updateQuery = 'UPDATE uczestnicy SET Życia = ? WHERE id_uczestnika = ?';
                                    db.query(updateQuery, [newHealth, playerId], (err, results) => {
                                        if (err) {
                                            console.error('Błąd zmiany zdrowia:', err);
                                            ws.send(JSON.stringify({ error: 'Błąd zmiany zdrowia gracza' }));
                                            return;
                                        }
                            
                                        if (results.affectedRows === 0) {
                                            ws.send(JSON.stringify({ error: 'Gracz nie znaleziony' }));
                                            return;
                                        }
                            
                                        // Wysyłamy potwierdzenie o powodzeniu zmiany zdrowia
                                        ws.send(JSON.stringify({ action: 'healthAdjusted', message: 'Zmiana zdrowia gracza zakończona pomyślnie' }));
                            
                                        // Po zmianie zdrowia, pobieramy zaktualizowaną listę graczy
                                        db.query('SELECT * FROM uczestnicy', (err, results) => {
                                            if (err) {
                                                console.error('Błąd pobierania graczy po zmianie zdrowia:', err);
                                                return;
                                            }
                            
                                            // Wysyłamy zaktualizowaną listę graczy do wszystkich połączonych klientów
                                            wss.clients.forEach(client => {
                                                if (client.readyState === WebSocket.OPEN) {
                                                    client.send(JSON.stringify({ action: 'playersList', data: results }));
                                                }
                                            });
                                        });
                                    });
                                });
                                break;
                            }
                            case 'adjustPoints': {
                                const { playerId } = data;
                            
                                // Sprawdzamy, czy playerId jest poprawne
                                if (!playerId || isNaN(playerId) || playerId <= 0) {
                                    ws.send(JSON.stringify({ error: 'Nieprawidłowy identyfikator gracza' }));
                                    return;
                                }
                            
                                // Zapytanie SQL - pobieramy aktualne punkty gracza
                                const getPlayerQuery = 'SELECT Punkty FROM uczestnicy WHERE id_uczestnika = ?';
                                db.query(getPlayerQuery, [playerId], (err, results) => {
                                    if (err) {
                                        console.error('Błąd pobierania danych gracza:', err);
                                        ws.send(JSON.stringify({ error: 'Błąd pobierania danych gracza' }));
                                        return;
                                    }
                            
                                    if (results.length === 0) {
                                        ws.send(JSON.stringify({ error: 'Gracz nie znaleziony' }));
                                        return;
                                    }
                            
                                    // Zwiększamy punkty gracza o 1
                                    const currentPoints = results[0].Punkty;
                                    const newPoints = currentPoints + 1;
                            
                                    // Zapytanie SQL - aktualizujemy punkty gracza
                                    const updateQuery = 'UPDATE uczestnicy SET Punkty = ? WHERE id_uczestnika = ?';
                                    db.query(updateQuery, [newPoints, playerId], (err, results) => {
                                        if (err) {
                                            console.error('Błąd zmiany punktów:', err);
                                            ws.send(JSON.stringify({ error: 'Błąd zmiany punktów gracza' }));
                                            return;
                                        }
                            
                                        if (results.affectedRows === 0) {
                                            ws.send(JSON.stringify({ error: 'Gracz nie znaleziony' }));
                                            return;
                                        }
                            
                                        // Wysyłamy potwierdzenie o powodzeniu zmiany punktów
                                        ws.send(JSON.stringify({ action: 'pointsAdjusted', message: 'Zmiana punktów gracza zakończona pomyślnie' }));
                            
                                        // Po zmianie punktów, pobieramy zaktualizowaną listę graczy
                                        db.query('SELECT * FROM uczestnicy', (err, results) => {
                                            if (err) {
                                                console.error('Błąd pobierania graczy po zmianie punktów:', err);
                                                return;
                                            }
                            
                                            // Wysyłamy zaktualizowaną listę graczy do wszystkich połączonych klientów
                                            wss.clients.forEach(client => {
                                                if (client.readyState === WebSocket.OPEN) {
                                                    client.send(JSON.stringify({ action: 'playersList', data: results }));
                                                }
                                            });
                                        });
                                    });
                                });
                                break;
                            } 
                            case 'chooseWinner': 
                                {
                                const query = 'SELECT * FROM uczestnicy ORDER BY Punkty DESC LIMIT 1';

                                db.query(query, (err, result) => {
                                    if (err) {
                                    console.error('❌ Błąd pobierania wygranego:', err);
                                    ws.send(JSON.stringify({ action: 'error', message: 'Błąd pobierania wygranego' }));
                                    return;
                                    }

                                    if (!result || result.length === 0) {
                                    ws.send(JSON.stringify({ action: 'showWinner', Winner: null }));
                                    return;
                                    }

                                    const winner = result[0];
                                    console.log('🏆 Wygrany to:', winner);

                                    ws.send(JSON.stringify({ action: 'showWinner', Winner: winner }));
                                });

                                break;
                                }

                                                                                
        }
    });

    ws.on('close', () => {
        console.log('Połączenie WebSocket zostało zamknięte');
    });

    ws.on('error', (err) => {
        console.error('Błąd WebSocket:', err);
    });
});

