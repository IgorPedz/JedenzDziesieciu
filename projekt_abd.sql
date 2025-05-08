-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Maj 09, 2025 at 12:03 AM
-- Wersja serwera: 10.4.32-MariaDB
-- Wersja PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `projekt_abd`
--

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `etapy_pytan`
--

CREATE TABLE `etapy_pytan` (
  `etap` varchar(11) NOT NULL,
  `id_pytania` int(11) NOT NULL,
  `id_puli` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `etapy_pytan`
--

INSERT INTO `etapy_pytan` (`etap`, `id_pytania`, `id_puli`) VALUES
('Etap 3', 1, 3),
('Etap 2', 1, 1);

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `gry`
--

CREATE TABLE `gry` (
  `nazwa_gry` varchar(100) NOT NULL,
  `id_puli` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `gry`
--

INSERT INTO `gry` (`nazwa_gry`, `id_puli`) VALUES
('test', 1),
('t', 3);

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `pula`
--

CREATE TABLE `pula` (
  `id` int(11) NOT NULL,
  `nazwa` varchar(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pula`
--

INSERT INTO `pula` (`id`, `nazwa`) VALUES
(1, '0'),
(3, 'nowa'),
(4, 'te');

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `pytania`
--

CREATE TABLE `pytania` (
  `id` int(11) NOT NULL,
  `pytanie` varchar(255) NOT NULL,
  `odpowiedz_poprawna` varchar(255) NOT NULL,
  `odpowiedz_1` varchar(255) NOT NULL,
  `odpowiedz_2` varchar(255) NOT NULL,
  `odpowiedz_3` varchar(255) NOT NULL,
  `podpowiedz_1` varchar(255) NOT NULL,
  `podpowiedz_2` varchar(255) NOT NULL,
  `podpowiedz_3` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pytania`
--

INSERT INTO `pytania` (`id`, `pytanie`, `odpowiedz_poprawna`, `odpowiedz_1`, `odpowiedz_2`, `odpowiedz_3`, `podpowiedz_1`, `podpowiedz_2`, `podpowiedz_3`) VALUES
(1, 'test', 'test', 'test', 'test', 'test', 'test', 'test', 'test'),
(2, 'pyt', 'op', 'o1', 'o2', 'o3', 'p1', 'p2', 'p3');

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `uczestnicy`
--

CREATE TABLE `uczestnicy` (
  `id_uczestnika` int(11) NOT NULL,
  `Imie` varchar(50) NOT NULL,
  `Nazwisko` varchar(50) NOT NULL,
  `Klasa` varchar(2) NOT NULL,
  `Punkty` int(11) NOT NULL DEFAULT 0,
  `Życia` int(11) NOT NULL DEFAULT 3
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `uczestnicy`
--

INSERT INTO `uczestnicy` (`id_uczestnika`, `Imie`, `Nazwisko`, `Klasa`, `Punkty`, `Życia`) VALUES
(59, 't', 't', '2p', 0, 3),
(60, 't', 't', '3p', 0, 3);

--
-- Wyzwalacze `uczestnicy`
--
DELIMITER $$
CREATE TRIGGER `limit_records` BEFORE INSERT ON `uczestnicy` FOR EACH ROW BEGIN
    DECLARE liczba INT;
    SELECT COUNT(*) INTO liczba FROM uczestnicy;
    IF liczba >= 10 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Maksymalna liczba rekordów osiągnięta';
    END IF;
END
$$
DELIMITER ;

--
-- Indeksy dla zrzutów tabel
--

--
-- Indeksy dla tabeli `pula`
--
ALTER TABLE `pula`
  ADD PRIMARY KEY (`id`);

--
-- Indeksy dla tabeli `pytania`
--
ALTER TABLE `pytania`
  ADD PRIMARY KEY (`id`);

--
-- Indeksy dla tabeli `uczestnicy`
--
ALTER TABLE `uczestnicy`
  ADD PRIMARY KEY (`id_uczestnika`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `pula`
--
ALTER TABLE `pula`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `pytania`
--
ALTER TABLE `pytania`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `uczestnicy`
--
ALTER TABLE `uczestnicy`
  MODIFY `id_uczestnika` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=61;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
