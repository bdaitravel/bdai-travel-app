---
description: Comandos para subir el git y a la vez desplegar en vercel via CLI por problems 2 cuentas github
---

# 1. Solicitar el commit al usuario
$commitMessage = Read-Host "Introduce el mensaje para el commit"

# Verificar que el mensaje no esté vacío
if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    Write-Error "El mensaje del commit no puede estar vacío."
    exit
}

# 2. Subir git
git add .
git commit -m "$commitMessage"
git push origin javier

# 3. Ejecutar despliegue a producción con Vercel CLI sin pedir confirmacion

vercel --prod --yes

#4. Informar que se ha ejecutado
Write-Host "Git push y vercel cli ejecutados" -ForegroundColor Magenta