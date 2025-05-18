/**
 * @jest-environment jsdom
 */

beforeEach(() => {
  document.body.innerHTML = `
    <div class="card">
      <div class="card-letters"></div>
    </div>
  `;
});

test("randomString returns correct length", () => {
  const { randomString } = require("../main.js");
  expect(randomString(10)).toHaveLength(10);
  expect(typeof randomString(5)).toBe("string");
});
test("card mousemove updates card-letters text", () => {
  const { randomString } = require("../main.js");
  const card = document.querySelector(".card");
  const letters = card.querySelector(".card-letters");

  card.onmousemove = (e) => {
    const rect = card.getBoundingClientRect(),
      x = e.clientX - rect.left,
      y = e.clientY - rect.top;
    letters.style.setProperty("--x", `${x}px`);
    letters.style.setProperty("--y", `${y}px`);
    letters.innerText = randomString(1500);
  };

  // Simulate mousemove
  const event = { clientX: 10, clientY: 20 };
  card.onmousemove(event);
  expect(letters.innerText.length).toBeGreaterThan(0);
});
