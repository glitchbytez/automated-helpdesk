# ⚡ Quick Setup Guide

Get the Campus Support Helpdesk System up and running in under 5 minutes!

## 🚀 Prerequisites

Before you start, make sure you have:

- **Docker Desktop** installed and running
- **Git** for cloning the repository
- **OpenAI API Key** ([Get one here](https://platform.openai.com/api-keys))
- **Text Editor** (VS Code recommended)

## 📥 1. Download & Setup

```bash
# Clone the repository
git clone <your-repository-url>
cd campus-support-helpdesk

# Copy environment template
cp .env.example .env
```

## 🔑 2. Configure Environment

Edit the `.env` file with your details:

```bash
# Required - Get from https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-proj-your_key_here

# Required - Your email for notifications
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Required - Strong secrets
JWT_SECRET=your-very-secure-jwt-secret-here
MONGO_INITDB_ROOT_PASSWORD=your-secure-db-password

# Optional - Rasa Pro License (for advanced AI features)
RASA_PRO_LICENSE=your-rasa-license-here
```

## 🚀 3. Start the System

```bash
# Start all services
docker compose up -d

# Check if everything is running
docker compose ps
```

## 🌐 4. Access Your Applications

| Application | URL | Default Login |
|-------------|-----|---------------|
| **Helpdesk Dashboard** | http://localhost:3001 | admin@example.com / admin123 |
| **Chatbot Interface** | http://localhost:3000 | No login required |

## 🔍 5. Verify Installation

Test the health endpoints:

```bash
# Windows (PowerShell)
Invoke-WebRequest -Uri "http://localhost:5500/api/health"
Invoke-WebRequest -Uri "http://localhost:5502/api/health"

# macOS/Linux
curl http://localhost:5500/api/health
curl http://localhost:5502/api/health
```

You should see `{"status":"healthy"}` responses.

## 🎯 6. Create Your First Ticket

1. Open http://localhost:3001
2. Login with default credentials
3. Navigate to "Tickets" → "New Ticket"
4. Fill out the form and submit

## 🤖 7. Test the Chatbot

1. Open http://localhost:3000
2. Type: "Hello" to start a conversation
3. Try: "I need help with my account"
4. The bot should respond and offer to create a ticket

## ⚙️ Customization

### Change Default Admin User

```bash
# Enter the backend container
docker compose exec helpdesk-backend sh

# Run the admin creation script
npm run create-admin
```

### Upload Knowledge Base Documents

1. Go to http://localhost:3001/knowledge-base
2. Upload JSON files with your FAQ/documentation
3. The chatbot will use this for better responses

### Modify Bot Responses

Edit the training data in `rasa-backend/data/` and rebuild:

```bash
docker compose build rasa-backend
docker compose restart rasa-backend
```

## 🛠️ Troubleshooting

### Services Won't Start

```bash
# Check Docker is running
docker --version

# Check ports aren't in use
netstat -an | findstr ":3000 :3001 :5500"

# View service logs
docker compose logs helpdesk-backend
```

### Database Connection Issues

```bash
# Restart MongoDB
docker compose restart mongodb

# Check MongoDB logs
docker compose logs mongodb
```

### Chatbot Not Responding

```bash
# Check Rasa service
docker compose logs rasa-backend

# Restart AI services
docker compose restart rasa-backend chatbot-data-service
```

## 📚 Next Steps

- Read the [full documentation](README.md)
- Check out the [development guide](DEVELOPMENT.md)
- Explore the [API documentation](helpdesk-backend/docs/technical/api.md)
- Join our [community discussions](https://github.com/your-repo/discussions)

## 🆘 Need Help?

- 📖 [Full Documentation](README.md)
- 🐛 [Report Issues](https://github.com/your-repo/issues)
- 💬 [Community Support](https://github.com/your-repo/discussions)

---

**🎉 That's it! Your helpdesk system is ready to use!** 