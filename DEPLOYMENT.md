# Guide de Déploiement Vercel - AgentAI

## 🚀 Déploiement Automatique

### 1. Prérequis
- Compte Vercel
- Projet Supabase configuré
- Repository GitHub connecté

### 2. Configuration des Variables d'Environnement

Dans votre dashboard Vercel, ajoutez ces variables d'environnement :

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Déploiement

#### Option A: Déploiement via GitHub (Recommandé)
1. Connectez votre repository GitHub à Vercel
2. Vercel détectera automatiquement la configuration
3. Le déploiement se fera automatiquement à chaque push

#### Option B: Déploiement via CLI
```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter à Vercel
vercel login

# Déployer
vercel

# Pour la production
vercel --prod
```

### 4. Configuration Supabase

Assurez-vous que votre projet Supabase a :
- Les tables créées (voir `supabase/migrations/`)
- RLS (Row Level Security) configuré
- Les politiques de sécurité définies

### 5. Vérification Post-Déploiement

1. ✅ L'application se charge correctement
2. ✅ La connexion Supabase fonctionne
3. ✅ Les fonctionnalités d'authentification marchent
4. ✅ Les données s'affichent correctement

## 🔧 Configuration Technique

### Fichiers de Configuration
- `vercel.json` : Configuration Vercel
- `vite.config.ts` : Optimisations de build
- `env.example` : Template des variables d'environnement

### Optimisations Incluses
- Code splitting automatique
- Cache des assets statiques
- Compression gzip/brotli
- Redirection SPA pour le routing

## 🐛 Dépannage

### Erreurs Communes
1. **Variables d'environnement manquantes** : Vérifiez dans Vercel Dashboard
2. **Erreur Supabase** : Vérifiez l'URL et la clé API
3. **Build échoue** : Vérifiez les dépendances dans `package.json`

### Logs de Déploiement
```bash
vercel logs [deployment-url]
```

## 📞 Support

En cas de problème, vérifiez :
1. Les logs Vercel
2. La console du navigateur
3. La configuration Supabase
