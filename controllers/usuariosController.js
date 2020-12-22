const mongoose = require('mongoose')
const Usuarios = mongoose.model('Usuarios')
const multer = require('multer')
const shortid = require('shortid')

const {
    body,
    validationResult
} = require('express-validator');

exports.subirImagen = (req,res,next) => {

    upload(req,res,function(error){
        if(error){
            // verifica que sea error de multer
            if(error instanceof multer.MulterError){
                if(error.code == 'LIMIT_FILE_SIZE'){
                    req.flash('error','El archivo es muy grande')
                }else{
                    req.flash('error',error.message)
                }
            }else{
                req.flash('error',error.message)
            }
            res.redirect('/administracion')
            return 
        }else{
            return next()
        }
    })
}

// opciones de multer
const configuracionMulter = {
    limits:{fileSize:100000},
    storage: fileStorage = multer.diskStorage({
        destination:(req,file,cb)=>{
            cb(null,__dirname+'../../public/uploads/perfiles')
        },
        filename:(req,file,cb) => {
            const extension = file.mimetype.split('/')[1]

            cb(null,`${shortid.generate()}.${extension}`)
        }
    }),
    fileFilter(req,file,cb){
        if(file.mimetype == 'image/jpeg' || file.mimetype == 'image/png'){
            // el callback se ejcuta como true o false, true: imagen aceptada
            // primer parametro es el error
            cb(null,true)
        }else{
            cb(new Error('Formato no valido'),false)
        }
    }
}

// despues de single es como este en el input el name
const upload = multer(configuracionMulter).single('imagen')

exports.formCrearCuenta = (req,res,next)=>{
    res.render('crear-cuenta',{
        nombrePagina: 'Crea tu cuenta en devjobs',
        tagLine:'Comienza a publicar tus vacantes gratis, solo debes crear una cuenta'
    })
}

exports.validarRegistro =  async (req,res,next)=>{ 

    const rules = [
        body('nombre').not().isEmpty().withMessage('El nombre es obligatorio').escape(),
        body('email').isEmail().withMessage('El email es obligatorio').normalizeEmail(),
        body('password').not().isEmpty().withMessage('El password es obligatorio').escape(),
        body('confirmar').not().isEmpty().withMessage('Confirmar password es obligatorio').escape(),
        body('confirmar').equals(req.body.password).withMessage('Los passwords no son iguales')
    ];
 
    await Promise.all(rules.map(validation => validation.run(req)));
    const errores = validationResult(req);


    //si hay errores
    if (!errores.isEmpty()) {
        // map recorre el arreglo y retorna los valores en req.flash 
        req.flash('error', errores.array().map(error => error.msg));
        res.render('crear-cuenta', {
            nombrePagina: 'Crea una cuenta en Devjobs',
            tagline: 'Comienza a publicar tus vacantes gratis, solo debes crear una cuenta',
            mensajes: req.flash()
        })
        return;
    }
 
    //si toda la validacion es correcta
    next();
}

exports.crearUsuario = async (req,res,next)=>{ 

    const usuario = new Usuarios(req.body)

    try{
        await usuario.save()
        res.redirect('/iniciar-sesion')
    }catch (error){
        // aqui llega el error lanzado desde el modelo
        // al guardarse en flash el otro lado ya sabe que imprimir
        req.flash('error',error)
        res.redirect('/crear-cuenta')
    }

}

exports.formIniciarSesion =  (req,res,next)=>{ 

   res.render('iniciar-sesion',{
       nombrePagina: 'Iniciar sesion debjobs'
   })

}

// form editar el perfil
exports.formEditarPerfil = (req,res) => {
    res.render('editar-perfil',{
        nombrePagina: 'Edita tu perfil en devjobs',
        usuario: req.user,
        cerrarSesion: true,
        nombre: req.user.nombre,
        imagen: req.user.imagen
    })
}   

// guardar cambios en el perfil
exports.editarPerfil = async (req,res)=>{
    const usuario = await Usuarios.findById(req.user._id)
    
    usuario.nombre = req.body.nombre
    usuario.email = req.body.email
    if(req.body.password){
        usuario.password = req.body.password
    }

    if(req.file){
        usuario.imagen = req.file.filename
    }

    await usuario.save()

    req.flash('correcto','Cambios guardados correctamente')
    // redirect
    res.redirect('/administracion')
}

// sanitizar y validar el formulario de editar perfiles
exports.validarPerfil = (req,res,next) => {
    // sanitizar
    req.sanitizeBody('nombre').escape()
    req.sanitizeBody('email').escape()
    if(req.body.password){
        req.sanitizeBody('password').escape()
    }

    // validar
    req.checkBody('nombre','El nombre no puede ir vacio').notEmpty()
    req.checkBody('email','El email no puede ir vacio').notEmpty()

    const errores = req.validationErrors()

    if(errores){
        req.flash('error',errores.map(error => error.msg))
        res.render('editar-perfil',{
            nombrePagina: 'Edita tu perfil en devjobs',
            usuario: req.user,
            cerrarSesion: true,
            nombre: req.user.nombre,
            mensajes: req.flash()
        })
    }

    next() // todo bien

}