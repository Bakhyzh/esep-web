FROM node:24-alpine AS build
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL=http://localhost:18081
ARG VITE_OIDC_URL=http://localhost:8180
ARG VITE_OIDC_REALM=esep
ARG VITE_OIDC_CLIENT_ID=esep-platform-web
ENV VITE_AUTH_MODE=keycloak
RUN npm run build

FROM nginx:1.30.6-alpine@sha256:583b7f2fce1cdb8da5ad5c39ebd3c33b98b87d493190e548bdee1fa8c619c311
COPY infrastructure/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /build/dist /usr/share/nginx/html
USER nginx
EXPOSE 8080
STOPSIGNAL SIGQUIT
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=5 CMD wget -qO- http://127.0.0.1:8080/health | grep -q healthy
ENTRYPOINT ["nginx"]
CMD ["-g", "daemon off;"]
