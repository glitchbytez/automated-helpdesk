# Use the official Rasa Pro image as base
FROM europe-west3-docker.pkg.dev/rasa-releases/rasa-pro/rasa-pro:3.12.18

# Switch to root to create directories with proper permissions
USER root

# Create cache directory with proper permissions in a writable location
RUN mkdir -p /tmp/.rasa/cache/rasa-llm-cache && \
    chmod -R 777 /tmp/.rasa

# Set environment variables for cache location
ENV RASA_CACHE_PATH=/tmp/.rasa
ENV XDG_CACHE_HOME=/tmp

# Set the working directory
WORKDIR /app

# Copy the Rasa project files
COPY . .

# Switch back to the rasa user (if it exists in the image)
RUN if id rasa >/dev/null 2>&1; then chown -R rasa:rasa /app /tmp/.rasa; fi

# Expose the ports for Rasa server and action server
EXPOSE 5005 5055

# Start just the Rasa server for now
CMD ["run", "--enable-api", "--cors", "*", "--port", "5005", "--model", "models"] 