════════════════════════════════════════════════════════════════
                            ⚡  SMART PREFETCH
════════════════════════════════════════════════════════════════

         Précharge automatiquement les pages web en
         arrière-plan pour qu'elles s'ouvrent quasi
                    instantanément.

           Chrome · Edge · Brave · Opera · v2.0.0


────────────────────────────────────────────────────────────────
                         🎯  EN BREF
────────────────────────────────────────────────────────────────

Smart Prefetch analyse tes habitudes de navigation (survol,
scroll, viewport, historique) et précharge en arrière-plan
les pages que tu risques de visiter.

Résultat : temps d'attente divisé par 5, sans rien changer
à ta façon de naviguer.


        Situation                  Sans          Avec Prefetch
        ─────────────────────────────────────────────────────
        Clic sur un lien        300-800 ms        20-80 ms
        Retour arrière          200-500 ms        instantané
        Ouverture d'article     400-900 ms        50-150 ms
        Temps gagné moyen            —             ~450 ms


────────────────────────────────────────────────────────────────
                       ✨  FONCTIONNALITÉS
────────────────────────────────────────────────────────────────

  🚀  Prefetch automatique
      Tous les liens de la page chargés dès l'arrivée.

  🖱️  Survol prédictif
      Un lien survolé se charge instantanément.

  👁️  Viewport intelligent
      Priorité aux liens visibles à l'écran.

  📜  Scroll rapide
      La page suivante est anticipée vers le bas.

  🧠  Chaîne de Markov
      L'extension apprend tes habitudes de navigation.

  🎨  Bulle Fluent
      Petit point bleu en haut à droite, discret.

  📛  Badge live
      Compteur en temps réel sur l'icône.

  ⚙️  Page d'options
      Réglages, blocklist, whitelist, stats détaillées.

  ⌨️  Raccourcis clavier
      Ctrl+Shift+P  →  page suivante
      Ctrl+Shift+A  →  tous les liens

  🖱️  Menu contextuel
      Clic droit  →  précharger tous les liens.

  📊  Stats de vitesse
      Mesure du temps réellement gagné.

  🚫  Blocklist par défaut
      YouTube, Twitter/X, banques, paiements…


────────────────────────────────────────────────────────────────
                        📦  INSTALLATION
────────────────────────────────────────────────────────────────

  1.  Télécharger le dossier "smart-prefetch"

  2.  Ouvrir  chrome://extensions

  3.  Activer le  Mode développeur  (en haut à droite)

  4.  Cliquer  Charger l'extension non empaquetée

  5.  Sélectionner le dossier "smart-prefetch"

  6.  L'extension apparaît ✅


  Vérifier :

  →  Va sur Wikipédia
  →  Ouvre F12  →  Network
  →  Tape "prefetch" dans le filtre
  →  Les requêtes défilent automatiquement ✅


────────────────────────────────────────────────────────────────
                       🗂️  STRUCTURE
────────────────────────────────────────────────────────────────

  smart-prefetch/
  │
  ├── manifest.json       Configuration (Manifest V3)
  ├── background.js       Service worker : stats, badge, menus
  ├── content.js          Cœur : prefetch + bulle + prédiction
  │
  ├── popup.html          Interface du popup
  ├── popup.js
  ├── popup.css
  │
  ├── options.html        Page d'options complète
  ├── options.js
  ├── options.css
  │
  ├── sw.js               Service worker de cache
  ├── rules.json          Speculation Rules (prerender)
  │
  └── icons/
      ├── icon16.png
      ├── icon48.png
      └── icon128.png


────────────────────────────────────────────────────────────────
                       ⚙️  CONFIGURATION
────────────────────────────────────────────────────────────────

  Réglage                 Défaut       Description
  ────────────────────────────────────────────────────────────
  Activer l'extension     ✅           On / off global
  Badge sur l'icône       ✅           Compteur en direct
  Bulle au survol         ✅           Petit point Fluent
  Délai au survol         80 ms        Avant de lancer
  Marge du viewport       400 px       Zone autour de l'écran
  Prefetch max            99999        Illimité
  Markov min hits         2            Transitions avant prédiction
  Bloquer 2G              ✅           Économise la data


  Blocklist par défaut :

    YouTube · Twitter/X · Facebook · Instagram · TikTok
    LinkedIn · Netflix · Twitch
    Google Accounts · Microsoft Login
    BNP · Crédit Agricole · Société Générale
    PayPal · Stripe


  Whitelist :

    Si non vide, seuls ces domaines seront préchargés.


────────────────────────────────────────────────────────────────
                      🔒  VIE PRIVÉE
────────────────────────────────────────────────────────────────

  ✕  Aucune donnée envoyée à un serveur
  ✓  Statistiques locales (chrome.storage.local)
  ✓  Graphe de navigation en localStorage uniquement
  ✓  Blocklist par défaut pour les sites sensibles
  ✓  Détection Save-Data et 2G → désactivation auto
  ✓  Aucun prefetch sur /login, /checkout, /admin, /panier


────────────────────────────────────────────────────────────────
                      🛠️  TECHNOLOGIES
────────────────────────────────────────────────────────────────

  · Manifest V3
  · Speculation Rules API (prerender natif)
  · IntersectionObserver / MutationObserver
  · Chaîne de Markov
  · Service Worker + Cache API
  · Fluent Design (Windows 12)


────────────────────────────────────────────────────────────────
                          🧪  TEST
────────────────────────────────────────────────────────────────

  Ouvre la console de n'importe quelle page, tape :

      document.querySelectorAll('link[rel="prefetch"]').length

  →  doit renvoyer un nombre > 0


────────────────────────────────────────────────────────────────
                        🐛  PROBLÈMES
────────────────────────────────────────────────────────────────

  Rien ne se passe ............ Recharger l'extension puis F5
  Bulle trop visible .......... Options → décocher
  Trop de bande passante ...... Réduire "Prefetch max" à 20
  Site cassé .................. Ajouter à la blocklist
  Extension invalide .......... manifest.json à la racine ?


────────────────────────────────────────────────────────────────
                          📜  LICENCE
────────────────────────────────────────────────────────────────

                 Projet open-source

     sans tracking · sans pub · sans compte

     Utilisation libre · Modification libre · Partage libre


────────────────────────────────────────────────────────────────
                          🚀  VERSION
────────────────────────────────────────────────────────────────

                        v2.0.0
              Chrome 102+ · Edge · Brave · Opera


            « Le meilleur temps de chargement,
              c'est celui qu'on n'attend pas. »


                        ⚡  SMART PREFETCH
════════════════════════════════════════════════════════════════
