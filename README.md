# Bitespeed Identity Reconciliation Service

This is a backend service built for the Bitespeed backend engineering task. It exposes an endpoint that receives customer orders containing emails and phone numbers, and links them together to create a unified customer identity.

## 🚀 Live Demo
**Base URL:** https://bitespeed-identity-task-jgaq.onrender.com

## 🛠️ Tech Stack
* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** PostgreSQL (Hosted on Neon)
* **ORM:** Sequelize
* **Deployment:** Render

## 📡 API Endpoints

### 1. Identify Customer
Consolidates contact information and returns a unified primary contact.

* **URL:** `/identify`
* **Method:** `POST`
* **Headers:** `Content-Type: application/json`

**Request Body Example:**
{
  "email": "lorraine@hillvalley.edu",
  "phoneNumber": "123456"
}

**Response Example:**
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["lorraine@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": []
  }
}
