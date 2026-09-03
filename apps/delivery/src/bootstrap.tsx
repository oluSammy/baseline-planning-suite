import { mount } from "./mount";

const container = document.getElementById("root");

if (!container) {
  throw new Error("Delivery: ##root element not found");
}

mount(container);
