import "dotenv/config"
import connectDB  from "./db/index.js"
import { app } from "./app.js"

const port = process.env.PORT || 3002

connectDB().then(() => {
  app.listen(port,()=>{
    console.log(`SERVER is running on http://localhost:${port}`);
  })
}).catch((err) => {
  console.log("MongoDB connection ERROR",err);
});

  

