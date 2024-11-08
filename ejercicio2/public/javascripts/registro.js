document.addEventListener('DOMContentLoaded', async function(params) {
    // cargar facultades
    try {
        const respuesta = await fetch('/facultades');
        const data = await respuesta.json();
        console.log(data);
        const facultadSelect = document.getElementById('facultad');
        data.forEach(facultad => {
            const option = document.createElement('option');
            option.value = facultad.nombre;
            option.textContent = facultad.nombre;
            facultadSelect.appendChild(option);
            
        });
    } catch (error) {
        console.log(error);
    }

    // cambiar el prefijo del tlf
    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const prefix = this.getAttribute('data-prefix');
            document.getElementById('dropdownMenuButton').textContent = prefix;
        });
    });

    // añadir prefijo al telefono
    const form = document.querySelector('form');
    form.addEventListener('submit', function(e) {
        const prefix = document.getElementById('dropdownMenuButton').textContent;
        const telefono = document.getElementById('telefono').value;
        document.getElementById('telefonoCompleto').value = prefix + telefono;
    });
});