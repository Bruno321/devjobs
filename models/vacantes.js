const mongoose = require('mongoose')
// para q las respuestas de mongoo sean promises
mongoose.Promise = global.Promise
const slug = require('slug')
const shortid = require('shortid')

// trim quita espacios
const vacanteaSchema = new mongoose.Schema({
    titulo: {
        type: String,
        required: 'El nombre de la vacante es obligatorio',
        trim: true
    },
    empresa: {
        type: String,
        trim: true
    },
    ubicacion:{
        type: String,
        trim: true,
        required: 'La ubicacion es obligatoria'
    },
    salario:{
        type: String,
        default: 0,
        trim: true
    },
    contrato:{
        type: String,
        trim: true
    },
    descripcion:{
        type: String,
        trim: true
    },
    url:{
        type: String,
        lowercase: true
    },
    skills: [String],
    candidatos: [{
        nombre: String,
        email: String,
        cv: String
    }],
    autor:{
        type:mongoose.Schema.ObjectId,
        ref: 'Usuarios',
        required: 'El autor es obligatorio'
    }
})
// este es como el hook
vacanteaSchema.pre('save',function(next){
    // crear la url
    const url = slug(this.titulo)
    this.url = `${url}-${shortid.generate()}`
    // next pasa al siguiente middleware
    next()
})

// crear un indice
vacanteaSchema.index({titulo: 'text'})

// aqui le das nombre al modelo
module.exports = mongoose.model('Vacante',vacanteaSchema)