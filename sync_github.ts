import { execSync } from 'child_process';

try {
    console.log("Iniciando sincronización desde GitHub (rama main)...");
    // Descarga el tarball de la rama main y lo extrae sobrescribiendo los archivos locales
    execSync('curl -L -s https://github.com/bdaitravel/bdai-travel-app/archive/refs/heads/main.tar.gz | tar -xz --strip-components=1', { stdio: 'inherit' });
    console.log("¡Sincronización completada con éxito!");
} catch (e) {
    console.error("Error durante la sincronización:", e);
}
