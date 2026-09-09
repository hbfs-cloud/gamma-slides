# Presenter Studio

Le studio garde les commandes dans la fenêtre de travail et ouvre une **sortie vidéo séparée** pour le public. Caméra, slides et démonstrations choisies apparaissent dans cette sortie. Ouvrir un menu ou un terminal de préparation ne doit pas l'envoyer à l'enregistrement.

## Lancer la démonstration

Depuis le dépôt, avec ses dépendances installées :

```bash
node bin/gamma-slides.js generate -f presentations/studio-demo.yaml -o output/studio-demo.html
node bin/gamma-slides.js serve -f output/studio-demo.html --port 4173 --browser --terminal
```

Ouvrir `http://127.0.0.1:4173` dans Chrome, en fenêtre normale. La [source de démonstration](../presentations/studio-demo.yaml) comporte 47 slides : illustrations, architectures et workflows Archify, navigateur, vidéo, ECharts natif, tableaux, trading et visualisations GPU. Les données financières et le clip de calibration sont illustratifs.

`--browser` active une session de navigateur isolée ; `--terminal` active le shell local. Ces deux capacités sont facultatives et restent sur le serveur local. Pour un deck de dépôt vérifié, utiliser aussi `repo-present --browser --terminal` ou `serve -d output/revue/site --browser --terminal`.

## Préparer une prise sans filmer les commandes

1. Ouvrir **M → Studio**. Le bouton rond M fonctionne au survol, au toucher et au clavier.
2. Activer la caméra et le microphone souhaités. Dans **Composition et sources**, choisir les périphériques, la position et la taille de la caméra. Déplacer son bandeau ou sa poignée de redimensionnement ; les flèches fonctionnent aussi lorsque ces poignées ont le focus.
3. Garder **Source à filmer → Sortie propre**, puis **Ouvrir la sortie vidéo**. Autoriser cette fenêtre si le navigateur la bloque.
4. Choisir la source et sélectionner précisément l'onglet **SORTIE VIDÉO** dans le sélecteur de partage. Le studio vérifie l'identité de cet onglet et refuse une source différente ou non vérifiable. Cette vérification nécessite un navigateur compatible avec Capture Handle ; utiliser Chrome en fenêtre normale. Une fenêtre privée peut renvoyer une identité nulle et être refusée.
5. Vérifier la composition dans la sortie vidéo, puis lancer l'enregistrement depuis le studio. Garder la fenêtre de sortie ouverte pendant toute la prise.

Le mode **Capture brute** filme aussi les menus présents dans la source sélectionnée. Le mode **Source externe** filme l'écran ou l'onglet choisi avec la caméra composée dessus. Ils ne donnent pas la garantie d'exclusion des commandes du mode Sortie propre.

Dans **Démonstrations → À diffuser dans la vidéo**, choisir explicitement **Slides**, **Terminal** ou **Navigateur**. Terminal et navigateur sont exclusifs ; ouvrir l'un des outils ne suffit pas à le diffuser. Le terminal transmet son contenu de sortie, le navigateur transmet l'image de la page. Revenir à **Slides** pour terminer la démonstration. Les commandes de préparation lancées dans un autre terminal restent hors de la sortie propre.

## Pendant et après l'enregistrement

La barre de prise donne accès au temps écoulé, à **Pause / Resume**, au micro, à la caméra et à la fin de prise. Couper le micro conserve la caméra ; masquer la caméra conserve le micro. Pause interrompt réellement MediaRecorder et la durée utile reprend avec la prise.

| Touche | Action |
| --- | --- |
| `↑` | Ouvrir le carrousel des slides |
| `←` / `→` | Parcourir les slides dans le carrousel |
| `Entrée` / `↓` / `Échap` | Revenir à la slide sélectionnée |
| `M` | Ouvrir ou fermer le menu rond |
| `T` | Ouvrir le terminal |
| `C` | Afficher ou masquer la caméra |
| `U` | Ouvrir ou couper le microphone |
| `P` | Mettre la prise en pause ou reprendre |
| `R` | Ouvrir la préparation, revoir la prise ou retrouver les commandes actives |
| `F` | Plein écran |
| `S` | Notes du présentateur |

Les champs de saisie conservent leurs touches. Archify possède son plein écran, ses parcours et ses commandes dans M → Explorer. Le navigateur dispose d'un agrandissement propre à sa fenêtre.

Après l'arrêt, lire la prise dans la revue : le format réel, les dimensions, la durée et la taille y sont affichés. Le navigateur choisit un codec disponible ; le fichier peut être MP4 ou WebM. Sauvegarder le fichier, puis vérifier sa lecture. Si le navigateur lance un téléchargement sans confirmer l'écriture, la copie reste en mémoire et demande une confirmation après vérification du fichier. **Revoir la prise** dans Studio permet de la retrouver après un retour aux slides. Une prise non sauvegardée bloque son remplacement ; fermer ou recharger la page peut la perdre.

## Préparer le contenu avec un LLM

Lire le [schéma](../src/schema/deck.schema.json) et utiliser le deck de démonstration comme exemple exécutable. Le LLM écrit du YAML/JSON et produit ou référence les assets ; le CLI n'intègre pas lui-même un service de génération d'images.

```yaml
- layout: visual
  title: Le signal, sans le bruit.
  subtitle: Un message court, une illustration lisible.
  visual:
    src: assets/illustration.svg
    alt: Description précise de ce que montre l'illustration.
    caption: Provenance de l'image ou mention de génération.
    icons:
      - name: shield
        label: Sécurité
- layout: media
  title: Voir le parcours.
  media:
    kind: video
    src: assets/demo.mp4
    poster: assets/apercu.png
    alt: Démonstration du parcours utilisateur.
- layout: browser
  title: Inspecter le dépôt.
  browser:
    url: https://github.com/hbfs-cloud/gamma-slides
    label: Explorer le dépôt
```

`visual` accepte une image ou un GIF, un titre pouvant porter le slogan et jusqu'à quatre icônes légendées. Choisir les noms dans le [catalogue d'icônes embarqué](../src/engine/components/icons.js). `media.kind` accepte `video` ou `audio`, avec lecture commandée par l'utilisateur. Les assets locaux SVG, PNG, JPEG, GIF, WebP, AVIF, MP4, WebM, MP3, WAV et OGG sont résolus par rapport au YAML et intégrés au HTML, jusqu'à 50 Mo par asset. Les URL distantes restent distantes : elles exigent leur accès réseau. Les fichiers de sous-titres référencés par `media.captions` doivent être servis séparément.

Pour une configuration ECharts native, utiliser `chart.type: echarts`, `chart.data: {}` et `chart.options.echarts` contenant l'option JSON : séries, axes, légende et zoom. Les fonctions JavaScript arbitraires, extensions et cartes externes ne sont pas automatiquement fournies. Préférer les types de graphiques existants lorsqu'ils couvrent le besoin ; ils bénéficient de la mise en forme du moteur. Les architectures restent des spécifications `layout: diagram` validées par les schémas Archify.

Demander au LLM des sources pour les chiffres, des unités explicites, une alternative textuelle aux images et une vérification du contraste et de la lecture mobile. Un fichier conforme au schéma ne prouve pas que toutes ses slides sont lisibles.

## Portée de la vidéo et contrôles

- Le navigateur local transmet des captures d'écran interactives de sa session isolée, **sans son de cette session**. Il ne réutilise pas les connexions du Chrome personnel. Sur fichier statique ou Pages, l'intégration repose sur une iframe que le site distant peut refuser ; utiliser alors le lien d'ouverture séparée.
- Le rendu responsive desktop, tablette et mobile ne garantit pas la capture d'écran sur ces appareils. `getDisplayMedia` est souvent indisponible dans les navigateurs mobiles ; utiliser alors l'enregistreur système et vérifier ce qu'il filme. Une émulation Playwright ne remplace pas un essai sur l'appareil réel.
- Une prise possède un format fixe : dimensions de la source, 1920 × 1080, 1080 × 1920 ou 1080 × 1080. Une source de proportions différentes peut produire des bandes. Préparer et regarder la sortie au format cible avant chaque prise ; un même fichier ne devient pas automatiquement idéal en horizontal et vertical.
- L'export vidéo narré du CLI compose des captures de slides et des transitions ; il ne remplace pas l'enregistrement Studio des interactions en direct.

Les contrôles Studio sont dans [qa/studio-recording.spec.js](../qa/studio-recording.spec.js). Ils produisent leurs preuves dans [output/studio-review/](../output/studio-review/), dont les vidéos enregistrées, images décodées et rapports lorsqu'ils ont été exécutés. Examiner ces fichiers et la sortie publique réelle ; distinguer les sources caméra/micro synthétiques des essais matériels. Ne pas annoncer une validation d'appareil ou une qualité universelle à partir des seules assertions automatiques.
