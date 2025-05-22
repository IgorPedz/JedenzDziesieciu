# Jeden z Dziesięciu – Gra z WebSocket

Aplikacja do tworzenia i zarządzania grami w stylu teleturnieju **"Jeden z Dziesięciu"**, w której gracze mogą brać udział w czasie rzeczywistym dzięki komunikacji WebSocket.

## 🔧 Funkcjonalności

- 🎮 Tworzenie gier z wybraną pulą pytań.
- 👥 Zarządzanie graczami (dodawanie, usuwanie, podgląd).
- 📊 Modyfikacja punktów i życia każdego gracza.
- 🔌 WebSocket do komunikacji w czasie rzeczywistym.
- 🖥️ Panel administracyjny do kontrolowania przebiegu gry.

---

## 🧰 Technologie

- **Frontend:** React (JavaScript)
- **Backend:** Node.js + WebSocket
- **Baza danych:** MySQL (XAMPP / phpMyAdmin)

---

## 📡 WebSocket
Połączenia WebSocket umożliwiają:

- Natychmiastową aktualizację danych graczy,

- Reakcję na działania administracji (dodanie/usunięcie gracza, zmiana punktów/życia),

- Synchronizację pytań i przebiegu gry w czasie rzeczywistym.

---

## 📦 Instalacja

### 1. Wymagania wstępne

- [Node.js](https://nodejs.org/) (zalecana wersja 16.x lub wyższa)
- npm (instalowany razem z Node.js)
- [XAMPP](https://www.apachefriends.org/pl/index.html) lub inny serwer MySQL
- Git

### 2. Przygotowanie bazy danych

1. Uruchom XAMPP i włącz `Apache` oraz `MySQL`.
2. Otwórz [phpMyAdmin](http://localhost/phpmyadmin).
3. Zaimportuj plik `projekt_abd.sql` znajdujący się w katalogu projektu.
4. Upewnij się, że baza danych została poprawnie utworzona.

### 3. Klonowanie repozytorium


- Pierwsza konsola (cmd)
```bash
git clone https://github.com/IgorPedz/JedenzDziesieciu.git
cd JedenzDziesieciu
# Instalacja zależności głównych
npm install
# Uruchomienie serwera
cd server
node server.js
```

- Druga konsola (cmd)
```bash
# Uruchomienie aplikacji react
cd JedenzDziesieciu/src
npm start
```
### 🗂️ Struktura projektu

JedenzDiesieciu/
├── server/             # Backend Node.js + WebSocket<br>
│   └── server.js       # Główny plik serwera<br>
├── src/                # Aplikacja React<br>
│   ├── components/     # Komponenty React<br> 
│   └── App.js          # Główny komponent aplikacji<br>  
├── projekt_abd.sql             # Plik SQL do utworzenia bazy danych<br>  
└── README.md           # Dokumentacja projektu<br>  
