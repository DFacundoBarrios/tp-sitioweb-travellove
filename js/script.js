// Clase para manejar los destinos turísticos
class DestinosTuristicos {
  constructor() {
    this.destinos = [];
    this.filtros = {
      region: 'todos',
      precioMin: 0,
      precioMax: Infinity
    };
    this.container = document.getElementById("paquetes-container");
    this.carruselContainer = document.getElementById("destinos-carousel");
    this.setupEventListeners();
  }

  async inicializar() {
    try {
      const response = await fetch("https://restcountries.com/v3.1/all?fields=name,capital,region,flags");
      const data = await response.json();
      this.destinos = data.slice(0, 30).map(country => ({
        id: Math.random().toString(36).substr(2, 9),
        nombre: country.name.common,
        capital: country.capital?.[0] || 'N/A',
        region: country.region,
        bandera: country.flags.png,
        precio: Math.floor(Math.random() * (5000 - 1000) + 1000),
        rating: (Math.random() * 2 + 3).toFixed(1),
        descripcion: `Descubre la magia de ${country.name.common} y su rica cultura.`
      }));

      this.renderizarCarrusel();
      this.renderizarDestinos();
      this.inicializarAnimaciones();
    } catch (error) {
      console.error("Error al obtener los datos:", error);
      this.mostrarError();
    }
  }

  setupEventListeners() {
    const filtroRegion = document.getElementById('filtro-region');
    const filtroPrecio = document.getElementById('filtro-precio');
    if (filtroRegion) filtroRegion.addEventListener('change', () => this.filtrar());
    if (filtroPrecio) filtroPrecio.addEventListener('input', () => this.filtrar());

    // Implementar búsqueda en tiempo real
    const busqueda = document.getElementById('busqueda-destino');
    if (busqueda) {
      busqueda.addEventListener('input', debounce(() => this.buscar(busqueda.value), 300));
    }
  }

  renderizarCarrusel() {
    if (!this.carruselContainer) return;

    const destacados = this.destinos.slice(0, 3);
    const carruselHTML = `
      <div id="destinosCarousel" class="carousel slide" data-bs-ride="carousel">
        <div class="carousel-indicators">
          ${destacados.map((_, idx) => `
            <button type="button" data-bs-target="#destinosCarousel" data-bs-slide-to="${idx}" 
              ${idx === 0 ? 'class="active"' : ''} aria-label="Slide ${idx + 1}"></button>
          `).join('')}
        </div>
        <div class="carousel-inner">
          ${destacados.map((destino, idx) => `
            <div class="carousel-item ${idx === 0 ? 'active' : ''}">
              <img src="${destino.bandera}" class="d-block w-100" alt="${destino.nombre}">
              <div class="carousel-caption d-none d-md-block">
                <h3>${destino.nombre}</h3>
                <p>${destino.descripcion}</p>
                <div class="rating">${'⭐'.repeat(Math.round(parseFloat(destino.rating)))}</div>
              </div>
            </div>
          `).join('')}
        </div>
        <button class="carousel-control-prev" type="button" data-bs-target="#destinosCarousel" data-bs-slide="prev">
          <span class="carousel-control-prev-icon" aria-hidden="true"></span>
          <span class="visually-hidden">Anterior</span>
        </button>
        <button class="carousel-control-next" type="button" data-bs-target="#destinosCarousel" data-bs-slide="next">
          <span class="carousel-control-next-icon" aria-hidden="true"></span>
          <span class="visually-hidden">Siguiente</span>
        </button>
      </div>
    `;
    this.carruselContainer.innerHTML = carruselHTML;
  }

  renderizarDestinosHTML(destinos) {
    return destinos.map(destino => `
      <div class="col-md-4 mb-4 destino-card" data-aos="fade-up">
        <div class="card h-100 shadow-sm hover-effect">
          <div class="card-header-custom position-relative">
            <img src="${destino.bandera}" class="card-img-top paquete-imagen" alt="${destino.nombre}" />
            <span class="badge bg-primary position-absolute top-0 end-0 m-2">$${destino.precio}</span>
          </div>
          <div class="card-body">
            <h5 class="card-title">${destino.nombre}</h5>
            <p class="card-text">${destino.descripcion}</p>
            <div class="d-flex justify-content-between align-items-center">
              <div class="rating">${'⭐'.repeat(Math.round(parseFloat(destino.rating)))}</div>
              <small class="text-muted">${destino.region}</small>
            </div>
          </div>
          <div class="card-footer bg-transparent border-top-0">
            <div class="d-grid gap-2">
              <button class="btn btn-outline-primary btn-reservar" data-destino-id="${destino.id}">
                Reservar ahora
              </button>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  renderizarDestinos() {
    if (!this.container) return;

    const destinosFiltrados = this.destinos.filter(destino => {
      const cumpleFiltroRegion = this.filtros.region === 'todos' || destino.region === this.filtros.region;
      const cumplePrecio = destino.precio >= this.filtros.precioMin && destino.precio <= this.filtros.precioMax;
      return cumpleFiltroRegion && cumplePrecio;
    });

    this.container.innerHTML = this.renderizarDestinosHTML(destinosFiltrados);

    // Agregar event listeners a los botones de reserva
    document.querySelectorAll('.btn-reservar').forEach(btn => {
      btn.addEventListener('click', (e) => this.manejarReserva(e.target.dataset.destinoId));
    });
  }

  inicializarAnimaciones() {
    // Inicializar AOS (Animate On Scroll)
    if (typeof AOS !== 'undefined') {
      AOS.init({
        duration: 1000,
        once: true
      });
    }

    // Agregar efectos hover con CSS
    const style = document.createElement('style');
    style.textContent = `
      .hover-effect {
        transition: transform 0.3s ease-in-out;
      }
      .hover-effect:hover {
        transform: translateY(-5px);
      }
    `;
    document.head.appendChild(style);
  }

  manejarReserva(destinoId) {
    const destino = this.destinos.find(d => d.id === destinoId);
    if (!destino) return;

    // Crear modal de reserva
    const modalHTML = `
      <div class="modal fade" id="modalReserva" tabindex="-1" aria-labelledby="modalReservaLabel" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="modalReservaLabel">Reservar viaje a ${destino.nombre}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <p>Precio: $${destino.precio}</p>
              <p>Calificación: ${destino.rating} ⭐</p>
              <form id="formReserva">
                <div class="mb-3">
                  <label for="fechaViaje" class="form-label">Fecha de viaje</label>
                  <input type="date" class="form-control" id="fechaViaje" required>
                </div>
                <div class="mb-3">
                  <label for="cantidadPersonas" class="form-label">Cantidad de personas</label>
                  <input type="number" class="form-control" id="cantidadPersonas" min="1" required>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" class="btn btn-primary" onclick="confirmarReserva()">Confirmar Reserva</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Agregar modal al DOM y mostrarlo
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = new bootstrap.Modal(document.getElementById('modalReserva'));
    modal.show();

    // Limpiar modal cuando se cierre
    document.getElementById('modalReserva').addEventListener('hidden.bs.modal', function () {
      this.remove();
    });
  }

  filtrar() {
    const region = document.getElementById('filtro-region')?.value || 'todos';
    const precio = document.getElementById('filtro-precio')?.value || Infinity;

    this.filtros = {
      region: region,
      precioMin: 0,
      precioMax: precio === 'todos' ? Infinity : parseInt(precio)
    };

    this.renderizarDestinos();
  }

  buscar(termino) {
    const terminoLower = termino.toLowerCase();
    const destinosFiltrados = this.destinos.filter(destino =>
      destino.nombre.toLowerCase().includes(terminoLower) ||
      destino.region.toLowerCase().includes(terminoLower)
    );
    this.container.innerHTML = this.renderizarDestinosHTML(destinosFiltrados);
    // Agregar event listeners a los botones de reserva
    document.querySelectorAll('.btn-reservar').forEach(btn => {
      btn.addEventListener('click', (e) => this.manejarReserva(e.target.dataset.destinoId));
    });
  }

  mostrarError() {
    if (this.container) {
      this.container.innerHTML = `
        <div class="alert alert-danger" role="alert">
          <h4 class="alert-heading">¡Ups! Algo salió mal</h4>
          <p>No se pudo obtener la información de los destinos en este momento.</p>
          <hr>
          <p class="mb-0">Por favor, verifica tu conexión a internet o intenta nuevamente más tarde.</p>
        </div>
      `;
    }
  }
}

// Función de utilidad para debounce
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  const app = new DestinosTuristicos();
  app.inicializar();
});

// Clase para manejar el formulario de contacto
class FormularioContacto {
  constructor() {
    this.form = document.getElementById('formContacto');
    this.campos = {
      nombre: {
        regex: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/,
        mensaje: 'El nombre debe contener solo letras y espacios (2-50 caracteres)'
      },
      email: {
        regex: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/,
        mensaje: 'Ingrese un email válido'
      },
      telefono: {
        regex: /^[0-9]{7,15}$/,
        mensaje: 'El teléfono debe contener entre 7 y 15 números'
      },
      mensaje: {
        regex: /^[\s\S]{10,500}$/,
        mensaje: 'El mensaje debe contener entre 10 y 500 caracteres'
      }
    };
    this.inicializar();
  }

  inicializar() {
    if (!this.form) return;

    // Agregar validación en tiempo real
    Object.keys(this.campos).forEach(campo => {
      const input = this.form.querySelector(`#${campo}`);
      if (input) {
        input.addEventListener('input', debounce((e) => this.validarCampo(e.target), 500));
        input.addEventListener('blur', (e) => this.validarCampo(e.target));
      }
    });

    // Manejar envío del formulario
    this.form.addEventListener('submit', (e) => this.manejarEnvio(e));

    // Agregar indicadores de fortaleza para campos específicos
    this.agregarIndicadorFortaleza('mensaje', {
      debil: 10,
      medio: 50,
      fuerte: 100
    });
  }

  async validarCampo(campo) {
    const configuracion = this.campos[campo.id];
    if (!configuracion) return true;

    const valor = campo.value.trim();
    const contenedorFeedback = this.obtenerOCrearFeedbackContainer(campo);
    
    // Simular validación asíncrona
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (!configuracion.regex.test(valor)) {
        this.mostrarError(campo, contenedorFeedback, configuracion.mensaje);
        return false;
      }

      // Validaciones adicionales específicas
      if (campo.id === 'email') {
        const dominioValido = await this.validarDominio(valor);
        if (!dominioValido) {
          this.mostrarError(campo, contenedorFeedback, 'El dominio del email no parece ser válido');
          return false;
        }
      }

      this.mostrarExito(campo, contenedorFeedback);
      return true;
    } catch (error) {
      console.error('Error en la validación:', error);
      return false;
    }
  }

  async validarDominio(email) {
    const dominio = email.split('@')[1];
    // Simular verificación de dominio
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com'].includes(dominio));
      }, 300);
    });
  }

  obtenerOCrearFeedbackContainer(campo) {
    let container = campo.nextElementSibling;
    if (!container || !container.classList.contains('feedback-container')) {
      container = document.createElement('div');
      container.className = 'feedback-container';
      campo.parentNode.insertBefore(container, campo.nextSibling);
    }
    return container;
  }

  mostrarError(campo, contenedor, mensaje) {
    campo.classList.remove('is-valid');
    campo.classList.add('is-invalid');
    contenedor.innerHTML = `
      <div class="invalid-feedback d-block">
        <i class="fas fa-exclamation-circle"></i> ${mensaje}
      </div>
    `;
  }

  mostrarExito(campo, contenedor) {
    campo.classList.remove('is-invalid');
    campo.classList.add('is-valid');
    contenedor.innerHTML = `
      <div class="valid-feedback d-block">
        <i class="fas fa-check-circle"></i> ¡Perfecto!
      </div>
    `;
  }

  agregarIndicadorFortaleza(campoId, niveles) {
    const campo = this.form.querySelector(`#${campoId}`);
    if (!campo) return;

    const indicador = document.createElement('div');
    indicador.className = 'progress mt-2';
    indicador.style.height = '5px';
    indicador.innerHTML = '<div class="progress-bar" role="progressbar" style="width: 0%"></div>';
    campo.parentNode.insertBefore(indicador, campo.nextSibling);

    campo.addEventListener('input', (e) => {
      const valor = e.target.value.length;
      const progressBar = indicador.querySelector('.progress-bar');
      
      let porcentaje = 0;
      let clase = 'bg-danger';

      if (valor >= niveles.fuerte) {
        porcentaje = 100;
        clase = 'bg-success';
      } else if (valor >= niveles.medio) {
        porcentaje = 66;
        clase = 'bg-warning';
      } else if (valor >= niveles.debil) {
        porcentaje = 33;
        clase = 'bg-danger';
      }

      progressBar.style.width = `${porcentaje}%`;
      progressBar.className = `progress-bar ${clase}`;
    });
  }

  async manejarEnvio(e) {
    e.preventDefault();
    const submitBtn = this.form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Enviando...';

    try {
      const validaciones = await Promise.all(
        Array.from(this.form.elements)
          .filter(el => el.id && this.campos[el.id])
          .map(el => this.validarCampo(el))
      );

      if (validaciones.every(v => v)) {
        // Simular envío exitoso
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mostrar mensaje de éxito
        const alertaExito = document.createElement('div');
        alertaExito.className = 'alert alert-success alert-dismissible fade show mt-3';
        alertaExito.innerHTML = `
          <strong><i class="fas fa-check-circle"></i></strong> Tu mensaje ha sido enviado correctamente.
          <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        this.form.parentNode.insertBefore(alertaExito, this.form.nextSibling);

        // Resetear formulario
        this.form.reset();
        this.form.querySelectorAll('.is-valid, .is-invalid').forEach(el => {
          el.classList.remove('is-valid', 'is-invalid');
        });
        this.form.querySelectorAll('.feedback-container').forEach(el => el.innerHTML = '');
      }
    } catch (error) {
      console.error('Error al enviar el formulario:', error);
      const alertaError = document.createElement('div');
      alertaError.className = 'alert alert-danger alert-dismissible fade show mt-3';
      alertaError.innerHTML = `
        <strong><i class="fas fa-exclamation-circle"></i> Error</strong> No se pudo enviar el formulario. Por favor, intenta nuevamente.
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      `;
      this.form.parentNode.insertBefore(alertaError, this.form.nextSibling);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Enviar Mensaje';
    }
  }
}

// Inicializar el formulario cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('contacto.html')) {
    new FormularioContacto();
  }
});
