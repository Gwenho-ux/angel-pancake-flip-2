// Button Component - Manages button states and interactions
class Button {
    constructor(element, onClick) {
        this.element = element;
        this.onClick = onClick;
        this.isEnabled = true;
        this.originalText = element.textContent;
        
        this.init();
    }

    init() {
        this.element.addEventListener('click', (e) => {
            if (this.isEnabled && this.onClick) {
                this.onClick(e);
                this.playClickAnimation();
            }
        });
    }

    enable() {
        this.isEnabled = true;
        this.element.disabled = false;
        this.element.classList.remove('disabled');
    }

    disable() {
        this.isEnabled = false;
        this.element.disabled = true;
        this.element.classList.add('disabled');
    }

    setText(text) {
        this.element.textContent = text;
    }

    resetText() {
        this.element.textContent = this.originalText;
    }

    playClickAnimation() {
        this.element.classList.add('clicked');
        setTimeout(() => {
            this.element.classList.remove('clicked');
        }, 200);
    }

    show() {
        this.element.style.display = 'block';
    }

    hide() {
        this.element.style.display = 'none';
    }

    addLoadingState() {
        this.disable();
        this.originalText = this.element.textContent;
        this.element.textContent = 'Loading...';
        this.element.classList.add('loading');
    }

    removeLoadingState() {
        this.enable();
        this.element.textContent = this.originalText;
        this.element.classList.remove('loading');
    }
} 