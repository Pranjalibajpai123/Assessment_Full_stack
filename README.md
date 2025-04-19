# Delivery Cost Calculator API

A REST API that calculates the minimum delivery cost for orders from multiple warehouses to a single location.

## 🚀 Features

- Calculates optimal delivery routes considering multiple warehouses
- Handles complex delivery scenarios with intermediate stops
- Validates order inputs
- Returns minimum delivery cost

## 📦 Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

## 🏃‍♂️ Running Locally

Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## 🌐 API Endpoint

### POST /calculate-cost

Calculate the minimum delivery cost for an order.

**Request Body:**
```json
{
    "A": 1,
    "G": 1,
    "H": 1,
    "I": 3
}
```

**Response:**
```json
{
    "minimum_cost": 86
}
```

## 🧪 Test Cases

1. `{ "A": 1, "G": 1, "H": 1, "I": 3 }` → 86
2. `{ "A": 1, "B": 1, "C": 1, "G": 1, "H": 1, "I": 1 }` → 118
3. `{ "A": 1, "B": 1, "C": 1 }` → 78
4. `{ "A": 1, "B": 1, "C": 1, "D": 1 }` → 168

## 🚀 Deployment

This project can be deployed on Vercel:

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

## 📝 Project Structure

```
.
├── app.js              # Main application file
├── routes/
│   └── cost.js        # Cost calculation endpoint
├── services/
│   └── deliveryService.js  # Business logic
├── utils/
│   └── constants.js   # Static data
├── vercel.json        # Deployment configuration
└── package.json       # Project dependencies
```

## 🤝 Contributing

Feel free to submit issues and enhancement requests! 