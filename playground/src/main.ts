import { Svaela, Svagation } from "../../src";
import { Counter } from "./card";
import { home } from "./home";

const routes = new Svagation()
  .branch({
    path: "/",
    view: home,
  })
  .branch({
    path: "/counter",
    view: Counter,
  });

const root = new Svaela(routes, document.getElementById("app"));
root.mount();
