# 🔐 Système d'Authentification AgentAI

## Vue d'ensemble

Ce document décrit le système d'authentification robuste implémenté pour AgentAI avec Supabase. Le système inclut :

- ✅ Inscription/Connexion avec email et mot de passe
- ✅ Gestion des profils utilisateurs
- ✅ Sessions utilisateur sécurisées
- ✅ Réinitialisation de mot de passe
- ✅ Politiques de sécurité RLS (Row Level Security)
- ✅ Limites d'utilisation par abonnement
- ✅ Gestion des appels API

## 🗄️ Structure de la Base de Données

### Tables Principales

#### `user_profiles`
```sql
- id (uuid, PK) - Référence vers auth.users
- email (text) - Email de l'utilisateur
- full_name (text) - Nom complet
- avatar_url (text) - URL de l'avatar
- subscription_tier (text) - Niveau d'abonnement: 'free', 'pro', 'enterprise'
- agent_limit (integer) - Limite d'agents autorisés
- api_calls_used (integer) - Appels API utilisés ce mois
- api_calls_limit (integer) - Limite mensuelle d'appels API
- last_login (timestamptz) - Dernière connexion
- created_at/updated_at (timestamptz) - Timestamps
```

#### `user_sessions`
```sql
- id (uuid, PK) - Identifiant de session
- user_id (uuid, FK) - Référence vers auth.users
- device_info (jsonb) - Informations sur l'appareil
- ip_address (inet) - Adresse IP
- is_active (boolean) - Session active
- expires_at (timestamptz) - Expiration de session
- created_at (timestamptz) - Création
```

#### `agents` (existant)
```sql
- id (uuid, PK) - Identifiant de l'agent
- user_id (uuid, FK) - Référence vers auth.users
- name, description, status, type, config...
- api_calls (integer) - Appels API de l'agent
- last_active, created_at, updated_at
```

## 🔧 Fonctions Supabase

### `handle_new_user()`
- **Déclencheur automatique** lors de l'inscription
- Crée automatiquement un profil utilisateur
- Configure les limites par défaut

### `create_user_session()`
- Crée une nouvelle session utilisateur
- Désactive les anciennes sessions
- Met à jour la dernière connexion

### `check_user_limits()`
- Vérifie les limites d'utilisation
- Retourne les capacités de l'utilisateur
- Utilisé pour contrôler l'accès aux fonctionnalités

### `increment_api_calls()`
- Incrémente le compteur d'appels API
- Mis à jour automatiquement lors des interactions

## 🛡️ Sécurité (RLS)

### Politiques de Sécurité

#### `user_profiles`
- ✅ Utilisateurs peuvent voir/modifier leur propre profil
- ✅ Création automatique via trigger

#### `user_sessions`
- ✅ Utilisateurs peuvent gérer leurs propres sessions
- ✅ Sessions expirées automatiquement

#### `agents`
- ✅ Utilisateurs peuvent gérer leurs propres agents
- ✅ Isolation complète des données

#### `agent_connections`
- ✅ Accès via les agents de l'utilisateur
- ✅ Sécurité en cascade

## 🚀 Installation et Configuration

### 1. Variables d'Environnement

Créez un fichier `.env.local` :
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Application des Migrations

```bash
# Installer Supabase CLI
npm install -g supabase

# Se connecter à Supabase
supabase login

# Lier le projet
supabase link --project-ref YOUR_PROJECT_REF

# Appliquer les migrations
npm run db:migrate
```

### 3. Vérification

```bash
# Vérifier le statut
npm run db:status

# Réinitialiser si nécessaire
npm run db:reset
```

## 📱 Utilisation dans l'Application

### Hook `useAuth`

```typescript
import { useAuth } from './hooks/useAuth';

function MyComponent() {
  const { 
    user, 
    profile, 
    loading, 
    signUp, 
    signIn, 
    signOut,
    updateProfile,
    checkLimits,
    incrementApiCalls 
  } = useAuth();

  // Utilisation...
}
```

### Hook `useUserLimits`

```typescript
import { useUserLimits } from './hooks/useAuth';

function MyComponent() {
  const { 
    canCreateAgent,
    canMakeApiCall,
    agentsCount,
    apiCallsUsed,
    apiCallsLimit 
  } = useUserLimits();

  // Vérification des limites...
}
```

## 🔄 Flux d'Authentification

### Inscription
1. Utilisateur saisit email, mot de passe, nom
2. `signUp()` appelé avec validation
3. Trigger `handle_new_user()` crée le profil
4. Email de vérification envoyé
5. Utilisateur vérifie son email

### Connexion
1. Utilisateur saisit email/mot de passe
2. `signIn()` authentifie l'utilisateur
3. Session créée automatiquement
4. Profil utilisateur chargé
5. Redirection vers l'application

### Déconnexion
1. `signOut()` appelé
2. Session Supabase fermée
3. État local nettoyé
4. Redirection vers la page de connexion

### Réinitialisation de Mot de Passe
1. Utilisateur clique "Forgot Password"
2. Email de réinitialisation envoyé
3. Lien vers `/reset-password`
4. Nouveau mot de passe saisi
5. Mot de passe mis à jour

## 🎯 Fonctionnalités Avancées

### Gestion des Sessions
- Sessions multiples par utilisateur
- Expiration automatique (30 jours)
- Désactivation des anciennes sessions
- Tracking des appareils

### Limites d'Abonnement
- **Free** : 1 agent, 1000 appels API/mois
- **Pro** : 10 agents, 10000 appels API/mois
- **Enterprise** : Illimité

### Sécurité
- Validation côté client et serveur
- Chiffrement des mots de passe
- Tokens JWT sécurisés
- Protection CSRF

## 🐛 Dépannage

### Erreurs Communes

1. **"Missing Supabase environment variables"**
   - Vérifiez vos variables d'environnement
   - Redémarrez le serveur de développement

2. **"Failed to create account"**
   - Vérifiez la configuration Supabase
   - Vérifiez les politiques RLS

3. **"Invalid session"**
   - Session expirée
   - Redémarrez l'authentification

### Logs de Débogage

```typescript
// Activer les logs Supabase
localStorage.setItem('supabase.auth.token', 'debug');
```

## 📞 Support

Pour toute question ou problème :
1. Vérifiez les logs de la console
2. Vérifiez la configuration Supabase
3. Testez les migrations
4. Vérifiez les politiques RLS

---

**Note** : Ce système d'authentification est conçu pour être robuste et sécurisé. Toutes les données utilisateur sont protégées par RLS et les sessions sont gérées de manière sécurisée.
