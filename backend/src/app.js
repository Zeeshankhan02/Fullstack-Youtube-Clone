import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { ensureTempDirExists } from './src/utils/initTempDir.util.js';


const app = express()
ensureTempDirExists();

app.use(cors({
  origin:"*",
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}))
app.use(express.json({limit:'16kb'}))
app.use(express.urlencoded({limit:'16kb'}))
app.use(express.static("public"))
app.use(cookieParser())


// importing routes
import healthCheckRouter from './routes/health.route.js'
import userRouter from './routes/user.routes.js'

// routes declaration
app.use("/healthCheck",healthCheckRouter)
app.use("/api/v1/users",userRouter)



export {app}