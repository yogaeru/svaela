import { Svaela, Svagation } from "../../src";
import { counter } from "./counter";
import { home } from "./home";

const routes = new Svagation()
  .branch({
    path: "/",
    view: home,
  })
  .branch({
    path: "/counter",
    view: counter,
  });

const root = new Svaela(routes, document.getElementById("app"));
root.mount();
