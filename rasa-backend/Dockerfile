# Use the official Rasa image as base
FROM europe-west3-docker.pkg.dev/rasa-releases/rasa-pro/rasa-pro:3.12.18

# Set the working directory
WORKDIR /app

# Copy the Rasa project files
COPY . .

# Install any additional Python dependencies if requirements.txt exists
# RUN if [ -f requirements.txt ]; then pip install -r requirements.txt; fi

# Expose the ports for Rasa server and action server
EXPOSE 5005 5055

# Train the model
RUN rasa train

# Start both Rasa server and action server
CMD ["sh", "-c", "rasa run actions --port 5055 & rasa run --enable-api --cors \"*\" --port 5005"] 