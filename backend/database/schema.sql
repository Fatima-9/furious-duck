CREATE TABLE IF NOT EXISTS roles (
  id_role SERIAL PRIMARY KEY,
  libelle VARCHAR(100) NOT NULL,
  statut VARCHAR(50) NOT NULL DEFAULT 'actif'
);

CREATE TABLE IF NOT EXISTS boutiques (
  id_boutique SERIAL PRIMARY KEY,
  nom VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  adresse VARCHAR(255),
  code_postal VARCHAR(20),
  ville VARCHAR(100),
  pays VARCHAR(100),
  statut VARCHAR(50) NOT NULL DEFAULT 'actif'
);

CREATE TABLE IF NOT EXISTS utilisateurs (
  id_user SERIAL PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  mot_de_passe VARCHAR(255) NOT NULL,
  date_de_naissance DATE,
  sexe VARCHAR(50),
  type_inscription VARCHAR(50),
  date_inscription TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  statut VARCHAR(50) NOT NULL DEFAULT 'actif',
  role_id INTEGER NOT NULL REFERENCES roles(id_role),
  boutique_id INTEGER NOT NULL REFERENCES boutiques(id_boutique)
);

CREATE TABLE IF NOT EXISTS campagnes (
  id_campagne SERIAL PRIMARY KEY,
  nom VARCHAR(150) NOT NULL,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  date_fin_reclamation DATE,
  nombre_tickets_max INTEGER NOT NULL,
  statut VARCHAR(50) NOT NULL DEFAULT 'actif'
);

CREATE TABLE IF NOT EXISTS gains (
  id_gain SERIAL PRIMARY KEY,
  libelle VARCHAR(150) NOT NULL,
  pourcentage_distribution NUMERIC(5, 2) NOT NULL,
  quantite_total INTEGER NOT NULL,
  quantite_restante INTEGER NOT NULL,
  statut VARCHAR(50) NOT NULL DEFAULT 'actif'
);

CREATE TABLE IF NOT EXISTS tickets (
  id_ticket SERIAL PRIMARY KEY,
  code_ticket VARCHAR(100) NOT NULL UNIQUE,
  date_generation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  date_utilisation TIMESTAMP,
  remis BOOLEAN NOT NULL DEFAULT false,
  date_remise TIMESTAMP,
  statut VARCHAR(50) NOT NULL DEFAULT 'actif',
  gain_id INTEGER NOT NULL REFERENCES gains(id_gain),
  utilisateur_id INTEGER REFERENCES utilisateurs(id_user),
  campagne_id INTEGER NOT NULL REFERENCES campagnes(id_campagne)
);

CREATE INDEX IF NOT EXISTS idx_utilisateurs_role_id ON utilisateurs(role_id);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_boutique_id ON utilisateurs(boutique_id);
CREATE INDEX IF NOT EXISTS idx_tickets_gain_id ON tickets(gain_id);
CREATE INDEX IF NOT EXISTS idx_tickets_utilisateur_id ON tickets(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_tickets_campagne_id ON tickets(campagne_id);
