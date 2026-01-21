FROM nginx:alpine

# Copy pre-built Angular app from browser folder
COPY ecommerce-frontend/dist/ecommerce-frontend/browser /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
