const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const mongoose = require('mongoose')
const Usuarios = mongoose.model('Usuarios')

passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
    // ahi se le pasa lo del formulario
},async (email,password,done)=>{
    const usuario = await Usuarios.findOne({email})

    // mensaje de error, usuario y opciones
    if(!usuario) return done(null,false,{
        message: 'Usuario no existente'
    })

    // el usuario existe hay  verificarlo
    // compararPassword es la funcion que creamos
    const verificarPass = usuario.compararPassword(password)
    if(!verificarPass) return done(null,false,{
        message: 'Password o email incorrecto'
    })

    // usuario existe y password correcto
    return done(null,usuario)
}))

passport.serializeUser((usuario,done)=>done(null,usuario._id))
passport.deserializeUser(async (id,done)=>{
    const usuario = await Usuarios.findById(id).exec()
    return done(null, usuario)
})

module.exports = passport