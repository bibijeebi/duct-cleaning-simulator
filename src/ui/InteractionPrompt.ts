import styles from './hud.module.css';

export class InteractionPrompt {
  readonly element = document.createElement('div');

  constructor(parent: HTMLElement) {
    this.element.className = styles.prompt;
    this.element.textContent = '';
    parent.appendChild(this.element);
  }

  setText(text: string) {
    this.element.textContent = text;
    this.element.classList.toggle(styles.promptVisible, Boolean(text));
  }
}
