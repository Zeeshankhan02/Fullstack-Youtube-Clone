import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'


const app = express()

app.use(cors())
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