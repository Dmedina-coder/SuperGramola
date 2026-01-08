# Etapa 1: Construcción
FROM node:20-alpine AS build
WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Construir la aplicación para producción
RUN npm run build

# Etapa 2: Servir con nginx
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Eliminar archivos por defecto de nginx
RUN rm -rf ./*

# Copiar archivos construidos desde la etapa anterior
COPY --from=build /app/dist/FrontEndGramola/browser ./

# Copiar configuración personalizada de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer el puerto
EXPOSE 80

# Comando para ejecutar nginx
CMD ["nginx", "-g", "daemon off;"]
