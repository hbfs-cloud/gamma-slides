# Produire l’épisode pilote

Le [pilote français](../presentations/youtube-pilot.yaml) suit une seule question : comment passer d’un contenu déclaratif à une vidéo compréhensible ? Ses 20 scènes vont du contrat YAML au rendu HTML, puis de la sortie propre à la revue de prise. Les trois diagrammes sont des gros plans de relations observées dans le code ; ils ne représentent pas toute l’architecture. Les références par scène se trouvent dans `source` et dans les notes.

La narration comporte environ 1 520 mots. Prévoir environ 10 à 12 minutes à débit explicatif ; seule la génération audio ou une prise réelle permet d’en connaître la durée. La voix déclarée est `fr-FR-HenriNeural`, avec un débit de `-5%`. Les réglages YouTube restent privés ; générer le deck ou la vidéo ne constitue pas une publication.

## Générer et présenter

Depuis la racine du dépôt :

```bash
node bin/gamma-slides.js generate -f presentations/youtube-pilot.yaml -o output/youtube-pilot.html
node bin/gamma-slides.js serve -f output/youtube-pilot.html --port 4173 --browser --terminal
```

Le navigateur et le terminal sont facultatifs. Le pilote reste une explication préparée sans eux. Pour filmer une manipulation, préparer une courte action locale, annoncer ce qu’elle doit prouver et choisir explicitement sa diffusion dans Studio. Ne pas transformer la prise en lecture improvisée du dépôt.

L’extrait de commande de la scène 10 est réparti sur plusieurs lignes pour la lecture. La commande exécutable ci-dessus donne les chemins depuis la racine. Le YAML de la scène 4 est un extrait de slide, pas un document complet à copier seul.

## Composition vidéo

Ce pilote utilise la variante `video-story` dans le monde Signal Room existant : fond sombre, accent ambre, Archivo pour les explications et Source Serif 4 pour les deux scènes de début et de fin. Le cadre vidéo de travail fait 1280 × 720, exporté en 1920 × 1080. Les titres ordinaires font 64 px, les messages et les éléments de séquence 52 px, le code 48 px. Le texte secondaire important descend à 40 px. Les références de provenance restent petites : elles sont également disponibles dans les notes et ne portent jamais une étape nécessaire à la compréhension.

La variante `video-closeup` montre deux éléments Archify par scène. Les libellés des nœuds font 22 unités SVG, soit environ 50 px une fois le diagramme ajusté à la largeur du cadre ; l’action entre les nœuds fait 20 unités. C’est une composition dédiée, sans agrandissement global des diagrammes existants. Les textes du SVG statique déclarent explicitement la police JetBrains Mono embarquée pour conserver la même famille que le rendu interactif.

Une image 1280 × 720 affichée à 390 px de largeur est réduite à environ 30,5 %. Un texte de 52 px devient environ 15,8 px. C’est cette réduction qu’il faut regarder pour évaluer la vidéo horizontale sur téléphone. La page responsive du deck est un contrôle distinct : elle réorganise le contenu, alors qu’un fichier vidéo ne le fait pas.

Les preuves de lecture se trouvent dans `output/youtube-review/` après les contrôles : `fixed-player-390.png`, `phone-player.html`, les scènes individuelles et `scene-review.json`. Les légendes de provenance restent volontairement hors du propos indispensable ; les agrandir ne doit pas remplir le cadre au détriment de l’explication.

## Caméra par scène

Chaque scène déclare son intention dans `scene.camera` :

```yaml
scene:
  camera:
    visible: true
    position: br
    width: 0.18
```

Le pilote place la caméra en bas à droite à 18 % de la largeur. Les scènes d’explication réservent la partie droite inférieure : le corps du texte est limité à 880 px, et les sources à 850 px. Les scènes de code, les séquences longues et les gros plans Archify masquent la caméra. Le changement de scène règle sa visibilité et son placement ; il ne doit pas couper le microphone ni demander une nouvelle autorisation de caméra. Activer et choisir le matériel dans Studio avant la prise.

Cette réserve est conçue pour ce pilote en 16:9. Changer la position, dépasser la largeur prévue, augmenter le texte ou enregistrer en vertical demande une nouvelle inspection. Un rectangle synthétique peut contrôler l’absence de recouvrement ; il ne valide pas la lumière, le regard, le rendu du visage ou la qualité d’une vraie caméra.

## Répéter et enregistrer

1. Lire les notes et préparer les éventuelles manipulations locales.
2. Ouvrir Studio, choisir caméra et micro, puis écouter un essai court avec le matériel réel.
3. Garder Sortie propre et ouvrir la sortie vidéo.
4. Partager précisément l’onglet de sortie dans le sélecteur du navigateur.
5. Vérifier le format et le cadrage dans cette sortie, puis lancer la prise.
6. Utiliser Pause pour préparer un passage ; revenir aux slides après une démonstration.
7. Arrêter, relire, sauvegarder et ouvrir le fichier sauvegardé.

Les détails sur les modes de capture, les permissions, les codecs et la reprise d’une prise sont dans [Presenter Studio](presenter-studio.md).

## Contrôles et portée

```bash
npx playwright test qa/youtube-pilot.spec.js --reporter=list --output=output/playwright-youtube
```

Ce contrôle examine le débordement des 20 scènes en 1280 × 720, leur échelle typographique principale, les libellés des gros plans et le cadrage de l’architecture existante en vue d’ensemble desktop, mobile et plein écran. Le mobile interactif peut démarrer sur un composant ; le test revient explicitement à la vue d’ensemble pour vérifier le cadrage.

Le premier audit avait observé un bord droit tronqué pendant l’entrée de l’architecture. La vue d’ensemble stabilisée a ensuite montré les sept nœuds complets avec le cadrage existant. Aucun changement spéculatif de géométrie générale n’est revendiqué. Les captures doivent distinguer la transition d’entrée, une vue sélectionnée, une vue d’ensemble et une sortie statique.

Ces contrôles n’établissent pas la rétention d’audience, la qualité d’une prise matérielle ou un résultat identique sur tous les navigateurs. La voix, la synchronisation, l’éclairage et la stabilité d’une longue prise doivent être jugés sur le fichier réellement produit.
