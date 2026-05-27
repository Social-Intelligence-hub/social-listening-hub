FROM mcr.microsoft.com/playwright:v1.42.0-jammy

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el código fuente y las configuraciones de compilación
COPY . .

# Compilar TypeScript a JavaScript
RUN npx tsc

# Comando por defecto para arrancar el scraping cycle al encender el contenedor
CMD ["node", "dist/index.js"]
