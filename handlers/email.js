const emailConfig = require('../config/email')
const nodeMailer = require('nodemailer')
const hbs = require('nodemailer-express-handlebars')
// para el callback del correo
const util = require('util')

let transport = nodeMailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    auth: {
        user: emailConfig.user,
        pass: emailConfig.pass
    }
})

// utilizar templates de handlebars
transport.use(
    'compile',
    hbs({
      viewEngine: {
        extName: 'handlebars',
        partialsDir: __dirname + '/../views/emails',
        layoutsDir: __dirname + '/../views/emails',
        defaultLayout: 'reset.handlebars'
      },
      viewPath: __dirname + '/../views/emails',
      extName: '.handlebars'
    })
  );
exports.enviar = async (opciones) => {
    const opcionesEmail = {
        from: 'devJobs <noreply@devjobs.com',
        to: opciones.usuario.email,
        subject: opciones.subject,
        template: opciones.archivo,
        // lo que pasemos en context estara disponible en el tempalte
        context: {
            resetUrl: opciones.resetUrl
        }
    }

    const sendMail = util.promisify(transport.sendMail,transport)

    return sendMail.call(transport, opcionesEmail)
}