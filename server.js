// const express = require("express")
// require("./config/config")

// const app = express()
// app.use(express.json())

// const port = process.env.port

// app.listen(port, ()=> {
//     console.log(`server is listening on port ${port}`)
// })

const express = require('express');
require('dotenv').config();

const cors = require ("cors")

const docRouter = require('./router.js/docMateRoute');
const fileUpload = require ("express-fileupload")
const app = express();

app.use(fileUpload({
    useTempFiles: true,
    limits: { fileSize: 5 * 1024 * 1024 },
  }));



port = process.env.PORT

app.use(express.json());

app.use(cors(``*``))
require("./config/config")

app.get('/', (req, res) => {
    res.send("Welcome to DocMate");
})

app.use(docRouter); 

app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});