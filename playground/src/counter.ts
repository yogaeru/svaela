import { t } from "../../src";
import { createSignal } from "../../src";
import type { Signal } from "../../src/elements/types";

export const counter = () => {
  const count: Signal = createSignal<number>(0);

  return t.div(
    t.h2(t.bind(count)),
    t.button(
      {
        events: {
          name: "click",
          handler: () => {
            // console.log("Incrementing count", count() + 1);
            count.set(count() + 1);
          },
        },
      },
      "Increment",
    ),
  );
};
