# Use the official Rasa Pro image as base
FROM europe-west3-docker.pkg.dev/rasa-releases/rasa-pro/rasa-pro:3.12.18

# Set the working directory
WORKDIR /app

# Copy the Rasa project files
COPY . .

# Expose the ports for Rasa server and action server
EXPOSE 5005 5055

# Start just the Rasa server for now
CMD ["run", "--enable-api", "--cors", "*", "--port", "5005", "--model", "models"] 