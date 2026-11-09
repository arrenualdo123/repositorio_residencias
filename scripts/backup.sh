#!/bin/bash
# ==============================================================================
# Script de Respaldo Automatizado - Repositorio Institucional TSJ La Huerta
# ==============================================================================
# Guarda un volcado completo de la base de datos PostgreSQL y los archivos PDF.
# ==============================================================================

BACKUP_DIR="/var/backups/repositorio_residencias"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
TEMP_DIR="/tmp/repositorio_backup_$TIMESTAMP"
DB_NAME="repositorio_residencias"
DB_USER="postgres"
APP_DIR="/var/www/repositorio_residencias"

mkdir -p "$BACKUP_DIR"
mkdir -p "$TEMP_DIR"

echo "=== Iniciando Respaldo del Repositorio [$TIMESTAMP] ==="

# 1. Respaldo de Base de Datos PostgreSQL
echo "[1/3] Exportando base de datos PostgreSQL ($DB_NAME)..."
sudo -u postgres pg_dump -d "$DB_NAME" -F c -b -v -f "$TEMP_DIR/database_$TIMESTAMP.sql"

# 2. Respaldo de Archivos Almacenados (PDFs de alumnos y catálogo)
echo "[2/3] Empaquetando documentos y reportes técnicos..."
if [ -d "$APP_DIR/backend/storage/app" ]; then
    tar -czf "$TEMP_DIR/storage_$TIMESTAMP.tar.gz" -C "$APP_DIR/backend/storage/app" .
fi

# 3. Empaquetar todo en un único archivo comprimido
FINAL_ARCHIVE="$BACKUP_DIR/backup_repositorio_$TIMESTAMP.tar.gz"
tar -czf "$FINAL_ARCHIVE" -C "$TEMP_DIR" .
rm -rf "$TEMP_DIR"

# 4. Rotación: Mantener solo los últimos 7 respaldos para no saturar el disco
find "$BACKUP_DIR" -name "backup_repositorio_*.tar.gz" -type f -mtime +7 -delete

BACKUP_SIZE=$(du -sh "$FINAL_ARCHIVE" | awk '{print $1}')
echo "[3/3] Respaldo generado con éxito en: $FINAL_ARCHIVE ($BACKUP_SIZE)"
echo "=== Respaldo completado con éxito ==="
