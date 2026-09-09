# Présenter un dépôt Git

La skill `repo-presentation` transforme « analyse et présente ce dépôt » en un deck complet puis une URL consultable. Le CLI sépare la collecte déterministe des preuves, l’analyse par le LLM, la compilation et la validation du rendu.

```sh
# Un seul parcours, auteur Codex configuré sur cette machine
gamma-slides repo-present --repo owner/repository --port 4173
# Ou un dépôt local : analyse du commit HEAD, pas des modifications non committées
gamma-slides repo-present --local /chemin/du/repo --port 4173
```

Le mode autonome appelle `codex exec` avec le compte et le modèle configurés dans Codex. Chrome/Chromium est nécessaire aux contrôles navigateur (`PUPPETEER_EXECUTABLE_PATH` si nécessaire). `GITHUB_TOKEN` peut fournir l’accès GitHub privé ou augmenter les quotas ; il n’est pas écrit dans le dossier. Les fichiers lus restent des entrées non fiables, pas des instructions à exécuter.

Dans une conversation avec le LLM, la skill fait travailler **le LLM courant** : `repo-brief` → lecture des sources → écriture du YAML → `repo-present --deck`. Il n’est alors pas nécessaire d’appeler un deuxième agent.

```sh
gamma-slides repo-brief --repo owner/repository -o output/revue/brief.json
# Le LLM écrit output/revue/deck.yaml à partir de ce dossier.
gamma-slides repo-present --repo owner/repository --ref <SHA-du-dossier> \
  --deck output/revue/deck.yaml -o output/revue --port 4173
```

Le deck comporte `meta.repository_review` avec `repository`, `revision` (SHA complet) et `collected_at`. Le CLI refuse une source liée à une autre révision ou à un autre dépôt, moins de 18 slides, des slides sans provenance et l’absence d’architecture + workflow/séquence. La collecte est bornée à 24 fichiers pertinents, chaque extrait à 16 000 caractères. L’analyse de sécurité, de marché ou de production n’est pas déduite automatiquement d’une arborescence : le LLM lit les preuves manquantes et marque les inconnues.

## Sorties et preuve de travail

- `author/repository-brief.json` : révision, inventaire, statistiques datées, extraits et limites de collecte. Hors serveur.
- `deck.yaml` : source éditable, hors serveur.
- `site/index.html` : présentation autonome, servie en loopback.
- `site/proof.json` : révision, hashes du HTML/deck, provenance des fichiers et résultats des contrôles.
- `qa/report.json` et captures : chaque slide dans les trois thèmes, en desktop 1440×900 et mobile 390×844 DPR2, avec continuations mobiles. Le contrôle utilise un vrai serveur HTTP.

Les checks vérifient chargement des images, débordements, erreurs JavaScript, contraste du texte avec composition des transparences, montage/démontage des viewers et, pour chaque diagramme en Signal Room, progression du parcours, pause et sélection via M → Explorer. Ils ne remplacent pas l’examen visuel des captures, une validation des affirmations ni un audit sécurité. Un échec laisse le site précédent intact : construction et QA ont lieu dans un nouveau répertoire, puis le lien `site` bascule atomiquement. Les générations précédentes restent dans `builds/`.

Pour construire sans serveur : `--build-only`. Pour relancer : `gamma-slides serve -d output/revue/site --port 4173`. Le serveur ne livre que la présentation et son reçu ; il n’expose ni le dépôt ni les extraits de sources. Une dépendance média relative non embarquée échoue lors du contrôle HTTP.

## Commandes et terminal local

Le bouton rond **M** ouvre cinq branches : Explorer, Plein écran, Terminal, Apparence et Studio. Survoler avec la souris ou cliquer ; sur téléphone, toucher M. Au clavier, Tab atteint le bouton, Entrée/Espace ouvre, les flèches parcourent les branches et Échap ferme. Explorer regroupe les contrôles natifs de la slide : parcours, composant, zoom, vues 2D/3D ou données. Les légendes et valeurs restent lisibles sur la slide ; glissement et manipulation directe des scènes restent disponibles. Sur téléphone, M reste au-dessus de la barre de continuation.

Pour un shell local, démarrer explicitement avec `--terminal` :

```sh
gamma-slides repo-present --local /chemin/du/repo --terminal --port 4173
# Ou servir les mêmes octets HTML déjà vérifiés :
gamma-slides serve --directory output/revue/site --terminal --port 4173
```

M → Terminal ouvre la console. Le shell part du répertoire courant du serveur ; `cd` persiste pour les commandes suivantes. Le serveur écoute sur `127.0.0.1` et vérifie Host, Origin et le jeton de session. La découverte du bridge se fait par handshake sans modifier le HTML vérifié. Sans `--terminal`, dans un fichier local ou sur Pages, la console conserve les commandes de présentation (`next`, `prev`, `go 12`, `overview`) sans shell distant.

## GitHub Pages

```sh
gamma-slides repo-present --repo owner/source --ref <SHA> --deck output/revue/deck.yaml \
  -o output/revue --publish owner/pages-repo --slug revue-source
```

`gh auth` doit donner accès au dépôt cible, déjà initialisé avec un commit. Choisir un dépôt Pages dédié : une configuration Actions ou une publication Jekyll existante est refusée avant mutation. Les autres fichiers d’une branche statique `gh-pages` sont préservés ; aucune mise à jour forcée. Le CLI publie les **octets HTML déjà contrôlés**, puis vérifie les hashes distants du HTML et du reçu. Après expiration du délai, il annonce le commit et une disponibilité non confirmée, sans annoncer de déploiement validé. Les sources ne sont pas publiées par cette commande, mais le texte du deck et les chemins de provenance peuvent être internes : choisir une destination autorisée.

## Diagrammes Archify

`layout: diagram` contient `diagram: {type, spec}`. Types : architecture, workflow, sequence, dataflow, lifecycle. `spec` est le JSON typé natif d’Archify, conservé éditable dans le YAML. Les schémas upstream et commun sont exposés par `gamma_archify_schema`. `meta.quality_profile: showcase` et `meta.animation: trace` activent les contrôles et les parcours finis ; nommer les vues dans `meta.views`.

Le renderer/validateur/viewer réel est intégré sans modification des sources upstream. Version 2.17.0-dev.1, révision `10722002bb8777ecb639d93c49586fae4adf3ae4`, licence MIT ; provenance et notices dans `src/vendor/archify/`. L’adaptateur Gamma ajoute commandes françaises, lecture textuelle, caméra mobile et isolation iframe. Certains libellés internes d’Archify restent anglais. M → Plein écran ouvre le diagramme dans un dialogue plein écran, avec plein écran navigateur si disponible ; Retour ou Échap restaure la slide. Le déplacement conserve le runtime si `moveBefore` est disponible ; sinon le viewer est remonté et la sélection/le parcours et la lecture reprennent. Le sandbox iframe reste opaque et la légende autonome Archify est masquée. Le viewer actif seulement est monté ; impression/export utilisent le SVG statique embarqué. Archify est un moteur SVG animé ; Three.js/PixiJS restent les moteurs GPU des autres visualisations.

## Outils MCP

- `gamma_inspect_repository` : collecte distante ou locale.
- `gamma_archify_schema` : schémas natifs, par type.
- `gamma://guides/repository` : contrat d’analyse et de narration.
- `create_repository_presentation` : prompt de revue technique complète.
- `gamma_validate_deck`, `gamma_generate_deck` : validation stricte Archify et génération.

Le prompt MCP renvoie vers la preuve CLI pour obtenir le serveur local ou les octets publiés. Exemple complet : `presentations/repository-review.yaml`, 21 slides sur Gamma Slides à `e2f9996`. Reconstruction de cet exemple : `node scripts/build-repository-demo.mjs`. Les chiffres GitHub de l’exemple sont datés du 9 septembre 2026 ; les mettre à jour exige une nouvelle collecte et une nouvelle revue.
