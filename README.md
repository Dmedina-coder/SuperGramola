# 🐳 Docker - SuperGramola

Este proyecto incluye configuración Docker para ejecutar tanto el frontend como el backend de SuperGramola.

## 🚀 Puertos Personalizados

- **Backend (Spring Boot)**: http://localhost:8090
- **Frontend (Angular)**: http://localhost:4300

## 📋 Requisitos Previos

- Docker Desktop instalado
- Docker Compose instalado

## 🏃 Iniciar la Aplicación

### Construir e iniciar todos los servicios:
```bash
docker-compose up --build
```

### Iniciar sin reconstruir:
```bash
docker-compose up
```

### Iniciar en modo detached (segundo plano):
```bash
docker-compose up -d
```

## 🛑 Detener la Aplicación

### Detener servicios:
```bash
docker-compose down
```

### Detener y eliminar volúmenes:
```bash
docker-compose down -v
```

## 🔍 Comandos Útiles

### Ver logs de todos los servicios:
```bash
docker-compose logs -f
```

### Ver logs de un servicio específico:
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Reconstruir un servicio específico:
```bash
docker-compose build backend
docker-compose build frontend
```

### Reiniciar un servicio:
```bash
docker-compose restart backend
docker-compose restart frontend
```

### Ver estado de los contenedores:
```bash
docker-compose ps
```

## 🔧 Configuración

### Backend
- Archivo: `BackEndGramola/Dockerfile`
- Puerto interno: 8080
- Puerto externo: 8090
- Conexión a base de datos MySQL externa ya configurada

### Frontend
- Archivo: `FrontEndGramola/Dockerfile`
- Puerto interno: 80 (nginx)
- Puerto externo: 4300
- Servido con Nginx para mejor rendimiento

## 📝 Notas

- Los servicios están conectados a través de una red interna llamada `gramola-network`
- El frontend depende del backend, por lo que el backend siempre arrancará primero
- Los health checks están configurados para verificar la salud de los servicios
- La configuración de base de datos usa la conexión externa ya especificada en `application.properties`

## ⚙️ Personalización de Puertos

Si necesitas cambiar los puertos, edita el archivo `docker-compose.yml`:

```yaml
ports:
  - "TU_PUERTO_EXTERNO:PUERTO_INTERNO"
```

Ejemplo para cambiar el backend al puerto 9000:
```yaml
backend:
  ports:
    - "9000:8080"
```

## 🐛 Troubleshooting

### Error: Puerto ya en uso
Si ves un error de puerto en uso, cambia el puerto externo en `docker-compose.yml`.

### El backend no arranca
Verifica la conexión a la base de datos:
```bash
docker-compose logs backend
```

### El frontend no muestra datos
Asegúrate de que el backend esté funcionando:
```bash
curl http://localhost:8090
```

### Reconstruir desde cero
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```
