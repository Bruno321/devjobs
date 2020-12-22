module.exports = {
    // dos parametros que se pasaran por default gracias al helper ??
    seleccionarSkills : (seleccionadas = [],opciones) => {
        const skills = ['HTML5', 'CSS3', 'CSSGrid', 'Flexbox', 'JavaScript', 'jQuery', 
        'Node', 'Angular', 'VueJS', 'ReactJS', 'React Hooks', 'Redux', 'Apollo', 
        'GraphQL', 'TypeScript', 'PHP', 'Laravel', 'Symfony', 'Python', 'Django', 
        'ORM', 'Sequelize', 'Mongoose', 'SQL', 'MVC', 'SASS', 'WordPress']
        
        let html = ''
        skills.forEach(skill => {
            html += `
                <li ${seleccionadas.includes(skill) ? 'class="activo"' : ''}>${skill}</li>
            `
        })

        return opciones.fn().html = html
    },
    tipoContrato: (seleccionado,opciones)=>{
        
        // $& inserta un string
        // seleccionado es lo que viene de la base de datos en el .handlebars vacante.skills
        // opciones es lo que esta dentro del html
        return opciones.fn(this).replace(
            new RegExp(` value="${seleccionado}"`), '$& selected="selected"'
        )
    },
    mostrarAlertas: (errores = {}, alertas) => {
        // .fn() para ver las alertas html
        // errores para que se muestren las alertas
        // alertas es donde se inyecta el html
        // es decir adentro de eso {{#mostrarAlertas mensajes}}
        //                          {{/mostrarAlertas}}
        // Object.keys(errores) nos trae las llaves d elos objetos
        // error-correcto son las llaves
        const categoria = Object.keys(errores)
        let html = ''
        if (categoria.length){
            errores[categoria].forEach(error => {
                html += `<div class="${categoria} alerta">
                    ${error}
                </div>`
            })
        }
        return alertas.fn().html = html
    }
    
}