const mongoose = require('mongoose')
require('./config/db')

const express = require('express')
const exphbs = require('express-handlebars')
const handlebars = require('handlebars')
const {allowInsecurePrototypeAccess} = require('@handlebars/allow-prototype-access')
const path = require('path')
const router = require('./routes/index')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session)
const bodyParser = require('body-parser')
const flash = require('connect-flash')
const createError = require('http-errors')
const passport = require('./config/passport')

require('dotenv').config({path:'variables.env'})

const app = express()


// habiltiar body parser
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))

//habiltiar handebars
// HELPERS forma de registrar scripts que se ejecutan con habdlebars antes de su ¿salida?
app.engine('handlebars',
    exphbs({
        handlebars: allowInsecurePrototypeAccess(handlebars),
        defaultLayout: 'layout',
        helpers: require('./helpers/handlebars')
    })
)
app.set('view engine','handlebars')

app.use(express.static(path.join(__dirname,'public')))

app.use(cookieParser())

app.use(session({
    secret: process.env.SECRETO,
    key: process.env.KEY,
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({mongooseConnection: mongoose.connection})
}))

// inicializar passport
app.use(passport.initialize())
app.use(passport.session())

// alertas y flash messages
app.use(flash())

// nuestro middleware
app.use((req,res,next) => {
    // ahi se almacenan los mensajes, siempre que haya un flash que enviar se llama a 
    // req.flash() y res.locals.mensajes se va a llenar con flash
    res.locals.mensajes = req.flash()
    next()
})

app.use('/',router())

// 404 pagina no existente
app.use((req,res,next)=>{
    // primer codigo, mensaje de error
    next(createError(404,'No encontrado'))
})

// administracion de los errores
app.use((error,req,res,next)=>{
    res.locals.mensaje = error.message
    const status = error.status || 500
    res.locals.status = status
    
    res.status(status)
    res.render('error')
})

// dejar que heroku asigne el puerto
const host = '0.0.0.0'
const port = process.env.PORT

app.listen(port,host,()=>{
    console.log('El servidor esta funcionando')
})