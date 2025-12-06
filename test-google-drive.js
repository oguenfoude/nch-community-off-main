// test-google-drive-debug.js
require('dotenv').config();
const { google } = require('googleapis');

const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

// Nettoyer la clé privée correctement
let GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;
if (GOOGLE_PRIVATE_KEY) {
    // Supprimer les guillemets et virgules en début/fin
    GOOGLE_PRIVATE_KEY = GOOGLE_PRIVATE_KEY.trim();
    if (GOOGLE_PRIVATE_KEY.startsWith('"')) {
        GOOGLE_PRIVATE_KEY = GOOGLE_PRIVATE_KEY.substring(1);
    }
    if (GOOGLE_PRIVATE_KEY.endsWith('",') || GOOGLE_PRIVATE_KEY.endsWith('"')) {
        GOOGLE_PRIVATE_KEY = GOOGLE_PRIVATE_KEY.replace(/",?$/, '');
    }
    // Remplacer les \n par de vrais retours à la ligne
    GOOGLE_PRIVATE_KEY = GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
}

async function testGoogleDriveConnection() {
    try {
        console.log('🧪 Test de connexion Google Drive...');
        console.log('📧 Service Account:', GOOGLE_SERVICE_ACCOUNT_EMAIL);
        console.log('📁 Folder ID:', GOOGLE_DRIVE_FOLDER_ID);

        // Debug de la clé privée après nettoyage
        if (GOOGLE_PRIVATE_KEY) {
            console.log('🔑 Clé privée commence par:', GOOGLE_PRIVATE_KEY.substring(0, 30) + '...');
            console.log('🔑 Clé privée finit par:', '...' + GOOGLE_PRIVATE_KEY.substring(GOOGLE_PRIVATE_KEY.length - 30));
            console.log('🔑 Longueur de la clé:', GOOGLE_PRIVATE_KEY.length, 'caractères');
            console.log('🔑 Contient BEGIN PRIVATE KEY:', GOOGLE_PRIVATE_KEY.includes('-----BEGIN PRIVATE KEY-----'));
            console.log('🔑 Contient END PRIVATE KEY:', GOOGLE_PRIVATE_KEY.includes('-----END PRIVATE KEY-----'));

            // Vérifier qu'il n'y a pas de caractères parasites
            const lastChar = GOOGLE_PRIVATE_KEY.charAt(GOOGLE_PRIVATE_KEY.length - 1);
            console.log('🔑 Dernier caractère:', lastChar === '\n' ? 'Retour à la ligne' : `"${lastChar}"`);
        } else {
            console.log('❌ Clé privée non chargée');
            return;
        }

        // Vérifier que les variables sont chargées
        if (!GOOGLE_PRIVATE_KEY || !GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_DRIVE_FOLDER_ID) {
            throw new Error('Variables d\'environnement manquantes');
        }

        // Créer les credentials en utilisant le format de fichier JSON
        const credentials = {
            type: 'service_account',
            client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: GOOGLE_PRIVATE_KEY,
        };

        console.log('🔐 Création de l\'authentification...');

        // Utiliser GoogleAuth au lieu de JWT directement
        const auth = new google.auth.GoogleAuth({
            credentials: credentials,
            scopes: [
                'https://www.googleapis.com/auth/drive',
                'https://www.googleapis.com/auth/drive.file'
            ]
        });

        console.log('🔐 Authentification en cours...');

        // Obtenir le client authentifié
        const authClient = await auth.getClient();
        console.log('✅ Authentification réussie !');

        const drive = google.drive({ version: 'v3', auth: authClient });

        console.log('📋 Test de listage des fichiers...');

        // Test simple : lister le contenu du dossier
        const response = await drive.files.list({
            q: `'${GOOGLE_DRIVE_FOLDER_ID}' in parents and trashed=false`,
            fields: 'files(id, name, mimeType, size)',
            pageSize: 10
        });

        console.log('✅ Connexion réussie !');
        console.log(`📁 Dossier contient ${response.data.files?.length || 0} fichiers`);

        if (response.data.files && response.data.files.length > 0) {
            console.log('📄 Fichiers trouvés :');
            response.data.files.forEach((file, index) => {
                console.log(`  ${index + 1}. ${file.name} (${file.id})`);
            });
        }

        console.log('🎉 Configuration Google Drive OK !');

        // Test de création de fichier
        console.log('🧪 Test de création de fichier...');
        const testFileContent = Buffer.from('Test NCH Community ' + new Date().toISOString(), 'utf8');

        const uploadResponse = await drive.files.create({
            requestBody: {
                name: 'test-nch-' + Date.now() + '.txt',
                parents: [GOOGLE_DRIVE_FOLDER_ID],
            },
            media: {
                mimeType: 'text/plain',
                body: testFileContent,
            },
            fields: 'id,name,webViewLink',
        });

        if (uploadResponse.data.id) {
            console.log('✅ Upload de test réussi !');
            console.log('📄 Fichier créé:', uploadResponse.data.name);
            console.log('🆔 ID:', uploadResponse.data.id);

            // Supprimer le fichier de test
            await drive.files.delete({
                fileId: uploadResponse.data.id,
            });
            console.log('🗑️  Fichier de test supprimé');
        }

    } catch (error) {
        console.error('❌ Erreur détaillée :', error.message);
        console.error('Stack:', error.stack);
    }
}

testGoogleDriveConnection();