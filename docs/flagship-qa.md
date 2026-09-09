# Flagship — revue du 9 septembre 2026

Livrable principal : output/flagship-demo.html, issu de presentations/flagship.yaml. Le deck contient 38 slides, 37 graphiques, 28 familles de visualisations et six chapitres. Les données restent explicitement illustratives.

## Présentation et rendu

Vingt slides ont une composition adaptée à leur contenu : synthèse, scorecard, grand tableau financier, preuve graphique, analyse asymétrique, registre de contrôles, séquence stratégique, feuille de route, chapitre et décisions. Archivo porte les données et les titres ordinaires ; Source Serif 4 distingue les synthèses et les décisions. Les styles et leurs adaptations sont consignés dans DESIGN.md et .impeccable/design.json.

L’ouverture dessine cinq rubans Three.js en WebGL. Leurs largeurs utilisent une échelle commune issue des revenus FY24/FY25 : 8,3 puis 16,2 millions de dollars. Chaque segment est sélectionnable et conserve ses deux valeurs exactes. Le passage de lumière est fini ; aucune animation permanente au repos.

Quatre scènes utilisent D3 pour les échelles ou les positions et Pixi.js pour dessiner les données avec WebGPU : revenus (9), comparables en vue 2D (21), risques (27) et réseau (35). Les preuves contrôlent un contexte réel, des objets graphiques et des pixels non vides ; le chargement d’une bibliothèque seul ne compte pas comme validation GPU.

Les comparables (21) s’ouvrent en Three.js/WebGL. Croissance, multiple de valorisation et marge brute occupent trois axes mesurés. Les noms restent à proximité des sphères ; les valeurs sélectionnées restent près des commandes, y compris sur téléphone. Le cadrage suit les rotations pour conserver les cinq sphères dans le champ, puis Reset restaure la vue initiale. Les autres graphiques utilisent ECharts/SVG. Il ne s’agit pas d’un rendu WebGPU intégral.

## Lecture et interactions

Les slides mobiles utilisent la largeur réelle du téléphone et défilent verticalement. Le bouton « More below » dispose d’un emplacement réservé de 44px au-dessus de la navigation. Les tableaux conservent leurs intitulés et leurs valeurs ; le compte de résultat garde son unité $M. Les synthèses et décisions exposent leurs signaux principaux dès le premier écran.

Les neuf nœuds du Sankey (26) portent leurs libellés courts directement dans le diagramme. Une section dépliable conserve les noms sources complets. Sur la slide 33, Scenario A–E identifie chaque trajectoire ; la légende accepte clavier et toucher, garde la sélection au changement de thème ou de largeur et conserve des axes fixes lors de l’isolation. Tous les intitulés de corrélation, dont Rates et FX, restent visibles. La légende du graphique circulaire (8) dispose d’un espace distinct sous son arc.

Les contrôles natifs restent utilisables sans faire avancer involontairement Reveal. Les scènes GPU libèrent leurs ressources hors slide, respectent le mouvement réduit et disposent de vues SVG et de données complètes pour l’absence du GPU, sa perte, l’impression et l’export. La résolution des scènes Three.js tient compte de la taille réellement affichée après la transformation Reveal.

## Validation finale

- 48 tests unitaires réussis : données financières, totaux, échelles proportionnelles, schéma et génération.
- 40 scénarios Playwright réussis dans un même lot, sans échec, scénario ignoré ni test instable. Commande : npx playwright test qa/flagship-*.spec.js.
- Parcours réel des 38 slides depuis une ouverture file:// vierge, sans thème forcé ni suppression artificielle de panneaux. Navigation desktop au clavier ; téléphone avec isMobile, hasTouch et DPR 2.
- 38 captures desktop à 1440 × 900 et 76 captures mobiles à 390 × 844, continuations incluses. Captures supplémentaires à 1920 × 1080 et dans les états 3D et de sélection.
- 535 contrôles de contraste HTML desktop et 572 sur mobile, avec composition des transparences. Aucun défaut contrôlé ni erreur JavaScript dans les deux parcours complets. Les textes des graphiques font aussi l’objet d’inspections visuelles et de contrôles SVG ciblés ; le contrôle HTML ne couvre pas à lui seul chaque pixel du canvas.
- Tests des valeurs sources exactes, du rendu réel WebGPU/WebGL, des changements de thème et de largeur, du clavier, du toucher, de la perte du GPU, de l’impression, du cadrage aux rotations extrêmes et de l’absence de rendu continu au repos.
- QA CLI d’export : 38 slides, zéro blocage et zéro avertissement. Les scènes GPU et leurs vues SVG sont recensées dans output/flagship-review/export/report.json.

## Revues indépendantes

La revue visuelle complète a examiné les deux planches de 38 slides, des captures individuelles lisibles, des continuations mobiles et les vues 1920px. Elle a demandé six corrections : identités proches des diagrammes mobiles, scénarios nommés, cadrage 3D plus ample, légendes et intitulés complets, unité financière mobile et documentation du système réel. Le même relecteur a rendu disposition: ship sur les captures remplacées : les six corrections sont résolues, sans régression matérielle identifiée dans cette passe. Ce verdict couvre ces six points. Verdict final consigné dans .impeccable/review/flagship-finish-review.md.

La revue de code contrarian a identifié une coupure de trois sphères aux limites autorisées de rotation. Le cadrage dynamique corrige ce défaut ; le test dédié vérifie maintenant les cinq sphères complètes, leurs noms et l’absence de collision aux extrêmes du clavier et du glisser. Aucun autre blocage confirmé dans le périmètre relu : revenus, DPR, destruction des scènes, clavier, sélection et export. Compte rendu : .impeccable/review/flagship-contrarian-code.md.

Les rôles Impeccable de revue finale et de documentation ont été remplis par des agents génériques indépendants suivant les contrats du skill, les classes d’agents nommées du plugin n’étant pas exposées par le harness. Le détecteur a été exécuté une fois pendant cette passe ; résultat vide dans output/flagship-review/design-audit.json. Aucun nouvel ignore Impeccable ajouté. Les corrections de la revue n’ont pas déclenché un second passage du détecteur.

## Preuves et limites

Galerie locale : output/flagship-review/index.html. Rapports du lot final : browser-final.json, desktop-manifest.json, mobile-manifest.json, gpu-manifest.json et revenue-*-manifest.json dans le même dossier. Le fichier principal est copié sans régénération depuis le fichier exact passé aux tests ; artifact.json consigne les empreintes SHA-256 et l’identité des deux fichiers. Son ouverture à son chemin final fait l’objet de main-file-smoke.json.

La validation couvre Chrome desktop et l’émulation mobile tactile ; aucun essai sur un téléphone physique ou Safari n’est revendiqué. Une revue visuelle, un verdict sur ses corrections et des tests verts ne constituent pas une certification esthétique de 9/10.
