const passport = require('passport')
const mongoose = require('mongoose')
const Vacante = mongoose.model('Vacante')
const Usuarios = mongoose.model('Usuarios')
const crypto = require('crypto')
const enviarEmail = require('../handlers/email')
const { reset } = require('nodemon')

exports.autenticarUsuario = passport.authenticate('local',{
    successRedirect: '/administracion',
    failureRedirect: '/iniciar-sesion',
    failureFlash: true,
})

// revisar si el usuario esta autenticado o no
exports.verificarUsuario = (req,res,next)=> {
    // revisar el usuario, es metodo de passport
    if(req.isAuthenticated()){
        return next() //estan autenticados
    }

    // redireccionar
    res.redirect('/iniciar-sesion')
}

exports.mostrarPanel = async (req,res)=>{

    // consultar el usuario autenticado
    const vacantes = await Vacante.find({autor:req.user._id})

    res.render('administracion',{
        nombrePagina: 'Panel de administracion',
        tagLine: 'Crea y administra tus vacantes desde aqui',
        cerrarSesion: true,
        nombre: req.user.nombre,
        imagen: req.user.imagen,
        vacantes,
    })
}

exports.cerrarSesion = (req,res)=>{
    req.logout()
    req.flash('correcto', 'Cerraste sesion')

    return res.redirect('/iniciar-sesion')
}

// formulario para reiniciar el password
exports.formReestablecerPassword = (req,res,next) => {
    res.render('reestablecer-password',{
        nombrePagina: 'Reestablecer password',
        tagLine: 'Coloca tu email'
    })
}

// genera el token en la tabla del usuario
exports.enviarToken = async (req,res,next) => {
    const usuario = await Usuarios.findOne({ email: req.body.email})

    // revisar el usuario
    if(!usuario){
        req.flash('error','No existe esa cuenta')
        return res.redirect('/iniciar-sesion')  
    }

    // el usuario existe
    usuario.token = crypto.randomBytes(20).toString('hex')
    usuario.expira = Date.now() +3600000

    // guardar el usuario
    await usuario.save()
    const resetUrl = `http://${req.headers.host}/reestablecer-password/${usuario.token}`

    // enviar email
    await enviarEmail.enviar({
        usuario,
        subject: 'Password reset',
        archivo: 'reset',
        resetUrl,
    })

    req.flash('correcto','revisa tu email para las indicaciones')
    res.redirect('/iniciar-sesion')
}

// valida si el token es valido y si el usuario existe muestra la vista
exports.reestablecerPassword = async (req,res,next) => {
    const usuario = await Usuarios.findOne({
        token: req.params.token,
        expira: {
            $gt: Date.now()
        }
    })

    // no existe el usuario o el token es invalido
    if(!usuario){
        req.flash('error','ya no es valido intenta de nuevo')
        return res.redirect('/reestablecer-password')
    }

    // todo bien, mostrar el formulario
    res.render('nuevo-password',{
        nombrePagina: 'Nuevo password'
    })
}

// almacena el nuevo password en la BD
exports.guardarPassword = async (req,res,next) => {
    const usuario = await Usuarios.findOne({
        token: req.params.token,
        expira: {
            $gt: Date.now()
        }
    })

    // no existe el usuario o el token es invalido
    if(!usuario){
        req.flash('error','ya no es valido intenta de nuevo')
        return res.redirect('/reestablecer-password')
    }

    usuario.password = req.body.password
    usuario.token = undefined
    usuario.expira = undefined

    await usuario.save()

    req.flash('correcto','Password modificado correctamente')
    req.redirect('/iniciar-sesion')

}