const mongoose = require('mongoose')
require('dotenv').config({path:'variables.env'})

mongoose.connect(process.env.DATABASE,{useNewUrlParser:true,useUnifiedTopology:true})

mongoose.connection.on('error',(e)=>{
    console.log(e)
})
// importar modelos
require('../models/vacantes')
require('../models/usuarios')
