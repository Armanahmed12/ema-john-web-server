const express = require("express");
const cors = require("cors");
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 3500;

// middleware
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {

  res.send("Hello John")

})

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_USER_PASSWORD}@cluster0.bb6w0qv.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const productsCollection = client.db("ema-john-DB").collection("products");

    // send products based on pageNumber
    app.get('/products/pageInfo', async (req, res) => {

      const queryParams = req.query;
      const allProducts = await productsCollection.find().toArray();
      const pageNum = parseInt(queryParams.pageNum || 1);
      if (pageNum == 1) {

        res.send(allProducts.slice(0, 6))

      }
      else {

        const productsStartPoint = (pageNum - 1) * (queryParams.limit || 6);
        const productsEndPoint = pageNum * (queryParams.limit || 6);
        res.send(allProducts.slice(productsStartPoint, productsEndPoint));

      }

    })

    app.get('/totalProducts', async (req, res) => {

      const result = await productsCollection.estimatedDocumentCount();
      res.send({ totalProducts: result });

    })

    // // send selected products for displaying in cart component.
    app.post('/selectedCartProducts', async (req, res) => {

      const allSelectedProductsIds = req.body;
      const arrayOfIds = allSelectedProductsIds.map(eachId => {

        const id = Object.keys(eachId);
        return id[0];

      })

        const ProductId = arrayOfIds.map(id => new ObjectId(id));
        const query = { _id: {$in: ProductId} }
        let matchedProducts = await productsCollection.find(query).toArray();

        let selectedPds = [];
        for (let i = 0; i < arrayOfIds?.length; i++){

        let modifiedPd = matchedProducts.find(eachPd => eachPd._id == arrayOfIds[i]);
        
          modifiedPd.quantity = allSelectedProductsIds[i][modifiedPd._id] > 1 ? allSelectedProductsIds[i][modifiedPd._id] : 1 ;
    
          selectedPds.push(modifiedPd)

        }
             
             res.send(selectedPds)
             console.log(selectedPds);
        })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //   await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {

  console.log(`This app is running on Port ${port}`)

})