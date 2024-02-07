const express = require("express")
require("./config/config")

const app = express()
app.use(express.json())

const port = process.env.port

app.listen(port, ()=> {
    console.log(`server is listening on port ${port}`)
})