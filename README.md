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

## 📦 Instalacja

## 📡 WebSocket
Połączenia WebSocket umożliwiają:

	natychmiastową aktualizację danych graczy,

	reakcję na działania administracji (dodanie/usunięcie gracza, zmiana punktów/życia),

	synchronizację pytań i przebiegu gry w czasie rzeczywistym.

---

### 1. Wymagania wstępne

- [Node.js](https://nodejs.org/) (zalecana wersja 16.x lub wyższa)
- npm (instalowany razem z Node.js)
- [XAMPP](https://www.apachefriends.org/pl/index.html) lub inny serwer MySQL
- Git

### 2. Przygotowanie bazy danych

1. Uruchom XAMPP i włącz `Apache` oraz `MySQL`.
2. Otwórz [phpMyAdmin](http://localhost/phpmyadmin).
3. Zaimportuj plik `JzD.sql` znajdujący się w katalogu projektu.
4. Upewnij się, że baza danych została poprawnie utworzona.

### 3. Klonowanie repozytorium

```bash
git clone https://github.com/IgorPedz/JedenzDiesieciu.git
cd JedenzDiesieciu
# Instalacja zależności głównych
npm install
# Uruchomienie serwera
cd server
node server.js
# Uruchomienie aplikacji react
cd src
npm start
```
### 🗂️ Struktura projektu

JedenzDiesieciu/
├── server/             # Backend Node.js + WebSocket
│   └── server.js       # Główny plik serwera
├── src/                # Aplikacja React
│   ├── components/     # Komponenty React
│   └── App.js          # Główny komponent aplikacji
├── JzD.sql             # Plik SQL do utworzenia bazy danych
└── README.md           # Dokumentacja projektu
