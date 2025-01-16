const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7g8b9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Main async function to handle database connections and routes
async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB");

    // Database and Collection References
    const db = client.db("BuildDB");
    const apartmentCollection = db.collection("apartments");
    const agreementCollection = db.collection("agreements");

    
    app.get('/apartments', async (req, res) => {
      try {
        const apartments = await apartmentCollection.find().toArray();
        res.status(200).json(apartments);
      } catch (error) {
        console.error("Error fetching apartments:", error);
        res.status(500).send("Failed to fetch apartments");
      }
    });

    /**
     * POST /agreements
     * Submit a new rental agreement
     */
    app.post('/agreements', async (req, res) => {
      const { userName, userEmail, floorNo, blockName, apartmentNo, rent, status } = req.body;

      // Validate required fields
      if (!userName || !userEmail || !floorNo || !blockName || !apartmentNo || !rent) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      try {
        // Check for existing agreement for the same apartment
        const existingAgreement = await agreementCollection.findOne({ apartmentNo });
        if (existingAgreement) {
          return res.status(400).json({ error: "Agreement already exists for this apartment" });
        }

        // Create a new agreement object
        const newAgreement = {
          userName,
          userEmail,
          floorNo,
          blockName,
          apartmentNo,
          rent,
          status: status || 'pending', // Default to 'pending'
          createdAt: new Date(),
        };

        // Insert the new agreement into the collection
        const result = await agreementCollection.insertOne(newAgreement);

        res.status(201).json({
          message: "Agreement submitted successfully",
          agreementId: result.insertedId,
        });
      } catch (error) {
        console.error("Error submitting agreement:", error);
        res.status(500).send("Failed to submit agreement");
      }
    });

    /**
     * GET /
     * Root route
     */
    app.get('/', (req, res) => {
      res.send('Boss is sitting');
    });

  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

// Run the server
run().catch(console.dir);

// Start listening
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
