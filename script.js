// Configuración inicial del IDE
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar el editor de código
    const editor = ace.edit("code-editor");
    editor.setTheme("ace/theme/dracula");
    editor.session.setMode("ace/mode/java");
    editor.setOptions({
        fontSize: "14px",
        enableBasicAutocompletion: true,
        enableLiveAutocompletion: true
    });

    // Variables de estado
    let currentProject = null;
    let openFiles = [];
    let activeFile = null;

    // Elementos del DOM
    const projectTree = document.getElementById('project-tree');
    const editorTabs = document.getElementById('editor-tabs');
    const currentFileElement = document.getElementById('current-file');
    const cursorPositionElement = document.getElementById('cursor-position');
    const buildOutputElement = document.getElementById('build-output');
    const buildStatusElement = document.getElementById('build-status');
    const newProjectModal = document.getElementById('new-project-modal');
    const appPreview = document.getElementById('app-preview');

    // Configurar eventos del editor
    editor.session.on('changeCursorPosition', function(e) {
        cursorPositionElement.textContent = `Ln ${e.cursor.row + 1}, Col ${e.cursor.column + 1}`;
    });

    // Eventos de los botones
    document.getElementById('new-project').addEventListener('click', showNewProjectModal);
    document.getElementById('open-project').addEventListener('click', openProject);
    document.getElementById('save-project').addEventListener('click', saveCurrentFile);
    document.getElementById('build-btn').addEventListener('click', buildProject);
    document.getElementById('run-btn').addEventListener('click', runProject);
    document.getElementById('export-btn').addEventListener('click', exportAPK);
    document.getElementById('fullscreen-btn').addEventListener('click', toggleFullscreen);
    document.getElementById('close-tab').addEventListener('click', closeCurrentTab);
    document.getElementById('cancel-project').addEventListener('click', hideNewProjectModal);
    document.getElementById('create-project').addEventListener('click', createNewProject);

    // Panel tabs
    document.querySelectorAll('.panel-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const panelId = this.getAttribute('data-panel');
            showPanel(panelId);
        });
    });

    // Funciones del IDE
    function showNewProjectModal() {
        newProjectModal.style.display = 'flex';
    }

    function hideNewProjectModal() {
        newProjectModal.style.display = 'none';
    }

    function showPanel(panelId) {
        document.querySelectorAll('.panel-content').forEach(panel => {
            panel.classList.add('hidden');
        });
        document.querySelectorAll('.panel-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        document.getElementById(`${panelId}-panel`).classList.remove('hidden');
        document.querySelector(`.panel-tab[data-panel="${panelId}"]`).classList.add('active');
    }

    function createNewProject() {
        const projectName = document.getElementById('project-name').value;
        const template = document.getElementById('project-template').value;
        const language = document.getElementById('project-language').value;
        
        if (!projectName) {
            alert('Por favor ingresa un nombre para el proyecto');
            return;
        }

        currentProject = {
            name: projectName,
            packageName: document.getElementById('package-name').value,
            version: document.getElementById('app-version').value,
            sdkVersion: document.getElementById('sdk-version').value,
            language: language,
            files: []
        };

        // Crear estructura básica del proyecto
        createProjectStructure(template, language);
        updateProjectTree();
        hideNewProjectModal();
        
        logToConsole(`Proyecto "${projectName}" creado exitosamente`);
        buildStatusElement.textContent = 'Proyecto listo';
    }

    function createProjectStructure(template, language) {
        // Crear estructura básica de directorios
        const directories = [
            'app',
            'app/src/main',
            'app/src/main/java',
            'app/src/main/res',
            'app/src/main/res/layout',
            'app/src/main/res/values',
            'app/src/main/assets'
        ];

        // Archivos básicos
        const files = [
            {
                path: 'app/src/main/AndroidManifest.xml',
                content: generateAndroidManifest()
            },
            {
                path: 'app/src/main/res/values/strings.xml',
                content: generateStringsXml()
            },
            {
                path: 'app/src/main/res/values/styles.xml',
                content: generateStylesXml()
            },
            {
                path: 'app/build.gradle',
                content: generateBuildGradle()
            }
        ];

        // Archivo de actividad principal según el lenguaje
        const mainActivityPath = `app/src/main/java/${currentProject.packageName.replace(/\./g, '/')}/MainActivity.${language === 'java' ? 'java' : 'kt'}`;
        files.push({
            path: mainActivityPath,
            content: generateMainActivity(language, template)
        });

        // Layout principal
        files.push({
            path: 'app/src/main/res/layout/activity_main.xml',
            content: generateMainLayout(template)
        });

        currentProject.files = files;
    }

    function generateAndroidManifest() {
        return `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${currentProject.packageName}">

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme">
        <activity android:name=".MainActivity">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>`;
    }

    function generateStringsXml() {
        return `<resources>
    <string name="app_name">${currentProject.name}</string>
    <string name="hello_world">Hello World!</string>
</resources>`;
    }

    function generateStylesXml() {
        return `<resources>
    <!-- Base application theme. -->
    <style name="AppTheme" parent="Theme.AppCompat.Light.DarkActionBar">
        <!-- Customize your theme here. -->
        <item name="colorPrimary">@color/colorPrimary</item>
        <item name="colorPrimaryDark">@color/colorPrimaryDark</item>
        <item name="colorAccent">@color/colorAccent</item>
    </style>
</resources>`;
    }

    function generateBuildGradle() {
        return `apply plugin: 'com.android.application'

android {
    compileSdkVersion ${currentProject.sdkVersion}
    defaultConfig {
        applicationId "${currentProject.packageName}"
        minSdkVersion 21
        targetSdkVersion ${currentProject.sdkVersion}
        versionCode 1
        versionName "${currentProject.version}"
    }
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}

dependencies {
    implementation fileTree(dir: 'libs', include: ['*.jar'])
    implementation 'androidx.appcompat:appcompat:1.3.0'
    implementation 'androidx.constraintlayout:constraintlayout:2.0.4'
}`;
    }

    function generateMainActivity(language, template) {
        if (language === 'java') {
            return `package ${currentProject.packageName};

import androidx.appcompat.app.AppCompatActivity;
import android.os.Bundle;

public class MainActivity extends AppCompatActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
    }
}`;
        } else {
            return `package ${currentProject.packageName}

import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
    }
}`;
        }
    }

    function generateMainLayout(template) {
        return `<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    tools:context=".MainActivity">

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Hello World!"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintLeft_toLeftOf="parent"
        app:layout_constraintRight_toRightOf="parent"
        app:layout_constraintTop_toTopOf="parent" />

</androidx.constraintlayout.widget.ConstraintLayout>`;
    }

    function updateProjectTree() {
        projectTree.innerHTML = '';
        
        if (!currentProject) return;
        
        // Mostrar estructura del proyecto
        const projectRoot = createTreeItem(currentProject.name, 'folder', true);
        projectTree.appendChild(projectRoot);
        
        // Agregar archivos
        currentProject.files.forEach(file => {
            const parts = file.path.split('/');
            let currentParent = projectRoot;
            
            for (let i = 0; i < parts.length - 1; i++) {
                let folder = Array.from(currentParent.children).find(child => 
                    child.textContent === parts[i] && child.classList.contains('folder')
                );
                
                if (!folder) {
                    folder = createTreeItem(parts[i], 'folder');
                    currentParent.appendChild(folder);
                }
                
                currentParent = folder;
            }
            
            const fileName = parts[parts.length - 1];
            const fileItem = createTreeItem(fileName, 'file');
            fileItem.addEventListener('click', () => openFile(file.path));
            currentParent.appendChild(fileItem);
        });
    }

    function createTreeItem(name, type, isRoot = false) {
        const item = document.createElement('div');
        item.className = `tree-item ${type}`;
        item.textContent = name;
        
        if (isRoot) {
            const icon = document.createElement('i');
            icon.className = 'material-icons';
            icon.textContent = 'folder';
            item.insertBefore(icon, item.firstChild);
        }
        
        return item;
    }

    function openFile(filePath) {
        // Verificar si el archivo ya está abierto
        const existingTab = openFiles.find(file => file.path === filePath);
        
        if (existingTab) {
            // Cambiar a la pestaña existente
            setActiveFile(existingTab);
            return;
        }
        
        // Buscar el archivo en el proyecto
        const file = currentProject.files.find(f => f.path === filePath);
        if (!file) return;
        
        // Crear nueva pestaña
        const tab = document.createElement('div');
        tab.className = 'tab active';
        tab.textContent = filePath.split('/').pop();
        tab.dataset.path = filePath;
        
        // Cerrar otras pestañas activas
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        
        editorTabs.appendChild(tab);
        
        // Agregar a archivos abiertos
        const fileObj = {
            path: filePath,
            content: file.content,
            tabElement: tab
        };
        
        openFiles.push(fileObj);
        setActiveFile(fileObj);
        
        // Configurar el editor
        const mode = getEditorMode(filePath);
        editor.session.setMode(mode);
        editor.setValue(file.content, -1);
        
        // Actualizar estado
        currentFileElement.textContent = filePath;
    }

    function getEditorMode(filePath) {
        const extension = filePath.split('.').pop().toLowerCase();
        
        switch (extension) {
            case 'java': return 'ace/mode/java';
            case 'kt': return 'ace/mode/kotlin';
            case 'xml': return 'ace/mode/xml';
            case 'gradle': return 'ace/mode/groovy';
            default: return 'ace/mode/text';
        }
    }

    function setActiveFile(file) {
        // Desactivar todas las pestañas
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        
        // Activar la pestaña seleccionada
        file.tabElement.classList.add('active');
        activeFile = file;
        
        // Actualizar editor
        editor.setValue(file.content, -1);
        const mode = getEditorMode(file.path);
        editor.session.setMode(mode);
        
        // Actualizar estado
        currentFileElement.textContent = file.path;
    }

    function saveCurrentFile() {
        if (!activeFile) return;
        
        // Actualizar contenido en memoria
        activeFile.content = editor.getValue();
        
        // Actualizar en el proyecto
        const projectFile = currentProject.files.find(f => f.path === activeFile.path);
        if (projectFile) {
            projectFile.content = activeFile.content;
        }
        
        logToConsole(`Archivo guardado: ${activeFile.path}`);
    }

    function closeCurrentTab() {
        if (!activeFile) return;
        
        // Guardar cambios
        saveCurrentFile();
        
        // Eliminar pestaña
        const tabIndex = openFiles.findIndex(file => file.path === activeFile.path);
        if (tabIndex >= 0) {
            openFiles.splice(tabIndex, 1);
            activeFile.tabElement.remove();
        }
        
        // Activar la siguiente pestaña
        if (openFiles.length > 0) {
            setActiveFile(openFiles[openFiles.length - 1]);
        } else {
            activeFile = null;
            editor.setValue('', -1);
            currentFileElement.textContent = 'Sin archivo abierto';
        }
    }

    function buildProject() {
        if (!currentProject) {
            logToConsole('Error: No hay proyecto abierto', 'error');
            return;
        }
        
        logToConsole('Iniciando compilación...');
        buildStatusElement.textContent = 'Compilando...';
        
        // Simular proceso de compilación
        setTimeout(() => {
            logToConsole('Compilando código Java/Kotlin...');
            
            setTimeout(() => {
                logToConsole('Generando recursos...');
                
                setTimeout(() => {
                    logToConsole('Creando APK...');
                    
                    setTimeout(() => {
                        logToConsole('Compilación completada exitosamente', 'success');
                        buildStatusElement.textContent = 'Compilación exitosa';
                    }, 1000);
                }, 1000);
            }, 1000);
        }, 1000);
    }

    function runProject() {
        if (!currentProject) {
            logToConsole('Error: No hay proyecto abierto', 'error');
            return;
        }
        
        logToConsole('Ejecutando aplicación...');
        buildStatusElement.textContent = 'Ejecutando...';
        
        // Simular ejecución
        setTimeout(() => {
            logToConsole('Aplicación iniciada', 'success');
            buildStatusElement.textContent = 'Ejecución completada';
            
            // Mostrar vista previa (simulada)
            appPreview.srcdoc = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <style>
                        body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
                        .app-container { width: 360px; height: 640px; border: 1px solid #ccc; margin: 0 auto; position: relative; overflow: hidden; }
                        .status-bar { height: 24px; background: #333; color: white; padding: 4px; font-size: 12px; }
                        .app-content { height: calc(100% - 24px); display: flex; justify-content: center; align-items: center; }
                        .hello-text { font-size: 24px; }
                    </style>
                </head>
                <body>
                    <div class="app-container">
                        <div class="status-bar">${currentProject.name}</div>
                        <div class="app-content">
                            <div class="hello-text">Hello World!</div>
                        </div>
                    </div>
                </body>
                </html>
            `;
            
            showPanel('preview');
        }, 2000);
    }

    function exportAPK() {
        if (!currentProject) {
            logToConsole('Error: No hay proyecto abierto', 'error');
            return;
        }
        
        logToConsole('Generando APK para exportar...');
        buildStatusElement.textContent = 'Exportando...';
        
        // Simular generación de APK
        setTimeout(() => {
            logToConsole('APK generada exitosamente', 'success');
            buildStatusElement.textContent = 'APK lista para descargar';
            
            // Crear enlace de descarga
            const apkName = `${currentProject.name.replace(/\s+/g, '_')}_v${currentProject.version}.apk`;
            const blob = new Blob(['APK simulada - Contenido real se generaría con el compilador'], { type: 'application/vnd.android.package-archive' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = apkName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 2000);
    }

    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                logToConsole(`Error al entrar en pantalla completa: ${err.message}`, 'error');
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }

    function openProject() {
        logToConsole('Esta funcionalidad requeriría integración con el sistema de archivos del navegador', 'info');
    }

    function logToConsole(message, type = 'info') {
        const line = document.createElement('div');
        line.textContent = message;
        
        switch (type) {
            case 'error':
                line.style.color = 'var(--error-color)';
                break;
            case 'success':
                line.style.color = 'var(--secondary-color)';
                break;
            case 'warning':
                line.style.color = 'var(--warning-color)';
                break;
            default:
                line.style.color = 'var(--text-color)';
        }
        
        buildOutputElement.appendChild(line);
        buildOutputElement.scrollTop = buildOutputElement.scrollHeight;
    }

    // Inicialización
    logToConsole('IDE listo. Crea un nuevo proyecto para comenzar.');
});
