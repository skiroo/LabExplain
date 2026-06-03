CONVENTION DE COMMIT - PROJET LABEXPLAIN
========================================


Structure générale
------------------
type(scope): message court

Exemple :
feat(api): ajout de la route de génération de résumé


Types de commit
----------------

feat
Nouvelle fonctionnalité

fix
Correction de bug

docs
Documentation

style
Modification visuelle / UI / CSS

refactor
Réorganisation du code sans nouvelle fonctionnalité

test
Ajout ou modification de tests

chore
Configuration, dépendances, Git, Docker, etc.


Scopes utilisés dans le projet
-------------------------------

api
Backend / API

frontend
Interface utilisateur

nlp
Intelligence artificielle / NLP

db
Base de données

ui
UX / UI

cdc
Cahier des charges

security
Sécurité / RGPD

infra
Déploiement / infrastructure


Exemples de commits
-------------------

feat(frontend): ajout du sélecteur de langue
feat(nlp): génération automatique des questions médecin
fix(api): correction de l’envoi des données patient
docs(cdc): ajout des contraintes RGPD
style(ui): amélioration accessibilité dyslexie
refactor(db): optimisation du stockage des prescriptions


Règles à respecter
------------------

- Utiliser le présent
- Faire des messages courts et précis
- Un commit = une modification logique
- Éviter les messages vagues comme :
  - update
  - test
  - correction
  - final version