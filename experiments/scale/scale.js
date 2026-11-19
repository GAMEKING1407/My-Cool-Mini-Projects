import data from "./scale.json" with { type: "json" };

const container = document.querySelector(".number-container");
const search = document.querySelector(".number-search");

function renderNumbers(numbers, query = "") {
  container.innerHTML = "";

  const filtered = numbers.filter(number =>
    `${number.name} ${number.category} ${number.notation} ${number.description}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  filtered.forEach((number, index) => {
    const card = document.createElement("article");
    card.className = "number-card";

    const category = document.createElement("span");
    category.className = "number-category";
    category.textContent = number.category;

    const title = document.createElement("h2");
    title.textContent = number.name;

    const notation = document.createElement("div");
    notation.className = "number-notation";
    notation.innerHTML = number.notation;

    const description = document.createElement("p");
    description.textContent = number.description;

    const position = document.createElement("span");
    position.className = "number-position";
    position.textContent = `#${index + 1} on the scale`;

    card.append(category, title, notation, description, position);
    container.appendChild(card);
  });

  if (filtered.length === 0) {
    container.textContent = "No numbers found.";
  }
}

search.addEventListener("input", () => {
  renderNumbers(data.numbers.numbers, search.value);
});

renderNumbers(data.numbers.numbers);