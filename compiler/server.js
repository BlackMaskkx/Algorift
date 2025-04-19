const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const multer = require('multer');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Configuración básica
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Ruta temporal para archivos de compilación
const TEMP_DIR = path.join(__dirname, 'temp');
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR);
}

// Almacenamiento para subida de proyectos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const projectId = req.body.projectId || 'default';
        const projectDir = path.join(TEMP_DIR, projectId);
        if (!fs.existsSync(projectDir)) {
            fs.mkdirSync(projectDir, { recursive: true });
        }
        cb(null, projectDir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage });

// ======= ENDPOINTS ======= //

// 1. Subir archivos del proyecto
app.post('/upload', upload.array('files'), (req, res) => {
    res.json({ 
        status: 'success',
        projectId: req.body.projectId,
        files: req.files.map(f => f.originalname)
    });
});

// 2. Compilar proyecto Android
app.post('/build', (req, res) => {
    const { projectId } = req.body;
    const projectDir = path.join(TEMP_DIR, projectId);

    // Simulación de compilación (en un entorno real usarías Gradle/Android SDK)
    exec(`cd ${projectDir} && echo "Compilando proyecto..."`, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ error: stderr });
        }

        // Generar un APK de prueba (simulado)
        const apkPath = path.join(projectDir, 'app-debug.apk');
        fs.writeFileSync(apkPath, 'Contenido simulado del APK');

        res.json({
            status: 'success',
            apkPath: `/download/${projectId}/app-debug.apk`
        });
    });
});

// 3. Descargar APK generado
app.get('/download/:projectId/:filename', (req, res) => {
    const filePath = path.join(TEMP_DIR, req.params.projectId, req.params.filename);
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).send('Archivo no encontrado');
    }
});

// 4. Limpiar proyecto temporal
app.delete('/clean/:projectId', (req, res) => {
    const projectDir = path.join(TEMP_DIR, req.params.projectId);
    if (fs.existsSync(projectDir)) {
        fs.rmSync(projectDir, { recursive: true });
        res.json({ status: 'deleted' });
    } else {
        res.status(404).json({ error: 'Proyecto no encontrado' });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor de compilación ejecutándose en http://localhost:${PORT}`);
});
