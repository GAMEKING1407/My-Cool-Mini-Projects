
import unicode from "./unicode.json" with { type: "json" };

const container = document.querySelector(".unicode-container");
const searchInput = document.querySelector(".unicode-search");

function renderUnicode(categories, search = "") {
  container.innerHTML = "";

  categories.forEach(category => {
    const characters = category.characters.filter(character =>
      `${character.char} ${character.name} ${character.code}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );

    if (characters.length === 0) return;

    const section = document.createElement("section");
    section.className = "unicode-category";

    const heading = document.createElement("h2");
    heading.textContent = category.name;

    const description = document.createElement("p");
    description.textContent = category.description;

    const grid = document.createElement("div");
    grid.className = "unicode-grid";

    characters.forEach(character => {
      const button = document.createElement("button");
      button.className = "unicode-character";

      const symbol = document.createElement("span");
      symbol.className = "unicode-symbol";
      symbol.textContent = character.char;

      const name = document.createElement("span");
      name.className = "unicode-name";
      name.textContent = character.name;

      const code = document.createElement("span");
      code.className = "unicode-code";
      code.textContent = character.code;

      button.append(symbol, name, code);

      button.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(character.char);
          button.classList.add("copied");
          name.textContent = "Copied!";

          setTimeout(() => {
            button.classList.remove("copied");
            name.textContent = character.name;
          }, 1000);
        } catch {
          name.textContent = character.char;
        }
      });

      grid.appendChild(button);
    });

    section.append(heading, description, grid);
    container.appendChild(section);
  });
}

searchInput.addEventListener("input", () => {
  renderUnicode(unicode.categories, searchInput.value);
});

renderUnicode(unicode.categories);
