const DEFAULT_OPTIONS = {
  lifetime: 3000,
  containerId: 'wai-toast',
  position: 'top-right',
  showProggress: true,
  onClose: () => { }
}

export default class ToastWai {
  #container;
  #progressInterval = {};
  #toastTimeout = {}
  #toastContainerTimeout = {};

  constructor(options) {
    this.updateOptions({ ...DEFAULT_OPTIONS, ...options })
  }

  updateOptions(options) {
    Object.entries(options).forEach(([key, value]) => {
      this[key] = value
    })
  }

  createContainer() {
    const container = document.createElement('div');
    container.id = this.containerId;
    container.classList.add('toast-container')
    container.dataset.position = this.position
    document.body.append(container)
    return container
  }

  success(message) {
    this.#container = this.getContainer()
    const toast = this.createToast(message)
    let onHover = false


    let vm = this
    requestAnimationFrame(() => {
      this.toastMove()
      let visibleSince = new Date()
      toast.onmouseenter = () => {
        onHover = true
      }
      toast.onmouseleave = () => onHover = false
      const classList = ['show', 'success']
      if (vm.showProggress) {
        let i = 0
        this.#progressInterval[toast.id] = setInterval(() => {
          if (!onHover) {
            i += 10
            const timeVisible = vm.lifetime - i
            const progress = (timeVisible / vm.lifetime) / 1
            toast.style.setProperty(
              "--toast-wai-progress",
              progress
            )
            if (progress <= 0) this.removeToast(toast.id)
          }
        }, 10)
        classList.push('progress')
      } else {
        this.#toastTimeout[toast.id] = setTimeout(() => this.removeToast(toast.id), this.lifetime)
      }
      toast.classList.add(...classList)
    })

    this.#container.append(toast)
  }

  createToast(message) {
    const uuid = this.generateId()
    const toastEl = document.createElement('div')
    toastEl.classList.add('toast')
    toastEl.id = uuid
    toastEl.textContent = message
    toastEl.onclick = () => this.removeToast(uuid)

    return toastEl
  }

  removeToast(toastId) {
    this.clearData(toastId)
    const toastEl = document.getElementById(toastId)
    if (!toastEl) return
    toastEl.classList.remove("show")
    toastEl.addEventListener("transitionend", () => {
      this.onClose()
      toastEl.remove()

      if (this.#container.hasChildNodes()) return
      this.#container.remove()
      this.#container = null
    })
  }

  toastMove() {
    const toasts = this.#container.querySelectorAll('.toast')
    toasts.forEach((t) => {
      t.classList.add('move')
      this.#toastContainerTimeout[t.id] = setTimeout(() => {
        t.classList.remove('move')
        this.removeToastContainerTimeout(t.id)
      }, 100)
    })
  }

  removeToastContainerTimeout(toastId) {
    clearTimeout(this.#toastContainerTimeout[toastId])
  }

  clearData(toastId) {
    clearInterval(this.#progressInterval[toastId])
    clearTimeout(this.#toastTimeout[toastId])
  }

  generateId() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }

  getContainer() {
    return document.getElementById(this.containerId) ?? this.createContainer()
  }
}
