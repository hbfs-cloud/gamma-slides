---
target: src/engine/components/studio-live.js
total_score: 28
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 4
timestamp: 2026-09-09T12-54-05Z
slug: src-engine-components-studio-live-js
---
Method: dual-agent (A: /root/youtube_design_review · B: /root/youtube_readiness_audit)

# Capacité à produire des vidéos YouTube — revue du 9 septembre 2026

Verdict : les outils permettent déjà une vidéo technique préparée, avec prise et montage contrôlés. La fiabilité d’un studio autonome pour des prises longues et une qualité constante n’est pas démontrée.

## Points solides

Identité visuelle spécifique (noir/ambre, hiérarchie éditoriale), graphiques GPU et parcours Archify utilisables dans une explication. Caméra et microphone indépendants, sortie sans commandes et pause/reprise réellement implémentés. CLI existant pour narration, SRT, chapitres, miniature et publication ; sa chaîne est distincte de la prise interactive.

Le choix MP4/H.264 et audio 48 kHz est cohérent avec les recommandations YouTube, sans constituer à lui seul une preuve de qualité : https://support.google.com/youtube/answer/1722171?hl=fr

## Priorités contradictoires

1. **P1 — Pérennité de la prise.** studio-capture.js conserve les chunks en mémoire et assemble le Blob à l’arrêt. presenter-studio.js écrit le fichier après revue. Pas de journal vidéo durable récupérable après crash. Les tests encodés conservés durent environ 4,09 et 8,24 secondes, avec caméra/micro synthétiques. Une prise de 30–60 minutes reste non validée. Action : écriture incrémentale, récupération et test d’endurance avec incidents. Impeccable harden.
2. **P1 — Résolution et lisibilité vidéo.** Avec DPR=1 et le profil paysage, la mesure fraîche confirme une source capturée 1280×720 ; le compositeur peut l’agrandir à 1920×1080. La vidéo fixe conserve ses petits textes sur téléphone même si le HTML est responsive. L’inspection A relève aussi un nœud Presenter Studio coupé sur l’architecture initiale. Action : contrôler la résolution réellement capturée, cadrer les diagrammes et construire des plans de détail lisibles. Impeccable adapt/typeset.
3. **P1 — Maîtrise du son.** Un vumètre existe dans le préflight, mais pas de contrôle des crêtes du mix enregistré pendant la prise, de gains séparés, de limiteur ou de pistes indépendantes. Saturation effective non reproduite ; absence des contrôles confirmée. Action : contrôle continu du mix, réglages distincts, test voix humaine + média. Impeccable harden.
4. **P2 — Démonstrations en mouvement et continuité.** Navigateur local transmis en JPEG à intervalle100ms, au plus environ10ips, sans audio. Certains renderers GPU s’arrêtent quand la page opérateur est masquée : risque de continuité à tester, pas une panne d’enregistrement reproduite ici. Si un appareil explicitement sélectionné disparaît, changer son deviceId exige une configuration désactivée pendant la prise ; reconnecter le même appareil ou le défaut peut fonctionner. Action : vraie source fluide pour les démos animées et scénarios d’interruption. Impeccable optimize/harden.
5. **P1 — Fil narratif.** La démo de47 slides présente de nombreux composants puis enchaîne sur une présentation financière en anglais. Elle démontre la couverture du moteur ; elle n’apporte pas la preuve d’un épisode YouTube cohérent. Action : un épisode pilote avec une question, des preuves, des plans de détail et une conclusion, puis montage et sous-titrage adaptés à la prise. Impeccable distill.

## Grille Nielsen — interface opérateur uniquement

Évaluation A avant le scan technique, 4=excellent. Aucun score de qualité vidéo n’est déduit de cette grille.

| Heuristique | /4 |
| --- | ---: |
| Visibilité de l’état | 3 |
| Correspondance avec le monde réel | 3 |
| Contrôle et liberté | 3 |
| Cohérence | 2 |
| Prévention des erreurs | 3 |
| Reconnaissance plutôt que mémorisation | 2 |
| Efficacité | 3 |
| Esthétique et sobriété | 3 |
| Récupération | 3 |
| Aide | 3 |
| Total | 28/40 |

Les scores de prévention/récupération de A reposent partiellement sur les protections documentées. La revue technique B révèle en complément le manque de récupération durable après crash.

## Personnes et parcours

Créateur débutant : apprentissage de M et de plusieurs lieux de commande. Présentateur seul : exploration, changement de source et narration sollicitent simultanément son attention. Spectateur sur téléphone : légendes et détails du fichier vidéo trop petits. Le début a une identité claire ; le passage à une démonstration financière sans continuité affaiblit le récit.

## Preuves et limites

A a inspecté des contextes Chrome neufs, les slides1–3, Studio/Explorer, le fichier décodé et deux planches de captures. B a inspecté une sortie neuve, vérifié la source getDisplayMedia et exécuté le détecteur une fois sur studio-live.js, studio-capture.js et studio-output.js : aucun signalement, aucun ignore ajouté. Ce résultat du détecteur ne mesure pas la qualité audiovisuelle. A était achevée avant réception du scan B. Aucun enregistrement long, essai matériel ou upload YouTube exécuté pendant cette revue. Aucun overlay navigateur revendiqué. Le serveur4175 préexistait et reste disponible.

Prochaine preuve décisive : un pilote de15 minutes avec voix et caméra réelles, diagrammes, graphique, navigateur, pause/reprise et changement de fenêtre ; lecture du fichier à taille téléphone, mesure A/V et test séparé d’interruption/récupération. Aucun résultat de rétention YouTube ne peut être inféré avant publication et audience réelle.

Questions skipped: demande de revue explicite ; aucune clarification nécessaire pour identifier les priorités.
