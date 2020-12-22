const mongoose = require('mongoose')
const Vacante = mongoose.model('Vacante')
const multer = require('multer')
const shortid = require('shortid')

const {
    body,
    validationResult
} = require('express-validator');


exports.formularioNuevaVacante = (req,res) => {
    res.render('nueva-vacante',{
        nombrePagina: 'Nueva vacante',
        tagLine: 'Llena el formulario y publica tu vacante',
        cerrarSesion: true,
        nombre: req.user.nombre,
        imagen: req.user.imagen
    })
}

// agrega las vacantes  ala abse de datos
exports.agregarVacante = async (req,res) => {
    // esto mapea todo
    const vacante = new Vacante(req.body)

    // usuario autor de la vacante
    vacante.autor = req.user._id

    // crear arreglo de skills
    vacante.skills = req.body.skills.split(',')

    // almacenar a la abse de datos
    const nuevaVacante = await vacante.save()

    // redireccionar
    res.redirect(`/vacantes/${nuevaVacante.url}`)
}

// muestra una vacante
exports.mostrarVacante = async (req,res,next) => {
    // .populate con el nombre de la FK
    const vacante = await Vacante.findOne({url:req.params.url}).populate('autor')

    // si no hay resultados
    if(!vacante) return next()

    res.render('vacante',{
        vacante,
        nombrePagina: vacante.titulo,
        barra: true
    })

}

// 
exports.formEditarVacante = async (req,res,next) => {
    const vacante = await Vacante.findOne({url:req.params.url})

    if(!vacante) return next()

    res.render('editar-vacante',{
        vacante,
        nombrePagina: `Editar - ${vacante.titulo}`,
        cerrarSesion: true,
        nombre: req.user.nombre,
        imagen: req.user.imagen
    })
}

// 
exports.editarVacante = async (req,res,next) => {
    const vacanteActualizada = req.body

    vacanteActualizada.skills = req.body.skills.split(',')

    const vacante = await Vacante.findOneAndUpdate({url:req.params.url}, vacanteActualizada, {
        new: true,
        runValidators: true
    })

    res.redirect(`/vacantes/${vacante.url}`)

}

// validar y sanitizar los campos de las nuevas vacantes
exports.validarVacante = async (req,res,next) => {

    const rules = [
        body('titulo').not().isEmpty().withMessage('Agrega un titulo a la vacante').escape(),
        body('empresa').not().isEmpty().withMessage('Agrega una empresa').escape(),
        body('ubicacion').not().isEmpty().withMessage('Agrega una ubicacion').escape(),
        body('contrato').not().isEmpty().withMessage('Selecciona el tipo de contrato').escape(),
        body('skills').not().isEmpty().withMessage('Agrega almenos una habilidad').escape(),

    ]

    await Promise.all(rules.map(validation => validation.run(req)))

    const errores = req.validationResult(req)

    if(!errores.isEmpty()){
        // recargar la vista con los errores
        req.flash('error',errores.array().map( error => error.msg))

        res.render('nueva-vacante',{
            nombrePagina: 'Nueva vacante',
            tagLine: 'Llena el formulario y publica tu vacante',
            cerrarSesion: true,
            nombre: req.user.nombre,
            mensajes: req.flash()
        })
        return
    }

    next()
}   

exports.eliminarVacante = async (req,res) => {
    const {id} = req.params

    const vacante = Vacante.findById(id)

    if(verificarAutor(vacante,req.user)){
        // si es el usario eliminar
        vacante.remove()
        res.status(200).send('Vacante eliminada correctamente')
    }else{
        // no permitido
        res.status(403).send('Error')
    }

}

const verificarAutor = (vacante = {}, usuario = {}) => {
    // equals metodo de mongoose
    if(!vacante.autor.equals(usuario._id)){
        return false
    }

    return true
}

// subir cv
exports.subirCV = (req,res,next) => {

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
            // nos reenvia a nuestra pagina actual si hay error
            res.redirect('back')
            return 
        }else{
            return next()
        }
    })
}

const configuracionMulter = {
    // limits:{fileSize:100000},
    storage: fileStorage = multer.diskStorage({
        // cb es como next
        destination:(req,file,cb)=>{
            cb(null,__dirname+'../../public/uploads/cv')
        },
        filename:(req,file,cb) => {
            const extension = file.mimetype.split('/')[1]

            cb(null,`${shortid.generate()}.${extension}`)
        }
    }),
    fileFilter(req,file,cb){
        if(file.mimetype == 'application/pdf'){
            // el callback se ejcuta como true o false, true: imagen aceptada
            cb(null,true)
        }else{
            cb(new Error('Formato no valido'),false)
        }
    }
}

const upload = multer(configuracionMulter).single('cv')

// almacenar los candidatos en la base de datos
exports.contactar = async (req,res,next) => {
    const vacante = await Vacante.findOne({ url: req.params.url})

    // si no existe
    if(!vacante) return next()

    // todo bien
    const nuevoCandidato = {
        nombre: req.body.nombre,
        email: req.body.email,
        cv : req.file.filename
    }

    // almacenar la vacante
    vacante.candidatos.push(nuevoCandidato)
    await vacante.save()
    
    // mensaje flash y redirect
    req.flash('correcto','Se envio tu cv correctamente')
    res.redirect('/')
}

exports.mostrarCandidatos = async (req,res,next) => {
    const vacante = await Vacante.findById(req.params.id)

    if(vacante.autor != req.user._id.toString()){
        return next()
    }

    if(!vacante) return next()

    res.render('candidatos',{
        nombrePagina: `Candidatos vacante - ${vacante.titulo}`,
        cerrarSesion: true,
        nombre: req.user.nombre,
        imagen: req.user.imagen,
        candidatos: vacante.candidatos
    })
}

// buscador de vacantes
exports.buscarVacantes = async (req,res,next) => {
    const vacantes = await Vacante.find({
        $text: {
            $search: req.body.q
        }
    })

    // mostrar las vacantes
    res.render('home',{
        nombrePagina:`Resultados para la busqueda: ${req.body.q}`,
        barra: true,
        vacantes
    })
}