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
    const announcementCollection = db.collection("announcements");

   


    app.get('/users/admin/:email',  async (req, res) => {
      const email = req.params.email;

      const query = { email: email };
      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === 'admin';
      }
      res.send({ admin });
    })

    


    app.post('/users', async (req, res) => {
      const { email, name } = req.body;
    
      // Validate input
      if (!email || !name) {
        return res.status(400).json({ error: "Email and name are required" });
      }
    
      try {
        const existingUser = await userCollection.findOne({ email });
        if (existingUser) {
          return res.status(409).json({ message: "User already exists" });
        }
    
        const result = await userCollection.insertOne({ email, name });
        res.status(201).json({ message: "User added successfully", userId: result.insertedId });
      } catch (error) {
        console.error("Error adding user:", error);
        res.status(500).json({ error: "Database operation failed" });
      }
    });

    app.get('/users',  async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });


    // Endpoint to get all announcements
app.get('/announcements', async (req, res) => {
  try {
    const announcements = await announcementCollection.find().toArray();
    res.status(200).json(announcements);
  } catch (error) {
    console.error("Error fetching announcements:", error);
    res.status(500).send("Failed to fetch announcements");
  }
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
