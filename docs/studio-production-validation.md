# Revue de production YouTube

Les corrections répondent à la revue contradictoire du 9 septembre 2026. Elles couvrent les prises récupérables, la résolution réellement capturée, le son, le navigateur interactif et la lisibilité d’un épisode préparé. Le catalogue de 47 slides reste disponible ; le pilote français de 20 scènes sert de scénario vidéo cohérent.

## Changements vérifiés

- Écriture incrémentale dans IndexedDB avec file bornée, récupération après crash réel du renderer, arrêt sur quota et export progressif. La récupération s’arrête au dernier fragment validé.
- Refus d’une source inférieure au format fixe demandé. La résolution native est affichée ; les dimensions ne changent pas dans le fichier pendant la prise.
- Gains voix/médias, réduction des médias pendant la parole, compression et plafond du mix. Pistes brutes optionnelles synchronisées avec pause/reprise ; couper le micro coupe également sa piste brute.
- Navigateur isolé en WebRTC avec vidéo 1920 × 1080 autour de 30 images/s et audio mesuré. Monitoring opérateur coupé pendant la diffusion puis rétabli. Nettoyage après fermeture, échec de négociation ou déconnexion pendant une navigation.
- Composition par scène pour la caméra, textes adaptés à une vidéo horizontale regardée sur téléphone et trois gros plans Archify.
- Revue de prise mobile réorganisée, actions tactiles de 44 px, métadonnées lisibles et fermeture du Studio accessible pendant le défilement.

## Preuves reproductibles

| Contrôle | Résultat | Preuves locales |
| --- | --- | --- |
| Tests unitaires | 66 réussis | `npm test` |
| Capture, pause, micro, caméra, responsive et sortie propre | 6 réussis | `qa/studio-recording.spec.js`, `output/studio-review/clean-proof.json` |
| Résolution, périphériques et reprise de prise | 3 réussis | `qa/studio-production.spec.js` |
| Crash, quota, mix et pistes brutes | 6 réussis | `output/studio-durability/` |
| WebRTC, diffusion, sécurité et fermeture | 4 réussis | `output/studio-review/browser-broadcast-proof.json`, `browser-stream-proof.json` |
| Pilote, lecture mobile et Archify | 3 réussis | `output/youtube-review/` |
| Revue visuelle indépendante | Corrections confirmées desktop/mobile | `output/studio-production-review/confirmation.md` |
| Endurance, capture native 1080p | 900 s de prise, 885,324 s utiles après pauses, 148 150 268 octets | `output/studio-production/endurance-proof.json`, `endurance.mp4` |
| GPU avec opérateur réellement masqué | WebGPU animé, sélection et pixels transmis ; aucune commande visible | `qa/studio-background.spec.js`, `output/studio-background/proof.json` |
| Impeccable | Typographie du pilote déclarée, aucune exclusion ajoutée | `DESIGN.md` |

La galerie est générée par `node qa/build-studio-review.js` dans `output/studio-review/index.html`. Elle relie les images réellement décodées, les vidéos et les mesures. Les sources caméra et microphone des tests sont synthétiques ; le partage d’onglet et les codecs sont ceux de Chrome.

Les fichiers produits permettent d’évaluer le rendu et les comportements testés. Une vraie répétition avec la voix, la caméra, l’éclairage et le matériel de l’auteur reste nécessaire pour juger la prise destinée à être publiée. La présentation responsive sur téléphone est distincte de la capture mobile et du cadrage vertical d’une vidéo.

## Prise longue et arrière-plan

La prise d’endurance a produit un MP4 H.264 de 1920 × 1080 à environ 30 images/s avec audio, changements entre les 20 scènes et pauses régulières. Les 172 échantillons de mémoire JavaScript observés vont de 14,5 à 34,9 Mo ; la file d’écriture observée reste sous 113 ko. Ces mesures échantillonnées ne représentent pas toute la mémoire de Chrome ni un maximum absolu. Le fichier de 148 Mo dépasse la limite de prévisualisation intégrée : il a été exporté fragment par fragment puis inspecté avec ffprobe et décodé au début, au milieu et à la fin.

Le test d’endurance conserve l’émulation de focus habituelle de Playwright. La vérification de fenêtre masquée est donc séparée : Chrome natif piloté par Puppeteer, sans forcer `document.hidden`. L’ancienne horloge tombait autour d’une image par seconde ; l’horloge Worker fournit ici 76 callbacks en 2,78 secondes. Le miroir GPU utilise un canvas appartenant à la sortie publique, car le `captureStream` d’un canvas masqué pouvait rester vide. L’animation, la sélection et le changement effectif de pixels ont été contrôlés dans cette situation réelle.

Un timeout de l’ancien scénario QA de capture venait d’un passage de la source de 1920 × 1080 à 1280 × 720 pendant ses captures d’écran. Le test fixe désormais ses dimensions physiques avant de démarrer ; la protection produit contre l’agrandissement artificiel reste active. La suite complète de six tests de capture et la confirmation après modification du miroir passent.
