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

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});


async function run() {
  try {
   
    await client.connect();
    console.log("Connected to MongoDB");

   
    const db = client.db("BuildDB");
    const apartmentCollection = db.collection("apartments");
    const agreementCollection = db.collection("agreements");
    const userCollection = db.collection("users");

    app.get('/users',  async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });


    app.get('/users/admin/:email',  async (req, res) => {
      const email = req.params.email;

      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden access' })
      }

      const query = { email: email };
      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === 'admin';
      }
      res.send({ admin });
    })

    app.post('/users', async (req, res) => {
      const user = req.body;
      // insert email if user doesnt exists: 
      // you can do this many ways (1. email unique, 2. upsert 3. simple checking)
      const query = { email: user.email }
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: 'user already exists', insertedId: null })
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    
    app.get('/apartments', async (req, res) => {
      try {
        const apartments = await apartmentCollection.find().toArray();
        res.status(200).json(apartments);
      } catch (error) {
        console.error("Error fetching apartments:", error);
        res.status(500).send("Failed to fetch apartments");
      }
    });

    
    app.post('/agreements', async (req, res) => {
      const { userName, userEmail, floorNo, blockName, apartmentNo, rent, status } = req.body;

      
      if (!userName || !userEmail || !floorNo || !blockName || !apartmentNo || !rent) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      try {
        
        

        const emailAgreement = await agreementCollection.findOne({ userEmail });
        if (emailAgreement) {
          return res.status(409).json({ error: true, message: 'This email already has an agreement' });
        }

        const newAgreement = {
          userName,
          userEmail,
          floorNo,
          blockName,
          apartmentNo,
          rent,
          status: status || 'pending', 
          createdAt: new Date(),
        };

        
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
