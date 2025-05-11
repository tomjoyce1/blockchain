class HeaderComponent extends HTMLElement {
  connectedCallback() {
    fetch("header.html")
      .then((res) => res.text())
      .then((html) => (this.innerHTML = html))
      .catch((err) => console.error("Header load failed:", err));
  }
}
customElements.define("header-component", HeaderComponent);
